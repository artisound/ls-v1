<template>
  <div>
    <v-container>
      <v-card class="mb-3">
        <v-toolbar
          color="success"
          dark
          class="align-center"
        >
          <span>事業者情報</span>
          <v-spacer></v-spacer>
          <v-switch v-model="stg_corp_enable" hide-details="auto" class="pa-0 ma-0"></v-switch>
        </v-toolbar>
        <v-card-text>
          <div class="text--primary">
            <v-text-field
              :disabled="!stg_corp_enable"
              v-model="setting.corp_name"
              label="会社名 / 事業名"
              hide-details="auto"
            >
              <v-icon slot="prepend">mdi-office-building</v-icon>
            </v-text-field>
            <v-text-field
              :disabled="!stg_corp_enable"
              v-model="setting.corp_tel"
              label="会社電話番号"
              hide-details="auto"
            >
              <v-icon slot="prepend">mdi-phone</v-icon>
            </v-text-field>
            <v-text-field
              :disabled="!stg_corp_enable"
              v-model="setting.zip_code"
              label="郵便番号"
              hide-details="auto"
            >
              <v-icon slot="prepend">mdi-map-marker</v-icon>
            </v-text-field>
            <v-text-field
              :disabled="!stg_corp_enable"
              v-model="setting.address01"
              label="住所１"
              hide-details="auto"
            >
              <v-icon slot="prepend">mdi-map-marker</v-icon>
            </v-text-field>
            <v-text-field
              :disabled="!stg_corp_enable"
              v-model="setting.address02"
              label="住所２"
              hide-details="auto"
            >
              <v-icon slot="prepend">mdi-map-marker</v-icon>
            </v-text-field>
            <v-text-field
              :disabled="!stg_corp_enable"
              v-model="setting.rep_name"
              label="担当者名"
              hide-details="auto"
            >
              <v-icon slot="prepend">mdi-account-tie</v-icon>
            </v-text-field>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            @click="saveSetting"
            :loading="loading"
            :disabled="!stg_corp_enable"
          >保存</v-btn>
        </v-card-actions>
      </v-card>

    </v-container>
  </div>
</template>

<script>
import { db } from '~/plugins/firebase.js';
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export default {
  layout: 'main',
  head() {
    return {
      title: 'アカウント設定',
    }
  },
  data() {
    return {
      stg_corp_enable: false,
      loading        : false,
      setting: {},
      overlay: false,
    }
  },
  mounted: async function () {
    this.setting = await this.getSetting();
  },
  methods: {
    /** *****************************************************
     * 設定情報取得
     ***************************************************** */
    async getSetting() {
      const getDocRef = await getDoc(doc(db, 'setting', 'corp'))
      const data = getDocRef.data();
      return (data) ? data : {}
    },


    /** *****************************************************
     * 設定保存
     ***************************************************** */
    async saveSetting() {
      this.loading = true
      try {
        const document = doc(db, 'setting', 'corp')
        const setDocRef = await setDoc(document, this.setting)
        console.log(setDocRef)

        this.$toast.success('事業者情報が保存されました。', {
          position: 'bottom-right'
        })
        this.stg_corp_enable = false
      } catch (e) {
        console.error("Error adding document: ", e)
        this.$toast.error('事業者情報を保存できませんでした。', {
          position: 'bottom-right'
        })
      }
      this.loading = false
    },


    /** *****************************************************
     * 【郵便番号・住所】
     * 郵便番号：自動ハイフン挿入
     * 住所　　：郵便番号から住所取得
     ***************************************************** */
    zipcodeToAddress: async function (e) {
      if (!e) this.settings.address01 = '';
      // 自動ハイフン挿入
      if (e.length > 3) this.settings.zip_code = insertHyphenForZipcode(e);

      if (e.length > 7) {
        this.overlay = true;
        let getAdrs = await getAddressByZipcodeFromGmap(e, this.config.api_key.g_map);

        if (getAdrs.length) {
          let arrAdrs = [];
          getAdrs.forEach(el => arrAdrs.push(el.long_name));

          // 先頭（国名）・末尾（郵便番号）を削除
          arrAdrs.shift();
          arrAdrs.pop();
          this.settings.address01 = arrAdrs.join('');
        }
        this.overlay = false;
      }
    },

  }
}
</script>