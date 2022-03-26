<template>
  <div>
    <v-container v-if="$route.path == `/${page}` || $route.path == `/${page}/`">
      <v-data-table
        :items="items"
        :search="search"
        :headers="headers"
        :loading="loadingTbl"
        :sort-by="['created_at']"
        :footer-props="{ 'items-per-page-text' : '行/ページ:' }"
        sort-desc
        locale="ja"
        item-key="name"
        class="elevation-2 mt-5"
        loading-text="読み込み中"
        no-data-text="データがありません。"
        no-results-text="データがありません。"
      >

          <template v-slot:top>
            <div class="d-flex flex-wrap grow px-4 p-2">
              <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
                <v-icon style="font-size:32px;">mdi-forum</v-icon>
              </v-card>
              <v-spacer></v-spacer>

              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    icon
                    small
                    color="green"
                    class="align-self-center"
                    @click="getDataListByBtn"
                    v-bind="attrs"
                    v-on="on"
                  ><v-icon>mdi-autorenew</v-icon></v-btn>
                </template>
                <span>再取得</span>
              </v-tooltip>
            </div>

            <v-divider></v-divider>

            <v-toolbar color="" flat>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="検索"
                single-line
                hide-details
              ></v-text-field>
              <v-spacer></v-spacer>
              <v-spacer></v-spacer>
              <v-btn
                text
                router
                exact
                color="success"
                :to="`/${page}/new`"
              ><v-icon class="me-2">mdi-plus</v-icon>作成</v-btn>
            </v-toolbar>
          </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getSendStatus(item, 'color')"
            dark
          >{{getSendStatus(item, 'status')}}</v-chip>
        </template>

        <template v-slot:item.reserve="{ item }">
          <v-icon v-if="item.reserve_at" color="primary" dark>mdi-check</v-icon>
        </template>

        <template v-slot:item.reserve_at="{ item }">
          {{outputReserveOrStep(item)}}
        </template>

        <template v-slot:item.sended_at="{ item }">
          {{(item.sended_at) ? convertDatetime(item.sended_at, 'YYYY/MM/DD H:mm') : '─'}}
        </template>

        <template v-slot:item.created_at="{ item }">
          {{convertDatetime(item.created_at, 'YYYY/MM/DD H:mm')}}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-menu offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="normal"
                v-bind="attrs"
                v-on="on"
                fab
                small
                depressed
              ><v-icon>mdi-dots-vertical</v-icon></v-btn>
            </template>
            <v-list>
              <v-list-item-group>

                <v-list-item v-if="!item.sended_at && !item.step_timing">
                  <v-list-item-title @click="activeData=item;dialogSendMessage=true;">
                    <v-icon class="mr-2">mdi-send</v-icon>送信
                  </v-list-item-title>
                </v-list-item>

                <v-list-item v-if="!item.sended_at" :to="`/${page}/${item.id}`">
                  <v-list-item-title>
                    <v-icon class="mr-2">mdi-file-edit</v-icon>編集
                  </v-list-item-title>
                </v-list-item>

                <v-list-item :to="`/${page}/new?id=${item.id}`">
                  <v-list-item-title>
                    <v-icon class="mr-2">mdi-file-replace</v-icon>複製
                  </v-list-item-title>
                </v-list-item>

                <v-list-item >
                  <v-list-item-title @click="activeData=item;dialogRemove=true;">
                    <v-icon class="mr-2">mdi-delete</v-icon>削除
                  </v-list-item-title>
                </v-list-item>

              </v-list-item-group>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-container>


    <nuxt-child v-else :page="page" />

    <v-dialog
      v-model="dialogRemove"
      max-width="400"
    >
      <v-card>
        <v-toolbar
          flat
          dark
          color="error"
          class="text-h5"
        >
          <v-icon color="white" class="mr-3">mdi-delete</v-icon>
          <div>{{activeData['field-name']}}</div>
        </v-toolbar>

        <v-card-text class="py-3">
          このメッセージを完全に削除します。<br>
          よろしいですか？
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="secondary"
            text
            @click="dialogRemove = false"
          >
            キャンセル
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="error"
            @click="removeData(activeData.id)"
          >
            削除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogSendMessage"
      max-width="400"
    >
      <v-card>
        <v-toolbar
          flat
          dark
          color="success"
          class="text-h5"
        >
          <v-icon color="white" class="mr-3">mdi-send</v-icon>
          <div>{{activeData.title}}</div>
        </v-toolbar>

        <v-card-text class="py-3">
          このメッセージを送信します。<br>
          送信後は取り消しができません。<br>
          よろしいですか？
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="secondary"
            text
            @click="dialogSendMessage = false"
          >キャンセル</v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="success"
            @click="sendMessage"
            :loading="loadingSendMsg"
            :disabled="loadingSendMsg"
          >送信</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from '~/plugins/firebase.js';
import {lineMsgApi} from '~/plugins/line_api.js';
import moment from 'moment'

export default {
  layout: 'main',
  head() {
    return {
      title: 'メッセージ配信',
    }
  },
  data() {
    return {
      page: 'message',
      // 表
      headers: [
        { text: 'メッセージタイトル', value: 'title',       align: 'left', sortable: false },
        { text: 'ステータス',         value: 'status',      align: 'center' },
        { text: '予約配信',           value: 'reserve',     align: 'center' },
        { text: '配信予約日時',       value: 'reserve_at',  align: 'center' },
        { text: '配信日',             value: 'sended_at',   align: 'center' },
        { text: '作成日',             value: 'created_at',  align: 'center' },
        { text: '',                   value: 'actions',     align: 'center', sortable: false, width: '100px' },
      ],
      search: '',
      items: [],
      loadingTbl: false,
      loadingSendMsg: false,
      activeData: {},

      // ダイアログ`
      dialogRemove: false,
      dialogSendMessage: false,
    }
  },
  created: function() {
    console.clear()
  },
  mounted: async function () {
    this.loadingTbl = true

    this.items = await this.getDataList();

this.loadingTbl = false
  },
  methods: {
    /** *****************************************************
     * 日時変換
     ***************************************************** */
    convertDatetime(datetime, format) {
      return moment(datetime).format(format);
    },

    outputReserveOrStep(item) {
      if (item.reserve_at) {
        return this.convertDatetime(item.reserve_at, 'YYYY/MM/DD H:mm')
      } else if (item.step_timing) {
        const timing = item.step_timing.split('-')
        const day    = timing[0] ? `登録から${timing[0]}日後` : '';
        const oclock = timing[1] ? `${timing[1]}時` : '';
        return day + 'の' + oclock
      } else {
        return '─'
      }
    },

    /** *****************************************************
     * データ一覧取得
     ***************************************************** */
    async getDataList() {
      const getDocRef = await getDocs(collection(db, this.page))
      let data, arrData = [];
      getDocRef.forEach(doc => {
        data = doc.data()
        data['id'] = doc.id
        arrData.push(data)
      });
      return arrData;
    },

    async getDataListByBtn() {
      this.items = []
      this.items = await this.getDataList()
    },


    /** *****************************************************
     * データ削除
     ***************************************************** */
    async removeData(id){
      this.loadingBtn = true
      const removedDataIndex = this.items.findIndex(v => v.id === id)

      try {
        await deleteDoc(doc(collection(db, this.page), id))
        this.$toast.success(`データが削除されました。`, {
          position: 'bottom-right'
        })

        this.dialogRemove = false
        this.items.splice(removedDataIndex, 1)
      } catch (e) {
        console.error("Error adding document: ", e)
        this.$toast.error(`データを削除できませんでした。`, {
          position: 'bottom-right'
        })
      }

      this.loadingBtn = false
    },

    /** **************************************************************
     * メッセージ送信
     ************************************************************** */
    async sendMessage() {
      this.loadingSendMsg = true
      // --------------------------------
      // LINE Messaging API実行
      // --------------------------------
      const lineApi = new lineMsgApi({
        url          : 'https://api.zp-ls.com/line/',
        accessToken  : process.env.LINE_PUBLIC_TOKEN,
      });

      console.log(lineApi)


      const msg_format = [];
      for (let msg of this.activeData.msg_format) {
        if(msg.type == 'json') {
          msg.format = this.strToJson(msg.str_format)
          msg_format.push(msg.format)
        } else {
          msg_format.push(msg)
        }
      }


      // メッセージ送信
      let resSendMsg;
      if(!this.activeData.collection.length){
        resSendMsg = await lineApi.sendMulticastMessage({
          to      : this.activeData.collection,
          messages: msg_format,
          notificationDisabled: saveData.notification_disabled,
        });
      } else {
        resSendMsg = await this.lineApi.sendBroadcastMessage({
          messages: msg_format,
          notificationDisabled: saveData.notification_disabled,
        });
      }
      console.log(resSendMsg)

      let resKeys = Object.keys(resSendMsg)
      if(!resKeys.length) {
        this.$toast.success(`メッセージを送信しました。`, {
          position: 'bottom-right'
        })

        try {
          this.activeData.sended_at = moment().format('YYYY-MM-DD HH:mm:ss')

          await setDoc(doc(collection(db, this.page), this.activeData.id), this.activeData, { merge: true })
          console.log('sended!')
        } catch (e) {
          console.error("Error adding document: ", e)
        }
      } else {
        this.$toast.error(`メッセージを送信できませんでした。`, {
          position: 'bottom-right'
        })
      }

      this.activeData        = {}
      this.loadingSendMsg    = false
      this.dialogSendMessage = false
    },


    /** *****************************************************
     * 設定情報取得
     ***************************************************** */
    async getLineSetting() {
      const getDocRef = await getDoc(doc(db, 'setting', 'line'))
      const data = getDocRef.data();
      return (data) ? data : {}
    },


    /** **************************************************************
     * 【一覧】
     * ステータス表示
     ************************************************************** */
    getSendStatus(item, ret) {
      const retObj = { color: '', status: '' };

      if(item.sended_at) {
        retObj['color'] = 'green';
        retObj['status'] = '配信済';
      } else if(item.step_timing) {
        retObj['color'] = 'pink';
        retObj['status'] = 'ステップ配信';
      } else {
        if(item.active) {
          retObj['color'] = 'indigo';
          retObj['status'] = '配信予約';
        } else {
          retObj['color'] = 'blue';
          retObj['status'] = '下書き';
        }
      }

      return retObj[ret];
    },
  },
  async beforeRouteUpdate(to, from, next) {
    next()
    this.items = await this.getDataList();
  },
}
</script>