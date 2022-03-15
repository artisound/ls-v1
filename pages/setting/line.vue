<template>
  <div>
    <v-toolbar
      dark
      flat
      dense
    >
      <v-tabs
        v-model="tab"
        align-with-title
      >
        <v-tabs-slider color="yellow"></v-tabs-slider>
        <v-tab
          v-for="(item, i) in tabItems"
          :key="i"
        >{{item}}</v-tab>
      </v-tabs>
    </v-toolbar>

    <v-tabs-items v-model="tab">
      <v-tab-item class="pa-3">

        <v-container>
          <v-row v-if="setting.friend_added_message">
            <v-col cols="12" sm="6">
              <v-form v-model="initMessageRules.valid">
                <v-list>
                  <v-list-item>
                    <v-list-item-content>
                      <v-textarea
                        required
                        outlined
                        label="メッセージ"
                        hide-details="auto"
                        v-model="setting.friend_added_message[0].contents.body.contents[0].text"
                        :rules="initMessageRules.content"
                      ></v-textarea>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-content>
                      <v-text-field
                        v-if="setting"
                        v-model="setting.friend_added_message[0].contents.footer.contents[0].action.label"
                        :rules="initMessageRules.buttonText"
                        :counter="10"
                        label="ボタンテキスト"
                        required
                        outlined
                      ></v-text-field>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                      <v-spacer></v-spacer>
                    <v-list-item-action-text>
                      <v-btn
                        :loading="loading"
                        :disabled="loading"
                        color="green"
                        dark
                        @click="saveSetting"
                      >保存</v-btn>
                    </v-list-item-action-text>
                  </v-list-item>
                </v-list>
              </v-form>
            </v-col>

            <v-col cols="12" sm="6">
              <v-card max-width="400">
                <v-card-text class="blue-grey darken-4 white--text px-3 py-2">プレビュー</v-card-text>
                <v-card-text class="blue lighten-3">
                  <v-row class=" mt-3">
                    <v-col cols="9" class="pt-0">
                      <v-sheet
                        rounded="lg"
                        class="pa-3 d-flex flex-column"
                      >
                        <div
                          class="mb-3"
                          v-if="setting"
                          v-html="setting.friend_added_message[0].contents.body.contents[0].text.replace(/\n/g, '<br>')"
                        ></div>
                        <v-sheet
                          class="pa-2 green accent-4 text-center"
                          rounded="lg"
                          dark
                          v-if="setting"
                        >{{setting.friend_added_message[0].contents.footer.contents[0].action.label}}</v-sheet>
                      </v-sheet>
                      <small class="d-block text-right">{{now}}</small>
                    </v-col>
                  </v-row>
                </v-card-text>

                <v-img
                  width="100%"
                  v-if="richmenuImage.init_richmenu"
                  :src="richmenuImage.init_richmenu"
                ></v-img>
              </v-card>
            </v-col>
          </v-row>

        </v-container>
      </v-tab-item>


      <v-tab-item class="pa-3">
        <v-container>

          <v-row>
            <v-col cols="12" sm="6">
              <v-form v-model="initMessageRules.valid">
                <v-list>
                  <v-list-item>
                    <v-list-item-content>
                      <v-textarea
                        required
                        outlined
                        label="メッセージ"
                        hide-details="auto"
                        v-model="setting.turn_back_message[0].text"
                        :rules="initMessageRules.content"
                      ></v-textarea>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                      <v-spacer></v-spacer>
                    <v-list-item-action-text>
                      <v-btn
                        :loading="loading"
                        :disabled="loading"
                        color="green"
                        dark
                        @click="saveSetting"
                      >保存</v-btn>
                    </v-list-item-action-text>
                  </v-list-item>
                </v-list>
              </v-form>
            </v-col>

            <v-col cols="12" sm="6">
              <v-card max-width="400">
                <v-card-text class="blue-grey darken-4 white--text px-3 py-2">プレビュー</v-card-text>
                <v-card-text class="blue accent-1">
                  <v-row class=" mt-3">
                    <v-col cols="9" class="pt-0">
                      <v-sheet
                        rounded="lg"
                        class="pa-3 d-flex flex-column"
                      >
                        <div
                          class="mb-3"
                          v-if="setting.turn_back_message[0].text"
                          v-html="setting.turn_back_message[0].text.replace(/\n/g, '<br>')"
                        ></div>
                      </v-sheet>
                      <small class="d-block text-right">{{now}}</small>
                    </v-col>
                  </v-row>
                </v-card-text>

                <v-img
                  width="100%"
                  v-if="richmenuImage.init_richmenu"
                  :src="richmenuImage.init_richmenu"
                ></v-img>
              </v-card>
            </v-col>
          </v-row>

        </v-container>
      </v-tab-item>

      <v-tab-item class="pa-3">
        <v-container>

          <v-row>
            <v-col cols="12" sm="6">
              <v-form v-model="initMessageRules.valid">
                <v-list>
                  <v-list-item>
                    <v-list-item-content>
                      <v-textarea
                        required
                        outlined
                        label="メッセージ"
                        hide-details="auto"
                        v-model="setting.customer_added_message[0].text"
                        :rules="initMessageRules.content"
                      ></v-textarea>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item v-if="richmenus.length">
                    <v-list-item-content>
                      <v-select
                        outlined
                        label="リッチメニュー"
                        v-model="setting.customer_added_richmenu"
                        :items="richmenus"
                      ></v-select>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                      <v-spacer></v-spacer>
                    <v-list-item-action-text>
                      <v-btn
                        :loading="loading"
                        :disabled="loading"
                        color="green"
                        dark
                        @click="saveSetting"
                      >保存</v-btn>
                    </v-list-item-action-text>
                  </v-list-item>
                </v-list>
              </v-form>
            </v-col>

            <v-col cols="12" sm="6">
              <v-card max-width="400">
                <v-card-text class="blue-grey darken-4 white--text px-3 py-2">プレビュー</v-card-text>
                <v-card-text class="blue accent-1">
                  <v-row class=" mt-3">
                    <v-col cols="9" class="pt-0">
                      <v-sheet
                        rounded="lg"
                        class="pa-3 d-flex flex-column"
                      >
                        <div
                          class="mb-3"
                          v-if="setting.customer_added_message[0].text"
                          v-html="setting.customer_added_message[0].text.replace(/\n/g, '<br>')"
                        ></div>
                      </v-sheet>
                      <small class="d-block text-right">{{now}}</small>
                    </v-col>
                  </v-row>
                </v-card-text>

                <v-img
                  width="100%"
                  v-if="richmenuImage.customer_added_richmenu"
                  :src="richmenuImage.customer_added_richmenu"
                ></v-img>
              </v-card>
            </v-col>
          </v-row>

        </v-container>
      </v-tab-item>

    </v-tabs-items>

  </div>
</template>

<script>
import { db } from '~/plugins/firebase.js';
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import {lineMsgApi} from '~/plugins/line_api.js';
import moment from 'moment'

export default {
  layout: 'main',
  head() {
    return {
      title: 'LINE設定',
    }
  },
  data() {
    return {
      now     : moment().format('H:mm'),
      loading : false,


      setting : {
        init_richmenu: '',
        customer_added_richmenu: '',

        // LINE登録時メッセージ
        friend_added_message: [{
          type    : 'flex',
          altText : '友だち登録ありがとうございます！',
          contents: {
            type     : 'bubble',
            direction: 'ltr',
            body     : {
              type    : 'box',
              layout  : 'vertical',
              contents: [{
                type    : 'text',
                text    : '友だち登録ありがとうございます！',
                size    : 'md',
                align   : 'start',
                wrap    : true,
                contents: []
              }]
            },
            footer: {
              type    : 'box',
              layout  : 'horizontal',
              contents: [{
                type  : 'button',
                action: {
                  type : 'uri',
                  label: 'ユーザー登録',
                  uri  : `https://liff.line.me/${process.env.LIFF_REGIST}`,
                },
                style : 'primary'
              }]
            }
          }
        }],
        // 友だち再登録メッセージ
        turn_back_message:[{
          type: 'text',
          text: 'おかえりなさい！',
        }],
        // ユーザー登録後メッセージ
        customer_added_message: [{
          type: 'text',
          text: 'ご登録いただきありがとうございます！',
        }],
      },

      tab     : null,
      tabItems: [ 'LINE友だち登録時', 'LINE友だち再登録時', 'ユーザー登録後' ],

      richmenus    : [],
      richmenuImage: {
        init_richmenu: null,
        customer_added_richmenu: null,
      },

      initMessageRules: {
        content: [
          v => !!v || '必須項目です。',
        ],
        buttonText: [
          v => !!v || '必須項目です。',
          v => v.length <= 10 || '10文字以内',
        ],
        valid: false,
      },

    }
  },

  created: async function() {

    this.lineApi = await new lineMsgApi({
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });


  },

  watch: {
    'setting.init_richmenu': async function(aft) {
      if(!aft) return
      const richmenuImage = await this.lineApi.getRichmenuImage(aft)
      this.$set(this.richmenuImage, 'init_richmenu', richmenuImage)
    },
    'setting.customer_added_richmenu': async function(aft) {
      if(!aft) return
      const richmenuImage = await this.lineApi.getRichmenuImage(aft)
      this.$set(this.richmenuImage, 'customer_added_richmenu', richmenuImage)
    },
  },

  mounted: async function () {
    this.lineApi = new lineMsgApi({
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });
    const defailt_richmenu = await this.lineApi.getDefaultRichmenu()
    if(defailt_richmenu.richMenuId) this.$set(this.setting, 'init_richmenu', defailt_richmenu.richMenuId)

    const settings = await this.getSetting();
    for(var stg in settings) {
      this.$set(this.setting, stg, settings[stg]);
    }

    this.richmenus = await this.getRichmenus()
  },

  methods: {
    /** *****************************************************
     * 設定情報取得
     ***************************************************** */
    async getSetting() {
      const getDocRef = await getDoc(doc(db, 'setting', 'line'))
      const data      = getDocRef.data();
      return (data) ? data : {}
    },


    /** *****************************************************
     * 設定保存
     ***************************************************** */
    async saveSetting() {
      this.loading = true

      try {
        await setDoc(doc(db, 'setting', 'line'), this.setting, { merge: true })

        this.$toast.success('設定が完了しました。', {
          position: 'bottom-right'
        })

      } catch (e) {
        this.$toast.error('正常に設定できませんでした。', {
          position: 'bottom-right'
        })
        console.error("Error adding document: ", e)
      }

      this.stg_customer_enable = false
      this.stg_admin_enable    = false
      this.stg_liff_enable     = false
      this.loading             = false
    },


    /** *****************************************************
     * 全リッチメニューを取得
     ***************************************************** */
    async getRichmenus() {
      try {
        const richmenus = await this.lineApi.getRichmenuList()
          .then(resp => resp.richmenus)
          .catch(e => { throw e })

        const defaultRichmenu = await this.lineApi.getDefaultRichmenu()
          .then(resp => resp.richMenuId)
          .catch(e => { throw e })

        if(defaultRichmenu) this.$set(this.setting, 'init_richmenu', defaultRichmenu)

        const ret = []
        if(richmenus.length) {
          if(defaultRichmenu) {
            ret.push({
              text  : 'デフォルト',
              value : defaultRichmenu,
            })
          }
          for(var menu of richmenus) {
            ret.push({
              text  : menu.name,
              value : menu.richMenuId,
            })
          }
        }

        return ret
      } catch(e) {
        console.error(e)
      }
    },
  }
}
</script>
