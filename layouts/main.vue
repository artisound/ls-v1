<template>
  <v-app dark>

    <Header />
    <v-main class="blue-grey lighten-5">

      <v-toolbar v-if="$route.path != '/'" dense flat color="success" dark >
        <Breadcrumbs />
      </v-toolbar>

      <Nuxt/>
    </v-main>
    <v-footer :absolute="false" app>
      <span>&copy; {{ new Date().getFullYear() }} ZeroProduct</span>
    </v-footer>
  </v-app>

</template>


<script>

export default {
  loading: {
    color: 'blue',
    height: '5px'
  },
  data() {
    return {
    }
  },
  mounted: async function(){
    console.log(process.env.NODE_ENV)
  },
  watch: {
  },
  methods: {
  }
};
</script>
