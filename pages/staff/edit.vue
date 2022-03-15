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
      <div class="d-flex" style="gap:10px;">
        <v-btn
          router
          exact
          color="error"
          :to="`/${page}/`"
        >
          <span class="">キャンセル</span>
        </v-btn>
        <v-btn
          router
          exact
          color="primary"
          @click="saveData"
        >
          <v-icon class="">mdi-cloud-upload</v-icon>
          <span class="ml-2">保存</span>
        </v-btn>
      </div>
    </v-toolbar>

    <v-container>
      <v-card class="mt-5 mb-10">
        <div class="d-flex flex-wrap grow px-4 p-2">
          <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
            <v-icon style="font-size:32px;">mdi-account-tie</v-icon>
          </v-card>
          <h3 class="ml-3 align-self-center">
            <v-icon left color="success">mdi-pencil</v-icon>
            編集
          </h3>
        </div>
        <v-divider></v-divider>

        <v-card-text>
          <v-card width="150" height="150">
            <template v-if="input['field-image_url']">
              <v-img
                :src="input['field-image_url']"
                style="position:relative;"
              >
                <v-btn
                  icon
                  @click="deleteStaffImage"
                  :style="{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                  }"
                ><v-icon color="error">mdi-close-circle</v-icon></v-btn>
              </v-img>
            </template>

            <template v-else>
              <v-file-input
                id="staffImageInput"
                v-model="staffImage"
                class="d-none"
                accept="image/*"
                @change="uploadStaffImage"
              ></v-file-input>

              <v-card-title style="height: 100%;">
                <v-spacer></v-spacer>
                <v-btn
                  dark
                  color="info"
                  @click="selectStaffImage"
                >画像を選択</v-btn>
                <v-spacer></v-spacer>
              </v-card-title>
            </template>
          </v-card>
        </v-card-text>



        <v-card-text>
          <InputForm :field="field" :input="input" :datepicker="datepicker" @input-value="inputedValue" />
        </v-card-text>

        <v-divider></v-divider>
        <v-card-text>
          ログイン情報
          <v-row class="mt-1">
            <v-col cols="12">
              <v-text-field
                outlined
                type="email"
                label="ユーザーID(メールアドレス)"
                placeholder="username@example.com"
                hide-details="auto"
                prepend-inner-icon="mdi-email"
                :disabled="emDisabled"
                v-model="input['field-email']"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-switch
                v-if="userExist"
                label="パスワードを変更する"
                v-model="password"
              ></v-switch>

              <v-text-field
                v-else
                outlined
                label="パスワード"
                placeholder="････････"
                hide-details="auto"
                prepend-inner-icon="mdi-key"
                :type="pwShow ? 'text' : 'password'"
                :append-icon="pwShow ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="pwShow = !pwShow"
                v-model="password"></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            large
            color="primary"
            :loading="loadingBtn"
            :disabled="loadingBtn"
            @click="saveData"
          >
            <v-icon
              left
              dark
            >
              mdi-cloud-upload</v-icon>保存
            </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { db, auth } from '~/plugins/firebase.js';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  updatePassword
} from "firebase/auth";
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
export default {
  props: ['page'],
  head() {
    return {
      title: '従業員管理 - 詳細',
    }
  },
  data() {
    return {
      stfId : this.$route.query.id,
      loadingBtn: false,
      datepicker: {},
      input     : {},
      field     : [],
      staffImage: null,
      // Firebase Storage
      fbStorage : getStorage(),
      userExist : false,
      pwShow    : false,
      emDisabled: false,
      password: '',
    }
  },
  created: function () {
    window.addEventListener("beforeunload", this.confirmSave)
  },
  mounted: async function () {
    console.clear()

    if(!this.$route.query.id) this.$router.push('/staff/edit/')
    // ------------------------------
    // フィールド取得
    this.field  = await this.getField()
    // ------------------------------
    // 各フィールドデフォ値挿入
    this.field.forEach(el => this.$set(this.input, el.name, el.value) )
    // =============================
    // 編集
    // =============================
    if( this.stfId ) {
      // ------------------------------
      // 従業員データ取得
      const getDocRef = await getDoc( doc( collection(db, this.page), this.stfId ), this.input )
      const staffData = getDocRef.data()
      // ------------------------------
      // 各フィールド 従業員データ挿入
      for(var sd in staffData) {
        this.$set(this.input, sd, staffData[sd])
        if(sd == 'field-email' && staffData[sd]) {
          this.emDisabled = true
          const exist_user = await this.userExistCheck(staffData[sd])
          if(exist_user.length) this.userExist = true
        }
      }
    }
  },
  methods: {
    confirmSave (event) {
      event.returnValue = "編集中のものは保存されませんが、よろしいですか？";
    },
    /** ****************************************************
     * フィールド情報取得
     **************************************************** */
    async getField() {
      const fields    = []
      const docRef    = query(collection(db, 'setting', 'field', this.page))
      const getDocRef = await getDocs(docRef)
      getDocRef.forEach(doc => fields.push( doc.data() ) )
      return fields
    },
    /** ****************************************************
     * 入力データ保存
     **************************************************** */
    async saveData() {
      this.loadingBtn = true
      try {
        // ==================================
        // ユーザー作成・パスワード変更 判定
        // ==================================
        if(this.input['field-email'] && this.password) {
          // ユーザー存在チェック
          const userExist = await this.userExistCheck(this.input['field-email'])
          this.userExist  = (userExist.length) ? true : false
          if(!this.userExist) {
            // ==================================
            // ユーザー作成
            // ==================================
            await createUserWithEmailAndPassword(auth, this.input['field-email'], this.password).then(success => {
              // ------------------------
              // 従業員情報に UID 追加
              this.$set(this.input, 'field-uid', success.user.uid)
              this.$toast.success(`ユーザーが作成されました。`, {
                position: 'bottom-right'
              })
              // this.$router.push(`/${this.page}`)
            }).catch(async err => {
              console.log(err.code)
              console.log(err.message)
              // ------------------------
              // パスワード6文字以上
              if ( err.code.endsWith('email-already-in-use') && this.input['field-uid']) {
                // await updatePassword(this.input['field-uid'], this.password).then(console.log).catch(console.error)
              } else {
                this.$toast.error(`ユーザーの作成に失敗しました。`, {
                  position: 'bottom-right'
                })
              }
            })
          } else {
            // ==================================
            // パスワード再設定メール送信
            // ==================================
            await sendPasswordResetEmail(auth, this.input['field-email']).then(success => {
              console.log(success)
            }).catch((error) => {
              console.error(error.code)
              console.error(error.message)
            });
          }
        } else {
          this.$router.push(`/${this.page}`)
        }
        // ==================================
        // 従業員情報登録・更新
        // ==================================
        if( this.stfId ) {
          // -------------------------------
          // 更新
          // -------------------------------
          await setDoc( doc( db, this.page, this.stfId ), this.input, { merge: true } )
          this.$toast.success(`保存されました。`, {
            position: 'bottom-right'
          })
        } else {
          // -------------------------------
          // 登録
          // -------------------------------
          await setDoc( doc( collection(db, this.page) ), this.input )
          this.$toast.success(`保存されました。`, {
            position: 'bottom-right'
          })
        }
      } catch (e) {
        console.error("Error adding document: ", e)
        this.$toast.success(`エラーが発生しました。`, {
          position: 'bottom-right'
        })
      }
      this.loadingBtn = false
    },
    /** ****************************************************
     * ユーザー存在確認
     * @param {string} email - ログインID（メールアドレス）
     **************************************************** */
    async userExistCheck(email) {
      return await fetchSignInMethodsForEmail(auth, email).then(exist => {
        // console.log(exist)
        return exist
      }).catch(err => {
        // console.log(err.message)
        return []
      })
    },
    /** ****************************************************
     * スタッフ画像削除
     **************************************************** */
    deleteStaffImage() {
      this.$set(this.input, 'field-image_url', '')
      this.staffImage = null
    },
    /** ****************************************************
     * スタッフ画像アップロード
     **************************************************** */
    async uploadStaffImage(e) {
      const extension = this.getImageExtByMimeType(e.type)
      if(!extension) return
      const fileName = e.lastModified + extension
      const reader = new FileReader()
      reader.readAsDataURL(e);
      reader.addEventListener('load', function (f) {
        console.log(e)
        this.staffImage = reader.result;
      }, false)
      if(this.staffImage) {
        try {
          // ファイルアップロード
          const uploadedData = await uploadBytes( ref(this.fbStorage, `${this.page}/${fileName}`), this.staffImage);
          console.log(uploadedData)
          // アップロードしたファイルのURLを取得
          const img_url = await getDownloadURL( ref(this.fbStorage, `${this.page}/${fileName}`) )
          console.log(img_url)
          this.$set(this.input, 'field-image_url', img_url)
        } catch(e) {
          console.error(e)
        }
      }
    },
    getImageExtByMimeType(mime) {
      switch(mime) {
        case 'image/png': return '.png'
        case 'image/gif': return '.gif'
        case 'image/jpeg': return '.jpg'
      }
    },
    /** 
     * ボタンをクリックしてファイルを選択
     */
    selectStaffImage() {
      document.getElementById('staffImageInput').click()
    },
    inputedValue(payload) {
      this.input = payload
      // console.log(this.input)
    }
  },
  destroyed () {
    window.removeEventListener("beforeunload", this.confirmSave)
  },
}
</script>