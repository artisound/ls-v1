<template>
  <div>
    <v-container v-if="$route.path == `/${page}` || $route.path == `/${page}/`">
      <v-data-table
        :items="items"
        :search="search"
        :headers="headers"
        :loading="loadingTbl"
        :sort-by="['status', 'datetime']"
        :footer-props="{ 'items-per-page-text' : '行/ページ:' }"
        locale="ja"
        item-key="name"
        class="elevation-2 mt-5"
        no-data-text="データがありません。"
        no-results-text="データがありません。"
        sort-asc
      >
        <template v-slot:top>
          <div class="d-flex flex-wrap grow px-4 p-2">
            <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
              <v-icon style="font-size:32px;">mdi-chat-question</v-icon>
            </v-card>
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
            <!-- <v-btn color="success" :to="`/${page}/edit`" text router exact><v-icon class="me-2">mdi-plus</v-icon>作成</v-btn> -->
          </v-toolbar>
        </template>

        <template v-slot:item.detail="{ item }">
          <v-btn
            icon
            small
            depressed
            color="primary"
            class="d-sm-block d-none"
            @click="activeData=item;dialogDetail=!dialogDetail;"
          ><v-icon>mdi-file</v-icon></v-btn>
        </template>

        <template v-slot:item.customer_name="{ item }">
          <span v-if="item.customer_name">{{item.customer_name}} 様</span>
        </template>

        <template v-slot:item.created_at="{ item }">
          <span>{{dtFormat(item.created_at, 'YYYY/MM/DD H:mm')}}</span>
        </template>

        <template v-slot:item.updated_at="{ item }">
          <span v-if="item.updated_at">{{dtFormat(item.updated_at, 'YYYY/MM/DD H:mm')}}</span>
          <span v-else>―</span>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip color="error" v-if="item.status == 0">新着メッセージ</v-chip>
          <v-chip color="success" v-else-if="item.status == 1">返信済み</v-chip>
          <v-chip color="warning" v-else>クローズ</v-chip>
        </template>

        <template v-slot:item.messages="{ item }">
          <span>{{item.messages}}件</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            outlined
            x-small
            fab
            color="warning"
            :disabled="(item.status==2) ? true : false"
            @click="activeData=item;dialogArchive=true;"
          >
            <v-icon small title="クローズ">mdi-logout-variant</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-container>

    <nuxt-child v-else :page="page" />

    <!-- ダイアログ | 顧客情報表示 -->
    <v-dialog
      v-model="dialogDetail"
    >
      <v-card>
        <v-toolbar
          dark
          dense
          color="success"
        >
          <v-toolbar-title>{{ activeData.title }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon
            dark
            @click="dialogDetail = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text>
          <v-form
            class="mt-5 mb-3"
          >
            <v-container
              class="overflow-auto"
            >

              <v-row>
                <v-col
                  cols="12"
                >
                  <v-textarea
                    outlined
                    rows="3"
                    label="返信メッセージ"
                    hide-details="auto"
                    :disabled="(activeData.status < 2) ? false : true"
                    v-model="replyMessage['field-body']"
                  ></v-textarea>
                </v-col>
                <v-col
                  cols="12"
                  class="d-flex"
                >
                  <!-- <span v-if="!current_staff && !current_staff['field-line_user_id']" class="red--text">従業員情報がLINEと連携されていません。</span> -->
                  <v-spacer></v-spacer>
                  <v-btn
                    :disabled="(replyMessage['field-body'] && current_staff['field-line_user_id']) ? false : true"
                    color="success"
                    class="w-100"
                    @click="dialogConfirm=true"
                  >送信</v-btn>
                </v-col>
                <v-col
                  cols="12"
                  class=""
                >
                  <v-divider></v-divider>
                  <div
                    class="pa-3 w-100 mx-auto overflow-y-auto"
                    style="max-height:300px;background-color:#A2B4DC;"
                  >

                    <v-row
                      v-for="(msg, i) in activeMessages"
                      :key="i"
                      class="justify-space-between mb-2"
                    >
                      <v-col
                        v-if="msg.admin"
                        cols="12"
                      >
                        <v-row>
                          <v-col
                            cols="8"
                            class="overflow-hidden"
                          >
                            <v-card
                              flat
                              class="px-3 py-1"
                              style="border-radius:12px;"
                              v-html="msg['field-body'].replace(/\n/g, '<br>')"
                            ></v-card>
                          </v-col>
                          <v-col
                            cols="4"
                            class="px-0 text--gray text-left align-self-end"
                          >
                            <small>{{dtFormat(msg['field-sended_at'], 'M月D日 H:mm')}}</small>
                          </v-col>
                        </v-row>
                      </v-col>

                      <v-col
                        v-else
                        cols="12"
                      >
                        <v-row>
                          <v-col
                            cols="4"
                            class="px-0 text--gray text-right align-self-end"
                          >
                            <small>{{dtFormat(msg['field-sended_at'], 'M月D日 H:mm')}}</small>
                          </v-col>

                          <v-col
                            cols="8"
                            class="overflow-hidden"
                          >
                            <small
                              class="d-block text-right px-3"
                            >{{getUserByUserId(customers, activeData.created_by)['field-name']}} 様</small>
                            <v-card
                              flat
                              class="px-3 py-1"
                              color="light-green accent-1"
                              style="border-radius:12px;"
                              v-html="msg['field-body'].replace(/\n/g, '<br>')"
                            ></v-card>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>

                  </div>
                </v-col>
              </v-row>

            </v-container>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>


    <!-- ダイアログ | 返信 -->
    <v-dialog
      v-model="dialogConfirm"
      max-width="400"
    >
      <v-card>
        <v-toolbar
          flat
          dark
          dense
          color="primary"
        >
          <v-icon
            color="white"
            class="mr-3"
          >mdi-send</v-icon>
          <span>返信</span>
        </v-toolbar>

        <v-card-text class="py-3">
          このメッセージで返信します。<br>
          送信されると取り消すことができません。<br>
          よろしいですか？
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="secondary"
            text
            @click="dialogConfirm=false"
          >キャンセル</v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="primary"
            @click="sendMessage"
          >送信</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!-- ダイアログ | アーカイブ -->
    <v-dialog
      v-model="dialogArchive"
      max-width="400"
    >
      <v-card>
        <v-toolbar
          flat
          dense
          dark
          color="warning"
        >
          <v-icon
            color="white"
            class="mr-3"
          >mdi-archive</v-icon>
          <span>クローズ</span>
        </v-toolbar>

        <v-card-text class="py-3">
          このお問い合わせをクローズしますか？
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="secondary"
            text
            @click="dialogArchive=false"
          >キャンセル</v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="warning"
            @click="archiveContact"
          >クローズ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { db } from '~/plugins/firebase.js';
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import {lineMsgApi} from '~/plugins/line_api.js';
import moment from 'moment'

export default {
  layout: 'main',
  head() {
    return {
      title: 'お問い合わせ',
    }
  },
  data() {
    return {
      page: 'contact',
      // 表
      headers: [
        { text: '',               value: 'detail',        align: 'center', sortable: false, width: '30px' },
        { text: 'お客様名',       value: 'customer_name', align: 'center', sortable: false },
        { text: '対応スタッフ名', value: 'staff_name',    align: 'center', sortable: false },
        { text: '件名',           value: 'title',         align: 'center' },
        { text: '初回受信日時',   value: 'created_at',    align: 'center' },
        { text: '最終送受信日時', value: 'updated_at',    align: 'center' },
        { text: 'ステータス',     value: 'status',        align: 'center' },
        { text: 'メッセージ数',   value: 'messages',      align: 'center' },
        { text: '',               value: 'actions',       align: 'center', sortable: false, width: '30px' },
      ],
      search: '',

      items     : [],
      customers : [],
      current_staff: {},
      activeData: {},
      activeMessages: [],
      replyMessage: {
        'admin'     : true,
        'field-body': null,
        'field-sended_at' : null,
      },
      defaultReplyMessage: {
        'admin'     : true,
        'field-body': null,
        'field-sended_at' : null,
      },

      // ダイアログ
      dialogDetail  : false,
      dialogConfirm : false,
      dialogArchive : false,
      dialogChangeArchive: false,

      // ローディング
      loadingTbl: false,
    }
  },
  watch: {
    async activeData(aft, bef) {
      console.log(aft)
      if(aft['created_at']){
        const msgCollections = collection(db, this.page, aft.id, 'message')
        const msgQuery       = query(msgCollections, orderBy('field-sended_at', 'desc'))
        const getDocRefs     = await getDocs(msgQuery)
        console.log(getDocRefs)

        this.activeMessages  = []
        getDocRefs.forEach(msg => this.activeMessages.push(msg.data()) )
        console.log(this.activeMessages)
      }
    }
  },
  created: function() {
    console.clear()
  },
  mounted: async function () {
    this.loadingTbl = true

    console.log(this.current_staff)

    this.lineApi = new lineMsgApi({
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });

    this.current_staff = await this.getCurrentStaff()
    this.items         = await this.getDataList()
    this.customers     = await this.getCustomerList()

    console.log(this.current_staff)

    this.loadingTbl = false
  },
  methods: {
    // ====================================
    // テーブル フィルタリング
    // ====================================
    filterOnlyCapsText(value, search, item) {
      return value != null &&
        search != null &&
        typeof value === 'string'
    },


    /** *****************************************************
     * 日付フォーマット変換
     ***************************************************** */
    dtFormat(val, format){
      if(Number(val)){
        return moment.unix(val).format(format)
      } else {
        return moment(val).format(format)
      }
    },


    /** *****************************************************
     * LINEユーザーIDから顧客情報を取得
     ***************************************************** */
    getUserByUserId(userList, lineUserId) {
      return userList.find(v => v['field-line_user_id'] === lineUserId)
    },



    /** *****************************************************
     * ログイン中のスタッフ情報取得
     */
    async getCurrentStaff() {
      const uid = this.$store.getters.user.uid
      const staffQuery  = query(collection(db, 'staff'), where('field-uid', '==', uid))

      try{
        const getDocRefs  = await getDocs(staffQuery)
        let staff = [];
        getDocRefs.forEach(d => {
          staff.push( d.data() );
        })

        console.log(staff)
        if(staff.length) {
          return staff[0]
        } else {
          throw {error: 'no synced staffs'};
        }
      } catch(e) {
        console.error(e)
        this.loadingTbl = false
      }
    },

    /** *****************************************************
     * 問い合わせ返信
     ***************************************************** */
    async sendMessage() {
      this.dialogDetail  = false
      this.dialogConfirm = false

      const roomId = this.activeData.id

      try {
        // 現在日時のタイムスタンプ生成
        this.replyMessage['field-sended_at'] = moment().unix()
        this.replyMessage['field-sended_by'] = this.current_staff['field-line_user_id'] || '未連携スタッフ'
        // ---------------------------
        // 問い合わせルーム情報更新
        // ---------------------------
        this.activeData.status     = 1
        this.activeData.messages   = this.activeData.messages + 1
        this.activeData.updated_at = moment().format('YYYY-MM-DD HH:mm:ss')
        await updateDoc( doc( collection(db, 'contact'), roomId ), this.activeData )

        // ---------------------------
        // 問い合わせ返信内容登録
        // ---------------------------
        await addDoc( collection(db, 'contact', roomId, 'message'), this.replyMessage )

        // ---------------------------------------------
        // 顧客LINEへの返信メッセージフォーマット生成
        // ---------------------------------------------
        const msgFormat = this.replyMessageFormat({
          title : this.activeData.title,
          body  : this.replyMessage['field-body'],
          roomId: roomId,
          liffId: process.env.LIFF_CONTACT,
        })

        // ---------------------------
        // LINEメッセージ送信
        // ---------------------------
        const resSendMsg = await this.lineApi.sendPushMessage({
          to      : this.activeData.created_by,
          messages: msgFormat,
        });

        this.$toast.success(`メッセージを送信しました。`, {
          position: 'bottom-right'
        })

        this.replyMessage = this.defaultReplyMessage

        // 一覧更新
        this.items = await this.getDataList()
      } catch(e) {
        console.error("Error adding document: ", e)
        this.$toast.error(`メッセージを送信できませんでした。`, {
          position: 'bottom-right'
        })
      }
    },


    /** *****************************************************
     * アーカイブに移動
     ***************************************************** */
    async archiveContact() {
      const docId = this.activeData.id

      try {
        await updateDoc(doc(db, this.page, docId), {
          status: 2,
        })

        const index = this.items.findIndex(v => v.id === docId)
        this.items[index].status     = 2

        this.$toast.success(`お問い合わせをクローズしました。`, {
          position: 'bottom-right'
        })

      } catch(e) {
        console.error(e)

        this.$toast.error(`正常に処理できませんでした。`, {
          position: 'bottom-right'
        })
      }

      this.dialogArchive = false
      this.activeData    = {}
    },


    /** *****************************************************
     * 顧客情報取得
     ***************************************************** */
    async getCustomerList() {
      const getDocRef = await getDocs(collection(db, 'customer'))
      let arrData = [];
      getDocRef.forEach(doc => arrData.push(doc.data()) );
      return arrData;
    },


    /** *****************************************************
     * データ一覧取得
     ***************************************************** */
    async getDataList() {
      const contactRef  = await getDocs(collection(db, this.page))  // 問い合わせ
      const customerRef = await getDocs(collection(db, 'customer')) // 顧客
      const staffRef    = await getDocs(collection(db, 'staff'))    // 従業員
      let data, contactData = [], customerData = [], staffData = [];

      /** **************************************
       * 問い合わせドキュメントリスト
       ************************************** */
      contactRef.forEach(doc => {
        data = doc.data()
        data['id'] = doc.id
        contactData.push(data)
      });
      /** **************************************
       * 顧客ドキュメントリスト
       ************************************** */
      customerRef.forEach(doc => {
        data = doc.data()
        data['id'] = doc.id
        customerData.push(data)
      });
      /** **************************************
       * 従業員ドキュメントリスト
       ************************************** */
      staffRef.forEach(doc => {
        data = doc.data()
        data['id'] = doc.id
        staffData.push(data)
      });


      contactData.forEach(d => {
        let customer    = customerData.find(v => v['field-line_user_id'] === d.created_by)
        d.customer_name = customer['field-name'];
      })
      return contactData;
    },


    /** *****************************************************
     * 返信メッセージフォーマット
     ***************************************************** */
    replyMessageFormat(params) {
      const title  = params.title;
      const body   = params.body;
      const roomId = params.roomId;
      const liffId = params.liffId;

      return [{
        type: 'flex',
        altText: `Re: ${title}`,
        contents: {
          type: 'bubble',
          direction: 'ltr',
          body: {
            type    : 'box',
            layout  : 'vertical',
            spacing : 'none',
            contents: [
              {
                type    : 'text',
                text    : `Re: ${title}`,
                weight  : 'bold',
                align   : 'start',
                wrap    : true,
                contents: []
              }, {
                type    : 'text',
                text    : body,
                align   : 'start',
                margin  : 'lg',
                wrap    : true,
                contents: []
              }
            ]
          },
          footer: {
            type    : 'box',
            layout  : 'horizontal',
            spacing : 'md',
            contents: [
              {
                style : 'primary',
                type  : 'button',
                height: 'sm',
                action: {
                  type : 'uri',
                  label: '返信',
                  uri  : `https://liff.line.me/${liffId}?mid=${roomId}`
                },
              }
            ]
          }
        }
      }];
    },



  }
}
</script>