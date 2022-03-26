<template>
  <div>
    <v-container v-if="$route.path == `/${page}` || $route.path == `/${page}/`">
      <v-data-table
        :items="items"
        :search="search"
        :headers="headers"
        :loading="loadingTbl"
        :footer-props="{ 'items-per-page-text' : '行/ページ:' }"
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
              <v-icon style="font-size:32px;">mdi-account-group</v-icon>
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
            <!-- <v-btn color="success" to="/customer/edit" text router exact><v-icon class="me-2">mdi-plus</v-icon>作成</v-btn> -->
          </v-toolbar>
        </template>

        <template v-slot:item.field-status="{ item }">
          <v-chip v-if="item['field-line_follow_status']=='follow'" color="green" dark>フォロー中</v-chip>
          <v-chip v-else-if="item['field-line_follow_status']=='unfollow'" color="red" dark>ブロック中</v-chip>
          <v-chip v-else color="orange" dark>不明</v-chip>
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
          このお客様情報を完全に削除します。<br>
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
  </div>
</template>

<script>
import { db } from '~/plugins/firebase.js';
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import {lineMsgApi} from '~/plugins/line_api.js';

export default {
  layout: 'main',
  head() {
    return {
      title: '顧客管理',
    }
  },
  data() {
    return {
      page: 'customer',
      // 表
      headers: [
        // { text: '',           value: 'detail',  align: 'center', sortable: false, width: '100px' },
        { text: 'お客様名',   value: 'field-name',    align: 'center', sortable: false },
        { text: '性別',       value: 'field-gender',  align: 'center' },
        { text: 'お住まい',   value: 'field-address', align: 'center' },
        { text: 'ステータス', value: 'field-status',  align: 'center' },
        // { text: '',           value: 'actions', align: 'center', sortable: false, width: '100px' },
      ],
      search: '',
      items: [],
      loadingTbl: false,
      activeData: {},

      // ダイアログ`
      dialogRemove: false,
    }
  },
  watch: {
    dialogRemove(aft){
      if(!aft) this.activeData = {};
    }
  },
  created: function() {
    console.clear()
  },
  mounted: async function () {
    this.loadingTbl = true;

    this.items = await this.getDataList();
    console.log(this.items)

    this.loadingTbl = false;
  },
  methods: {
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

  },
  async beforeRouteUpdate(to, from, next) {
    next()
    this.items = await this.getDataList();
  },
}
</script>
