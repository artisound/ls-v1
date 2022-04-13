<template>
  <v-container>
    <v-row>

      <v-col cols="12" lg="3" sm="6" v-for="(ins, i) in insight" :key="i">
        <v-card class="mt-6">
          <div class="d-flex flex-wrap grow justify-space-between px-4 p-2">

            <v-card class="elevation-4 pa-5 mt-n5 mb-6" :color="ins.color" dark>
              <v-icon style="font-size:32px;">{{ins.icon}}</v-icon>
            </v-card>

            <div class="pt-2">
              <div class="ml-auto text-right">
                <div class="body-3 grey--text font-weight-light">{{ins.name}}</div>
                <div class="d-flex align-end justify-end">
                  <v-progress-circular
                    v-if="loading"
                    size="30"
                    width="4"
                    value="60"
                    :color="ins.color"
                    indeterminate
                  ></v-progress-circular>
                  <span v-else class="display-1 font-weight-light text--primary">{{ins.data}}</span>

                  <span v-if="ins.max" class="body-3 ml-2 grey--text font-weight-light">/{{ins.max}}</span>
                </div>

              </div>
            </div>

          </div>

          <v-divider></v-divider>

          <v-card-text class="d-flex">
            <v-icon
              v-text="ins.icon"
              style="font-size:18px;"
            ></v-icon>
            <v-spacer></v-spacer>
            <v-btn
              text
              color="grey darken-1"
              :to="ins.link"
            >
              {{ins.label}}
              <v-icon
                right
                v-text="'mdi-arrow-right-circle'"
                style="font-size:18px;"
              ></v-icon>
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

    </v-row>

    <v-row>
      <v-col
        cols="6"
        lg="2"
        sm="3"
      >
        <v-card class="mt-6">
          <div class="d-flex flex-wrap grow justify-space-between px-4 p-2">

            <v-card class="elevation-4 pa-5 mt-n5 mb-6" color="primary" dark>
              <v-icon style="font-size:32px;">mdi-qrcode</v-icon>
            </v-card>

            <vue-qr
              width="100%"
              :text="`https://line.me/R/ti/p/${qr_public}`"
              :margin="1"
              class="mb-3"
            ></vue-qr>

          </div>

          <v-divider></v-divider>

          <v-card-text class="d-flex">
            <v-icon style="font-size:18px;">mdi-share-variant</v-icon>
            <v-spacer></v-spacer>
            <v-btn
              text
              color="grey darken-1"
              @click="navigatorShare"
            >
              共有
              <v-icon
                right
                v-text="'mdi-arrow-right-circle'"
                style="font-size:18px;"
              ></v-icon>
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
import { doc, collection, getDoc, getDocs, query, where, orderBy, startAt } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from '~/plugins/firebase.js';
import {lineMsgApi} from '~/plugins/line_api.js';
import moment from 'moment'

export default {
  layout: 'main',
  head() {
    return {
      title: 'ホーム',
    }
  },
  data() {
    return {
      analysis: {},
      insight: {
        friends:  { name: '友だち数',           label: '顧客管理',       link: '/customer', data: 0, color: 'purple', icon: 'mdi-account-group' },
        messages: { name: '今月のメッセージ数', label: 'メッセージ配信', link: '/message',  data: 0, color: 'indigo', icon: 'mdi-forum', max: '1,000' },
        contacts: { name: '問い合わせ数',       label: 'お問い合わせ',   link: '/contact',  data: 0, color: 'teal',   icon: 'mdi-chat-question' },
        reserves: { name: '本日の予約数',       label: 'スケジュール',   link: '/schedule', data: 0, color: 'orange', icon: 'mdi-calendar-multiselect' },
      },
      qr_public: process.env.LINE_PUBLIC_ACCOUNT,
      loading: false,
    }
  },
  mounted: async function () {
    this.loading = true

    this.lineApi = new lineMsgApi({
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });

    // 友だち数
    const msgNum = await this.lineApi.getMessageQuotaConsumption()
    this.$set(this.insight.messages,'data', msgNum.count)

    // 今月のメッセージ数
    const cstNum = await this.getNumberOf('customer')
    this.$set(this.insight.friends,'data', cstNum)

    // 問い合わせ数
    const cntNum = await this.getNumberOf('contact')
    this.$set(this.insight.contacts,'data', cntNum)

    // 本日の予約数
    const schNum = await this.getNumberOf('schedule')
    this.$set(this.insight.reserves,'data', schNum)

    this.loading = false
  },
  methods: {
    /** *****************************************************
     * 共有ボタン
     ***************************************************** */
    navigatorShare() {
      if (navigator.share) {
        navigator.share({
          title: process.env.LINE_CHANNEL_NAME,
          url: `https://line.me/R/ti/p/${this.qr_public}`
        })
      }
    },


    /** *****************************************************
     * LINE設定情報取得
     ***************************************************** */
    async getLineSetting() {
      try {
        const getDocRef = await getDoc(doc(db, 'setting', 'line'))
        const data = getDocRef.data();
        return (data) ? data : {}
      } catch(e) {
        console.error(e)
      }
    },


    /** *****************************************************
     * データ数取得
     ***************************************************** */
    async getNumberOf(colName) {
      let colWhere, colWhere01, colWhere02, colOrderBy, colStart, queryRef;
      const col = collection(db, colName)
      switch(colName) {
        case 'customer':
          colWhere = where('field-line_follow_status', '==', 'follow')
          queryRef = query(col, colWhere)
          break;
        case 'contact':
          colWhere = where('status', '==', 0)
          queryRef = query(col, colWhere)
          break;
        case 'schedule':
          const todayYmd   = moment().format('YYYY-MM-DD')
          const todayStart = moment(`${todayYmd} 00:00:00`).unix() * 1000
          const todayEnd   = moment(`${todayYmd} 23:59:59`).unix() * 1000
          console.log(todayStart)
          console.log(todayEnd)
          colWhere01 = where('start', '>=', todayStart)
          colWhere02 = where('start', '<=', todayEnd)
          queryRef   = query(col, colWhere01, colWhere02)
          break;
      }

      try {
        const getDocsRef = await getDocs(queryRef)
        let data;
        let customers = []
        getDocsRef.forEach(d => {
          customers.push(d.data())
        })

        if(colName == 'schedule') {
          customers = customers.filter(v => v.userId)
        }
        return customers.length
      } catch(e) {
        console.error(e)
      }
    },

  }
}
</script>