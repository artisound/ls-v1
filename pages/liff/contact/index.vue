<template>
  <div>
    <HeaderLiff :title="title" />
    <v-container>
      <InputForm :field="field" :input="input" :datepicker="datepicker" @input-value="inputedValue" class="mb-3" />

      <v-divider></v-divider>

      <v-sheet class="py-3">
        <v-row>
          <v-col cols="6">
            <v-btn style="width:100%;">キャンセル</v-btn>
          </v-col>

          <v-col cols="6">
            <v-btn
              @click="dialogSendMessage=!dialogSendMessage"
              color="primary"
              style="width:100%;"
            >送信</v-btn>
          </v-col>
        </v-row>
      </v-sheet>

      <v-overlay :value="overlay">
        <v-progress-circular
          indeterminate
          size="64"
        ></v-progress-circular>
      </v-overlay>
    </v-container>
    <FooterLiff />


    <!-- メッセージ送信ダイアログ -->
    <v-dialog
      v-model="dialogSendMessage"
      max-width="400"
    >
      <v-card>
        <v-toolbar
          flat
          dark
          color="success"
          class="text-h5"
        >
          <v-icon color="white" class="mr-3">mdi-send</v-icon>
          <div>お問い合わせ</div>
        </v-toolbar>

        <v-card-text class="py-3">
          このお問い合わせ内容を送信します。<br>
          送信後は取り消しができません。<br>
          よろしいですか？
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="secondary"
            text
            @click="dialogSendMessage = false"
          >キャンセル</v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="success"
            @click="sendContact"
            :loading="loading"
            :disabled="loading"
          >送信</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { doc, collection, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { auth, db } from '~/plugins/firebase.js';
import { lineMsgApi } from '~/plugins/line_api.js';
import moment from 'moment';

export default {
  layout: 'liff',
  data() {
    return {
      // ----------------------
      // クエリパラメータ
      mid  : this.$route.query.mid,
      admin: this.$route.query.admin,

      // ----------------------
      // ページ設定
      title: 'お問い合わせ',
      login: {},

      // ----------------------
      // 入力フィールド情報
      field: [],
      input: {},
      datepicker: {},

      // ----------------------
      // 問い合わせルーム情報
      roomInfo: {
        title     : this.$route.query.title || '',
        status    : '',
        messages  : this.$route.query.message || '',
        created_at: '',
        created_by: '',
        updated_at: '',
        updated_by: '',
      },

      // ----------------------
      // ダイアログ
      dialogSendMessage: false, // メッセージ送信

      // ----------------------
      // ローディングアクション
      overlay: false,
      loading: false,
    }
  },
  created: function () {
    // console.clear()
  },
  mounted: async function () {
    this.overlay = true

    // ==================================
    // ① LIFF ユーザー情報取得
    // ==================================
    this.liffInfo = await getLiffInfo(process.env.LIFF_CONTACT)

    // ==================================
    // ② Firebase ログイン
    // ==================================
    this.login = await signInWithEmailAndPassword(auth, process.env.LIFF_USER_ID, process.env.LIFF_USER_PW)

    if(this.login) {
      // ==================================
      // ③ Firestore フィールド情報取得
      // ==================================
      this.field = await this.getField()

      // ==================================
      // ④ Firestore 事業者情報取得
      // ==================================
      this.corpSetting = await this.getDocument('setting/corp')

      // ==================================
      // ⑤ Firestore 問い合わせルーム情報
      // ==================================
      const roomInfo = (this.mid) ? await this.getDocument(['contact', this.mid]) : null
      console.log(roomInfo)
      if(this.mid && roomInfo){  // 問い合わせ返信の場合
        this.roomInfo = roomInfo

        if(this.admin) {  // 事業者側からの返信の場合、ステータスを「返信：1」に変更
          this.$set(this.roomInfo, 'status', 1)
        } else {
          this.$set(this.roomInfo, 'status', 0)
        }

        if(this.roomInfo.title){  // タイトル有無判定
          // タイトル自動入力
          this.$set(this.input, 'field-title', this.roomInfo.title)

          // タイトルフィールドの要素番号取得
          let titleIndex = this.field.findIndex(v => v.name == 'field-title')
          // タイトルフィールドを非活性化
          this.$set(this.field[titleIndex], 'disabled', true)
        }
      }

      this.userDoc     = await this.getUserDocId(this.liffInfo.userId)  // LINEユーザーIDから顧客情報を取得
      if(!this.userDoc && !this.admin) {   // ユーザー登録されていない場合、登録画面へリダイレクト
        location.href = 'https://liff.line.me/' + process.env.LIFF_REGIST
        return;
      } else {  // LINEユーザーIDを自動入力
        // LINEユーザーIDフィールドの要素番号取得
        let uidIndex = this.field.findIndex(v => v.name == 'field-uid')
        // LINEユーザーID自動入力
        this.$set(this.field[uidIndex], 'value', this.userDoc.docId)
      }
    }


    // -------------------------------------------
    // LINEクラス定義
    this.lineApi = new lineMsgApi({       // 顧客用
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });

    this.lineApiAdmin = new lineMsgApi({  // 事業者用
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_ADMIN_TOKEN,
    });

    this.overlay = false
  },
  methods: {
    /** *******************************************
     * ドキュメント情報取得
     * @param {string} documentPath - Firestoreドキュメント名
     ******************************************* */
    async getDocument(documentPath) {
      if( Array.isArray(documentPath) ) documentPath = documentPath.join('/')
      console.log(documentPath)

      try {
        const getDocRef = await getDoc(doc(db, documentPath))
        const data = getDocRef.data();
        return (data) ? data : {}
      } catch(e) {
        console.error(e)
      }
    },


    /** *******************************************
     * フィールド情報取得
     ******************************************* */
    async getField() {
      const fields    = [];

      const colRef    = collection(db, 'setting', 'field', 'contact')
      const queryRef  = query(colRef, orderBy('num', 'asc'))

      try {
        const getDocRef = await getDocs(queryRef);

        getDocRef.forEach(doc => fields.push(doc.data()) );
        return fields;
      } catch(e) {
        console.error(e)
      }
    },


    /** *******************************************
     * スタッフ情報取得（Firestore）
     * @param {string} lineUserId - LINEユーザーID
     ******************************************* */
    async getStaffDocs() {
      const colRef    = collection(db, 'staff')
      const docRef    = query(colRef, where('field-line_user_id', '!=', ''));
      try {
        const getDocRef = await getDocs(docRef);

        let arr = [];
        getDocRef.forEach( doc => arr.push( doc.data() ) )

        if(arr.length) {
          return arr
        } else {
          throw {error: 'LINE連携された従業員がいません。'}
        }
      } catch(e) {
        console.error(e)
      }
    },


    /** *******************************************
     * ユーザー情報取得（Firestore）
     * @param {string} lineUserId - LINEユーザーID
     ******************************************* */
    async getUserDocId(lineUserId) {
      const colRef    = collection(db, 'customer')
      const docRef    = query(colRef, where('field-line_user_id', '==', lineUserId));
      try {
        const getDocRef = await getDocs(docRef);

        let arr = [];
        getDocRef.forEach(doc => arr.push({ docId: doc.id, data: doc.data() }) )

        if(arr.length) return arr[0]
      } catch(e) {
        console.error(e)
      }
    },




    /** *******************************************
     * 登録
     ******************************************* */
    async sendContact(){
      this.loading           = true   // ローディング開始
      this.dialogSendMessage = false  // メッセージ送信ダイアログを閉じる
      // 匿名ログイン
      // this.login = await signInAnonymously(auth)

      const now = moment().format('YYYY-MM-DD HH:mm:ss')

      try {
        // ============================
        // 回答への返信
        // ============================
        if(this.mid){
          // LINE連携しているスタッフのLINEユーザーID取得
          const staffLineIds = await getStaffDocs()

          // ====================================================================
          // LINEメッセージ送信
          // 顧客 → 事業者
          // ====================================================================
          if(!this.admin){
            // ---------------------------
            // 顧客LINEメッセージ送信
            const sendMsg = await this.lineApi.sendPushMessage({
              to      : this.liffInfo.userId,
              messages: [{
                type: 'text',
                text: `問い合わせを受け付けました。\n\n---------------\n件名：${this.input['field-title']}\n本文：\n${this.input['field-body']}\n---------------`,
              }],
            });

            // ---------------------------
            // 事業者LINEメッセージ送信
            const customerName = this.userDoc.data['field-name'] || this.userDoc.data['field-line_user_name']

            const param = {
              to: staffLineIds,
              messages: this.lineMessageFormat({
                admin : true,
                title : `${customerName}様から追加の問い合わせがありました。`,
                body  : `受付日時：${moment(now).format('YYYY年M月D日 H:mm')}\n\n件名：${this.input['field-title']}\n本文：\n${this.input['field-body']}`,
                roomId: this.mid,
                liffId: process.env.LIFF_CONTACT,
              }),
            }
            const sendMsgAdmin = await this.lineApiAdmin.sendMulticastMessage(param);
            console.log(sendMsgAdmin)
          }
          // ====================================================================
          // LINEメッセージ送信
          // 事業者 → 顧客
          // ====================================================================
          else {
            // ---------------------------
            // 事業者LINEメッセージ送信
            const sendMsg = await this.lineApiAdmin.sendMulticastMessage({
              to: staffLineIds,
              messages: [{
                type: 'text',
                text: `問い合わせを返信しました。\n\n---------------\n件名：${this.input['field-title']}\n本文：\n${this.input['field-body']}\n---------------`,
              }],
            });
            console.log(sendMsg)

            // ---------------------------
            // 顧客LINEメッセージ送信
            const customerName = this.corpSetting.corp_name
            const sendMsgAdmin = await this.lineApi.sendPushMessage({
              to: this.liffInfo.userId,
              messages: this.lineMessageFormat({
                title : `${customerName}からお問い合わせの返信がありました。`,
                body  : `受付日時：${moment(now).format('YYYY年M月D日 H:mm')}\n\n件名：${this.input['field-title']}\n本文：\n${this.input['field-body']}`,
                roomId: this.mid,
                liffId: process.env.LIFF_CONTACT,
              }),
            });
            console.log(sendMsgAdmin)
          }

          // ====================================================================
          // 問い合わせルーム更新
          // ====================================================================
          this.$set(this.roomInfo, 'messages'  , this.roomInfo.messages + 1)
          this.$set(this.roomInfo, 'updated_at', now)
          this.$set(this.roomInfo, 'updated_by', this.liffInfo.userId)

          await updateDoc( doc( db, 'contact', this.mid ), this.roomInfo )

          // ---------------------------
          // 問い合わせ内容登録
          // ---------------------------
          this.input['field-sended_at'] = moment(now).unix()
          await addDoc( collection(db, 'contact', this.mid, 'message'), this.input )

        }

        // ============================
        // 新規問い合わせ送信
        // ============================
        else {
          // ---------------------------
          // 問い合わせルーム作成
          // ---------------------------
          this.$set( this.roomInfo, 'title',      this.input['field-title'] )
          this.$set( this.roomInfo, 'status',     0 )
          this.$set( this.roomInfo, 'messages',   1 )
          this.$set( this.roomInfo, 'customer',   this.userDoc.data['field-name'] || this.userDoc.data['field-line_user_name'] )
          this.$set( this.roomInfo, 'created_at', now )
          this.$set( this.roomInfo, 'created_by', this.liffInfo.userId )
          const docRef = await addDoc( collection( db, 'contact' ), this.roomInfo )

          // ---------------------------
          // 問い合わせ内容登録
          // ---------------------------
          this.input['field-sended_at'] = moment(now).unix()
          await addDoc( collection(db, 'contact', docRef.id, 'message'), this.input )

          // ---------------------------
          // LINEメッセージ送信
          // ---------------------------
          const sendMsg = await this.lineApi.sendPushMessage({
            to      : this.liffInfo.userId,
            messages: [{
              type: 'text',
              text: `問い合わせを受け付けました。\n\n---------------\n${this.input['field-body']}\n---------------`,
            }],
          });
          console.log(sendMsg)

          // ---------------------------
          // 事業者LINEメッセージ送信
          // ---------------------------
          const customerName = this.userDoc.data['field-name'] || this.userDoc.data['field-line_user_name']
          const sendMsgAdmin = await this.lineApiAdmin.sendBroadcastMessage({
            messages: this.lineMessageFormat({
              admin : true,
              title : `${customerName}様から問い合わせがありました。`,
              body  : `受付日時：${moment(now).format('YYYY年M月D日 H時mm分')}\n問い合わせ内容：\n${this.input['field-body']}`,
              roomId: docRef.id,
              liffId: process.env.LIFF_CONTACT,
            }),
          });
          console.log(sendMsgAdmin)
          console.log(docRef)
        }

        // LIFF画面を閉じる
        liff.closeWindow()
      } catch (e) {
        console.error(e)
      }

      this.loading = false
    },


    /** *******************************************
     * ログアウト - 匿名ユーザー削除
     ******************************************* */
    userLogout() {
      const user = auth.currentUser;

      // ログアウト処理
      signOut(auth).then(() => {

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

    
    /** *****************************************************
     * 返信メッセージフォーマット
     ***************************************************** */
    lineMessageFormat(params) {
      const title  = params.title;
      const body   = params.body;
      const roomId = params.roomId;
      const liffId = params.liffId;

      const message = [{
        type: 'flex',
        altText: title,
        contents: {
          type: 'bubble',
          direction: 'ltr',
          body: {
            type    : 'box',
            layout  : 'vertical',
            spacing : 'none',
            contents: [
              {
                type    : 'text',
                text    : title,
                weight  : 'bold',
                align   : 'start',
                wrap    : true,
                contents: []
              }, {
                type    : 'text',
                text    : body,
                align   : 'start',
                margin  : 'lg',
                wrap    : true,
                contents: []
              }
            ]
          },
          footer: {
            type    : 'box',
            layout  : 'horizontal',
            spacing : 'md',
            contents: [
              {
                style : 'primary',
                type  : 'button',
                height: 'sm',
                action: {
                  type : 'uri',
                  label: '返信',
                  uri  : `https://liff.line.me/${liffId}?mid=${roomId}`
                },
              }
            ]
          }
        }
      }];

      if(params.admin) {
        message[0].contents.footer.contents[0].action.uri = `https://liff.line.me/${liffId}?mid=${roomId}&admin=1`
        message[0].contents.footer.contents.push({
          style : 'primary',
          type  : 'button',
          height: 'sm',
          action: {
            type : 'uri',
            label: 'ダッシュボード',
            uri  : `https://${location.host}/contact`
          },
        });
      }

      return message;
    },
  }
}
</script>