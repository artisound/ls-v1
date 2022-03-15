<template>
  <div>
    <HeaderLiff :title="title" />

    <v-container>
        <v-card
          max-width="500"
          class="mx-auto"
        >
          <template v-if="step === 1">
            <v-card-text v-if="valids.email || valids.password" class="text-center error--text">
              <span v-if="valids.email && valids.password">
                IDまたはパスワードが違います。
              </span>
              <span v-else-if="valids.email && !valids.password">
                IDが違います。
              </span>
            </v-card-text>

            <v-card-text>

                <v-text-field
                  outlined
                  label="ユーザーID"
                  hide-details="auto"
                  prepend-inner-icon="mdi-identifier"
                  :error="valids.email"
                  v-model="input.email"
                ></v-text-field>

            </v-card-text>

            <v-card-text>

              <v-text-field
                outlined
                label="パスワード"
                hide-details="auto"
                prepend-inner-icon="mdi-key"
                :error="valids.password"
                :type="pwShow ? 'text' : 'password'"
                :append-icon="pwShow ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="pwShow = !pwShow"
                v-model="input.password"
              ></v-text-field>

            </v-card-text>

            <v-card-text>

              <v-btn
                color="primary"
                width="100%"
                :loading="loading"
                :disabled="!btnActive ? true : false"
                @click="userLogin"
              >認証</v-btn>

            </v-card-text>

          </template>


          <template v-else-if="step === 2">

            <v-card-title class="mb-5">
              <v-spacer></v-spacer>
              連携が完了しました。
              <v-spacer></v-spacer>
            </v-card-title>

            <v-card-text>

              <v-btn
                color="success"
                width="100%"
                @click="actionCloseLiff"
              >閉じる</v-btn>

            </v-card-text>

          </template>
        </v-card>

    </v-container>

    <FooterLiff />
  </div>
</template>

<script>
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail, signOut } from "firebase/auth";
import { auth, db } from '~/plugins/firebase.js';

export default {
  layout: 'liff',
  data() {
    return {
      title: '従業員LINE連携',

      uid     : this.$route.query.uid,
      lineUser: {},
      input   : {},

      valids  : {
        email   : false,
        password: false,
      },

      step      : 1,
      pwShow    : false,
      overlay   : false,
      loading   : false,
      btnActive : false,
    }
  },
  watch: {
    input: {
      handler: function(aft) {
        this.inputValidationUpdate(false, false)
        if(aft.email && aft.password) {
          this.btnActive = true
        } else if(!aft.email || !aft.password){
          this.btnActive = false
        }
      },
      deep: true,
    }
  },
  mounted: async function () {
    console.clear()
    this.overlay = true

    // 念のためログアウト
    await signOut(auth)
    // ==================================
    // ① LIFF ユーザー情報取得
    // ==================================
    this.lineUser = await getLiffInfo(process.env.LIFF_STAFF_SYNC_DEV)


    this.inputValidationUpdate(false, false)
    this.loading = false
    this.overlay = false
  },
  methods: {
    /** *******************************************
     * ログイン - 従業員
     ******************************************* */
    async userLogin() {
      this.loading = true

      /** ************************
       * ① ユーザー有無確認
       ************************ */
      const exist_user = await fetchSignInMethodsForEmail(auth, this.input.email).then(exist => {
        // console.log(exist)
        return exist
      }).catch(err => {
        // console.log(err)
        return []
      })

      if(exist_user.length) {

        /** ************************
         * ② スタッフ情報
         * - ドキュメントID取得
         ************************ */
        const docId = await signInWithEmailAndPassword(auth, this.input.email, this.input.password).then(async success => {
          console.log(success)
          if(success.user.uid === this.uid) {
            // ユーザー情報取得
            const getDocRef = await getDocs( query(
              collection(db, 'staff'),
              where('field-uid', '==', this.uid)
            ) );

            let docId = ''
            getDocRef.forEach(doc => docId = doc.id );
            if(docId) return docId
          }
        }).catch(console.log)

        if(docId) {
          /** ************************
           * ③ スタッフ情報更新
           * - LINE ユーザーID 追加
           ************************ */
          await setDoc(doc(db, 'staff', docId), {
            'field-line_user_id': this.lineUser.userId
          }, { merge: true })

          /** ************************
           * ④ ログアウト処理
           ************************ */
          await signOut(auth)

          console.log(auth.currentUser)

          // バリデーション状態更新
          this.inputValidationUpdate(false, false)


          /** ************************
           * ⑤ 画面遷移
           * - 連携完了画面へ
           ************************ */
          this.step = 2
        } else {
          // --------------------------------------
          // IDまたはパスワードが違います
          // --------------------------------------
          // バリデーション状態更新
          this.inputValidationUpdate(true, true)
        }
      } else {
        // --------------------------------------
        // IDが違います
        // --------------------------------------
        // バリデーション状態更新
        this.inputValidationUpdate(true, false)
      }

      this.loading   = false
      this.btnActive = true
    },


    /** *******************************************
     * バリデーション状態更新
     * @param {Boolean} email    - ユーザーID入力フィールド
     * @param {Boolean} password - パスワード入力フィールド
     ******************************************* */
    inputValidationUpdate(email, password) {
      this.$set(this.valids, 'email',    email)
      this.$set(this.valids, 'password', password)
    },


    /** *******************************************
     * LIFF閉じる
     ******************************************* */
    actionCloseLiff() {
      liff.closeWindow()
    },

  },
}
</script>