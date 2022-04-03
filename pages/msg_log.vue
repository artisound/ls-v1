<template>
  <div>
    <v-container>
      <v-data-table
        :items="items"
        :search="search"
        :headers="headers"
        :loading="loadingTbl"
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


        <template v-slot:item.timestamp="{ item }">
          {{ convertDatetime(item.timestamp, 'YYYY年M月D日 H:m') }}
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
      // 表
      headers: [
        { text: 'アクション名', value: 'action',    align: 'left', sortable: false },
        { text: 'ステータス',   value: 'status',    align: 'center' },
        { text: '配信対象',     value: 'sended_to', align: 'center' },
        { text: '配信日',       value: 'timestamp', align: 'center' },
      ],
      search: '',
      items: [],
      loadingTbl: false,
    }
  },
  mounted: async function() {
    console.log(this.$route)
    this.items = await this.getDataList();

    console.log(this.items)
  },
  methods: {
    /** *****************************************************
     * 日時変換
     ***************************************************** */
    convertDatetime(datetime, format) {
      return moment(datetime).format(format);
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