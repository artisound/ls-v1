<template>
  <div>
    <v-navigation-drawer
      style="background-color:#023047;"
      v-model="drawer"
      :mini-variant="miniVariant"
      fixed
      dark
      app
    >
      <v-list dense>
        <v-list-item>
          <template>
            <v-img v-if="miniVariant" src="/favicon.ico"></v-img>
            <v-img v-else src="/zp-logo-white.png"></v-img>
          </template>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          @click="title = item.title"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <v-menu top offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-list-item v-on="on" v-bind="attrs">
              <v-list-item-action>
                <v-icon>mdi-cogs</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>設定</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>

          <v-list>
            <v-list-item
              v-for="(item, i) in settingItems"
              :key="i"
              :to="item.to"
              @click="title = item.title"
              router
              exact
            >
              <v-list-item-action>
                <v-icon>{{ item.icon }}</v-icon>
              </v-list-item-action>
              <v-list-item-title v-text="item.title" />
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-navigation-drawer>


    <v-app-bar fixed app>
      <v-btn
        icon
        @click.stop="miniVariant = !miniVariant"
        class="d-none d-sm-block"
      >
        <v-icon>mdi-{{ `chevron-${miniVariant ? "right" : "left"}` }}</v-icon>
      </v-btn>
      <v-btn icon @click.stop="drawer = !drawer">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-toolbar-title v-text="title" />
      <v-spacer />

      <v-menu bottom offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-on="on" v-bind="attrs" class="mr-2">
            <v-icon dark>mdi-account</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item to="/setting/account" @click="title='ユーザー設定'">
            <v-list-item-title>ユーザー設定</v-list-item-title>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list>
          <v-dialog
            v-model="dialogLogout"
            width="300"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-list-item
                v-bind="attrs"
                v-on="on"
              >
                <v-list-item-title>ログアウト</v-list-item-title>
              </v-list-item>
            </template>

            <v-card>
              <v-card-title class="text-h5 grey lighten-2">
                ログアウト
              </v-card-title>

              <v-card-text class="py-3">
                ログアウトします。よろしいですか？
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-btn
                  color="primary"
                  text
                  @click="dialogLogout=false"
                >
                  キャンセル
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  color="error"
                  @click="signOut"
                >
                  ログアウト
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-list>

      </v-menu>
    </v-app-bar>
  </div>
</template>

<script>
import { db, auth } from '~/plugins/firebase.js';
import axios from 'axios';

export default {
  data() {
    return {
      title: '',
      drawer: false,
      miniVariant: false,

      // ダイアログ
      dialogLogout: false,
      menuSetting: false,

      // ドロワーメニュー
      items: [
        {
          icon: "mdi-home-variant",
          title: "ホーム",
          to: "/",
        }, {
          icon: "mdi-account-group",
          title: "顧客管理",
          to: "/customer",
        }, {
          icon: "mdi-account-tie",
          title: "従業員管理",
          to: "/staff",
        }, {
          icon: "mdi-calendar-month",
          title: "スケジュール",
          to: "/schedule",
        }, {
          icon: "mdi-chat-question",
          title: "お問い合わせ",
          to: "/contact",
        }, {
          icon: "mdi-tooltip-image",
          title: "メディア",
          to: "/media",
        }, {
          icon: "mdi-forum",
          title: "メッセージ配信",
          to: "/message",
        }, {
          icon: "mdi-robot",
          title: "チャットボット",
          to: "/scenario",
        }, {
          icon: "mdi-view-quilt",
          title: "リッチメニュー",
          to: "/richmenu",
        },
      ],
      settingItems: [
        {
          icon: "mdi-account-settings",
          title: "ユーザー設定",
          to: "/setting/account",
        }, {
          icon: "mdi-database-settings",
          title: "入力フィールド設定",
          to: "/setting/field",
        }, {
          icon: "mdi-message-settings",
          title: "LINE設定",
          to: "/setting/line",
        },
      ],
    }
  },
  watch: {
      '$route': function(to, from) {
        console.log(to)
      }
  },
  mounted: async function() {
  },
  methods: {
    // ====================================
    // ログアウト処理
    // ====================================
    signOut: function() {
      this.$store.dispatch('signOut').then(() => {
        this.$router.push({ name: 'login' })
      }).catch((err) => {
        alert(err.message)
      })
    }
  },
}
</script>