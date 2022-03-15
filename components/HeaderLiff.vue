<template>
  <v-app-bar
    :color="color"
    dense
    dark
  >
    <v-spacer></v-spacer>

    <v-toolbar-title>{{title}}</v-toolbar-title>

    <v-spacer></v-spacer>
  </v-app-bar>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'title',
    },
    color: {
      type: String,
      default: 'green'
    }
  },
  mounted: async function () {

  },
  methods: {
    
  }
}
</script>