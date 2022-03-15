<template>
  <div>
    <v-container v-if="$route.path == `/${page}` || $route.path == `/${page}/`">
      <v-data-table
        locale="ja"
        :headers="headers"
        :items="items"
        :footer-props="{ 'items-per-page-text' : '行/ページ:' }"
        :loading="loadingTbl"
        item-key="richMenuId"
        class="elevation-2 mt-5"
        no-data-text="データがありません。"
        loading-text="読み込み中"
      >

        <template v-slot:top>
          <div class="d-flex flex-wrap grow px-4 p-2">
            <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
              <v-icon style="font-size:32px;">mdi-view-quilt</v-icon>
            </v-card>
            <v-spacer></v-spacer>
            <div class="align-self-center">
              <v-btn
                text
                router
                exact
                color="success"
                :to="`/${page}/new`"
              ><v-icon class="me-2">mdi-plus</v-icon>作成</v-btn>
            </div>
          </div>
          <v-divider></v-divider>
        </template>

        <template v-slot:item.detail="{ item }">
          <v-dialog
            v-model="dialogRichmenuImg"
            width="400"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                fab
                text
                small
                @click="getRichmenuImage(item.richMenuId)"
                color="primary"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon v-text="'mdi-image-area'"></v-icon>
              </v-btn>
            </template>

            <v-card v-if="activeRichmenuImg">
              <v-img
                width="100%"
                height="100%"
                :src="activeRichmenuImg"
              ></v-img>
            </v-card>
          </v-dialog>

        </template>

        <template v-slot:item.size="{ item }">
          <v-chip v-if="item.size.height == 843">小</v-chip>
          <v-chip v-else>大</v-chip>
        </template>

        <template v-slot:item.default="{ item }">
          <v-icon
            v-if="item.default"
            color="green"
          >mdi-check-bold</v-icon>
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

                <v-list-item
                  v-if="!item.default"
                  @click="setDefaultRichmenu(item.richMenuId)"
                >
                  <v-list-item-title>
                    <v-icon
                      left
                      class="mr-2"
                    >mdi-cellphone-arrow-down</v-icon>
                    デフォルトメニューに設定
                  </v-list-item-title>
                </v-list-item>

                <v-list-item
                  :to="`/${page}/${item.richMenuId}`"
                >
                  <v-list-item-title>
                    <v-icon
                      left
                      class="mr-2"
                    >mdi-file-replace</v-icon>
                    複製
                  </v-list-item-title>
                </v-list-item>

                <v-dialog
                  v-model="dialogRemove"
                  width="300"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-list-item
                      v-if="!item.default"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-list-item-title>
                        <v-icon class="mr-2" left>mdi-delete</v-icon>
                        削除
                        </v-list-item-title>
                    </v-list-item>
                  </template>
                  <v-card>
                    <v-toolbar
                      flat
                      dark
                      color="error"
                      class="text-h6"
                    >
                      <v-icon color="white" class="mr-3">mdi-delete</v-icon>
                      リッチメニュー削除
                    </v-toolbar>

                    <v-card-text class="py-3">
                      このリッチメニューを完全に削除します。<br>
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
                        @click="deleteRichmenu(item.richMenuId)"
                      >
                        削除
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>

              </v-list-item-group>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-container>


    <nuxt-child v-else :page="page" />

  </div>
</template>

<script>
import { db } from '~/plugins/firebase.js';
import {lineMsgApi} from '~/plugins/line_api.js';
import { doc, getDoc } from "firebase/firestore";

export default {
  layout: 'main',
  head() {
    return {
      title: 'リッチメニュー',
    }
  },
  data() {
    return {
      page: 'richmenu',

      // 表
      headers: [
        { text: '',                 value: 'detail',      align: 'center', sortable: false },
        { text: 'メニュー名',       value: 'name',        align: 'left',   sortable: false },
        { text: 'バーテキスト',     value: 'chatBarText', align: 'left',   sortable: false },
        { text: 'サイズ',           value: 'size',        align: 'center' },
        { text: 'リッチメニューID', value: 'richMenuId',  align: 'left',   sortable: false },
        { text: 'デフォルト設定',   value: 'default',     align: 'center' },
        { text: '',                 value: 'actions',     align: 'center', sortable: false, width: '100px' },
      ],
      search: '',
      items: [],

      // ローディング
      loadingTbl: false,

      // 選択されたリッチメニュー
      activeRichmenuImg: '',  // 画像(base64)

      // ダイアログ
      dialogRemove     : false,
      dialogRichmenuImg: false,
    }
  },
  watch: {
    dialogRichmenuImg: function(aft) {
      if(!aft) this.activeRichmenuImg = ''
    }
  },
  mounted: async function () {
    console.clear()
    this.loadingTbl = true

    this.lineApi = await new lineMsgApi({
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });

    this.items = await this.getRichmenus()
    // console.log(this.items)

    this.loadingTbl = false;
  },
  methods: {
    /** *****************************************************
     * 設定情報取得
     ***************************************************** */
    async getSetting() {
      const getDocRef = await getDoc(doc(db, 'setting', 'line'))
      const data = getDocRef.data();
      return (data) ? data : {}
    },


    /** *****************************************************
     * 全リッチメニューを取得
     ***************************************************** */
    async getRichmenus() {
      console.clear()
      try {
        const richmenus = await this.lineApi.getRichmenuList()
          .then(resp => resp.richmenus)
          .catch(e => { throw e })

        const defaultRichmenu = await this.lineApi.getDefaultRichmenu()
          .then(resp => resp.richMenuId)
          .catch(e => { throw e })

        if(richmenus.length && defaultRichmenu) {
          for(var menu of richmenus) {
            menu.default = (menu.richMenuId === defaultRichmenu) ? true : false
          }

          return richmenus
        } else {
          return []
        }
      } catch(e) {
        console.error(e)
      }
    },


    /** *****************************************************
     * デフォルトリッチメニューを設定
     * @param {String} richmenuId
     ***************************************************** */
    async setDefaultRichmenu(richmenuId) {
      console.clear()
      this.loadingTbl = true
      try {
        // デフォルトリッチメニュー設定
        await this.lineApi.setDefaultRichmenu(richmenuId)

        // 全リッチメニューを取得
        this.items = await this.getRichmenus()

        this.$toast.success(`デフォルトリッチメニューが変更されました。`, {
          position: 'bottom-right'
        })
      } catch(e) {
        console.error(e)
        this.$toast.error(`デフォルトリッチメニューの変更に失敗しました。`, {
          position: 'bottom-right'
        })
      }
      this.loadingTbl = false
    },


    /** *****************************************************
     * リッチメニュー画像を取得
     * @param {String} richmenuId
     ***************************************************** */
    async getRichmenuImage(richmenuId) {
      const img = await this.lineApi.getRichmenuImage(richmenuId)
      if(img) {
        this.activeRichmenuImg = img
      } else {
        this.dialogRichmenuImg = false
      }
    },

    /** *****************************************************
     * リッチメニューを削除
     * @param {String} richmenuId
     ***************************************************** */
    async deleteRichmenu(richmenuId) {
      console.clear()
      this.loadingTbl   = true
      this.dialogRemove = false
      try {
        // デフォルトリッチメニュー設定
        await this.lineApi.deleteRichmenu(richmenuId)

        // 全リッチメニューを取得
        this.items = await this.getRichmenus()

        this.$toast.success(`リッチメニューを削除しました。`, {
          position: 'bottom-right'
        })
      } catch(e) {
        console.error(e)
        this.$toast.error(`リッチメニューの削除に失敗しました。`, {
          position: 'bottom-right'
        })
      }
      this.loadingTbl   = false
    },

  },
}
</script>