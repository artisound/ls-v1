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
          :disabled="(rmImg && actions.length) ? false : true"
          @click="dialogCreateRichmenu = true"
        >
          <v-icon class="">mdi-cloud-upload</v-icon>
          <span class="ml-2">登録</span>
        </v-btn>
      </div>
    </v-toolbar>

    <v-row class="pa-3">
      <v-col
        cols="12"
        lg="6"
        md="8"
      >
        <v-card class="d-flex flex-wrap">
            <v-col
              cols="12"
              md="6"
            >
              <v-card-text>
                <v-text-field
                  dense
                  outlined
                  label="リッチメニュー名"
                  hide-details="auto"
                  v-model="menuBase.name"
                ></v-text-field>
              </v-card-text>

              <v-card-text class="py-0">
                <v-file-input
                  id="file"
                  class="d-none"
                  @change="setImage"
                ></v-file-input>
                <v-btn
                  color="primary"
                  width="100%"
                  @click="selectFile"
                >
                  <v-icon left>mdi-image</v-icon>
                  画像を選択
                </v-btn>
              </v-card-text>

              <v-card-text>
                <div style="width:100%;">サイズ</div>

                <v-btn-toggle
                  dense
                  mandatory
                  color="primary"
                  style="width:100%"
                  v-model="menuBase.size.height"
                >
                  <v-btn width="50%" :value="1686">大</v-btn>
                  <v-btn width="50%" :value="843">小</v-btn>
                </v-btn-toggle>
              </v-card-text>

              <v-card-text>
                <v-switch
                  class="ma-0"
                  label="アクティブ設定"
                  v-model="menuBase.selected"
                  messages="ユーザーにリンクした際、自動的に表示されます"
                ></v-switch>
              </v-card-text>

              <v-card-text>
                <v-text-field
                  dense
                  outlined
                  label="メニュー表示バーボタン名"
                  placeholder="メニュー"
                  hide-details="auto"
                  v-model="menuBase.chatBarText"
                ></v-text-field>
              </v-card-text>
              {{menuBase.size.height}}
            </v-col>

            <v-divider vertical></v-divider>

            <v-col
              cols="12"
              md="6"
            >
              <v-list>
                <v-list-item>
                  <v-btn
                    color="primary"
                    width="100%"
                    @click="actions.push(addAction())"
                  >
                    <v-icon left>mdi-plus</v-icon>
                    エリアを追加
                  </v-btn>
                </v-list-item>
              </v-list>
              <v-divider></v-divider>
              <v-list
                max-height="450"
                class="overflow-y-auto py-0"
              >
                <v-card
                  tile
                  flat
                  v-for="(act, i) in actions"
                  :key="i"
                  three-line
                  :class="(act.isActive) ? 'green lighten-5' : ''"
                >
                  <v-divider v-if="i != 0"></v-divider>
                  <v-card-actions>
                    <v-btn
                      icon
                      small
                      color="primary"
                      @click="act.edit = !act.edit"
                    >
                      <v-icon small>mdi-pencil</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      text
                      class="blue-grey--text"
                      @click="act.show = !act.show"
                    >
                      アクション{{i + 1}}
                      <v-icon right v-text="(act.show) ? 'mdi-menu-down' : 'mdi-menu-up'"></v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      icon
                      small
                      color="error"
                      @click="actions.splice(i, 1)"
                    >
                      <v-icon small>mdi-close</v-icon>
                    </v-btn>
                  </v-card-actions>
                  <v-card-text class="py-2" v-show="act.show">
                    <template v-if="act.edit">
                      <v-text-field
                        dense
                        outlined
                        type="number"
                        min="0"
                        label="X(領域)"
                        hide-details="auto"
                        class="mb-3"
                        v-model="act.bounds.x"
                      ></v-text-field>
                      <v-text-field
                        dense
                        outlined
                        type="number"
                        min="0"
                        label="Y(領域)"
                        hide-details="auto"
                        class="mb-3"
                        v-model="act.bounds.y"
                      ></v-text-field>
                      <v-text-field
                        dense
                        outlined
                        type="number"
                        min="50"
                        :max="(menuBase.size.width / 5) - act.bounds.x"
                        label="幅(領域)"
                        hide-details="auto"
                        class="mb-3"
                        v-model="act.bounds.width"
                      ></v-text-field>
                      <v-text-field
                        dense
                        outlined
                        type="number"
                        min="50"
                        :max="(menuBase.size.height / 5) - act.bounds.y"
                        label="高さ(領域)"
                        hide-details="auto"
                        class="mb-3"
                        v-model="act.bounds.height"
                      ></v-text-field>
                    </template>

                    <v-select
                      dense
                      outlined
                      label="タイプ"
                      hide-details="auto"
                      class="mb-3"
                      v-model="act.action.type"
                      @change="changeActionFormat(i, act.action.type)"
                      :items="actionTypes"
                    ></v-select>

                    <template v-if="act.action.type == 'message' || act.action.type == 'postback'">
                      <v-text-field
                        dense
                        outlined
                        label="テキスト"
                        hide-details="auto"
                        class="mb-3"
                        v-model="act.action.text"
                      ></v-text-field>
                    </template>

                    <template v-if="act.action.type == 'uri'">
                      <v-text-field
                        dense
                        outlined
                        type="url"
                        label="URI"
                        hide-details="auto"
                        class="mb-3"
                        v-model="act.action.uri"
                      ></v-text-field>
                    </template>

                    <template v-if="act.action.type == 'postback' || act.action.type == 'datetimepicker'">
                      <v-text-field
                        dense
                        outlined
                        label="データ"
                        hide-details="auto"
                        class="mb-3"
                        v-model="act.action.data"
                      ></v-text-field>

                      <template v-if="act.action.type == 'datetimepicker'">
                        <v-text-field
                          dense
                          outlined
                          width="50%"
                          type="date"
                        ></v-text-field>

                        <v-text-field
                          dense
                          outlined
                          width="50%"
                          type="time"
                        ></v-text-field>

                        <v-text-field
                          dense
                          outlined
                          width="50%"
                          type="time"
                        ></v-text-field>
                      </template>
                    </template>
                  </v-card-text>
                </v-card>
              </v-list>
            </v-col>


        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-sheet
          tile
          elevation="2"
          id="canvas"
          :width="menuBase.size.width/5 +'px'"
          :height="menuBase.size.height/5 + 'px'"
          :style="'background-image:url('+rmImg+');background-size:100% auto;background-repeat:no-repeat;position:relative;'"
        >
          <VueDragResize
            v-for="(act, i) in actions"
            :key="i"
            :parentLimitation="true"
            :PreventActiveBehavior="true"
            :x="act.bounds.x"
            :y="act.bounds.y"
            :w="act.bounds.width"
            :h="act.bounds.height"
            :isActive="act.isActive"
            @resizing="resizeRect($event, i)"
            @dragging="resizeRect($event, i)"
            @clicked="theActivate(i)"
            @deactivate="theDeactivate($event, i)"
          ></VueDragResize>
        </v-sheet>
      </v-col>
    </v-row>


    <!-- メッセージ送信ダイアログ -->
    <v-dialog
      v-model="dialogCreateRichmenu"
      max-width="300"
    >
      <v-card>
        <v-card-text class="py-3">
          リッチメニューがLINE公式アカウントに登録されます。<br>
          よろしいですか？
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="secondary"
            text
            @click="dialogCreateRichmenu = false"
          >キャンセル</v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="success"
            @click="saveData"
            :loading="loadingBtn"
            :disabled="loadingBtn"
          >登録</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import { doc, getDoc } from "firebase/firestore";
import { db } from '~/plugins/firebase.js';
import { lineMsgApi } from '~/plugins/line_api.js';
import VueDragResize from 'vue-drag-resize';

export default {
  components: {
    VueDragResize
  },
  props: ['page'],
  head() {
    return {
      title: 'リッチメニュー - 作成',
    }
  },
  data() {
    return {
      // リッチメニューID
      rmId : this.$route.params.slug,

      // リッチメニュー画像
      rmImg: null,

      // ローディング
      loadingBtn: false,

      // ダイアログ
      dialogCreateRichmenu: false,

      // アクション格納
      actions: [],

      // リッチメニューベース
      menuBase: {
        name       : 'リッチメニュー１',
        size       : {
          width : 2500,
          height: 843,
        },
        selected   : true,
        chatBarText: 'メニュー',
      },

      // アクションタイプ
      actionTypes: [
        { text: 'テキストメッセージ', value: 'message' },
        { text: 'URI',                value: 'uri' },
        { text: 'ポストバック',       value: 'postback' },
        // { text: '日付選択',           value: 'datetimepicker' },
      ],
    }
  },
  watch: {
    // 'menuBase.size.height': function(val) {
    //   this.actions = [];
    // }
  },
  mounted: async function(){
    console.clear()
    // --------------------------------
    // LINE Messaging API実行
    // --------------------------------
    this.lineApi = new lineMsgApi({
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });

    if(this.rmId !== 'new') {
      // --------------------------------
      // リッチメニューオブジェクト取得
      // --------------------------------
      console.log(this.rmId)
      const richmenuJson = await this.lineApi.getRichmenu(this.rmId)
      this.rmImg = await this.lineApi.getRichmenuImage(this.rmId)
      if(!richmenuJson.richMenuId) return

      for(var rm in richmenuJson) {
        switch (rm) {
          case 'richMenuId': break;
          case 'areas':
            const areas = []
            richmenuJson[rm].forEach((area, i) => {
              this.actions.push(area)
              this.actions[i].bounds.x      = Math.floor(area.bounds.x / 5)
              this.actions[i].bounds.y      = Math.floor(area.bounds.y / 5)
              this.actions[i].bounds.width  = Math.floor(area.bounds.width / 5)
              this.actions[i].bounds.height = Math.floor(area.bounds.height / 5)

              this.actions[i]['show']     = true
              this.actions[i]['edit']     = false
              this.actions[i]['isActive'] = false
            })
            break;
          default:
            this.$set(this.menuBase, rm, richmenuJson[rm])
            break;
        }
      }
    }
  },
  asyncData() {
    const stickers = require(`~/assets/json/line_stickers.json`)
    return {
      stickers
    }
  },
  methods: {
    /** **************************************************************
     * ファイル選択
     * - ボタン処理
     ************************************************************** */
    selectFile() {
      const fileInput = document.getElementById('file');
      fileInput.click();
    },

    /** **************************************************************
     * ファイル選択
     * - base64出力
     ************************************************************** */
    setImage(e) {
      if (e.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (f) => {
          this.rmImg = f.target.result;
        };
        reader.readAsDataURL(e);
      }
    },


    /** **************************************************************
     * リッチメニューアクション追加
     ************************************************************** */
    addAction() {
      return {
        isActive: false,
        show  : true,
        edit  : false,
        bounds: {
          x     : 0,
          y     : 0,
          width : 50,
          height: 50,
        },
        action: {
          type: 'message',
          text: 'テキスト'
        }
      }
    },


    /** **************************************************************
     * VueDragResizeコンポーネント
     * - 選択エリアリサイズ
     * @param {object} size - サイズオブジェクト
     * @param {number} i    - 配列番号
     ************************************************************** */
    resizeRect(size, i) {
      this.$set(this.actions[i].bounds, 'x',      size.left);
      this.$set(this.actions[i].bounds, 'y',      size.top);
      this.$set(this.actions[i].bounds, 'width',  size.width);
      this.$set(this.actions[i].bounds, 'height', size.height);
    },


    /** **************************************************************
     * VueDragResizeコンポーネント
     * - アクティブエリア
     * @param {number} i - 配列番号
     ************************************************************** */
    theActivate(i) {
      this.actions.forEach(act => this.$set(act, 'isActive', false) );
      this.$set(this.actions[i], 'isActive', true);
    },

    theDeactivate(e) {
      console.log(e)
    },


     /** **************************************************************
    // 入力データ保存
     ************************************************************** */
    async saveData(){
      console.clear()
      this.loadingBtn = true
      if(!this.rmImg) return;
      // this.input.created_at = moment().format('YYYY-MM-DD HH:mm:ss')

      // ===========================================================================
      // リッチメニューのJSONオブジェクトの形式に整形
      // ===========================================================================
      const actions = [];
      this.actions.forEach(act => actions.push(act) )

      const menuFormat = {
        name       : this.menuBase.name,
        areas      : [],
        selected   : this.menuBase.selected,
        chatBarText: this.menuBase.chatBarText,
        size: {
          width : 2500,
          height: this.menuBase.size.height
        },
      }


      actions.forEach(act => {
        menuFormat.areas.push({
          action: act.action,
          bounds: {
            x     : act.bounds.x * 5,
            y     : act.bounds.y * 5,
            width : act.bounds.width * 5,
            height: (act.bounds.height * 5) - 2,
          },
        })
      })

      console.log(menuFormat)


      // ===========================================================================
      // LINE Message APIを実行
      // - リッチメニュー登録
      // ===========================================================================
      try {
        // ------------------------
        // リッチメニュー登録
        let newRichmenu = await this.lineApi.createRichmenu(menuFormat);
        console.log(newRichmenu)

        // ------------------------
        // エラー時、処理終了
        if(!newRichmenu.richMenuId) throw newRichmenu

        // ------------------------
        // リッチメニューID
        const newRichmenuId = newRichmenu.richMenuId;

        // ------------------------
        // リッチメニュー画像登録
        let setImgResp = await this.lineApi.uploadRichmenuImage({
          fileType   : 'png',
          richMenuId : newRichmenuId,
          base64image: this.rmImg.split(',')[1],
        });

        console.log(setImgResp)

        // --------------------------------------
        // エラー時、リッチメニュー削除処理終了
        if(setImgResp.message) {
          await this.lineApi.deleteRichmenu(newRichmenuId);

          // エラー
          throw setImgResp
        }


        this.$toast.success(`保存されました。`, {
          position: 'bottom-right'
        })
      } catch (e) {
        console.error(e)
        this.$toast.error(`エラーが発生しました。`, {
          position: 'bottom-right'
        })
      }

      this.loadingBtn           = false
      this.dialogCreateRichmenu = false
    },


    /** *****************************************************
     * メッセージタイプ変更
     * @param {number|string} key - メッセージフォーマットの配列キー
     * @param {string} type       - メッセージタイプ
     ***************************************************** */
    changeActionFormat(key, type) {
      const baseFormat = { type: type }

      switch(type) {
        case 'message':
          baseFormat['text'] = ''
          break;
        case 'uri':
          baseFormat['uri'] = 'https://'
          break;
        case 'postback':
          baseFormat['text'] = ''
          baseFormat['data'] = ''
          break;
        case 'datetimepicker':
          baseFormat['data']    = ''
          baseFormat['mode']    = 'datetime'
          baseFormat['initial'] = ''  // 2017-12-25t00:00
          baseFormat['max']     = ''  // 2018-01-24t23:59
          baseFormat['min']     = ''  // 2017-12-25t00:00
          break;
      }
      this.$set(this.actions[key], 'action', baseFormat)
    },


    /** *****************************************************
     * 設定情報取得
     ***************************************************** */
    async getLineSetting() {
      const getDocRef = await getDoc(doc(db, 'setting', 'line'))
      const data = getDocRef.data();
      return (data) ? data : {}
    },
  },
}
</script>

<style scoped>
#canvas .vdr.inactive {
  outline: 2px solid grey;
  outline-offset: -2px;
}
#canvas .vdr.active {
  outline: 2px solid green !important;
  outline-offset: -2px;
}
</style>