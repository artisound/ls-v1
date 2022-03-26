import colors from 'vuetify/es5/util/colors'
import path from 'path'
import fs from 'fs'

export default {
  mode: 'spa',
  webfontloader: {
    google: {
      families: {
        Kosugi: true,
        'Kosugi+Maru': true,
        Varela: true,
        'Varela+Round': true
      }
    }
  },
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: `%s | L's`,
    // title: 'ls-app',
    htmlAttrs: {
      lang: 'ja'
    },
    script: [
      { src: 'https://static.line-scdn.net/liff/edge/2/sdk.js' },
      { src: '/src/js/functions.js' },
    ],
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/css/style.css',
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/toast',               mode: 'client' },
    { src: '~/plugins/firebase',            mode: 'client' },
    { src: '~/plugins/firebase.auth.js',    mode: 'client' },
    { src: '~/plugins/line_api',            mode: 'client' },
    { src: '~/plugins/vue-drag-resize',     mode: 'client' },
    { src: '~/plugins/vue-qrcode',          ssr : false },
    { src: '~/plugins/vue-draggable',       mode: 'client' },
    { src: '~/plugins/simple-code-editor',  mode: 'client' },
    { src: '~/plugins/codemirror',          mode: 'client' },
  ],

  router: {
    middleware: 'authenticated',
  },

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
    '@nuxtjs/moment',
  ],

  moment: {
    locales: ['ja']
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/dotenv',
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // proxy: true,
  },
  // proxy: {
  //   '/api/': {
  //     target: 'https://api.line.me/v2/bot/',
  //     pathRewrite: {
  //       '^/api/': ''
  //     }
  //   },
  //   '/api2/': {
  //     target: 'https://api-data.line.me/v2/bot/',
  //     pathRewrite: {
  //       '^/api2/': ''
  //     }
  //   },
  // },


  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: false,
      themes: {
        dark: {
          primary   : colors.blue.darken2,
          accent    : colors.grey.darken3,
          secondary : colors.amber.darken3,
          info      : colors.teal.lighten1,
          warning   : colors.amber.base,
          error     : colors.deepOrange.accent4,
          success   : colors.green.accent3
        }
      }
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  },

  publicRuntimeConfig: {},
  privateRuntimeConfig: {},

  server: {
    port: 3000,
    host: 'localhost',
    https: process.env.NODE_ENV === 'production' ? {} : {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem'))
    }
  },
}