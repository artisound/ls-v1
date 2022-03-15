<template>
  <div>
    <v-sheet
      tile
      height="54"
      class="d-flex"
    >
      <v-btn
        icon
        class="ma-2"
        @click="$refs.calendar.prev()"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <v-select
        v-model="type"
        :items="types"
        dense
        outlined
        hide-details
        class="ma-2"
        label="カレンダータイプ"
      ></v-select>
      <v-spacer></v-spacer>
      <v-btn
        icon
        class="ma-2"
        @click="$refs.calendar.next()"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </v-sheet>
    <v-sheet height="calc(100vh - 200px)">
      <v-calendar
        ref="calendar"
        v-model="focus"
        locale="ja-jp"
        color="success"
        first-interval="8"
        interval-count="15"
        :type="type"
        :weekdays="weekdays"
        :events="events"
        :event-ripple="false"
        @change="setEvents"
        @click:more="viewDay"
        @click:date="viewDay"
        @mouseup:event="mouseUp"
        @mouseup:time="endDrag"
        @mousedown:event="startDrag"
        @mousedown:time="startTime"
        @mousemove:time="mouseMove"
        @mouseleave.native="cancelDrag"
      >
        <template v-slot:event="{ event, timed, eventSummary }">
          <div
            class="v-event-draggable"
            v-html="eventSummary()"
          ></div>
          <div
            v-if="timed"
            class="v-event-drag-bottom"
            @mousedown.stop="extendBottom(event)"
          ></div>
        </template>
      </v-calendar>


      <!-- イベント作成 -->
      <v-menu
        v-model="createdOpen"
        :close-on-content-click="false"
        :activator="selectedElement"
        offset-x
      >
        <v-card
          flat
          min-width="350px"
          max-width="350px"
        >
          <v-card-text>
            <v-row class="align-center">
              <v-col cols="12">
                <v-text-field
                  outlined
                  label="タイトル"
                  v-model="selectedEvent.name"
                  hide-details="auto"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <!-- 開始日付選択 -->
                <v-menu
                  ref="sDatePicker"
                  v-model="sDatePicker"
                  :close-on-content-click="false"
                  :return-value.sync="sDate"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      outlined
                      readonly
                      dense
                      label="開始日"
                      v-model="sDate"
                      prepend-inner-icon="mdi-calendar"
                      hide-details="auto"
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="sDate"
                    no-title
                    scrollable
                    locale="ja-jp"
                    :min="current_date"
                    @click:date="onDatePicker($refs)"
                  ></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="6" v-if="selectedEvent.timed">
                <!-- 開始時刻選択 -->
                <v-menu
                  ref="sTimePicker"
                  v-model="sTimePicker"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="sTime"
                      readonly
                      outlined
                      dense
                      prepend-inner-icon="mdi-clock"
                      hide-details="auto"
                      label="開始時刻"
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-time-picker
                    v-if="sTimePicker"
                    v-model="sTime"
                    full-width
                    @click:minute="onTimePicker($refs)"
                    format="24hr"
                    :min="current_time"
                  ></v-time-picker>
                </v-menu>
              </v-col>
              <v-col cols="6">
                <!-- 終了日付 -->
                <v-menu
                  ref="eDatePicker"
                  v-model="eDatePicker"
                  :close-on-content-click="false"
                  :return-value.sync="eDate"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      readonly
                      outlined
                      dense
                      v-model="eDate"
                      label="終了日"
                      prepend-inner-icon="mdi-calendar"
                      hide-details="auto"
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="eDate"
                    no-title
                    scrollable
                    locale="ja-jp"
                    :min="sDate"
                    @click:date="onDatePicker($refs, 'end')"
                  >
                  </v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="6" v-if="selectedEvent.timed">
                <!-- 終了時刻 -->
                <v-menu
                  offset-y
                  ref="eTimePicker"
                  v-model="eTimePicker"
                  transition="scale-transition"
                  max-width="290px"
                  min-width="290px"
                  :close-on-content-click="false"
                  :nudge-right="40"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      outlined
                      readonly
                      dense
                      v-model="eTime"
                      label="終了時刻"
                      prepend-inner-icon="mdi-clock"
                      hide-details="auto"
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-time-picker
                    v-if="eTimePicker"
                    v-model="eTime"
                    full-width
                    @click:minute="onTimePicker($refs, 'end')"
                    format="24hr"
                    :min="current_time"
                  ></v-time-picker>
                </v-menu>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="py-0 mb-3 d-flex">
                <v-spacer></v-spacer>
                <v-switch
                  v-model="selectedEvent.timed"
                  :true-value="false"
                  :false-value="true"
                  label="終日"
                  hide-details="auto"
                  class="mt-0"
                ></v-switch>
              </v-col>
              <v-col cols="12" class="py-0 mb-3">
                <v-btn
                  v-for="(color, i) in colors"
                  :key="i"
                  small
                  @click="onSetColor(color)"
                  :icon="true"
                >
                  <v-icon
                    :color="color"
                  >{{(color==selectedEvent.color) ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle'}}</v-icon>
                </v-btn>
              </v-col>
              <v-col class="py-0 mb-3">
                <v-autocomplete
                  outlined
                  dense
                  v-model="selectedEvent.userId"
                  :items="customers"
                  :persistent-hint="true"
                  no-data-text="選択できるお客様がいません。"
                  label="お客様名"
                  hint="予約を登録する場合は、お客様を選択してください。"
                  hide-details="auto"
                  prepend-inner-icon="mdi-account"
                ></v-autocomplete>
              </v-col>

              <v-col class="py-0 mb-3" style="max-width:70px">
                <v-btn
                  fab
                  small
                  color="warning"
                  title="再取得"
                  :disabled="loadingBtnRegetCustomer"
                  :loading="loadingBtnRegetCustomer"
                  @click="getCustomers"
                ><v-icon>mdi-account-sync</v-icon></v-btn>
              </v-col>

              <v-col cols="12" class="py-0 mb-3">
                <v-textarea
                  outlined
                  dense
                  label="備考"
                  rows="3"
                  v-model="remarks"
                  hide-details="auto"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-btn
              v-if="selectedEvent.id"
              text
              color="error"
              @click="onDelete"
            ><v-icon class="mr-2">mdi-trash-can</v-icon>削除</v-btn>
            <v-spacer></v-spacer>
            <v-btn
              text
              color="secondary"
              @click="onCancel"
            >キャンセル</v-btn>
            <v-btn
              color="primary"
              @click="onSave"
            >保存</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>


    </v-sheet>
  </div>
</template>

<script>
import { db, auth } from "~/plugins/firebase.js";
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, startAt } from "firebase/firestore";
import moment from "moment";

export default {
  layout: 'main',
  head() {
    return {
      title: 'スケジュール',
    }
  },
  data() {
    return {
      page: "schedule",

      focus: '',     // 今日の日付

      // ------------------------------------
      // カレンダー表示別のディスプレイ名
      type : 'week', // カレンダー表示タイプ。デフォルトは1週間表示
      types: [
        { value:'month', text: '月カレンダー' },
        { value:'week' , text: '週カレンダー' },
        { value:'day'  , text: '日カレンダー' },
      ],
      weekdays: this.weekDays(),
      current_sMonth : null,
      current_eMonth : null,
      current_date   : moment().format('YYYY-MM-DD'),
      current_time   : moment().format('HH:mm'),
      selectedEvent  : {},    // 選択されたイベント
      selectedElement: null,  // 選択されたイベントの表示位置
      events         : [],    // イベントを格納する配列
      beforeColor    : '',

      // -------------------------------
      // イベント作成
      createdOpen     : false,  // イベント作成メニュー表示フラグ
      dragEvent       : null,   // ドラッグされたイベント
      dragTime        : null,   // ドラッグされた時間
      createEvent     : null,   // 作成しているイベント
      createStart     : null,   // 作成しているイベントのスタート日時
      extendOriginal  : null,
      createdEventName: '',     // 作成しているイベント名

      // イベントカラー
      colors   : [ 'red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'amber', 'orange', 'deep-orange', 'brown', 'blue-grey', 'grey' ],
      // 顧客名、顧客LINEユーザーID
      customers: [],

      sDatePicker: false, // イベント開始日を指定するピッカー表示フラグ
      eDatePicker: false, // イベント終了日を指定するピッカー表示フラグ
      sTimePicker: false, // イベント開始時刻を指定するピッカー表示フラグ
      eTimePicker: false, // イベント終了時刻を指定するピッカー表示フラグ

      sDate  : '',  // イベント開始日付
      sTime  : '',  // イベント開始時刻
      eDate  : '',  // イベント終了日付
      eTime  : '',  // イベント終了時刻
      userId : '', // イベントの顧客ID
      remarks: '', // イベントの詳細

      // -------------------------------
      // ボタンアクション
      loadingBtnRegetCustomer: false,
    };
  },
  mounted: async function () {
    this.$refs.calendar.checkChange()

    await this.getCustomers()


    console.log(this.events)

    // 時間軸線
    // this.ready = true;
    // this.scrollToTime();
    // this.updateTime();
  },
  computed: {
    /** -----------------------------------------------------
     * イベントの最後のインデックスを返す
     * @returns Int - イベントの最後のインデックス
     ----------------------------------------------------- */
    lastEventIndex() {
      return this.events.length - 1;
    }
  },
  watch: {
    sDate(aft) {
      const sDateUnix = moment(aft).unix() * 1000
      const eDateUnix = moment(this.eDate).unix() * 1000
      if(sDateUnix > eDateUnix) {
        this.eDate = moment(sDateUnix).format('YYYY-MM-DD')
      }
    },
    eDate(aft) {
      const sDateUnix = moment(this.sDate).unix() * 1000
      const eDateUnix = moment(aft).unix() * 1000
      if(sDateUnix > eDateUnix) {
        this.eDate = moment(eDateUnix).format('YYYY-MM-DD')
      }
    },

    'selectedEvent.userId': function(aft) {
      if(aft) {
        const objCustomer = this.customers.find(v => v.value === aft)
        this.$set(this.selectedEvent, 'name', `【ご予約】${objCustomer.text} 様`)
      }
    },
  },
  created() {},
  methods: {
    // -------------------------------------
    // イベント作成・編集
    // -------------------------------------
    viewDay ({ date }) {
      console.log(date)
      this.focus = date
      this.type  = 'day'
    },

    // -------------------------------------
    // イベント作成・編集
    // -------------------------------------
    startTime(tms) {
      if (this.createdOpen) {
        this.createdOpen = false;
        if (!this.selectedEvent.id) this.events.pop();
        return;
      }

      const mouse = this.objToTime(tms);

      if (this.dragEvent && !this.dragTime) {
        const start   = (Number(this.dragEvent.start)) ? this.dragEvent.start : moment(this.dragEvent.start).unix();
        this.dragTime = (String(start).length == 13) ? mouse - start : mouse - (start * 1000);
      } else {
        this.createStart  = this.roundTime(mouse);
        this.createEvent  = {
          name  : '',
          color : this.rndElement(this.colors),
          start : this.createStart,
          end   : this.createStart,
          userId: '',
          timed : true
        };
        this.events.push(this.createEvent);
      }
    },


    // -------------------------------------
    // 既存イベントドラッグ
    // -------------------------------------
    startDrag({ event, timed }) {
      if (event && timed) {
        this.dragEvent      = event;
        this.dragTime       = null;
        this.extendOriginal = null;
      }
    },


    // -------------------------------------
    // 時間延ばすやつ
    // -------------------------------------
    async extendBottom(event) {
      this.createEvent    = event;
      this.createStart    = event.start;
      this.extendOriginal = event.end;
    },


    // -------------------------------------
    // マウスを動かしているとき
    // -------------------------------------
    mouseMove(tms) {
      if (newEvent && event) return;

      const event    = this.dragEvent
      const newEvent = this.createEvent
      const mouse    = this.objToTime(tms)

      if (event && this.dragTime) {
        const duration     = event.end - event.start
        const newStartTime = mouse - this.dragTime
        const newStart     = this.roundTime(newStartTime)
        const newEnd       = newStart + duration

        event.start = newStart
        event.end   = newEnd

      } else if (newEvent && this.createStart) {
        const mouseRounded = this.roundTime(mouse, false)

        const start = (Number(this.createStart)) ? this.createStart : moment(this.createStart).unix() * 1000
        const min   = Math.min(mouseRounded, start)
        const max   = Math.max(mouseRounded, start)

        this.createEvent.start = min
        this.createEvent.end   = max
      }
    },


    // -------------------------------------
    // ドラッグしたあと
    // -------------------------------------
    endDrag () {
      this.dragTime       = null
      this.dragEvent      = null
      this.createEvent    = null
      this.createStart    = null
      this.extendOriginal = null
    },

    // -------------------------------------
    // マウスクリックを離したとき
    // -------------------------------------
    async mouseUp({ nativeEvent, event }) {
      this.dragTime       = null;
      this.dragEvent      = null;
      this.createEvent    = null;
      this.createStart    = null;
      this.extendOriginal = null;

      this.selectedEvent    = event;
      this.selectedElement  = nativeEvent.target;

      console.log(event)

      // 日付が数値(= タイムスタンプ)の場合、変換
      this.sDate = (Number(this.selectedEvent.start)) ? moment.unix(this.selectedEvent.start / 1000).format('YYYY-MM-DD') : moment.unix(this.selectedEvent.start).format('YYYY-MM-DD')
      this.sTime = (Number(this.selectedEvent.start)) ? moment.unix(this.selectedEvent.end / 1000).format('HH:mm') : moment.unix(this.selectedEvent.end).format('HH:mm')
      this.eDate = (Number(this.selectedEvent.end)) ? moment.unix(this.selectedEvent.start / 1000).format('YYYY-MM-DD') : moment.unix(this.selectedEvent.start).format('YYYY-MM-DD')
      this.eTime = (Number(this.selectedEvent.end)) ? moment.unix(this.selectedEvent.end / 1000).format('HH:mm') : moment.unix(this.selectedEvent.end).format('HH:mm')

      requestAnimationFrame( () => requestAnimationFrame( () => {
        this.createdOpen  = true;
      } ) );

      
      // if(event.name){
      //   try {
      //     await this.eventSave(event)
      //   } catch (e) {
      //     console.error(e)
      //   }
      // }

      nativeEvent.stopPropagation();
    },


    // -------------------------------------
    // ドラッグを中止したとき
    // -------------------------------------
    cancelDrag() {
      if (this.createEvent) {
        if (this.extendOriginal) {
          this.createEvent.end = this.extendOriginal;
        } else {
          if(this.events.indexOf(this.createEvent) > -1) this.events.splice(i, 1);
        }
      }

      this.createEvent  = null;
      this.createStart  = null;
      this.dragTime     = null;
      this.dragEvent    = null;
    },


    // -------------------------------------
    // 刻み分
    // -------------------------------------
    roundTime(time, down = true) {
      const roundTo       = 5; // minutes
      const roundDownTime = roundTo * 60 * 1000;

      return down ? time - (time % roundDownTime) : time + (roundDownTime - (time % roundDownTime));
    },


    // -------------------------------------
    // -------------------------------------
    objToTime(tms) {
      return new Date(tms.year, tms.month - 1, tms.day, tms.hour, tms.minute).getTime()
    },



    // ===========================================================================================================
    // ボタン押下処理
    // ===========================================================================================================
    /** ****************************************************
     * イベント作成時の保存ボタン
     **************************************************** */
    async onSave() {
      this.createdOpen = false;
      const event     = this.selectedEvent.id ? this.selectedEvent : this.events[this.lastEventIndex]

      event.name      = event.name ? event.name : 'タイトルなし';
      event.remarks   = this.remarks;
      event.timed     = (event.timed) ? true : false;

      this.createdEventName = '';
      this.remarks          = '';

      try {
        await this.eventSave(event)
      } catch(e) {
        console.error(e)
      }
    },


    /** ****************************************************
     * イベント作成時のキャンセルボタン
     **************************************************** */
    onCancel() {
      // イベント作成メニューを閉じる
      this.createdOpen      = false;
      this.createdEventName = null;
      this.location         = null;
      this.remarks          = null;
      if (this.beforeColor) this.selectedEvent.color = this.beforeColor;

      // 新規追加イベントを削除する
      // 選択しているイベント名が設定されていなければイベント配列からイベントを削除する
      if (!this.selectedEvent.id) this.events.pop()
    },


    /** ****************************************************
     * イベント削除
     **************************************************** */
    async onDelete() {
      const evId = this.selectedEvent.id

      if(evId){
        try{
          await this.eventDelete(evId)

          const evIndex = this.events.findIndex(v => v.id === evId)
          this.events.splice(evIndex, 1)
        } catch(e) {
          console.error(e)
        }
      }
      this.createdOpen = false;
    },



    // ===========================================================================================================
    // Firestore（データベース）処理
    // ===========================================================================================================
    /** ****************************************************
     * 顧客取得（Firestore）
     **************************************************** */
    async getCustomers() {
      this.loadingBtnRegetCustomer = true

      const docQuery  = query(
        collection(db, 'customer'),
        where('field-line_follow_status', '==', 'follow')
      )
      const getCustomers = await getDocs(docQuery)

      let c, name;
      this.customers = []
      getCustomers.forEach(d => {
        c = d.data()
        name = c['field-name'] || c['field-line_user_name']
        if(name) {
          this.customers.push({
            text : name,
            value: d.id,
          })
        }
      })

      this.loadingBtnRegetCustomer = false
    },


    /** ****************************************************
     * イベント取得（Firestore）
     * @param {string} ymd - オブジェクト
     **************************************************** */
    async setEvents(ymd = null) {
      const lastDay = this.monthLastDay(ymd.end.year, ymd.end.month)
      const sMonth  = moment(`${ymd.start.year}-${this.toDoubleDigits(ymd.start.month)}-01 00:00:00`).unix() * 1000
      const eMonth  = moment(`${ymd.end.year}-${this.toDoubleDigits(ymd.end.month)}-${lastDay} 23:59:59`).unix() * 1000

      if(this.current_month !== sMonth || this.current_month !== eMonth) {
        console.log(sMonth)
        console.log(eMonth)
        this.current_sMonth = sMonth
        this.current_eMonth = eMonth
        const docQuery  = query(collection(db, this.page), where('start', '>=', sMonth), where('start', '<=', eMonth))
        const getEvents = await getDocs(docQuery)

        let ev;
        this.events = []
        getEvents.forEach(d => {
          ev       = d.data()
          ev.id    = d.id
          this.events.push(ev)
        })
      }
    },


    /** ****************************************************
     * イベント登録（Firestore）
     * @param {object} event - selectedEventオブジェクト
     **************************************************** */
    async eventSave(event) {
        const data = {
          name   : event.name,
          start  : (Number(event.start) > 1600000000000) ? event.start : event.start * 1000,
          end    : (Number(event.end) > 1600000000000) ? event.end : event.end * 1000,
          timed  : event.timed,
          color  : event.color,
          userId : event.userId || '',
          remarks: event.remarks || '',
        };

        try {
          if(event.id) {
            await setDoc(doc(collection(db, this.page), event.id), data)

            this.$toast.success(`予定を更新しました。`, {
              position: 'bottom-right'
            })
          } else {
            await setDoc(doc(collection(db, this.page)), data)

            this.$toast.success(`予定を登録しました。`, {
              position: 'bottom-right'
            })
          }
        } catch(e) {
          console.error(e)
          this.$toast.error(`予定を登録できませんでした。`, {
            position: 'bottom-right'
          })
        }
    },


    /** ****************************************************
     * イベント削除（Firestore）
     * @param {string} id - ドキュメントID
     **************************************************** */
    async eventDelete(id) {
      try {
        await deleteDoc(doc(db, this.page, id))

        this.$toast.success(`予定を削除しました。`, {
          position: 'bottom-right'
        })
      } catch(e){
        console.error(e)

        this.$toast.error(`予定を削除できませんでした。`, {
          position: 'bottom-right'
        })
      }
    },


    // ===========================================================================================================
    // その他関数
    // ===========================================================================================================
    /** ****************************************************
     * 【日付変更】デートピッカーの処理
     * @param {*} $refs
     **************************************************** */
    onDatePicker($refs, type = 'start') {
      if(type == 'start'){
        $refs.sDatePicker.save(this.sDate);
      } else if(type == 'end') {
        $refs.eDatePicker.save(this.eDate);
      } else { return }
      if (this.sDate != this.eDate) $refs.eDatePicker.save(this.eDate);

      console.log($refs)

      const evId    = this.selectedEvent.id
      const evIndex = this.events.findIndex(v => v.id === evId)
      console.log( moment(this.selectedEvent.start).format('YYYY/MM/DD') )

      this.$set(this.selectedEvent, 'start', moment(`${this.sDate} ${this.sTime}`).unix() * 1000)
      this.$set(this.selectedEvent, 'end', moment(`${this.eDate} ${this.eTime}`).unix() * 1000)
      // this.selectedEvent.start  = moment(`${this.sDate} ${this.sTime}`).unix() * 1000
      // this.selectedEvent.end    = moment(`${this.eDate} ${this.eTime}`).unix() * 1000
    },

    /** ****************************************************
     * 【時間変更】タイムピッカーの処理
     **************************************************** */
    onTimePicker($refs, type = 'start') {
      if(type == 'start'){
        $refs.sTimePicker.save(this.sTime);
      } else if(type == 'end') {
        $refs.eTimePicker.save(this.eTime);
      } else { return }

      const evId    = this.selectedEvent.id
      const evIndex = this.events.findIndex(v => v.id === evId)

      this.events[evIndex].start = moment(`${this.sDate} ${this.sTime}`).unix() * 1000
      this.events[evIndex].end   = moment(`${this.eDate} ${this.eTime}`).unix() * 1000
    },



    /** ****************************************************
     * カラー設定
     **************************************************** */
    onSetColor(color) {
      if (!this.beforeColor) this.beforeColor = this.selectedEvent.color;
      this.selectedEvent.color = color;
    },


    /** ****************************************************
     * 配列ランダム出力
     * @param {array} arr - 配列
     **************************************************** */
    rndElement (arr) {
      const rnd = Math.floor(((arr.length - 1) - 1) * Math.random()) + 0
      return arr[rnd]
    },


    /** ****************************************************
     * 引数の値を2桁の0埋めにフォーマットする関数
     * @param {Number} num - 2桁表示にしたい値
     * @returns - 2桁表示にフォーマットされた値
     **************************************************** */
    toDoubleDigits(num) {
      num += "";
      if (num.length === 1) num = "0" + num;
      return num;
    },


    /** ****************************************************
     * 月の最終日を出力
     * @param {Number} year  - 年
     * @param {Number} month - 月
     **************************************************** */
    monthLastDay(year, month) {
      const leapYear = (year % 4 === 0) ? true : false
      month = (String(month).startsWith('0')) ? Number(String(month).slice(1)) : month

      console.log(month)
      const daysOfMonth = [
        { month: 1,  days: 31 },
        { month: 2,  days: 28 },
        { month: 3,  days: 31 },
        { month: 4,  days: 30 },
        { month: 5,  days: 31 },
        { month: 6,  days: 30 },
        { month: 7,  days: 31 },
        { month: 8,  days: 31 },
        { month: 9,  days: 30 },
        { month: 10, days: 31 },
        { month: 11, days: 30 },
        { month: 12, days: 31 },
      ]

      const monthObj = daysOfMonth.find(v => v.month == month)
      if(leapYear){
        return (month == 2) ? 29 : monthObj.days
      } else {
        return monthObj.days
      }
    },


    /** ****************************************************
     * 週番号配列出力
     **************************************************** */
    weekDays(){
      // 当日週番号
      const current_week = moment().weekday()
      const ret = []
      let num   = current_week
      for(let i = 0; i < 7; i++){
        // 7以上になったら0に差し戻す
        if(num > 6) num = 0

        ret.push(num)
        num++
      }
      return ret
    }

  },
};
</script>

<style lang="scss" scoped>
.v-current-time {
  height: 2px;
  background-color: #ea4335;
  position: absolute;
  left: -1px;
  right: 0;
  pointer-events: none;

  &.first::before {
    content: "";
    position: absolute;
    background-color: #ea4335;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: -5px;
    margin-left: -6.5px;
  }
}
.v-event-draggable {
  padding-left: 6px;
}

.v-event-timed {
  user-select: none;
  -webkit-user-select: none;
}
.v-event-drag-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  height: 4px;
  cursor: ns-resize;

  &::after {
    display: none;
    position: absolute;
    left: 50%;
    height: 4px;
    border-top: 1px solid white;
    border-bottom: 1px solid white;
    width: 16px;
    margin-left: -8px;
    opacity: 0.8;
    content: "";
  }

  &:hover::after {
    display: block;
  }
}
</style>