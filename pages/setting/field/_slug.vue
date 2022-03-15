<template>
  <div>
    <v-toolbar flat>
      <v-btn
        text
        router
        exact
        color="success"
        :to="`/${page}/field`"
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
          :to="`/${page}/field`"
        >
          <span class="">キャンセル</span>
        </v-btn>
        <v-btn
          router
          exact
          color="primary"
          @click="saveData"
        >
          <v-icon>mdi-cloud-upload</v-icon>
          <span class="ml-2">保存</span>
        </v-btn>
      </div>
    </v-toolbar>


    <v-container>
      <v-card class="mb-2">
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <v-text-field
                dense
                outlined
                label="フォーム名"
                hide-details="auto"
                v-model="slug"
                :disabled="($route.params.slug==='new') ? false : true"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                dense
                outlined
                label="フォームタイトル"
                hide-details="auto"
                v-model="formName"
                :disabled="($route.params.slug==='new') ? false : true"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <div class="mb-2 d-flex">
        <v-spacer></v-spacer>
        <v-menu offset-y offset-x>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              dark
              color="primary"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon dark left>mdi-plus</v-icon>
              フィールドを追加
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="(t, i) in type" :key="i" @click="addField(t.name)">
              <v-list-item-title>{{t.label}}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <v-expansion-panels
        v-model="panel"
        multiple
        focusable
        v-if="!relendering"
      >
        <draggable
          v-bind="dragOptions"
          handle=".handle"
          @start="isDragging = true"
          @end="isDragging = false"
          style="width:100%"
          v-model="field"
        >
          <v-expansion-panel
            class="item"
            v-for="(fld, i) in field"
            :key="i"
          >
            <v-expansion-panel-header class="handle py-1">
              <div
                class="d-flex align-center"
                style="width:100%;"
              >
                <span>
                  {{i + 1}}.
                  <span>
                    <span v-if="fld.type=='hidden'">
                      {{ fld.name }}
                      <span class="info--text mr-2">非表示</span>
                    </span>
                    <span v-else>{{ fld.label }}</span>
                  </span>
                  <span v-if="fld.required" class="error--text mr-2">必須</span>
                  <span v-if="fld.hide" class="info--text mr-2">非表示</span>
                  <span v-if="fld.disabled" class="warning--text mr-2">編集不可</span>
                </span>
                <v-spacer></v-spacer>
                <v-btn
                  fab
                  text
                  small
                  color="error"
                  class="mr-2"
                  @click="field.splice(i, 1)"
                  title="フィールドを削除"
                >
                  <v-icon>mdi-trash-can</v-icon>
                </v-btn>
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content
              class="mt-3"
            >

              <!-- tel | url | text | date | email | number -->
              <v-row v-if="
                fld.type=='tel' ||
                fld.type=='url' ||
                fld.type=='text' ||
                fld.type=='date' ||
                fld.type=='email' ||
                fld.type=='number'
              ">
                <v-col cols="6">
                  <v-text-field
                    v-model="fld.label"
                    label="ラベル"
                    outlined
                    dense
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="fld.name"
                    label="フィールド名"
                    outlined
                    dense
                    prefix="field-"
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="fld.value"
                    :type="fld.type"
                    label="初期値"
                    outlined
                    dense
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="fld.placeholder"
                    label="プレースホルダー"
                    outlined
                    dense
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-select
                    dense
                    outlined
                    label="入力補助"
                    :items="inputAssists"
                    @change="fld.name=$event"
                  ></v-select>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="fld.icon"
                    label="アイコン"
                    outlined
                    dense
                    prefix="mdi-"
                    :append-icon="(fld.icon) ? `mdi-${fld.icon}` : ''"
                    placeholder="例）filter-menu"
                    hide-details="auto"
                  ></v-text-field>
                  <small class="d-block px-2 text-right">
                    <a
                      href="https://materialdesignicons.com/"
                      target="_blank"
                    >アイコンはこちら</a>
                  </small>
                </v-col>

                <v-col cols="12" class="pt-0">
                  <div
                    class="d-flex pb-2 ma-0"
                    style="gap:15px;"
                  >
                    <v-spacer></v-spacer>

                    <v-switch
                      messages="必須項目"
                      v-model="fld.required"
                    ></v-switch>
                    <v-switch
                      messages="非表示"
                      v-model="fld.hide"
                    ></v-switch>
                    <v-switch
                      messages="編集不可"
                      v-model="fld.disabled"
                    ></v-switch>
                    <v-switch
                      messages="絞込み対象"
                      v-model="fld.condition"
                    ></v-switch>
                  </div>
                </v-col>
              </v-row>

              <!-- textarea -->
              <v-row v-else-if="fld.type=='textarea'">
                <v-col cols="6">
                  <v-text-field
                    v-model="fld.label"
                    label="ラベル"
                    outlined
                    dense
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="fld.name"
                    label="フィールド名"
                    outlined
                    dense
                    prefix="field-"
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="fld.value"
                    label="初期値"
                    outlined
                    dense
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="fld.placeholder"
                    label="プレースホルダー"
                    outlined
                    dense
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    type="number"
                    v-model="fld.rows"
                    label="行数"
                    outlined
                    dense
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" class="pt-0">
                  <div
                    class="d-flex pb-2 ma-0"
                    style="gap:15px;"
                  >
                    <v-spacer></v-spacer>

                    <v-switch
                      messages="必須項目"
                      v-model="fld.required"
                    ></v-switch>
                    <v-switch
                      messages="非表示"
                      v-model="fld.hide"
                    ></v-switch>
                    <v-switch
                      messages="編集不可"
                      v-model="fld.disabled"
                    ></v-switch>
                  </div>
                </v-col>
              </v-row>

              <!-- radio | select | checkbox -->
              <v-row v-else-if="
                fld.type=='radio' ||
                fld.type=='select' ||
                fld.type=='checkbox'
              ">
                <v-col cols="6">
                  <v-text-field
                    v-model="fld.label"
                    label="ラベル"
                    outlined
                    dense
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    v-model="fld.name"
                    label="フィールド名"
                    outlined
                    dense
                    prefix="field-"
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-divider></v-divider>
                  <v-radio-group
                    v-model="fld.value"
                    hide-details="auto"
                  >
                    <draggable
                      v-bind="dragOptions"
                      handle=".menu-swap"
                      @start="isDragging = true"
                      @end="isDragging = false"
                      style="width:100%"
                      v-model="fld.items"
                    >
                      <div
                        v-for="(item, j) in fld.items"
                        :key="j"
                        style="gap:10px;"
                        class="d-flex py-2 my-2"
                      >
                        <v-radio :value="item.value"></v-radio>

                        <v-text-field
                          v-model="item.value"
                          label="値"
                          dense
                          hide-details="auto"
                        ></v-text-field>

                        <v-text-field
                          v-model="item.label"
                          label="ラベル"
                          dense
                          hide-details="auto"
                        ></v-text-field>

                        <v-icon class="menu-swap">mdi-menu-swap</v-icon>
                      </div>
                    </draggable>
                  </v-radio-group>
                  <div class="d-flex">
                    <v-spacer></v-spacer>
                    <v-btn
                      small
                      color="primary"
                      class="mb-3"
                      @click="fld.items.push({label:'', value:''})"
                    >
                      <v-icon small class="mr-2">mdi-plus</v-icon>
                      追加
                    </v-btn>
                  </div>
                  <v-divider></v-divider>
                </v-col>

                <v-col cols="12" class="pt-0">
                  <div
                    class="d-flex pb-2 ma-0"
                    style="gap:15px;"
                  >
                    <v-spacer></v-spacer>

                    <v-switch
                      messages="必須項目"
                      v-model="fld.required"
                    ></v-switch>
                    <v-switch
                      messages="非表示"
                      v-model="fld.hide"
                    ></v-switch>
                    <v-switch
                      messages="編集不可"
                      v-model="fld.disabled"
                    ></v-switch>
                    <v-switch
                      messages="絞込み対象"
                      v-model="fld.condition"
                    ></v-switch>
                  </div>
                </v-col>

              </v-row>

              <!-- hidden -->
              <v-row v-else-if="fld.type=='hidden'">
                <v-col cols="6">
                  <v-text-field
                    outlined
                    dense
                    v-model="fld.name"
                    label="フィールド名"
                    prefix="field-"
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <v-text-field
                    outlined
                    dense
                    v-model="fld.value"
                    label="初期値"
                    hide-details="auto"
                  ></v-text-field>
                </v-col>

              </v-row>

            </v-expansion-panel-content>
          </v-expansion-panel>
        </draggable>
      </v-expansion-panels>

      <div class="mt-2 d-flex">
        <v-spacer></v-spacer>
        <v-menu offset-y offset-x>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              dark
              color="primary"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon dark left>mdi-plus</v-icon>
              フィールドを追加
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="(t, i) in type" :key="i" @click="addField(t.name)">
              <v-list-item-title>{{t.label}}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-container>
  </div>
</template>

<script>
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from '~/plugins/firebase.js';
import moment from 'moment'

export default {
  props: ['page'],
  data() {
    return {
      slug: this.$route.params.slug,
      formInfo: [],
      formName: null,
      panel: [],
      field: [],
      fieldNum: null,

      relendering: false,

      type: [
        { name: 'text',     label: 'テキスト（一行）' },
        { name: 'textarea', label: 'テキスト（複数行）' },
        { name: 'radio',    label: 'ラジオボタン' },
        { name: 'checkbox', label: 'チェックボックス' },
        { name: 'select',   label: 'セレクトボックス' },
        { name: 'hidden',   label: '隠しフィールド' },
      ],

      inputAssists: [
        { value: ''        , text:'なし' },
        { value: 'zip_code', text:'郵便番号' },
        { value: 'address' , text:'住所' },
        { value: 'uid'     , text:'顧客情報' },
      ],

    }
  },

  watch: {
    // field: {
    //   handler(aft, bef) {
    //     console.log(aft)
    //     console.log(bef)
    //     if(aft != bef) console.log('変更されました')
    //   },
    //   deep: true
    // }
  },

  computed: {
    dragOptions() {
      return {
        animation: 200,
        chosenClass: "chosen",
        forceFallback: true,
        fallbackClass: "fallback",
        ghostClass: "ghost"
      };
    }
  },

  mounted: async function () {
    console.clear()

    this.formInfo = await this.getFormDetails()
    this.field    = await this.getDataList()
    this.fieldNum = this.field.length

    if(this.$route.params.slug !== 'new'){
      let n = this.formInfo.findIndex(v => v.collection === this.$route.params.slug)
      this.formName = this.formInfo[n].name
    }
  },

  methods: {
    /** *****************************************************
     * フォーム情報取得
     ***************************************************** */
    async getFormDetails() {
      try {
        const getDocRef = await getDoc(doc(db, this.page, 'field'))
        const docData   = getDocRef.data()
        return docData.collections
      } catch(e) {
        console.error(e)
      }
    },

    inputValue(i, key, value){
      this.$set(this.field[i], key, value)
    },


    /** *****************************************************
     * データ一覧取得
     ***************************************************** */
    async getDataList() {
      const colRef    = collection(db, this.page, 'field', this.slug)
      const queryRef  = query(colRef, orderBy('num', 'asc'))
      const getDocRef = await getDocs(queryRef);

      let arrDocs = []
      getDocRef.forEach( doc => arrDocs.push(doc.data()) )

      let arrField = []
      for(let objDoc in arrDocs) {
        let objField = this.fieldTypes(arrDocs[objDoc].type)
        if(!objField) continue;

        for(let key in objField) {
          objField[key] = arrDocs[objDoc][key]
        }

        if(objField.name && objField.name.startsWith('field-')){
          objField.name = objField.name.replace('field-', '')
        }

        if(objField.icon && objField.icon.startsWith('mdi-')) {
          objField.icon = objField.icon.replace('mdi-', '')
        }

        arrField.push(objField)
      }

      console.log(arrField)

      return arrField
    },


    /** *****************************************************
     * データ保存
     ***************************************************** */
    async saveData() {
      // const now = moment().add(9, 'hours').format('YYYY-MM-DD HH:mm:ss')
      const now = moment().format('YYYY-MM-DD HH:mm:ss')
      // ----------------------
      // 不足テキスト追加処理
      // ----------------------
      const arrFirld = [];
      this.field.forEach((fld, i) => {
        arrFirld.push(fld)
        if(fld.name) arrFirld[i].name = `field-${fld.name}`
        if(fld.icon) arrFirld[i].icon = `mdi-${fld.icon}`
        arrFirld[i].num = i
      })

      try {
        if(this.$route.params.slug == 'new') {
          this.formInfo.push({
            collection: this.slug,
            name      : this.formName,
            created_at: now,
            updated_at: '',
          })
        } else {
          let n = this.formInfo.findIndex(v => v.collection === this.slug)
          this.$set(this.formInfo[n], 'updated_at', now)

          // ----------------------
          // 元あるフィールドを削除
          // ----------------------
          for(let n = 0; n < this.fieldNum; n++) {
            await deleteDoc( doc( collection( db, this.page, 'field', this.slug ), String(n) ) )
          }
        }
        // ----------------------
        // 更新
        // ----------------------
        // フィールド情報
        console.log(arrFirld)
        console.log(this.formInfo)
        for(let i = 0; i < arrFirld.length; i++) {
          await setDoc( doc( collection( db, this.page, 'field', this.slug ), String(i) ), arrFirld[i], { merge: true } )
        }

        // フォーム情報
        await setDoc( doc( db, this.page, 'field' ), {collections: this.formInfo}, { merge: true } )

        this.$toast.success(`保存されました。`, {
          position: 'bottom-right'
        })
        this.$router.push(`/${this.page}/field`)
      } catch(e) {
        console.error(e)
        this.$toast.error(`エラーが発生しました。`, {
          position: 'bottom-right'
        })
      }
    },


    /** *****************************************************
     * フィールド追加
     ***************************************************** */
    fieldTypes(type) {
      let objField;
      switch(type) {
        case 'textarea':
          objField = {
            placeholder : '入力例',
            label       : 'ラベル',
            name        : 'name',
            icon        : '',
            value       : '',
            rows        : '5',
          }
          break;
        case 'radio':
          objField = {
            condition: false,
            label : 'ラベル',
            name  : 'name',
            value : '',
            items : [
              {label: 'ラベル', value: '値'},
            ],
          }
          break;
        case 'checkbox':
          objField = {
            condition: false,
            label : 'ラベル',
            name  : 'name',
            value : '',
            items : [
              {label: 'ラベル', value: '値'},
            ],
          }
          break;
        case 'select':
          objField = {
            condition: false,
            label   : 'ラベル',
            name    : 'name',
            icon    : '',
            value   : '',
            multiple: false,
            items   : [
              {label: 'ラベル', value: '値'},
            ],
          }
          break;
        case 'hidden':
          objField = {
            name  : 'name',
            value : '',
          }
          break;
        default:
          objField = {
            condition  : false,
            placeholder: '入力例',
            label      : 'ラベル',
            name       : 'name',
            icon       : '',
            value      : '',
          }
          break;
      }
      if(objField) objField.type = type
      return objField
    },
    addField(type) {
      const objField = this.fieldTypes(type)
      if(objField) this.field.push(objField)
    }
  }
}
</script>

<style lang="scss" scoped>
.v-expansion-panel-header--active {
  min-height: initial;
}

.item {
  background-color: #fff;
  color: #ccc;
  display: block;
  margin-bottom: -1px;
  transition: 0.15s color ease-in-out;
  &.fallback {
    background-color: #f8f8f8;
  }
  &.ghost {
    color: #f8f8f8;
  }
  .menu-swap {
    cursor: pointer;
  }
}
</style>