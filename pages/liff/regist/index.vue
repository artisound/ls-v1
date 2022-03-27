<template>
  <div>
    <HeaderLiff :title="title" />
    <v-container>
      <v-stepper v-model="step">
        <v-stepper-header>
          <v-stepper-step
            :complete="step > 1"
            step="1"
          >
          </v-stepper-step>

          <v-divider></v-divider>

          <v-stepper-step
            :complete="step > 2"
            step="2"
          >
          </v-stepper-step>

          <v-divider></v-divider>

          <v-stepper-step step="3">
          </v-stepper-step>
        </v-stepper-header>

        <v-stepper-items>
          <v-stepper-content step="1">
            <InputForm :field="field" :input="input" :datepicker="datepicker" @input-value="inputedValue" class="mb-3" />

            <v-divider></v-divider>

            <v-sheet class="py-3">
              <v-row>
                <v-col cols="6">
                  <v-btn style="width:100%;">キャンセル</v-btn>
                </v-col>

                <v-col cols="6">
                  <v-btn
                    @click="step = 2"
                    color="primary"
                    style="width:100%;"
                  >確認</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-stepper-content>

          <v-stepper-content step="2">
            <DetailForm :field="field" :input="input" :datepicker="datepicker" />

            <v-sheet class="py-3">
              <v-row>
                <v-col cols="6">
                  <v-btn
                    @click="step = 1"
                    style="width:100%;"
                    :disabled="loading"
                  >戻る</v-btn>
                </v-col>

                <v-col cols="6">
                  <v-btn
                    @click="actionRegist();loading=!loading"
                    :loading="loading"
                    :disabled="loading"
                    color="primary"
                    style="width:100%;"
                  >{{title}}</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-stepper-content>

          <v-stepper-content step="3">
            <v-sheet
              class="mb-12"
            >
              <p v-if="title == '登録'">ご登録いただき、誠にありがとうございます。</p>
              <p v-else>保存されました。</p>

              <p>「閉じる」ボタンをタップして、この画面を閉じてください。</p>
            </v-sheet>

            <v-sheet class="py-3">
              <v-row class="justify-center">
                <v-col cols="6">
                  <v-btn
                    @click="actionCloseLiff"
                    color="primary"
                    style="width:100%;"
                  >閉じる</v-btn>
                </v-col>
              </v-row>
            </v-sheet>
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>

      <v-overlay :value="overlay">
        <v-progress-circular
          indeterminate
          size="64"
        ></v-progress-circular>
      </v-overlay>
    </v-container>
    <FooterLiff />
  </div>
</template>

<script>
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, fetchSignInMethodsForEmail, EmailAuthProvider, linkWithCredential, signOut, deleteUser } from "firebase/auth";
import { firebaseApp, auth, db } from '~/plugins/firebase.js';
import { lineMsgApi } from '~/plugins/line_api.js';
import sha256 from 'crypto-js/sha256';

export default {
  layout: 'liff',
  data() {
    return {
      title: '',
      user : {},
      login: {},
      docId: '',
      field: [],
      input: {},
      datepicker: {},

      step: 1,
      overlay: false,
      loading: false,
    }
  },
  watch: {
    input: {
      handler: async function (val, oldVal) {
        if(val['field-zip_code']){
          let zip_code = val['field-zip_code']
          this.$set(this.input, 'field-zip_code', insertHyphenForZipcode(zip_code))

          if(zip_code.length === 8) {
            let apiKey  = process.env.GEOCODING_KEY
            let address = await getAddressByZipcodeFromGmap(zip_code, apiKey)

            if(address.length){
              let len = address.length
              let newAddress = '';
              address.forEach((el,i) => {
                if(i != 0 && i < len - 1) {
                  newAddress += el.long_name
                }
              })
              this.$set(this.input, 'field-address', newAddress)
            } else {
              this.$set(this.input, 'field-address', '')
            }
          } else {
            this.$set(this.input, 'field-address', '')
          }
        }
      },
      deep: true
    },
  },
  mounted: async function () {
    console.clear()
    this.overlay = true

    // ==================================
    // LINE Messaging API実行
    // ==================================
    this.lineApi = new lineMsgApi({
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });

    // ==================================
    // ① LIFF ユーザー情報取得
    // ==================================
    const getLiff   = await getLiffInfo(process.env.LIFF_REGIST)
    this.userId    = getLiff.userId

    // ==================================
    // ② Firebase ログイン
    // ==================================
    this.login = await signInWithEmailAndPassword(auth, process.env.LIFF_USER_ID, process.env.LIFF_USER_PW)

    if(this.login) {
      // ==================================
      // ③ Firestore フィールド情報取得
      // ==================================
      this.field    = await this.getField()

      // ==================================
      // ④ Firestore ユーザー情報取得
      // ==================================
      this.userDoc  = await this.getUserDocId(this.userId)

      // ==================================
      // ⑤ Firestore ユーザー情報自動入力
      // ==================================
      if(this.userDoc) {
        this.title  = '更新'
        this.docId  = this.userDoc.docId

        for(const key in this.userDoc.data) {
          this.$set(this.input, key, this.userDoc.data[key])
        }
      } else {
        this.title  = '登録'
      }

      // ==================================
      // ⑥ LIFF ユーザー情報自動入力
      // ==================================
      this.$set(this.input, 'field-line_user_id',   this.userId)
      this.$set(this.input, 'field-line_language',  getLiff.language)
      this.$set(this.input, 'field-line_user_name', getLiff.displayName)
    }

    this.loading = false
    this.overlay = false
  },
  methods: {
    /** *******************************************
     * LINE設定情報取得
     ******************************************* */
    async getLineSetting() {
      const getDocRef = await getDoc(doc(db, 'setting', 'line'))
      const data = getDocRef.data();
      return (data) ? data : {}
    },


    /** *******************************************
     * フィールド情報取得
     ******************************************* */
    async getField() {
      const fields    = [];
      const colRef    = collection(db, 'setting', 'field', 'customer')
      const queryRef  = query(colRef, orderBy('num', 'asc'))
      const getDocRef = await getDocs(queryRef);

      getDocRef.forEach(doc => fields.push(doc.data()) );
      return fields;
    },


    /** *******************************************
     * ユーザー情報取得（Firestore）
     ******************************************* */
    async getUserDocId(lineUserId) {
      const colRef    = collection(db, 'customer')
      const docRef    = query(colRef, where('field-line_user_id', '==', lineUserId));
      const getDocRef = await getDocs(docRef);

      let arr = [];
      getDocRef.forEach(doc => arr.push({ docId: doc.id, data: doc.data() }) )

      if(arr.length) return arr[0]
    },


    /** *******************************************
     * 【Firebase】idToken取得
     ******************************************* */
    async getIdToken() {
      const functions = getFunctions()
      functions.region = 'asia-northeast2'
      const getIdTokenFunction = httpsCallable(functions, 'getIdToken')
      const idToken = await getIdTokenFunction().then(res => {
        if(res.data.idToken) return res.data.idToken
      }).catch(console.error);
      // console.log(idToken)
      return idToken
    },


    /** *******************************************
     * 【Firestore】ユーザードキュメント取得
     ******************************************* */
    async getUserDocs(idToken, collectionId) {
      const functions = getFunctions()
      functions.region = 'asia-northeast2'
      const getDocFunction = httpsCallable(functions, 'asyncGetFirestore')
      const documents = await getDocFunction({
        method: 'get',
        idToken: idToken,
        collection: collectionId,
      }).then(res => {
        if(res.data.documents) return res.data.documents
      }).catch(console.error);
      return documents
    },


    /** *******************************************
     * 登録
     ******************************************* */
    async actionRegist() {
      try {
        // ===========================================
        // ユーザー情報更新
        // ===========================================
        if(!this.input['field-registered']) {
          this.$set(this.input, 'field-registered', true)
          // ===========================================
          // LINE リッチメニュー変更・メッセージ送信
          // - 初回のみ
          // ===========================================
          const config = await this.getLineSetting()
          // LINE リッチメニュー変更
          if(config.customer_added_richmenu) await this.lineApi.linkRichmenuToUser(config.customer_added_richmenu, this.userId)
          // メッセージ送信
          this.lineApi.sendPushMessage({
            to      : this.userId,
            messages: config.customer_added_message,
          })

        }
        await setDoc( doc( collection(db, 'customer'), this.userId), this.input, { merge: true } )

        this.step = 3
      } catch (e) {
        console.error(e)
        this.step = 1
      }
    },


    /** *******************************************
     * ログアウト - 匿名ユーザー削除
     ******************************************* */
    async userLogout() {
      const user = auth.currentUser;

      // ログアウト処理
      await signOut(auth).then(() => {

        // 匿名ユーザー削除
        deleteUser(user).then(() => {
          // console.log('deleted')
        }).catch((error) => {
          console.error(error)
        });

      }).catch((error) => {
        console.error(error)
      });
    },


    /** *******************************************
     * LIFF閉じる
     ******************************************* */
    actionCloseLiff() {
      liff.closeWindow()
    },

    inputedValue(payload) {
      this.input = payload
      // console.log(this.input)
    },

    handle() {
    }
  },
}
</script>