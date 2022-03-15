<template>
  <div>
    {{$route.params}}
    <div class="l-detail-area">
        <nuxt-child />
    </div>
    <v-data-table
      locale="ja"
      :headers="headers"
      :search="search"
      :items="items"
      :custom-filter="filterOnlyCapsText"
      :footer-props="{ 'items-per-page-text' : '行/ページ:' }"
      item-key="name"
      class="elevation-1 mt-5"
      no-data-text="データがありません。"
      :loading="loading"
      loading-text="読み込み中"
    >
      <template v-slot:top>
        <div class="d-flex flex-wrap grow px-4 p-2">
          <v-card class="elevation-3 pa-5 mt-n5" color="success" dark>
            <v-icon style="font-size:32px;">{{icon}}</v-icon>
          </v-card>
        </div>

        <v-toolbar color="" flat>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="検索"
            single-line
            hide-details
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-spacer></v-spacer>
          <v-btn color="success" to="/customer/edit" text router exact><v-icon class="me-2">mdi-plus</v-icon>作成</v-btn>
        </v-toolbar>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip v-if="item.status=='follow'" color="green" dark>フォロー中</v-chip>
        <v-chip v-else-if="item.status=='unfollow'" color="red" dark>ブロック中</v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="normal"
              v-bind="attrs"
              v-on="on"
              fab
              small
              depressed
            ><v-icon>mdi-dots-vertical</v-icon></v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(m, i) in menu"
              :key="i"
              :to="'/customer/'+item.id"
            >
              <v-list-item-title><v-icon class="mr-2">{{m.icon}}</v-icon>{{ m.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>



  </div>
</template>

<script>
export default {
  props: [
    'headers',
    'items',
    'search',
    'menu',
    'icon',
    'loading',
  ],
  data() {
    return {
    }
  },
  methods: {
    // ====================================
    // テーブル フィルタリング
    // ====================================
    filterOnlyCapsText(value, search, item) {
        return value != null &&
            search != null &&
            typeof value === 'string'
    },
  }
}
</script>