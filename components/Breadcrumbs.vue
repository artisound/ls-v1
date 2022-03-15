<template>
  <v-breadcrumbs :items="items">
    <template v-slot:item="{ item }">
      <v-breadcrumbs-item
        :to="item.href"
        :disabled="item.disabled"
      >
        {{ item.text }}
      </v-breadcrumbs-item>
    </template>
  </v-breadcrumbs>
</template>

<script>
  export default {
    data() {
      return {
        items: [],
      }
    },
    watch :{
      '$route': function(to, from) {
        console.log(this.$route.name)

        //遷移元と遷移先のパスが違った場合に発火する
        this.item = [
          {
            text: 'Home',
            disabled: false,
            href: '/',
          },
        ]
        if(to.path !== from.path) {
          console.log(this.$route.name)
        }
      },
      title(){
        this.items[1].text = this.title
      }
    },
    mounted: function() {
      this
    }
  }
</script>