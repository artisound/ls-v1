<template>
  <div>
    <v-container>
      <v-data-table
        :items="items"
        :search="search"
        :headers="headers"
        :loading="loadingTbl"
        :sort-by="['timestamp']"
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
              <v-icon style="font-size:32px;">mdi-math-log</v-icon>
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
        </template>


        <template v-slot:item.status="{ item }">
          <v-chip
            dark
            v-if="item.message_obj.message || item.response.message"
            color="error"
          >ERROR</v-chip>
          <v-chip
            dark
            v-else
            color="success"
          >OK</v-chip>
        </template>

        <template v-slot:item.sended_to="{ item }">
          <div v-html="getUserNameById(item.sended_to).join('<br>')"></div>
        </template>

        <template v-slot:item.timestamp="{ item }">
          {{ convertDatetime(item.timestamp, 'YYYY年M月D日 H:mm') }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-dialog
            scrollable
            v-model="dialogDetails"
            :retain-focus="false"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                v-bind="attrs"
                v-on="on"
                color="primary"
                @click="activeData = item"
              ><v-icon>mdi-file</v-icon></v-btn>
            </template>
            <v-card>
              <v-toolbar
                flat
                dark
                color="success"
                class="text-h5"
              >
                <v-icon color="white" class="mr-3">mdi-file</v-icon>
              </v-toolbar>

              <v-card-text class="py-3">
                <pre v-if="activeData.id">
<code>{{ (Array.isArray(activeData.message_obj)) ? JSON.stringify(activeData.message_obj, null, "\t") : JSON.stringify(activeData.response, null, "\t") }}</code>
                </pre>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  text
                  color="secondary"
                  @click="dialogDetails = false"
                >閉じる</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </template>

      </v-data-table>
    </v-container>
  </div>
</template>

<script>
import { collection, getDocs } from "firebase/firestore";
import { db } from '~/plugins/firebase.js';
import moment from 'moment';

export default {
  layout: 'main',
  head() {
    return {
      title: '配信ログ',
    }
  },
  data() {
    return {
      page: this.$route.name,
      dialogDetails: false,

      // 表
      headers: [
        { text: 'アクション名', value: 'action',    align: 'left', sortable: false },
        { text: 'ステータス',   value: 'status',    align: 'center' },
        { text: '配信対象',     value: 'sended_to', align: 'center' },
        { text: '配信日',       value: 'timestamp', align: 'left' },
        { text: '',             value: 'actions',   align: 'center', sortable: false, width: '100px' },
      ],
      search: '',
      customers: {},
      items: [],
      activeData: {},
      loadingTbl: false,
    }
  },
  mounted: async function() {
    console.log(this.$route)
    this.customers = await this.getUserList();
    this.items     = await this.getDataList();

    console.log(this.items)
  },
  methods: {
    /** *****************************************************
     * 日時変換
     ***************************************************** */
    convertDatetime(datetime, format) {
      return moment(datetime).format(format);
    },

    getUserNameById(lineUserId) {
      const names = []
      if(Array.isArray(lineUserId)) {
        lineUserId.forEach(uid => {
          if(this.customers[uid]) names.push(this.customers[uid]['field-name'] || this.customers[uid]['field-line_user_name'])
        })
      } else {
        if(this.customers[lineUserId]) {
          names.push(this.customers[lineUserId]['field-name'] || this.customers[lineUserId]['field-line_user_name'])
        } else {
          names.pus('全員')
        }
      }
      return names
    },

    /** *****************************************************
     * ユーザー一覧取得
     ***************************************************** */
    async getUserList() {
      const getDocRef = await getDocs(collection(db, 'customer'))
      let data = {};
      getDocRef.forEach(doc => data[doc.id] = doc.data() );
      return data;
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
  }
}
</script>