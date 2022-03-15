<template>
  <div>
    <v-row class="mt-1">
      <template v-for="(fld, f) in field">
        <v-col cols="12" :key="f" v-if="!fld.hide && fld.type!='hidden'">
          <v-radio-group
            v-if="fld.type=='radio'"
            v-model="input[fld.name]"
            hide-details="auto"
            :column="fld.row"
            :row="!fld.row"
            @input="inputEmit"
          >
            <div class="mb-2" v-for="item in fld.items" :key="item">
              <v-radio
                :label="item.label"
                :value="item.value"
              ></v-radio>
            </div>
          </v-radio-group>

          <v-textarea
            v-else-if="fld.type=='textarea'"
            v-model="input[fld.name]"
            :label="fld.label"
            :placeholder="fld.placeholder"
            :disabled="fld.disabled"
            hide-details="auto"
            class="mb-2"
            outlined
            @input="inputEmit"
          ></v-textarea>

          <v-menu
            v-else-if="fld.type=='date'"
            v-model="datepicker[fld.name]"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            min-width="auto"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="input[fld.name]"
                :label="fld.label"
                :prepend-inner-icon="fld.icon || 'mdi-calendar'"
                hide-details="auto"
                v-bind="attrs"
                v-on="on"
                readonly
                outlined
                class="mb-2"
              ></v-text-field>
            </template>
            <v-date-picker
              locale="ja-jp"
              v-model="input[fld.name]"
              @change="inputEmit"
              @input="datepicker[fld.name] = false"
              no-title
            ></v-date-picker>
          </v-menu>

          <v-expansion-panels v-else-if="fld.type=='group'" focusable>
            <v-expansion-panel>
              <v-expansion-panel-header>{{fld.label}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <InputForm :field="fld.items" :input="input" :datepicker="datepicker" @input-value="inputedValue" />
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-select
            v-else-if="fld.type=='select'"
            v-model="input[fld.name]"
            :label="fld.label"
            :items="fld.items"
            :prepend-inner-icon="fld.icon"
            item-text="label"
            item-value="value"
            hide-details="auto"
            class="mb-2"
            outlined
            @input="inputEmit"
          ></v-select>

          <v-text-field
            v-else
            :type="fld.type"
            :label="fld.label"
            :placeholder="fld.placeholder"
            :prepend-inner-icon="fld.icon"
            :disabled="fld.disabled"
            v-model="input[fld.name]"
            hide-details="auto"
            class="mb-2"
            outlined
            @input="inputEmit"
          ></v-text-field>
        </v-col>
      </template>
    </v-row>

    <div v-for="(fld, f) in field" :key="f">
      <input
        v-if="fld.type=='hidden'"
        type="hidden"
        v-model="input[fld.name]"
      >
    </div>
  </div>
</template>

<script>
export default {
  props: {
    field: {
      type: Array,
    },
    input: {
      type: Object,
    },
    datepicker: {
      type: Object,
    },
  },
  data() {
    return {}
  },
  methods: {
    inputEmit() {
      this.$emit('input-value', this.input)
    },
    inputedValue(payload) {
      this.input = payload
    }
  },
}
</script>