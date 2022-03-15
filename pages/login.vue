<template>
  <div class="my-5 w-100">
    <img src="https://admin.z-pro.tech/images/zp-logo-black.png" alt="" class="d-block mx-auto" style="width:300;">
    <div class="mx-auto" style="max-width:500px;">
      <v-card class="my-3 mx-2">
        <v-card-text>
          <!-- <v-form v-model="valid"> -->
            <p class="red--text text-center mt-3 mb-0">{{errorMsg}}</p>
            <v-text-field
              required
              :rules="validation.email"
              v-model="input.email"
              type="email"
              @keyup.enter="loginOnEnter"
              label="ユーザーID（メールアドレス）">
              <v-icon slot="prepend">mdi-account</v-icon>
            </v-text-field>
            <v-text-field
              required
              :rules="validation.password"
              type="password"
              v-model="input.password"
              @keyup.enter="loginOnEnter"
              label="パスワード">
              <v-icon slot="prepend">mdi-lock</v-icon>
            </v-text-field>
          <!-- </v-form> -->
        </v-card-text>

        <v-card-actions class="pa-0 pb-5 justify-lg-space-between">
          <v-spacer></v-spacer>
          <v-btn
            id="btnLogin"
            color="primary"
            :loading="btnLoading"
            :disabled="btnLoading"
            @click="email_login"
          >ログイン</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script>
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth'
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from '~/plugins/firebase.js';

export default {
  layout: 'login',
  head() {
    return {
      // nuxt.config.jsの%sに反映される内容
      title: 'ログイン',
    }
  },
  data() {
    return {
      redirectUrl: '',

      // 認証
      errorMsg: '',
      input: {
        email: '',
        password: ''
      },

      // バリデーション
      validation: {
        email: [
          v => !!v || 'メールアドレスを入力してください。',
          v => /.+@.+/.test(v) || 'メールアドレスを正しく入力してください。',
        ],
        password: [
          v => !!v || 'パスワードを入力してください。',
          v => v.length <= 8 || '8文字以上のパスワードを入力してください。',
        ],
      },
      valid: false,
      btnLoading: false,
    }
  },
  mounted: async function() {
    console.clear()
  },

  methods: {
    // ====================================
    // ログイン処理
    // ====================================
    email_login() {
      this.btnLoading = true

      this.$store.dispatch('signInWithEmail', {
        email   : this.input.email,
        password: this.input.password
      }).then(resp => {
        console.log(resp)
        const redirectUrl = this.$route.query.redirect;
        if(redirectUrl) {
          this.$router.push({ path: redirectUrl })
        } else {
          this.$router.push({ name: 'index' })
        }
      }).catch(err => {
        // console.error(err)
        if(!this.input.email && !this.input.password){
          this.errorMsg = 'ユーザーIDおよびパスワードを入力してください。'
        } else {
          if(err.code === 'auth/user-disabled') {
            this.errorMsg = 'このアカウントはロックされています。'
          } else if(err.status === 'error') {
            this.errorMsg = 'このアカウントではログインできません。'
          } else {
            this.errorMsg = 'メールアドレスまたはパスワードが間違っています。'
          }
        }

        this.btnLoading = false
      })
    },


    // ====================================
    // ID・パスワード入力フィールドで
    // Enterキー
    // ====================================
    loginOnEnter: e => {
      if(e.keyCode === 13) {
        document.getElementById('btnLogin').click()
      }
    },
  }
}
</script>