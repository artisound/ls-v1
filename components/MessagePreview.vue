<template>
  <div
    class="mb-4 pa-3"
    :style="{
      height: '100%',
      overflowY: 'auto',
    }"
  >
    <div
      v-for="(fmt, f) in format"
      :key="f"
      class="mt-4 d-flex"
    >
      <template v-if="fmt.type=='text'">
        <v-card
          elevation="0"
          :style="{
            borderRadius: '15px',
            position:'relative',
          }"
        >
          <v-icon
            color="white"
            :style="{
              position:'absolute',
              transform:'rotate(85deg)',
              top: '-7px',
              left: '-7px',
            }">mdi-moon-waxing-crescent</v-icon>
          <v-card-text v-html="fmt.text.replace(/\n/g, '<br>')"></v-card-text>
        </v-card>
      </template>

      <template v-else-if="fmt.type=='image'">
        <v-card
          v-if="fmt.originalContentUrl"
          elevation="0"
          width="80%"
          max-width="300px"
        ><v-img :src="fmt.originalContentUrl"></v-img></v-card>
      </template>

      <template v-else-if="fmt.type=='template'">
        <v-card
          elevation="0"
          :style="{ borderRadius: '15px' }"
          width="250px"
        >
          <v-card-text class="grey lighten-4 black--text pb-0"><strong>{{fmt.template.title}}</strong></v-card-text>
          <v-card-text class="grey lighten-4 black--text" v-html="fmt.template.text.replace(/\n/g, '<br>')"></v-card-text>
          <template v-for="(act, a) in fmt.template.actions">
            <v-card-text
              :key="a"
              class="blue--text darken-4--text text-center py-3"
            >{{act.label}}</v-card-text>
          </template>
        </v-card>
      </template>

      <template v-else-if="fmt.type=='sticker'">
        <v-img
          width="60%"
          max-width="200"
          :src="`https://stickershop.line-scdn.net/stickershop/v1/sticker/${fmt.stickerId}/android/sticker.png`"></v-img>
      </template>

      <template v-else-if="fmt.type=='location'">
        <v-card
          elevation="0"
          :style="{ borderRadius: '15px' }"
          width="250px"
        >
          <iframe
            :src="`https://www.google.com/maps?output=embed&q=${fmt.latitude}, ${fmt.longitude}&&t=m&z=16`"
            width="100%"
            style="border:0;"
            allowfullscreen=""
            loading="lazy"
          ></iframe>
          <v-card-text class="py-1">
            <span class="black--text">{{fmt.title}}</span>
            <span class="d-block">{{fmt.address}}</span>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-text class="py-2 d-flex justify-space-between">
            <div>
              <v-btn
                fab
                dark
                x-small
                color="green"
                :style="{
                  width: '20px',
                  height: '20px',
                }"
                elevation="0"
              ><v-icon style="font-size:14px;">mdi-map-marker</v-icon></v-btn>
              <small>位置情報</small>
            </div>

            <v-icon color="grey darken-3">mdi-chevron-right</v-icon>
          </v-card-text>
        </v-card>
      </template>

<!--
      <template v-else-if="fmt.type=='imagemap'">
        <v-sheet></v-sheet>
      </template>
-->
<!--
      <template v-else-if="fmt.type=='carousel'">
        <v-sheet></v-sheet>
      </template>
-->
    </div>
  </div>
</template>

<script>
export default {
  props: {
    format: {
      type: Array,
      default: function () {
        return []
      }
    }
  },
  mounted: function () {
    console.log(this.format)
  },
  data() {
    return {}
  },
}
</script>