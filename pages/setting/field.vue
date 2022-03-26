<template>
  <div>
    <v-container v-if="!$route.params.slug">
      <v-data-table
        locale="ja"
        :headers="headers"
        :items="items"
        :custom-filter="filterOnlyCapsText"
        :footer-props="{ 'items-per-page-text' : '行/ページ:' }"
        :loading="loadingTbl"
        class="elevation-2 mt-5"
        item-key="name"
        sort-asc
        no-data-text="データがありません。"
      >

        <template v-slot:top>
          <div class="d-flex flex-wrap grow px-4 p-2">
            <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
              <v-icon style="font-size:32px;">mdi-tooltip-image</v-icon>
            </v-card>
            <v-spacer></v-spacer>
            <div
              v-if="user.email.startsWith('admin')"
              class="align-self-center"
            >
              <v-btn
                text
                router
                exact
                color="success"
                class="align-center"
                :to="`/${page}/field/new`"
              ><v-icon class="me-2">mdi-plus</v-icon>作成</v-btn>
            </div>
          </div>

          <v-divider></v-divider>
        </template>

        <template v-slot:item.detail="{ item }">
          <v-btn
            icon
            small
            depressed
            color="primary"
            class="d-sm-block d-none"
            :to="`/${page}/field/${item.collection}`"
          ><v-icon>mdi-file-edit</v-icon></v-btn>
        </template>

        <template v-slot:item.created_at="{ item }">
          {{convertDatetime(item.created_at, 'YYYY/MM/DD H:mm')}}
        </template>

        <template v-slot:item.updated_at="{ item }">
          {{(item.updated_at) ? convertDatetime(item.updated_at, 'YYYY/MM/DD H:mm') : '─'}}
        </template>
      </v-data-table>
    </v-container>

    <nuxt-child v-else :page="page" />
  </div>
</template>

<script>
import { db } from '~/plugins/firebase.js';
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import moment from 'moment'

export default {
  layout: 'main',
  head() {
    return {
      title: '入力フィールド設定',
    }
  },
  data() {
    return {
      page: 'setting',
      user: this.$store.getters.user,
      // 表
      headers: [
        { text: '',           value: 'detail',     align: 'center', sortable: false, width: '100px' },
        { text: 'フォーム名', value: 'name',       align: 'left' },
        { text: 'スラッグ',   value: 'collection', align: 'left' },
        { text: '作成日',     value: 'created_at', align: 'left' },
        { text: '最終更新日', value: 'updated_at', align: 'left' },
      ],
      search: '',
      items: [],

      // ローディング
      loadingTbl: false,
    }
  },
  mounted: async function () {
    this.items = await this.getDataList()
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
     * 日時変換
     ***************************************************** */
    convertDatetime(datetime, format) {
      return moment(datetime).format(format);
    },


    /** *****************************************************
     * データ一覧取得
     ***************************************************** */
    async getDataList() {
      try {
        const getDocRef = await getDoc(doc(db, this.page, 'field'))
        const docData = getDocRef.data()
        return docData.collections
      } catch(e) {
        console.error(e)
      }
    },

    /** *****************************************************
     * オブジェクト空判定
     ***************************************************** */
    isEmpty(obj){
      return !Object.keys(obj).length;
    },
  },
  async beforeRouteUpdate(to, from, next) {
    next()
    this.items = await this.getDataList();
  },
}
</script>