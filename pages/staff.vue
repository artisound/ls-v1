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
        loading-text="読み込み中"
        class="elevation-2 mt-5"
        no-data-text="データがありません。"
        no-results-text="データがありません。"
      >

        <template v-slot:top>
          <div class="d-flex flex-wrap grow px-4 p-2">
            <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
              <v-icon style="font-size:32px;">mdi-account-tie</v-icon>
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
            <v-btn color="success" :to="`/${page}/edit`" text router exact><v-icon class="me-2">mdi-plus</v-icon>作成</v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.detail="{ item }">
          <v-btn
            icon
            small
            depressed
            color="primary"
            class="d-sm-block d-none"
            :to="`/${page}/${item.id}`"
          ><v-icon>mdi-file</v-icon></v-btn>
        </template>

        <template v-slot:item.image_url="{ item }">
          <v-avatar
            v-if="item.image_url"
            size="36"
          >
            <img :src="item.image_url" :alt="item.name">
          </v-avatar>
        </template>

        <template v-slot:item.line_user_id="{ item }">
          <v-chip
            v-if="item.line_user_id"
            dark
            color="green"
          >連携済</v-chip>

          <v-dialog v-else>
            <template v-if="item.email" v-slot:activator="{on, attr}">
              <v-btn
                dark
                color="orange"
                v-bind="attr"
                v-on="on"
              >連携する</v-btn>
            </template>
            <v-card>
              <vue-qr :text="'https://liff.line.me/'+liffSyncUrl+'?uid='+item.uid"></vue-qr>

              <v-card-text>
                <v-btn
                  dark
                  width="100%"
                  color="orange"
                  :href="'https://liff.line.me/'+liffSyncUrl+'?uid='+item.uid"
                >こちら</v-btn>
              </v-card-text>
            </v-card>
          </v-dialog>
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
                <v-list-item class="d-flex d-sm-none" :to="`/${page}/${item.id}`">
                  <v-list-item-title><v-icon class="mr-2">mdi-file</v-icon>詳細</v-list-item-title>
                </v-list-item>
                <v-list-item :to="`/${page}/edit?id=${item.id}`">
                  <v-list-item-title><v-icon class="mr-2">mdi-file-edit</v-icon>編集</v-list-item-title>
                </v-list-item>
                <v-list-item >
                  <v-list-item-title @click="activeData=item;dialogRemove=true;"><v-icon class="mr-2">mdi-delete</v-icon>削除</v-list-item-title>
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
          この従業員の情報を完全に削除します。<br>
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

export default {
  layout: 'main',
  head() {
    return {
      title: '従業員管理',
    }
  },
  data() {
    return {
      page: 'staff',
      liffSyncUrl: process.env.LIFF_STAFF_SYNC_DEV,
      // 表
      headers: [
        { text: '',         value: 'detail',        align: 'center', sortable: false, width: '48px' },
        { text: '',         value: 'image_url',     align: 'center', sortable: false, width: '36px' },
        { text: '従業員名', value: 'name',          align: 'left',   sortable: false },
        { text: '性別',     value: 'gender',        align: 'center' },
        { text: '生年月日', value: 'birthday',      align: 'center' },
        { text: '役職',     value: 'position',      align: 'center' },
        { text: '雇用区分', value: 'employ_status', align: 'center' },
        { text: '部署',     value: 'department',    align: 'center' },
        { text: '入社日',   value: 'hire_date',     align: 'center' },
        { text: 'LINE連携', value: 'line_user_id',  align: 'center' },
        { text: '',         value: 'actions',       align: 'center', sortable: false, width: '100px' },
      ],
      search: '',
      items: [],
      activeData: {},

      // ローディング
      loadingTbl: false,

      // ダイアログ`
      dialogRemove: false,
    }
  },
  watch: {
    dialogRemove(aft){
      if(!aft) this.activeData = {};
    }
  },
  mounted: async function () {
    // console.clear()
    this.loadingTbl = true;

    this.setting = await this.getSetting();
    this.items = await this.getDataList();

    this.loadingTbl = false;
  },
  methods: {
    /** *****************************************************
     * データ一覧取得
     ***************************************************** */
    async getDataList() {
      const getDocRef = await getDocs(collection(db, this.page))
      let data, fields, arrData = [];
      getDocRef.forEach(doc => {
        data = doc.data()

        fields = {}
        for(var d in data) {
          if(d.startsWith('field-')){
            var k = d.replace(/field-/g, '')
            fields[k] = data[d]
          } else {
            fields[d] = data[d]
          }
        }

        fields.id = doc.id
        arrData.push(fields)
      });
      return arrData;
    },
    /** *****************************************************
     * 設定情報取得
     ***************************************************** */
    async getSetting() {
      const getDocRef = await getDoc(doc(db, 'setting', 'line'))
      const data = getDocRef.data();
      return (data) ? data : {}
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
        this.$router.push(`/${this.page}`)

        this.items.splice(removedDataIndex, 1)
      } catch (e) {
        console.error("Error adding document: ", e)
        this.$toast.error(`データを削除できませんでした。`, {
          position: 'bottom-right'
        })
      }

      this.loadingBtn = false
    },
  },
  async beforeRouteUpdate(to, from, next) {
    next()
    this.items = await this.getDataList();
  },

}
</script>