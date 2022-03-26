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
        <v-dialog
          v-model="dialogDraftSave"
          max-width="400"
        >
          <template v-slot:activator="{ on, attr }">
            <v-btn
              dark
              color="blue"
              :disabled="loading || doc.active"
              :loading="loading"
              v-on="on"
              v-bind="attr"
            >
              <v-icon class="">mdi-content-save</v-icon>
              <span class="ml-2">下書き</span>
            </v-btn>
          </template>

          <v-card>
            <v-card-text class="py-3">
              このメッセージを下書きとして保存します。<br>よろしいですか？
            </v-card-text>

            <v-card-actions>
              <v-btn
                color="secondary"
                text
                @click="dialogDraftSave = false"
              >キャンセル</v-btn>

              <v-spacer></v-spacer>

              <v-btn
                dark
                color="blue"
                @click="saveData()"
              >下書き保存</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>


        <!-- メッセージ送信ダイアログ -->
        <v-dialog
          v-model="dialogSave"
          max-width="400"
        >
          <template v-slot:activator="{ on, attr }">
            <v-btn
              dark
              v-on="on"
              v-bind="attr"
              :color="doc.reserve ? 'indigo' : 'green'"
              :disabled="loading"
              :loading="loading"
            >
              <v-icon class="">mdi-cloud-upload</v-icon>
              <span class="ml-2">{{doc.reserve ? '配信予約' : '送信'}}</span>
            </v-btn>
          </template>

          <v-card>
            <v-card-text class="py-3">
              <template v-if="doc.reserve">
                このメッセージを保存します。<br>
                指定された時間に自動的に送信されます。<br>
              </template>
              <template v-else>
                このメッセージを今すぐ送信します。<br>
                送信すると取り消すことができません。<br>
                よろしいですか？
              </template>
            </v-card-text>

            <v-card-actions>
              <v-btn
                text
                color="secondary"
                @click="dialogSave = false"
              >キャンセル</v-btn>

              <v-spacer></v-spacer>

              <v-btn
                dark
                :color="doc.reserve ? 'indigo' : 'green'"
                @click="saveData(true, doc.reserve)"
              >{{doc.reserve ? '送信予約' : '送信'}}</v-btn>
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
            <div class="d-flex flex-column">
              <v-col
                cols="12"
                class="d-flex"
              >
                <v-btn
                  fab
                  icon
                  x-small
                  :disabled="(key == 0) ? true : false"
                  @click="changeOrderFormat(key, 'down')"
                ><v-icon>mdi-chevron-up</v-icon></v-btn>

                <v-btn
                  fab
                  icon
                  x-small
                  :disabled="(formats.length == key + 1) ? true : false"
                  @click="changeOrderFormat(key, 'up')"
                ><v-icon>mdi-chevron-down</v-icon></v-btn>

                <v-spacer></v-spacer>

                <v-btn
                  fab
                  icon
                  x-small
                  :disabled="(formats.length > 1) ? false : true"
                  @click="deleteFormat"
                ><v-icon>mdi-close</v-icon></v-btn>
              </v-col>

              <v-col cols="12" class="pt-0">
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
              </v-col>
            </div>

            <v-divider></v-divider>

            <!-- text -->
            <v-card-text v-if="fmt.type == 'text'">
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
                @input="fmt.template.title = $event"
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

            <!-- json -->
            <v-card-text v-if="fmt.type == 'json'">
              <v-card>
                <codemirror
                  v-model="fmt.str_format"
                  :options="{
                    tabSize: 4,
                    mode: 'text/javascript',
                    // theme: 'base16-dark',
                    lineNumbers: true,
                    line: true,
                  }"
                ></codemirror>
              </v-card>

              <div class="d-flex mt-3">
                <v-spacer></v-spacer>
                <v-btn @click="fmt.str_format = adjustJsonStr(fmt.str_format)">整形</v-btn>
              </div>
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
          <v-card-text>
            <v-text-field
              dense
              outlined
              label="タイトル"
              hide-details="auto"
              v-model="doc.title"
            ></v-text-field>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text>
            <v-radio-group
              row
              v-model="deliverType"
              hide-details="auto"
              class="ma-0 pa-0"
            >
              <template v-for="(item, i) in deliverTypeItems">
                <v-radio
                  :key="i"
                  :label="item.text"
                  :value="item.value"
                ></v-radio>
              </template>
            </v-radio-group>

            <v-row v-if="deliverType == 'reserve'" class="d-flex mt-3">
              <v-col cols="6">
                <v-menu
                  v-model="menu.reserve.date"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      dense
                      readonly
                      outlined
                      label="日"
                      v-model="reserve.date"
                      prepend-inner-icon="mdi-calendar"
                      hide-details="auto"
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    no-title
                    locale="ja-jp"
                    :min="menu.today"
                    v-model="reserve.date"
                    @input="menu.reserve.date = false"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="6">
                <v-menu
                  v-model="menu.reserve.time"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      dense
                      readonly
                      outlined
                      label="時"
                      v-model="reserve.time"
                      prepend-inner-icon="mdi-clock-time-four-outline"
                      hide-details="auto"
                      v-bind="attrs"
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-time-picker
                    full-width
                    format="24hr"
                    v-model="reserve.time"
                    :min="menu.now"
                    :allowed-minutes="m => m % 10 === 0"
                    @click:minute="menu.reserve.time = false"
                  ></v-time-picker>
                </v-menu>
              </v-col>
            </v-row>


            <v-row v-if="deliverType == 'step'" class="d-flex mt-3">
              <v-col cols="6">
                <v-select
                  dense
                  outlined
                  prefix="登録"
                  suffix="日後"
                  hide-details="auto"
                  v-model="step.day"
                  :items="[1, 2, 3, 4, 5, 6, 7]"
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-select
                  dense
                  outlined
                  suffix="時"
                  hide-details="auto"
                  v-model="step.oclock"
                  :items="[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 ]"
                  :value="8"
                ></v-select>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text>
            <v-switch
              label="絞り込む"
              hide-details="auto"
              class="ma-0 pa-0"
              v-model="collectionCheck"
              :disabled="collectionCheckDisabled"
            ></v-switch>

            <template v-if="collectionCheck">
              <v-list-item>
                <v-list-item-content>お客様名</v-list-item-content>
                <v-list-item-content>が</v-list-item-content>
                <v-list-item-content>
                    <v-autocomplete
                      dense
                      outlined
                      multiple
                      clearable
                      hide-details="auto"
                      v-model="doc.collection"
                      :items="customers"
                    ><!-- vmは一時的 --></v-autocomplete>
                </v-list-item-content>
              </v-list-item>
              <!-- <v-list-item
                v-for="(fld, i) in segments.selected"
                :key="i"
              >
              {{segments.conditions}}
                <v-list-item-content>
                  <v-select
                    dense
                    outlined
                    hide-details="auto"
                    :items="segments.conditions"
                    @change="getConditionIndexByFieldName"
                  ></v-select>
                </v-list-item-content>
                <v-list-item-content>が</v-list-item-content>
                {{segments.condition[i]}}
                <v-list-item-content>
                  <template v-if="segments.selected[i] == 'customer'">
                    <v-autocomplete
                      dense
                      outlined
                      multiple
                      hide-details="auto"
                      :items="setSegmentTargetItems(i)"
                      @change="getTargets($event, i)"
                    ></v-autocomplete>
                  </template>

                  <template v-else-if="segments.selected[i] == 'gender'">
                    <v-select
                      dense
                      outlined
                      hide-details="auto"
                      :items="setSegmentTargetItems(i)"
                      @change="getTargets($event, i)"
                    ></v-select>
                  </template>

                  <template v-else-if="segments.selected[i] == 'age'">
                    <v-select
                      dense
                      outlined
                      multiple
                      hide-details="auto"
                      :items="setSegmentTargetItems(i)"
                      @change="getTargets($event, i)"
                    ></v-select>
                  </template>
                </v-list-item-content>

                <v-list-item-action>
                  <v-btn
                    icon
                    dark
                    color="red"
                  ><v-icon>mdi-close-circle</v-icon></v-btn>
                </v-list-item-action>
              </v-list-item> -->
              <!-- <v-list-item>
                <v-spacer></v-spacer>
                <v-btn
                  dark
                  small
                  color="blue"
                  @click="segments.selected.push(segments.conditions[0])"
                ><v-icon left>mdi-plus</v-icon>条件を追加</v-btn>
              </v-list-item> -->
            </template>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text>
            <div class="d-flex">
              <v-spacer></v-spacer>
              <v-btn @click="sendTestMessage">テストメッセージ送信</v-btn>
            </div>
          </v-card-text>

<!--
          <v-divider></v-divider>

          <v-card-text>
            <v-textarea
              dense
              outlined
              label="備考"
              hide-details="auto"
              v-model="doc.remarks"
            ></v-textarea>
          </v-card-text>
-->
        </v-card>
      </v-col>
    </v-sheet>



    <v-card
      width="400"
      max-width="calc(100vw - 30px)"
      style="position:fixed;bottom:50px;right:10px;"
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
import { lineMsgApi } from '~/plugins/line_api.js';
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
      dialogDraftSave: false,
      dialogSave: false,

      // 日時
      menu: {
        reserve: {
          date: false,
          time: false,
        },
        today: moment().format('YYYY-MM-DD'),
        now: moment().format('HH:mm:ss')
      },

      stickerTab: null,

      msg_type: [
        { text: 'テキスト',       value: 'text',     icon: 'mdi-message-bulleted',        disabled: false },
        { text: '画像',           value: 'image',    icon: 'mdi-image',                   disabled: false },
        { text: 'ボタン',         value: 'template', icon: 'mdi-gesture-tap-button',      disabled: false },
        { text: 'スタンプ',       value: 'sticker',  icon: 'mdi-emoticon-happy-outline',  disabled: false },
        { text: '位置情報',       value: 'location', icon: 'mdi-map-marker',              disabled: false },
        // { text: 'イメージマップ', value: 'imagemap', icon: 'mdi-view-grid',               disabled: true },
        // { text: 'カルーセル',     value: 'carousel', icon: 'mdi-view-carousel-outline',   disabled: true },
        { text: 'JSON',           value: 'json',     icon: 'mdi-code-json',               disabled: false },
      ],

      // images
      images: {},

      // segment conditions
      customers: [],
      selectedCustomers: [],

      fields   : [],
      segments: {
        conditions: [],
        condition : [],
        selected  : [],
      },

      // stickers
      stickerTab: null,

      // 配信区分
      deliverTypeItems: [
        { text: '今すぐ配信',   value: 'normal' },
        { text: '予約配信',     value: 'reserve' },
        { text: 'ステップ配信', value: 'step' },
      ],
      deliverType: 'normal',

      // ドキュメントデータ
      doc: {
        title       : '',
        msg_format  : [],
        collection  : [],
        remarks     : '',
        active      : false,
        step_timing : '',
        sended_at   : '',
        reserve_at  : '',
        created_at  : '',
        updated_at  : '',
        notification_disabled: false,
      },
      formats: [
        { type: 'text', text: '' },
      ],
      fmt_json: '',
      collections: [],

      // 予約配信日時
      reserve:{ date: '', time: '' },

      // ステップ配信日時
      step: { day: 1, oclock: 8 },

      collectionCheck: false,
      collectionCheckDisabled: false,

      files: [],
      isDragging: false,
      dragCount: 0
    }
  },

  watch: {
    files() {
      this.draw();
    },

    'doc.reserve': function(aft) {
      if(!aft) this.$set(this.doc, 'reserve_at', '')
    },

    /** *******************************************
     * 予約配信日時が入力されたときの処理
     ******************************************* */
    reserve: {
      handler: function (aft) {
        this.$set(this.doc, 'reserve_at', `${aft.date} ${aft.time}`)
      },
      deep: true,
    },

    /** *******************************************
     * ステップ配信日時が入力されたときの処理
     ******************************************* */
    step: {
      handler: function (aft) {
        this.$set(this.doc, 'step_timing', `${aft.day}-${aft.oclock}`)
      },
      deep: true,
    },

    collectionCheck(aft) {
      if(!aft) this.$set(this.doc, 'collection', [])
    },

    /** *******************************************
     * 配信タイプが切り替わったときの処理
     ******************************************* */
    deliverType(aft) {
      switch(aft) {
        case 'normal':
          // ステップメッセージタイミングクリア
          this.$set(this.doc, 'step_timing',  '')
          // 配信予約日クリア
          this.$set(this.doc, 'reserve_at',   '')
          this.collectionCheckDisabled = false
          break;
        case 'reserve':
          // ステップメッセージタイミングクリア
          this.$set(this.doc, 'step_timing',  '')
          this.$set(this.doc, 'reserve_at',  `${this.reserve.date} ${this.reserve.time}`)
          this.collectionCheckDisabled = false
          break;
        case 'step':
          // 配信予約日クリア
          this.$set(this.doc, 'reserve_at',  '')
          this.$set(this.doc, 'step_timing', `${this.step.day}-${this.step.oclock}`)
          this.collectionCheck = false
          this.collectionCheckDisabled = true
          break;
      }
    }
  },

  created: function() {
    console.clear()
  },

  mounted: async function() {
    // --------------------------------
    // LINE Messaging API実行
    // --------------------------------
    this.lineApi = new lineMsgApi({
      url          : 'https://api.zp-ls.com/line/',
      accessToken  : process.env.LINE_PUBLIC_TOKEN,
    });

    const customers = await this.getDataList('customer')
    customers.forEach(c => {
      if(c['field-line_user_id'] && c['field-line_follow_status'] == 'follow') {
        this.customers.push({
          text: c['field-name'] || c['field-line_user_name'],
          value: c['field-line_user_id']
        })
      }
    })
    const fields    = await this.getDataList('setting', 'field', 'customer')
    fields.forEach(f => {
      if(f.collection) {
        let fld = {
          text  : f.label,
          value : f.name,
          items : [],
        }

        switch (f.type) {
          case 'text':
            customers.forEach(c => {
              fld.items.push(c['field-name'])
            })
            break;
          case 'radio':
            for(let item of f.items) {
              fld.items.push({
                text: item.label,
                value: item.value,
              })
            }
            break;
        }

        this.segments.conditions.push(fld)
      }
    })
    console.log(this.segments.conditions)

    // this.$set(this.segments.targets.customer, 'items', [])
    this.customers.forEach( c => {
      if(c['field-line_user_id']) {
        this.segments.targets.customer.items.push({
          text: (c['field-name'] || c['field-line_user_name']) + '様',
          value: c['field-line_user_id'],
        })
      }
    })

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


    if(this.$route.params.slug === 'new') {
      this.$set(this.doc, 'active', false)
    }
  },
  methods: {
    highlighter(code) {
      return highlight(code, languages.js); //returns html
    },
    /** *****************************************************
     * データ取得
     * @param {String} docId      - ドキュメントID
     * @param {Boolean} duplicate - 複製フラグ
     ***************************************************** */
    async getData(docId, duplicate = false) {
      try {
        const docRef = await getDoc(doc(db, this.page, docId))
        const getData = docRef.data()

        console.log(getData)

        for(var fld in getData) {
          switch(fld) {
            case 'msg_format':
              this.formats = getData[fld]
              break;
            default:
              this.$set(this.doc, fld, getData[fld])
              break;
          }
        }

        if(duplicate) {
          this.$set(this.doc, 'sended_at', '')
          this.$set(this.doc, 'created_at', '')
          this.$set(this.doc, 'updated_at', '')
        }

        if(this.doc.reserve && this.doc.reserve_at) {
          const [date, time] = this.doc.reserve_at.split(' ')

          console.log(this.doc.reserve_at)

          this.$set(this.doc, 'reserve', true)
          this.$set(this.reserve, 'date', date)
          this.$set(this.reserve, 'time', time)
        }
      } catch (e) {
        console.error(e)
      }
    },

    /** *****************************************************
     * データ取得(全件)
     * @param {String} collectionName - コレクション名
     ***************************************************** */
    async getDataList(collectionName, doc, subCollectionName) {
      try {
        let docRefs;
        if(doc) {
          docRefs = await getDocs( collection(db, collectionName, doc, subCollectionName) )
        } else {
          docRefs = await getDocs( collection(db, collectionName) )
        }
        const retData = []
        docRefs.forEach(d => retData.push( d.data() ) )
        return retData;
      } catch (e) {
        console.error(e)
      }
    },

    getConditionIndexByFieldName(fieldName) {
      const index = this.segments.conditions.findIndex(v => v.value === fieldName)
      this.segments.condition.push(this.segments.conditions[index].items)
      console.log(index)
    },

    setSegmentTargetItems(i) {
      const selected = this.segments.selected[i]
      console.log(i)
      return this.segments.targets[selected].items
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
            type  : 'buttons',
            title : '',
            text  : '',
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
        // -----------------------
        // JSON
        case 'json':
          baseFormat['str_format'] = ''
          baseFormat['format'] = ''
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
     * テストメッセージ
     ***************************************************** */
    async sendTestMessage() {
      this.loading = true;
      const msgApi = new lineMsgApi({
        url          : 'https://api.zp-ls.com/line/',
        accessToken  : process.env.LINE_ADMIN_TOKEN,
      });


      const staffs = await this.getDataList('staff')
      let sendToUser;
      for (let staff of staffs) {
        if(staff['field-uid'] && staff['field-uid'] == this.$store.getters.user.uid) {
          sendToUser = staff['field-line_user_id']
          break;
        }
      }

      const msg_format = [];
      for (let msg of this.formats) {
        if(msg.type == 'json') {
          msg.format = this.strToJson(msg.str_format)
          msg_format.push(msg.format)
        } else {
          msg_format.push(msg)
        }
      }
      let sendMsg = await msgApi.sendPushMessage({
        to      : sendToUser,
        messages: msg_format,
      });
      console.log(sendMsg)
      if(!Object.keys(sendMsg).length) {
        this.$toast.success(`正常に送信されました。`, {
          position: 'bottom-right'
        })
      } else {
        this.$toast.error(`メッセージの送信に失敗しました。\nメッセージの構成を見直してください。`, {
          position: 'bottom-right'
        })
      }
      this.loading = false;
    },

    /** *****************************************************
     * メッセージデータ保存（Firestore）
     ***************************************************** */
    async saveData(active = false, reserve = false){
      this.loading = true
      this.dialogSave = false

      console.log(active)
      console.log(reserve)

      const saveData = {}
      for(var key in this.doc) {
        switch(key) {
          case 'msg_format':
            const msg_format = [];
            for (let msg of this.formats) {
              if(msg.type == 'json') {
                msg.format = this.strToJson(msg.str_format)
              }
              msg_format.push(msg)
            }
            saveData[key] = msg_format
            break;
          case 'collection':
            saveData[key] = this.collectionCheck ? this.collections : [];
            break;
          default:
            saveData[key] = this.doc[key]
            break;
        }
      }

      // メッセージステータス ：アクティブ
      // 予約ステータス       ：未予約 (= 今すぐ配信)
      if(active && !reserve){
        const msg_format = [];
        for (let msg of this.formats) {
          if(msg.type == 'json') {
            msg.format = this.strToJson(msg.str_format)
            msg_format.push(msg.format)
          } else {
            msg_format.push(msg)
          }
        }
        console.log(saveData)
        // --------------------------------
        // LINE Messaging API実行
        // --------------------------------
        if(saveData.collection.length){
          let sendMsg = await this.lineApi.sendMulticastMessage({
            to                  : saveData.collection,
            messages            : msg_format,
            notificationDisabled: saveData.notification_disabled,
          });
          console.log(sendMsg)
        } else {
          let sendMsg = await this.lineApi.sendBroadcastMessage({
            messages            : msg_format,
            notificationDisabled: saveData.notification_disabled,
          });
          console.log(sendMsg)
        }

        saveData.sended_at = moment().format('YYYY-MM-DD HH:mm:ss')
      }

      // 予約日時が空もしくは空白があれば、予約無効
      saveData.reserve = ( !saveData.reserve_at || !saveData.reserve_at.match(/\S/g) ) ? false : true

      try {
        console.log(saveData)

        if(this.docId == 'new') {
          saveData.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
          await addDoc(collection(db, this.page), saveData)
        } else {
          saveData.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
          await setDoc(doc(collection(db, this.page), this.docId), saveData, { merge: true })
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

    /** ****************************************
     * JSON文字列をJSON形式に変換
     **************************************** */
    strToJson(str) {
      try {
        return JSON.parse(str)
      } catch (e) {
        return {}
      }
    },

    /** ****************************************
     * JSON文字列を整形
     **************************************** */
    adjustJsonStr(json) {
      let obj;
      try {
        obj = JSON.parse(json)
      } catch (e) {
        obj = json
      }
      return JSON.stringify(obj, null, "\t")
    }

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
