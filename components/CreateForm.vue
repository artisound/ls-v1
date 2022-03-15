<template>
  <v-expansion-panels
    v-model="panel"
    multiple
    focusable
  >
    <draggable
      v-bind="dragOptions"
      handle=".handle"
      @start="isDragging = true"
      @end="isDragging = false"
      style="width:100%"
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
            <span>{{i + 1}}. {{ fld.label }}
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

            <v-col cols="12">
              <v-row
                class="pb-2 ma-0"
                justify="space-between"
              >
                <v-spacer></v-spacer>
                <v-btn-toggle
                  multiple
                  color="primary"
                >
                  <v-btn v-model="fld.required">必須項目</v-btn>
                  <v-btn v-model="fld.hide">非表示</v-btn>
                  <v-btn v-model="fld.disabled">編集不可</v-btn>
                </v-btn-toggle>
              </v-row>
            </v-col>
          </v-row>

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

            <v-col cols="12">
              <v-row
                class="pb-2 ma-0"
                justify="space-between"
              >
                <v-spacer></v-spacer>
                <v-btn-toggle
                  multiple
                  color="primary"
                >
                  <v-btn v-model="fld.required">必須項目</v-btn>

                  <v-btn v-model="fld.hide">非表示</v-btn>

                  <v-btn v-model="fld.disabled">編集不可</v-btn>
                </v-btn-toggle>
              </v-row>
            </v-col>
          </v-row>

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

            <v-col cols="12">
              <v-row
                class="pb-2 ma-0"
                justify="space-between"
              >
                <v-spacer></v-spacer>
                <v-btn-toggle
                  multiple
                  color="primary"
                >
                  <v-btn v-model="fld.required">必須項目</v-btn>
                  <v-btn v-model="fld.hide">非表示</v-btn>
                  <v-btn v-model="fld.disabled">編集不可</v-btn>
                </v-btn-toggle>
              </v-row>
            </v-col>

          </v-row>

          <v-row v-else-if="fld.type=='hidden'">
            <v-col cols="6">
              <v-text-field
                outlined
                dense
                v-model="fld.name"
                @input="$emit('input-value', $event)"
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
                @input="$emit('input-value', $event)"
                label="初期値"
                hide-details="auto"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              {{field}}
            </v-col>
          </v-row>

        </v-expansion-panel-content>
      </v-expansion-panel>
    </draggable>
  </v-expansion-panels>
</template>


<script>
import draggable from 'vuedraggable'
export default {
  components: { draggable },
  props: ['field'],
  model: {
    prop: 'field',
    event: 'changeValue'
  },
  data() {
    return {
      panel: [],

      inputAssists: [
        { value: ''        , text:'なし' },
        { value: 'zip_code', text:'郵便番号' },
        { value: 'address' , text:'住所' },
        { value: 'uid'     , text:'顧客情報' },
      ],
    }
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

  methods: {


    /** *****************************************************
     * 入力値を親コンポーネントへ送信
     ***************************************************** */
    inputEmit() {
      this.$emit('input-value', this.input)
    },
  }
}
</script>

<style lang="scss" scoped>
.item {
  background-color: #fff;
  color: #ccc;
  display: block;
  margin-bottom: -1px;
  transition: 0.15s color ease-in-out;
  // &:hover {
  //   color: #aaa;
  // }
  // &.chosen {
  //   background-color: #f8f8f8;
  //    color: #aaa;
  // }
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