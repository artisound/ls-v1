<template>
  <div>
    <v-list
      subheader
      three-line
    >
      <template v-for="(fld, f) in field">
        <v-list-item v-if="!fld.hide && fld.type!=='hidden'" :key="f">
          <v-list-item-content>
            <v-row>
              <v-col cols="5" md="3" class="border-right">
                <v-list-item-title>{{fld.label}}</v-list-item-title>
              </v-col>
              <v-col cols="7" md="9" v-if="Array.isArray(input[fld.name])">
                <v-list-item-subtitle>{{input[fld.name].split(' / ')}}</v-list-item-subtitle>
              </v-col>
              <v-col cols="7" md="9" v-else>
                <v-list-item-subtitle>
                  {{input[fld.name]}}
                  <!-- <div :html="input[fld.name].replace('', '<br>')"></div> -->
                </v-list-item-subtitle>
              </v-col>
            </v-row>
            <v-divider></v-divider>
          </v-list-item-content>

          <!-- <v-list-item-content v-else>
            <v-expansion-panels focusable>
              <v-expansion-panel>
                <v-expansion-panel-header>{{fld.label}}</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <InputForm :field="fld.items" :input="input" :datepicker="datepicker" @input-value="inputedValue" />
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-list-item-content> -->
        </v-list-item>
      </template>
    </v-list>


  </div>
</template>

<script>
export default {
  props: [
    'field',
    'input',
  ],
  data() {
    return {}
  },
  methods: {
  },
}
</script>