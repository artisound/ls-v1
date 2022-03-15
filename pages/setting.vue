<template>
  <nuxt-child />
</template>

<script>
export default {
  layout: 'main',
  head() {
    return {
      title: '設定',
    }
  },
  mounted: function() {
    console.log(this.$route)
    if(this.$route.fullPath === '/setting'){
      location.href = '/errors/404'
    }
  }
}
</script>