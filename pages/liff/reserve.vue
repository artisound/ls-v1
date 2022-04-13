<template>
  <div>
    <HeaderLiff :title="$metaInfo.title" />

    <v-stepper flat v-model="step">
      <v-stepper-items>
        <!-- メニュー選択 -->
        <v-stepper-content :step="1">
          <h1>メニューを選んでください</h1>

          <v-list two-line>
            <v-list-item-group
              v-model="selected_menu"
              active-class="pink--text"
              multiple
            >
              <template v-for="(item, i) in menu">
                <v-list-item
                  class="px-0"
                  :key="item.title"
                >
                  <template v-slot:default="{ active }">
                    <v-list-item-action>
                      <v-icon
                        v-if="active"
                        color="yellow darken-3"
                      >mdi-check-circle</v-icon>
                      <v-icon
                        v-else
                        color="grey lighten-1"
                      >mdi-checkbox-blank-circle-outline</v-icon>
                    </v-list-item-action>

                    <v-list-item-content>
                      <v-list-item-title v-text="item.name"></v-list-item-title>

                      <v-list-item-subtitle
                        class="text--primary"
                        v-text="item.discription"
                      ></v-list-item-subtitle>

                      <v-list-item-subtitle>
                        {{ convertMinuteToHour(item.time_required) }} | {{ numberFormat(item.price) }}円
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </template>
                </v-list-item>

                <v-divider
                  v-if="i < menu.length - 1"
                  :key="i"
                ></v-divider>
              </template>
            </v-list-item-group>
          </v-list>
          {{selected_menu}}
        </v-stepper-content>

        <!-- 担当者選択 -->
        <v-stepper-content :step="2">
          <h1>担当者を選んでください</h1>

          <v-row>
            <v-col cols="12">
              <v-card
                @click="selected_staff = null"
                :class="selected_staff == null ? 'pink--text' : ''"
              >
                <v-list>
                  <v-list-item>
                    <v-list-item-action>
                      <v-icon
                        v-if="selected_staff == null"
                        class="pink--text"
                      >mdi-check-circle</v-icon>
                      <v-icon
                        v-else
                      >mdi-checkbox-blank-circle-outline</v-icon>
                    </v-list-item-action>

                    <v-list-item-content>指名なし</v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>

          <v-row class="mb-5">
            <v-col
              cols="6"
              v-for="(item, i) in staff"
              :key="i"
            >
              <v-card
                @click="selected_staff = i"
                :class="selected_staff == i ? 'pink--text' : ''"
              >
                <v-icon
                  v-if="selected_staff == i"
                  class="pink--text"
                  :style="{
                    position:'absolute',
                    top: '5px',
                    right: '5px',
                    zIndex: 999,
                  }"
                >mdi-check-circle</v-icon>
                <v-icon
                  v-else
                  :style="{
                    position:'absolute',
                    top: '5px',
                    right: '5px',
                    zIndex: 999,
                  }"
                >mdi-checkbox-blank-circle-outline</v-icon>
                <v-img :src="item.image"></v-img>
                <v-card-title>{{ item.name }}</v-card-title>
                <v-card-text>{{ item.position }}</v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-stepper-content>

        <!-- 日時選択 -->
        <v-stepper-content :step="3">
          <v-list class="d-flex flex-column" style="gap:25px;">
            <v-list-item>
              <v-date-picker
                no-title
                full-width
                v-model="selected_date"
                ref="picker"
                locale="ja-jp"
                :min="min_date"
                :max="max_date"
                :elevation="3"
              ></v-date-picker>
            </v-list-item>

            <v-list-item v-if="selected_date">
              <v-list width="100%">
                <v-radio-group v-model="selected_time">
                  <v-list-item
                    v-for="(time, t) in createTimesArray(bussiness_info.start, bussiness_info.end, reserve_setting.interval)"
                    :key="t"
                  >
                    <v-list-item-content style="width:50%;">{{time}}</v-list-item-content>
                    <v-list-item-action style="width:50%;">
                      <v-radio :value="time"></v-radio>
                    </v-list-item-action>
                  </v-list-item>
                </v-radio-group>
              </v-list>
            </v-list-item>
          </v-list>

        </v-stepper-content>

        <!-- 確認画面 -->
        <v-stepper-content :step="4">
          <v-list
            subheader
            three-line
          >
            <v-subheader>ご予約確認</v-subheader>

            <v-list-item v-if="selected_menu.length">
              <v-list-item-content>
                <v-list-item-title>メニュー</v-list-item-title>
                <v-list-item-subtitle>
                  <div class="d-flex flex-column">
                    <div
                      v-for="(item, i) in selected_menu"
                      :key="i"
                    >{{ menu[item].name }}</div>
                  </div>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>担当者</v-list-item-title>
                <v-list-item-subtitle>{{ selected_staff == null ? '指名しない' : staff[selected_staff].name }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item v-if="selected_date && selected_time">
              <v-list-item-content>
                <v-list-item-title>ご予約日</v-list-item-title>
                <v-list-item-subtitle>{{ convertDatetimeFormat(selected_date, 'YYYY年MM月DD日') }} {{ selected_time }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

        </v-stepper-content>

        <v-divider></v-divider>

        <v-card-actions>
          <v-row>
            <v-col cols="6">
              <v-btn
                v-if="step == 1"
                text
                block
                @click="actionCloseLiff"
              >閉じる</v-btn>
              <v-btn
                v-else
                text
                block
                @click="step--"
              >戻る</v-btn>
            </v-col>

            <v-col cols="6">
              <v-btn
                v-if="step == 3"
                block
                color="primary"
                @click="step++"
              >確認</v-btn>

              <v-btn
                v-else
                block
                color="primary"
                @click="step++"
              >次へ</v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-stepper-items>
    </v-stepper>


    <FooterLiff />
  </div>
</template>

<script>
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, fetchSignInMethodsForEmail, EmailAuthProvider, linkWithCredential, signOut, deleteUser } from "firebase/auth";
import { firebaseApp, auth, db } from '~/plugins/firebase.js';
import { lineMsgApi } from '~/plugins/line_api.js';
import moment from 'moment';

const LIFF_RESERVE = (process.env.NODE_ENV === 'development') ? process.env.LIFF_RESERVE_DEV : process.env.LIFF_RESERVE

export default {
  layout: 'liff',
  head() {
    return {
      title: process.env.LIFF_RESERVE_TITLE
    }
  },
  data() {
    return {
      step: 1,
      min_date: moment().add(1, 'days').format('YYYY-MM-DD'),
      max_date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
      min_time: moment().format('HH:mm'),
      reserve: {
        date: moment().format('YYYY-MM-DD'),
        time: moment().format('HH:mm')
      },
      staff: [
        {
          image: 'https://firebasestorage.googleapis.com/v0/b/l-s-zero-product.appspot.com/o/staff%2F1641116818260.jpg?alt=media&token=1ab9670a-16ea-40bf-a573-b19582db7e2a',
          name: '加藤 剛司',
          position: 'スタイリスト',
        }, {
          image: 'https://firebasestorage.googleapis.com/v0/b/l-s-zero-product.appspot.com/o/staff%2F1641116818260.jpg?alt=media&token=1ab9670a-16ea-40bf-a573-b19582db7e2a',
          name: '山田 花子',
          position: 'スタイリスト',
        }
      ],
      menu: [
        {
          name: 'カット',
          image: '',
          price: 3000,
          time_required: 60,
          discription: '説明文がここに入ります。あああああああああああああああああああああああああああああああああ',
        }, {
          name: 'パーマ',
          image: '',
          price: 4500,
          time_required: 60,
          discription: '説明文がここに入ります。',
        }, {
          name: 'カラー',
          image: '',
          price: 4000,
          time_required: 80,
          discription: '説明文がここに入ります。',
        },
      ],

      bussiness_info: {
        start: '08:00',
        end: '18:00',
        holiday: [1],
      },
      reserve_setting: {
        interval: 30,
      },

      selected_menu: [],
      selected_staff: null,
      selected_date: null,
      selected_time: null,
    }
  },
  watch: {
    step(aft) {
      if(aft < 1) this.step = 1
    }
  },
  created: function() {
    console.clear()
  },
  mounted: async function() {
    // ==================================
    // ① LIFF ユーザー情報取得
    // ==================================
    const getLiff   = await getLiffInfo(LIFF_RESERVE)
    console.log(getLiff)

    // ==================================
    // ② Firebase ログイン
    // ==================================
    this.login = await signInWithEmailAndPassword(auth, process.env.LIFF_USER_ID, process.env.LIFF_USER_PW)
    console.log(this.login)


    this.createTimesArray(this.bussiness_info.start, this.bussiness_info.end, this.reserve_setting.interval)
  },
  methods: {
    convertDatetimeFormat(dt, format) {
      return moment(dt).format(format)
    },
    convertMinuteToHour(min) {
      if(min / 60 > 0) {
        const hour   = Math.floor(min / 60)
        const minute = min % 60
        return (minute) ? `${hour}時間${minute}分` : `${hour}時間`
      } else {
        return `${minute}分`
      }
    },
    createTimesArray(start, end, interval) {
      start = Number(start.split(':')[0])
      end   = Number(end.split(':')[0])

      const times = []
      for (let h = start; h < end; h++) { // 時間
        for ( let m = 0; m < 60; m = m + interval) {
          const hour   = ( '00' + h ).slice( -2 );
          const minute = ( '00' + m ).slice( -2 );

          times.push(hour + ':' + minute)
        }
      }
      return times
    },
    numberFormat(num) {
      num = Number(num)
      return num.toLocaleString()
    },
    actionCloseLiff() {
      liff.closeWindow()
    }
  }
}
</script>