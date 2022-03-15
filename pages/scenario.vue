<template>
  <div>
    <v-container v-if="$route.path == `/${page}` || $route.path == `/${page}/`">
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
              <v-icon style="font-size:32px;">mdi-forum</v-icon>
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
            <v-btn color="success" :to="`/${page}/new`" text router exact><v-icon class="me-2">mdi-plus</v-icon>作成</v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.message_num="{ item }">
          {{item.format.length}}
        </template>

        <template v-slot:item.status="{ item }">
          <v-menu>
            <template v-slot:activator="{on, attr}">
              <template v-for="(st, i) in status">
                <v-chip
                  dark
                  v-if="item.status == st.value"
                  v-on="on"
                  v-bind="attr"
                  :key="i"
                  :color="st.color"
                >{{st.name}}</v-chip>
              </template>
            </template>
            <v-list>
              <template v-for="(st, i) in status">
                <v-list-item
                  link
                  :key="i"
                  :disabled="(item.status == st.value) ? true: false"
                  @click="changeStatus(item, st.value)"
                >
                  <v-list-item-title>
                    <v-icon
                      left
                      v-text="st.icon"
                    ></v-icon>
                    {{st.name}}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
          </v-menu>
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


                <v-dialog
                  v-model="dialogRemove"
                  max-width="400"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-list-item
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-list-item-title>
                        <v-icon class="mr-2">mdi-delete</v-icon>削除
                      </v-list-item-title>
                    </v-list-item>
                  </template>
                  <v-card>
                    <v-toolbar
                      flat
                      dark
                      color="error"
                      class="text-h5"
                    >
                      <v-icon color="white" class="mr-3">mdi-delete</v-icon>
                      <div></div>
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
                      >キャンセル</v-btn>

                      <v-spacer></v-spacer>

                      <v-btn
                        color="error"
                        @click="removeData(item.id)"
                      >削除</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>

              </v-list-item-group>
            </v-list>
          </v-menu>
        </template>

        <template v-slot:item.created_at="{ item }">
          {{convertDatetime(item.created_at, 'YYYY/MM/DD H:mm')}}
        </template>

        <template v-slot:item.updated_at="{ item }">
          {{convertDatetime(item.updated_at, 'YYYY/MM/DD H:mm')}}
        </template>

      </v-data-table>
    </v-container>

    <nuxt-child v-else :page="page" />

  </div>
</template>

<script>
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from '~/plugins/firebase.js';
import moment from 'moment'

export default {
  layout: 'main',
  head() {
    return {
      title: 'チャットボット',
    }
  },
  data() {
    return {
      page: 'scenario',
      // 表
      headers: [
        { text: 'メッセージタイトル', value: 'title',        align: 'left' },
        { text: '呼出し語句',         value: 'call_text',    align: 'left' },
        { text: 'メッセージ数',       value: 'message_num',  align: 'center' },
        { text: 'ステータス',         value: 'status',       align: 'center' },
        { text: '作成日時',           value: 'created_at',   align: 'center' },
        { text: '更新日時',           value: 'updated_at',   align: 'center' },
        { text: '',                   value: 'actions',      align: 'center', sortable: false, width: '100px' },
      ],
      search: '',
      items: [],
      loadingTbl: false,

      status: [
        { name: '公開',     value: 'publish', color: 'green',   icon: 'mdi-message-text' },
        { name: '公開停止', value: 'draft',   color: 'orange',  icon: 'mdi-message-text-lock' },
      ],

      // ダイアログ`
      dialogRemove: false,
    }
  },
  mounted: async function () {
    console.clear()
    this.loadingTbl = true

    this.items = await this.getDataList()
    console.log(this.items)

    this.loadingTbl = false
  },
  methods: {
    /** *****************************************************
     * 日時変換
     ***************************************************** */
    convertDatetime(datetime, format) {
      return moment(datetime).format(format);
    },

    async changeStatus(item, status) {
      console.log(item)
      const docId = item.id
      item.status = status
      
      try {
        await setDoc(doc(db, this.page, docId), item)
      } catch (e) {
        console.error(e)
      }
    },

    /** *****************************************************
     * データ一覧取得
     ***************************************************** */
    async getDataList() {
      let data, arrData = [];
      try {
        const getDocRef = await getDocs(collection(db, this.page))
        getDocRef.forEach(doc => {
          data = doc.data()
          data.id = doc.id
          arrData.push(data)
        });
      } catch (e) {
        console.error(e)
      }
      return arrData;
    },


    /** *****************************************************
     * データ削除
     ***************************************************** */
    async removeData(id){
      console.clear()
      this.loadingBtn   = true
      this.dialogRemove = true

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

      this.dialogRemove = false
      this.loadingBtn   = false
    },
  },
  async beforeRouteUpdate(to, from, next) {
    next()
    this.items = await this.getDataList();
  },
}
</script>