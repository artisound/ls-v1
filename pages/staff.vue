<template>
  <div>
    <v-container v-if="$route.path == `/${page}` || $route.path == `/${page}/`">
      <v-card>
        <v-card-title class="d-flex flex-wrap grow mt-5 px-4 py-0">
          <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
            <v-icon style="font-size:32px;">mdi-account-tie</v-icon>
          </v-card>

          <v-spacer></v-spacer>

          <v-btn
            text
            router
            exact
            color="success"
            :to="`/${page}/edit/`"
          >
            <v-icon class="">mdi-plus</v-icon>
            <span class="d-none d-sm-inline">作成</span>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>

        <v-row
          class="pa-4"
          justify="space-between"
        >
          <v-col cols="5">
            <v-treeview
              :active.sync="active"
              :items="items"
              :open.sync="open"
              activatable
              color="warning"
              open-on-click
              transition
            >
              <template v-slot:prepend="{ item }">
                <v-icon v-if="!item.children">
                  mdi-account
                </v-icon>
              </template>
            </v-treeview>
          </v-col>

          <v-divider vertical></v-divider>

          <v-col class="d-flex text-center py-0">
            <v-scroll-y-transition
              v-if="selected"
              mode="out-in"
            >
              <v-list class="pa-0" width="100%">
                <v-list-item>
                  <v-chip
                    v-if="selected['line_user_id']"
                    dark
                    label
                    class="ma-2"
                    color="orange"
                  >連携済</v-chip>

                  <v-spacer></v-spacer>

                  <v-menu offset-y>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                      >
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item :to="`/${page}/edit?id=${selected.id}`">
                        <v-list-item-title>
                          <v-icon class="">mdi-pencil</v-icon>
                          <span class="d-none d-sm-inline">編集</span>
                        </v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="dialogRemove=true">
                        <v-list-item-title>
                          <v-icon class="">mdi-delete</v-icon>
                          <span class="d-none d-sm-inline">削除</span>
                        </v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-list-item>

                <v-list-item>
                  <v-card
                    :key="selected.id"
                    class="mx-auto"
                    flat
                  >
                    <v-card-text>
                      <v-avatar
                        v-if="selected['image_url']"
                        size="88"
                      >
                        <v-img
                          :src="selected['image_url']"
                          class="mb-6"
                        ></v-img>
                      </v-avatar>
                      <h3 class="text-h5 mb-2">
                        {{ selected.name }}
                      </h3>
                      <div class="blue--text mb-2">
                        {{ selected.email }}
                      </div>
                      <div class="blue--text subheading font-weight-bold">
                        {{ selected.uid }}
                      </div>
                    </v-card-text>
                    <!-- <v-divider></v-divider> -->
                    <v-row
                      class="text-left"
                      tag="v-card-text"
                    >
                      <!-- <v-col
                        class="text-right mr-4 mb-2"
                        tag="strong"
                        cols="5"
                      >
                        Company:
                      </v-col>
                      <v-col>{{ selected.company.name }}</v-col>
                      <v-col
                        class="text-right mr-4 mb-2"
                        tag="strong"
                        cols="5"
                      >
                        Website:
                      </v-col>
                      <v-col>
                        <a
                          :href="`//${selected.website}`"
                          target="_blank"
                        >{{ selected.website }}</a>
                      </v-col>
                      <v-col
                        class="text-right mr-4 mb-2"
                        tag="strong"
                        cols="5"
                      >
                        Phone:
                      </v-col>
                      <v-col>{{ selected.phone }}</v-col> -->
                    </v-row>
                  </v-card>
                </v-list-item>


              </v-list>
            </v-scroll-y-transition>
          </v-col>
        </v-row>
      </v-card>
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
      liffSyncUrl: process.env.LIFF_STAFF_SYNC,
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
      // items: [],
      active: [],
      avatar: null,
      open: [],
      staffs: [],
      activeData: {},

      // ローディング
      loadingTbl: false,

      // ダイアログ
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
    this.staffs = await this.getDataList();

    this.loadingTbl = false;
  },
  computed: {
    items () {
      const items = [], mps = []
      this.staffs.forEach(stf => {
      console.log(stf)
        mps.push(stf['position'])
      })
      const arr_mp = [...new Set(mps)]
      arr_mp.forEach(mp => {
        let item = {
          name: mp,
          children: [],
        }

        this.staffs.forEach(stf => {
          if(mp == stf['position']) item.children.push(stf)
        })
        items.push(item)
      })
      return items
    },
    selected () {
      if (!this.active.length) return
      const id = this.active[0]
      return this.staffs.find(stf => stf.id === id)
    },
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