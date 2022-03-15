<template>
  <div>
    <v-toolbar flat>
      <v-btn
        text
        router
        exact
        color="success"
        :to="`/${page}/`"
      >
        <v-icon class="">mdi-view-list</v-icon>
        <span class="d-none d-sm-inline">一覧</span>
      </v-btn>
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
      <v-btn
        text
        router
        exact
        color="warning"
        :to="`/${page}/edit?id=${$route.params.slug}`"
      >
        <v-icon class="">mdi-pencil</v-icon>
        <span class="d-none d-sm-inline">編集</span>
      </v-btn>
      <v-btn
        text
        router
        exact
        color="error"
        @click="dialogRemove=true"
      >
        <v-icon class="">mdi-delete</v-icon>
        <span class="d-none d-sm-inline">削除</span>
      </v-btn>
    </v-toolbar>

    <v-container>
      <v-card class="mt-5 mb-10">
        <div class="d-flex flex-wrap grow px-4 p-2">
          <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
            <v-icon style="font-size:32px;">mdi-account-tie</v-icon>
          </v-card>
          <h3 class="ml-3 align-self-center">
            <v-icon left color="success">mdi-file</v-icon>
            詳細
          </h3>

          <v-spacer></v-spacer>

        </div>
        <v-divider></v-divider>
<!--
        <v-card-text>
          <DetailForm :field="field" :input="input" />
        </v-card-text>
-->

        <v-card-text>

          <v-list>
            <v-list-item>
              <v-list-item-avatar
                size="100"
                class="elevation-4"
              >
                  <img
                    v-if="input['field-image_url']"
                    :src="input['field-image_url']"
                  >
                  <!-- <v-img></v-img> -->
              </v-list-item-avatar>

              <v-list-item-action-text>
                <v-list-item-subtitle>よみ　がな</v-list-item-subtitle>
                <v-list-item-title v-if="input['field-name']">
                  <h2>{{input['field-name']}}</h2>
                </v-list-item-title>
              </v-list-item-action-text>

              <v-list-item-avatar>
                <template>
                  <v-icon
                    v-if="input['field-gender'] == '男性'"
                    color="blue"
                    v-text="'mdi-gender-male'"
                  ></v-icon>
                  <v-icon
                    v-else
                    color="red"
                    v-text="'mdi-gender-female'"
                  ></v-icon>
                </template>
              </v-list-item-avatar>
            </v-list-item>

            <v-list-item class="flex-column">
              <v-list-item-content
                class="pb-0"
                style="width:100%"
              >
                <v-list-item-subtitle
                  class="text-left"
                >{{input['field-position']}} | {{input['field-employ_status']}} | {{input['field-department']}}</v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-content
                class="pb-0"
                style="width:100%"
              >
                <v-list-item-subtitle
                  class="text-left"
                  v-if="input['field-birthday']"
                >{{convertDatetime(input['field-birthday'], 'YYYY年M月D日 生まれ')}} ({{birthdayToAge(input['field-birthday'])}})</v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-content
                class="pb-0"
                style="width:100%"
              >
                <v-list-item-subtitle
                  class="text-left"
                  v-if="input['field-birthday']"
                >{{convertDatetime(input['field-hire_date'], 'YYYY年M月D日 入社')}}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <template v-if="input['field-remarks']">
              <v-divider></v-divider>
              <v-list-item>
                <v-list-item-content
                  v-html="input['field-remarks'].replace(/\n/g, '<br>')"
                ></v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </v-card-text>


        <v-card-actions class="pa-4">
        </v-card-actions>
      </v-card>
    </v-container>


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
          <div>{{input['field-name']}}</div>
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
            @click="removeData"
          >
            削除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db, auth } from '~/plugins/firebase.js';
import moment from 'moment'

export default {
  props: ['page'],
  head() {
    return {
      title: '従業員管理 - ' + (this.$route.params.slug == 'new' ? '作成' : '編集'),
    }
  },
  data() {
    return {
      input: {
        'field-image_url'    : '',
        'field-name'         : '',
        'field-gender'       : '',
        'field-position'     : '',
        'field-employ_status': '',
        'field-department'   : '',
        'field-birthday'     : '',
        'field-hire_date'    : '',
        'field-remarks'      : '',
      },
      field: [],

      // ダイアログ
      dialogRemove: false,
    }
  },
  mounted: async function () {
    this.field  = await this.getField()

    if( this.$route.params.slug !== 'new' ) {
      const getDocRef = await getDoc(doc(collection(db, this.page), this.$route.params.slug))
      this.input = getDocRef.data()
      console.log(this.input)
    }
  },
  created: function () {
    this.field.forEach(el => {
      console.log(el)
      this.input[el.name] = el.value;
      console.log(this.input)
    })
  },
  methods: {
    /** *****************************************************
     * 日時変換
     ***************************************************** */
    convertDatetime(datetime, format) {
      return moment(datetime).format(format);
    },

    birthdayToAge(datetime) {
      const y = moment(datetime).format('YYYY')
      const m = moment(datetime).format('M')
      const d = moment(datetime).format('D')
      const birthday = moment().year(y).month(m - 1).date(d)

      return moment().diff(birthday, 'years') + '歳'
    },


    // フィールド情報取得
    async getField() {
      const fields = [];
      const docRef    = query(collection(db, 'setting', 'field', this.page));
      const getDocRef = await getDocs(docRef);

      getDocRef.forEach(doc => fields.push( doc.data() ) );
      return fields;
    },

    // データ削除
    async removeData(){
      this.loadingBtn = true

      try {
        console.log(this.$route.params.slug)
        await deleteDoc(doc(collection(db, this.page), this.$route.params.slug))
        this.$toast.success(`データが削除されました。`, {
          position: 'bottom-right'
        })

        this.$router.push(`/${this.page}`)
      } catch (e) {
        console.error("Error adding document: ", e)
        this.$toast.error(`データを削除できませんでした。`, {
          position: 'bottom-right'
        })
      }

      this.loadingBtn = false
    },
  }
}
</script>
