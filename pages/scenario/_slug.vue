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
          :disabled="loading"
          :to="`/${page}/`"
        >
          <span class="">キャンセル</span>
        </v-btn>


        <!-- メッセージ送信ダイアログ -->
        <v-dialog
          v-model="dialogSave"
          max-width="400"
        >
          <template v-slot:activator="{ on, attr }">
            <v-btn
              router
              exact
              color="primary"
              :disabled="loading"
              :loading="loading"
              v-on="on"
              v-bind="attr"
            >
              <v-icon class="">mdi-cloud-upload</v-icon>
              <span class="ml-2">保存</span>
            </v-btn>
          </template>
          <v-card>
            <v-card-text class="py-3">
              このメッセージを保存します。<br>
              よろしいですか？
            </v-card-text>

            <v-card-actions>
              <v-btn
                color="secondary"
                text
                @click="dialogSave = false"
              >キャンセル</v-btn>

              <v-spacer></v-spacer>

              <v-btn
                color="primary"
                @click="saveData"
              >保存</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

      </div>
    </v-toolbar>


    <v-sheet
      class="d-flex flex-md-row flex-column-reverse mb-16"
      color="blue-grey lighten-5"
    >
      <v-col
        cols="12"
        md="6"
      >
        <v-card
          v-for="(fmt, key) in formats" :key="key"
          class="mb-3"
        >
            <v-card-title>
              <v-btn-toggle
                dark
                dense
                mandatory
                v-model="fmt.type"
                @change="changeMessageFormat(key, fmt.type)"
              >
                <v-tooltip
                  top
                  v-for="(type, i) in msg_type"
                  :key="i"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      :value="type.value"
                      :disabled="type.disabled"
                      v-bind="attrs"
                      v-on="on"
                    ><v-icon v-text="type.icon"></v-icon></v-btn>
                  </template>
                  <span v-text="type.text"></span>
                </v-tooltip>
              </v-btn-toggle>

              <v-spacer></v-spacer>

              <v-btn
                fab
                text
                small
                :disabled="(key == 0) ? true : false"
                @click="changeOrderFormat(key, 'down')"
              ><v-icon>mdi-chevron-up</v-icon></v-btn>

              <v-btn
                fab
                text
                small
                :disabled="(formats.length == key + 1) ? true : false"
                @click="changeOrderFormat(key, 'up')"
              ><v-icon>mdi-chevron-down</v-icon></v-btn>

              <v-btn
                fab
                text
                small
                :disabled="(formats.length > 1) ? false : true"
                @click="deleteFormat"
              ><v-icon>mdi-close</v-icon></v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <!-- text -->
            <v-card-text
              v-if="fmt.type == 'text'"
            >
              <v-textarea
                dense
                outlined
                hide-details="auto"
                v-model="fmt.text"
              ></v-textarea>
            </v-card-text>

            <!-- image -->
            <v-card-text
              v-else-if="fmt.type == 'image'"
              class="d-flex flex-column justify-center mx-auto"
              :style="{
                maxWidth: '200px',
                gap: '5px',
              }"
            >
              <v-card
                v-if="fmt.originalContentUrl"
                class="mb-3"
              >
                <v-card-text>
                  <v-img :src="fmt.originalContentUrl"></v-img>
                  <v-btn
                    fab
                    text
                    small
                    color="error"
                    :style="{
                      position:'absolute',
                      top: 0,
                      right: 0,
                    }"
                    @click="fmt.originalContentUrl='';fmt.previewImageUrl='';"
                  >
                    <v-icon>mdi-close-circle</v-icon>
                  </v-btn>
                </v-card-text>
              </v-card>

              <!-- 画像選択ダイアログ -->
              <v-dialog
                v-model="dialogSelectImage"
                scrollable
                width="600"
                max-width="100%"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    dark
                    color="green"
                    v-bind="attrs"
                    v-on="on"
                  >画像を選択</v-btn>
                </template>
                <v-card>
                  <v-card-text class="d-flex flex-wrap px-2 pt-2">
                    <div
                      v-for="(img, docId) in images"
                      :key="docId"
                      class="mx-1 mb-2"
                      :style="{
                        width: 'calc(33.3% - 8px)',
                        cursor: 'pointer'
                      }"
                    >
                      <v-card
                        class="d-flex"
                        :color="(fmt.originalContentUrl == img.url) ? 'light-blue lighten-4' : ''"
                      >
                        <img
                          @click="changeImage(key, docId)"
                          :src="img.url"
                          class="d-block my-auto pa-2"
                          style="width:100%;"
                        >
                      </v-card>
                    </div>
                  </v-card-text>
                </v-card>
              </v-dialog>

              <!-- image -->
              <v-btn :disabled="true">画像をアップロード</v-btn>


            </v-card-text>

            <!-- template -->
            <v-card-text
              v-else-if="fmt.type == 'template'"
            >
              <v-text-field
                dense
                outlined
                label="タイトル"
                v-model="fmt.altText"
                hide-details="auto"
                class="mb-3"
              ></v-text-field>

              <v-textarea
                dense
                outlined
                v-model="fmt.template.text"
                hide-details="auto"
                class="mb-3"
              ></v-textarea>
              <v-row>
                <v-col><small class="mb-2">アクション</small></v-col>
              </v-row>
              <v-row
                v-for="(act, j) in fmt.template.actions"
                :key="j"
                class="align-center"
              >
                <v-col
                  cols="1"
                  class="pt-0"
                >
                  <v-icon>mdi-drag-vertical</v-icon>
                </v-col>
                <v-col
                  cols="3"
                  class="pt-0"
                >
                  <v-select
                    dense
                    outlined
                    hide-details="auto"
                    :items="[
                      {text: 'テキスト', value: 'message'},
                      {text: 'URI',      value: 'uri'}
                    ]"
                    v-model="act.type"
                  ></v-select>
                </v-col>

                <v-col
                  cols="3"
                  class="pt-0"
                >
                  <v-text-field
                    dense
                    outlined
                    label="ボタンラベル"
                    hide-details="auto"
                    v-model="act.label"
                  ></v-text-field>
                </v-col>

                  <v-col
                    cols="4"
                    class="pt-0"
                  >
                    <template v-if="act.type == 'message'">
                      <v-text-field
                        dense
                        outlined
                        label="出力テキスト"
                        hide-details="auto"
                        v-model="act.text"
                      ></v-text-field>
                    </template>

                    <template v-else-if="act.type == 'uri'">
                      <v-text-field
                        dense
                        outlined
                        label="URL"
                        hide-details="auto"
                        v-model="act.uri"
                      ></v-text-field>
                    </template>
                  </v-col>


                <v-col
                  cols="1"
                  class="pt-0"
                >
                  <v-btn
                    fab
                    text
                    x-small
                    color="error"
                    @click="deleteAction(key, fmt.type, j)"
                    :disabled="(fmt.template.actions.length == 1) ? true : false"
                  ><v-icon>mdi-minus</v-icon></v-btn>
                </v-col>
              </v-row>

              <v-row>
                <v-col class="pt-0 d-flex justify-end">
                  <v-btn
                    small
                    color="primary"
                    @click="addAction(key, fmt.type)"
                    :disabled="(fmt.template.actions.length >= 4) ? true : false"
                  ><v-icon left>mdi-plus</v-icon>追加</v-btn>
                </v-col>
              </v-row>
            </v-card-text>

            <!-- sticker -->
            <v-card-text
              v-else-if="fmt.type == 'sticker'"
              class="d-flex flex-column justify-center mx-auto"
              style="max-width:200px;"
            >
              <v-card
                v-if="fmt.stickerId"
                class="mb-3"
              >
                <v-card-text>
                  <v-img
                    :src="`https://stickershop.line-scdn.net/stickershop/v1/sticker/${fmt.stickerId}/android/sticker.png`"
                  ></v-img>
                    <v-btn
                      fab
                      text
                      small
                      color="error"
                      :style="{
                        position:'absolute',
                        top: 0,
                        right: 0,
                      }"
                      @click="fmt.packageId='';fmt.stickerId='';"
                    >
                      <v-icon>mdi-close-circle</v-icon>
                    </v-btn>
                </v-card-text>
              </v-card>
              <!-- スタンプ選択ダイアログ -->
              <v-dialog
                v-model="dialogSelectSticker"
                scrollable
                width="600"
                max-width="100%"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    dark
                    color="green"
                    v-bind="attrs"
                    v-on="on"
                  >スタンプを選択</v-btn>
                </template>
                <v-card>
                  <v-tabs
                    dark
                    v-model="stickerTab"
                    background-color="blue-grey darken-2"
                  >
                    <v-tab v-for="(pkg, num) in stickers" :key="num">{{ num }}</v-tab>
                  </v-tabs>

                  <v-card-text class="pa-0">
                    <v-tabs-items class="mx-2" v-model="stickerTab">
                      <v-tab-item v-for="(pkg, num) in stickers" :key="num">
                        <v-card flat class="d-flex flex-wrap pa-2">
                          <div
                            v-for="(sticker, i) in pkg.stickerId"
                            :key="i"
                            class="mx-1 mb-2 d-flex"
                            style="width:calc(33.3% - 8px);cursor:pointer"
                          >
                            <v-card
                              :color="(fmt.stickerId == sticker) ? 'light-blue lighten-4' : ''"
                              class="d-flex align-center"
                            >
                              <img
                                @click="changeSticker(key, pkg.packageId, sticker)"
                                :src="`https://stickershop.line-scdn.net/stickershop/v1/sticker/${sticker}/android/sticker.png`"
                                class="d-block"
                                style="width: 100%;"
                              >
                            </v-card>
                          </div>
                        </v-card>
                      </v-tab-item>
                    </v-tabs-items>
                  </v-card-text>
                </v-card>
              </v-dialog>

            </v-card-text>

            <!-- location -->
            <v-card-text
              v-else-if="fmt.type == 'location'"
            >
              <v-row>
                <v-col cols="12" class="pb-0">
                  <v-text-field
                    dense
                    outlined
                    label="建物名 / 場所名"
                    hide-details="auto"
                    v-model="fmt.title"
                  ></v-text-field>
                </v-col>
                <v-col cols="10" class="pb-0">
                  <v-text-field
                    dense
                    outlined
                    label="住所"
                    placeholder="高知県高知市〇〇"
                    hide-details="auto"
                    v-model="fmt.address"
                  ></v-text-field>
                </v-col>
                <v-col cols="2" class="pb-0">
                  <v-btn
                    color="green"
                    width="100%"
                    height="100%"
                    :dark="(fmt.address) ? true : false"
                    :disabled="(fmt.address) ? false : true"
                    @click="getLatlngByAddress(key, fmt.address)"
                  ><v-icon>mdi-map-search</v-icon></v-btn>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    dense
                    outlined
                    disabled
                    label="緯度"
                    hide-details="auto"
                    v-model="fmt.latitude"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    dense
                    outlined
                    disabled
                    label="経度"
                    hide-details="auto"
                    v-model="fmt.longitude"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>

        </v-card>

        <v-btn
          color="primary"
          :disabled="(formats.length >= 5) ? true : false"
          @click="addFormat"
        >
          <v-icon left>mdi-plus</v-icon>
          追加
        </v-btn>
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-card class="mb-3">
          <v-card-text
            class="d-flex flex-column"
            style="gap: 15px"
          >
            <v-text-field
              dense
              outlined
              label="タイトル"
              hide-details="auto"
              v-model="doc.title"
            ></v-text-field>


            <v-text-field
              dense
              outlined
              label="呼び出し語句"
              hide-details="auto"
              v-model="doc.call_text"
            ></v-text-field>

            <v-btn-toggle
              mandatory
              v-model="doc.status"
            >
              <v-btn value="publish" width="50%">
                <v-icon small left>mdi-message-text</v-icon>
                公開
              </v-btn>

              <v-btn value="draft" width="50%">
                <v-icon small left>mdi-message-text-lock</v-icon>
                公開停止
              </v-btn>
            </v-btn-toggle>
          </v-card-text>
        </v-card>
      </v-col>
    </v-sheet>



    <v-card
      width="350"
      class="mx-3"
      style="position:fixed;bottom:50px;"
    >
      <v-expansion-panels
        accordion
        v-model="preview"
      >
        <v-expansion-panel>
          <v-expansion-panel-header
            class="white--text"
            color="blue-grey darken-3"
            style="min-height:initial;"
          >
            プレビュー
            <template v-slot:actions>
              <v-icon color="white">
                mdi-menu-up
              </v-icon>
            </template>
          </v-expansion-panel-header>
          <v-expansion-panel-content
            class="blue lighten-3 pa-0 child-no-padding"
            :style="{
              maxHeight: '500px',
            }"
          >
            <MessagePreview :format="formats"></MessagePreview>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>
  </div>
</template>

<script>
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from '~/plugins/firebase.js';
import moment from 'moment'
export default {
  props: ['page'],
  head() {
    return {
      title: 'メッセージ配信 - ' + (this.$route.params.slug == 'new' ? '作成' : '編集'),
    }
  },
  data() {
    return {
      loading: false,
      preview: null, // プレビューウィンドウON / OFF

      docId  : this.$route.params.slug || null,
      cpDocId: this.$route.query.id || null,

      // ダイアログ
      dialogSelectImage  : false,
      dialogSelectSticker: false,
      dialogSave: false,

      stickerTab: null,

      msg_type: [
        { text: 'テキスト',       value: 'text',     icon: 'mdi-message-bulleted',        disabled: false },
        { text: '画像',           value: 'image',    icon: 'mdi-image',                   disabled: false },
        { text: 'ボタン',         value: 'template', icon: 'mdi-gesture-tap-button',      disabled: false },
        { text: 'スタンプ',       value: 'sticker',  icon: 'mdi-emoticon-happy-outline',  disabled: false },
        { text: '位置情報',       value: 'location', icon: 'mdi-map-marker',              disabled: false },
        { text: 'イメージマップ', value: 'imagemap', icon: 'mdi-view-grid',               disabled: true },
        { text: 'カルーセル',     value: 'carousel', icon: 'mdi-view-carousel-outline',   disabled: true },
      ],

      // images
      images: {},

      // stickers
      stickerTab: null,


      doc: {
        title       : '',
        call_text   : '',
        format      : [],
        status      : 'draft',
        created_at  : '',
        updated_at  : '',
      },
      formats: [
        { type: 'text', text: '' },
      ],

      files: [],
      isDragging: false,
      dragCount: 0
    }
  },

  watch: {
    files() {
      this.draw();
    },
  },

  mounted: async function() {
    // console.clear()
    if (this.cpDocId) {
      // ---------------------------
      // 複製
      // ---------------------------
      await this.getData(this.cpDocId, true)

    } else if(this.docId && this.docId !== 'new') {
      // ---------------------------
      // 編集
      // ---------------------------
      await this.getData(this.docId)
    }

    // 画像データ全件取得
    this.images = await this.getImagesList();
  },
  methods: {
    /** *****************************************************
     * データ取得
     * @param {String} docId      - ドキュメントID
     * @param {Boolean} duplicate - 複製フラグ
     ***************************************************** */
    async getData(docId, duplicate = false) {
      try {
        const docRef = await getDoc(doc(db, this.page, docId))
        const getData = docRef.data()

        for(var fld in this.doc) {
          switch(fld) {
            case 'status':
              if(duplicate) {
                this.$set(this.doc, fld, 'draft')
              } else {
                this.$set(this.doc, fld, getData[fld])
              }
              break;
            case 'format':
              this.formats = getData[fld]
              break;
            default:
              this.$set(this.doc, fld, getData[fld])
              break;
          }
        }
      } catch (e) {
        console.error(e)
      }
    },


    /** *****************************************************
     * 住所から緯度経度情報取得
     * - 位置情報メッセージ
     * @param {number|string} key - メッセージフォーマットの配列キー
     * @param {string} address    - 住所
     ***************************************************** */
    async getLatlngByAddress(key, address) {
      try {
        const apiKey = process.env.GEOCODING_KEY
        const LatLng = await getAddressByZipcodeFromGmap(address, apiKey, true)
        // console.group()
        // console.log(key)
        // console.log(address)
        // console.log(LatLng)

        if(LatLng) {
          const lat = LatLng.geometry.location.lat
          const lng = LatLng.geometry.location.lng
          this.$set(this.formats[key], 'latitude',  lat)
          this.$set(this.formats[key], 'longitude', lng)
        }
        console.groupEnd()
      } catch (e) {
        console.error(e)
      }
    },


    /** *****************************************************
     * 画像全件取得
     ***************************************************** */
    async getImagesList() {
      try {
        const getDocRef = await getDocs(collection(db, 'media'))
        const arrData = {};
        getDocRef.forEach(doc => arrData[doc.id] = doc.data() );
        return arrData;
      } catch (e) {
        console.error(e)
        return
      }
    },


    /** *****************************************************
     * 新しいメッセージフォーマットを追加
     ***************************************************** */
    addFormat() {
      this.formats.push({
        type: 'text',
        text: ''
      })
    },


    /** *****************************************************
     * 新しいボタンアクションを追加
     * - テンプレートメッセージ、イメージマップメッセージ
     * @param {number|string} key - メッセージフォーマットの配列キー
     * @param {string} type       - メッセージタイプ
     ***************************************************** */
    addAction(key, type) {
      if(type == 'template') {
        this.formats[key].template.actions.push({
          type : 'message',
          label: '',
          text : ''
        })
      }
    },


    /** *****************************************************
     * メッセージフォーマットを削除
     * @param {number|string} key - メッセージフォーマットの配列キー
     ***************************************************** */
    deleteFormat(key) {
      this.formats.splice(key, 1)
    },


    /** *****************************************************
     * ボタンアクションを削除
     * - テンプレートメッセージ、イメージマップメッセージ
     * @param {number|string} key - メッセージフォーマットの配列キー
     ***************************************************** */
    deleteAction(key, type, num) {
      if(type == 'template') {
        this.formats[key].template.actions.splice(num, 1)
      }
    },


    /** *****************************************************
     * メッセージフォーマットを上下入れ替え（並び替え）
     * @param {number|string} key - メッセージフォーマットの配列キー
     ***************************************************** */
    changeOrderFormat(key, upDown) {
      if(upDown == 'up') {
        const nextEl = this.formats[key + 1];
        this.$set(this.formats, key + 1, this.formats[key])
        this.$set(this.formats, key, nextEl)
      } else if(upDown == 'down') {
        const prevEl = this.formats[key - 1];
        this.$set(this.formats, key - 1, this.formats[key])
        this.$set(this.formats, key, prevEl)
      }
    },


    /** *****************************************************
     * メッセージタイプ変更
     * @param {number|string} key - メッセージフォーマットの配列キー
     * @param {string} type       - メッセージタイプ
     ***************************************************** */
    changeMessageFormat(key, type) {
      const baseFormat = { type: type }
      switch(type) {
        // -----------------------
        // テキストメッセージ
        case 'text':
          baseFormat['text'] = ''
          break;
        // -----------------------
        // 画像メッセージ
        case 'image':
          baseFormat['originalContentUrl'] = ''
          baseFormat['previewImageUrl']    = ''
          break;
        // -----------------------
        // ボタンメッセージ
        case 'template':
          baseFormat['altText']   = 'タイトル'
          baseFormat['template']  = {
            type         : 'buttons',
            // title        : "Menu",
            text         : '',
            actions: [
              {
                type : 'message',
                label: 'ボタンラベル',
                text : '出力テキスト'
              }
            ],
          }
          break;
        // -----------------------
        // スタンプメッセージ
        case 'sticker':
          baseFormat['packageId'] = ''
          baseFormat['stickerId'] = ''
          break;
        // -----------------------
        // 位置情報メッセージ
        case 'location':
          baseFormat['title']     = ''
          baseFormat['address']   = ''
          baseFormat['latitude']  = ''
          baseFormat['longitude'] = ''
          break;
        // -----------------------
        // イメージマップメッセージ
        case 'imagemap':
          baseFormat['baseUrl']  = ''
          baseFormat['altText']  = '選択してください。'
          baseFormat['baseSize'] = {
              width : 1040,
              height: 1040,
          }
          baseFormat['actions']  = []
          break;
      }
      this.$set(this.formats, key, baseFormat)
    },


    /** *****************************************************
     * スタンプ 変更
     * @param {number|string} key - メッセージフォーマットの配列キー
     * @param {string} packageId  - スタンプのパッケージID
     * @param {string} stickerId  - スタンプのステッカーID
     ***************************************************** */
    changeSticker(key, packageId, stickerId) {
      this.$set(this.formats[key], 'packageId', packageId)
      this.$set(this.formats[key], 'stickerId', stickerId)
      this.dialogSelectSticker = false
    },


    /** *****************************************************
     * 画像 変更
     * @param {number|string} key - メッセージフォーマットの配列キー
     * @param {string} docId      - 画像コレクションのドキュメントID
     ***************************************************** */
    changeImage(key, docId) {
      this.$set(this.formats[key], 'originalContentUrl', this.images[docId].url)
      this.$set(this.formats[key], 'previewImageUrl', this.images[docId].url)
      this.dialogSelectImage = false
    },


    /** *****************************************************
     * メッセージデータ保存（Firestore）
     ***************************************************** */
    async saveData(){
      this.loading = true
      this.dialogSave = false

      const saveData = {}
      for(var key in this.doc) {
        saveData[key] = (key == 'format') ? this.formats : this.doc[key]
      }

      try {
        saveData.created_at = saveData.created_at || moment().format('YYYY-MM-DD HH:mm:ss');
        saveData.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');

        if(this.docId == 'new') {
          await setDoc(doc(collection(db, this.page)), saveData)
        } else {
          await setDoc(doc(collection(db, this.page), this.docId), saveData)
        }
        this.$toast.success(`保存されました。`, {
          position: 'bottom-right'
        })
        this.$router.push(`/${this.page}`)
      } catch (e) {
        console.error(e)
        this.$toast.error(`エラーが発生しました。`, {
          position: 'bottom-right'
        })
      }

      this.loading = false
    },

  },
  asyncData() {
    const stickers = require(`~/assets/json/line_stickers.json`)
    return {
      stickers
    }
  },

}
</script>

<style>
.child-no-padding .v-expansion-panel-content__wrap {
  padding: 0 !important;
}
</style>
