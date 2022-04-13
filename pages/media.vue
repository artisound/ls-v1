<template>
  <div>
    <v-container>

      <v-card>
        <div class="d-flex flex-wrap grow mt-5 px-4">
          <v-card class="elevation-4 pa-5 mt-n5 mb-2" color="success" dark>
            <v-icon style="font-size:32px;">mdi-tooltip-image</v-icon>
          </v-card>
          <v-spacer></v-spacer>
          <div class="align-self-center">
            <v-btn
              text
              router
              exact
              color="success"
              class="align-center"
              @click="dialogFileUpload = !dialogFileUpload"
            ><v-icon class="me-2">mdi-cloud-upload</v-icon>アップロード</v-btn>
          </div>
        </div>
        <v-divider></v-divider>

        <div class="d-flex">
          <v-col
            cols="6"
            md="2"
            sm="3"
            v-for="(item, i) in items"
            :key="i"
          >
            <v-card @click="dialogDetails = true;activeData = item">
              <v-img
                aspect-ratio="1"
                :src="item.url"
              ></v-img>
            </v-card>
          </v-col>
        </div>
        
      </v-card>
    </v-container>

    <!-- ダイアログ | 画像詳細情報 -->
    <v-dialog v-model="dialogDetails">
      <v-card>
        <v-img
          :src="activeData.url"
        ></v-img>
      </v-card>
    </v-dialog>
    
    <!-- ダイアログ | 画像アップロード -->
    <v-dialog v-model="dialogFileUpload" width="500">
      <v-card>
        <v-card-title class="text-h5 primary white--text">画像アップロード</v-card-title>

        <v-card-text class="mt-3 p-4">
          <v-file-input
            show-size
            truncate-length="15"
            label="画像を選択"
            accept=".jpg,.jpeg,.png"
            class="mb-2"
            @change="selectUploadFile"
            hide-details="auto"
          ></v-file-input>

          <small>
            ファイル形式：JPG、JPEG、PNG<br>
            ファイルサイズ：10MB以下
          </small>
        </v-card-text>

        <v-card-text class="p-4">
          <img :src="importItem.url" class="d-block mx-auto" style="width:250px;">
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            v-if="importItem"
            color="primary"
            :disabled="loadingBtn"
            :loading="loadingBtn"
            @click="cloudStorageFileUpload"
          >アップロード</v-btn>
          <v-btn v-else disabled>アップロード</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!-- ダイアログ | 画像削除 -->
    <v-dialog
      v-model="dialogRemove"
      max-width="400"
    >
      <v-card>
        <v-toolbar
          flat
          dark
          color="error"
          class="text-h5"
        >
          <v-icon color="white" class="mr-3">mdi-delete</v-icon>
          <div>{{activeData.name}}</div>
        </v-toolbar>

        <v-card-text class="py-3">
          このファイルを完全に削除します。<br>
          よろしいですか？
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="secondary"
            text
            @click="dialogRemove = false"
          >
            キャンセル
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="error"
            @click="cloudStorageFileRemove(activeData.name)"
            :disabled="loadingBtn"
            :loading="loadingBtn"
          >
            削除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { getStorage, ref, getDownloadURL, uploadString, deleteObject } from "firebase/storage";
import { doc, collection, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from '~/plugins/firebase.js';
import moment from 'moment';
const date = new Date();

export default {
  layout: 'main',
  head() {
    return {
      title: 'メディア',
    }
  },
  data() {
    return {
      page: 'media',
      // 表
      headers: [
        { text: '画像',   value: 'name',    sortable: false, align: 'left' },
        { text: '',       value: 'url',     sortable: false },
        { text: '作成日', value: 'created_at' },
        { text: '',       value: 'actions', sortable: false, align: 'right' },
      ],
      items     : [],
      importItem: {},
      activeData: {},
      loadingTbl: false,
      loadingBtn: false,

      // Firebase Storage
      fbStorage: getStorage(),

      // ダイアログ`
      dialogDetails: false,
      dialogFileUpload: false,
      dialogRemove: false,
    }
  },
  watch: {
    dialogFileUpload(aft) {
      if(!aft) this.importItem = {}
    },
    importItem: {
      handler: function (aft, bef) {
        console.log(aft)
      },
      deep: true,
    }
  },
  mounted: async function () {
    this.loadingTbl = true

    this.items = await this.getDataList();

    this.loadingTbl = false
  },
  methods: {
    datetimeFormat(dt, format) {
      return moment(dt).format(format);
    },


    /** *****************************************************
     * ファイル選択時、ファイル情報取得
     ***************************************************** */
    selectUploadFile(file) {
      if (file !== undefined && file !== null) {
        if (file.name.lastIndexOf('.') <= 0) return
        this.importItem['info'] = file
        console.log(file)
        const fr = new FileReader()
        fr.readAsDataURL(file)
        fr.addEventListener('load', () => {
          this.importItem['url'] = fr.result
        })
      } else {
        this.importItem = {}
      }
    },


    /** *****************************************************
     * ファイルアップロード
     ***************************************************** */
    async cloudStorageFileUpload(){
      if(!this.importItem) return;
      this.loadingBtn = true;

      const storageRef = ref(this.fbStorage, `${this.page}/${this.importItem.info.name}`)
      try {
        // ファイルアップロード
        const uploadedData = await uploadString(storageRef, this.importItem.url, 'data_url');

        // アップロードしたファイルのURLを取得
        const imageRef = ref(this.fbStorage, `${this.page}/${this.importItem.info.name}`);
        const img_url = await getDownloadURL(imageRef)

        // DBに保存するデータ内容
        const img_info = {
          name      : this.importItem.info.name,
          url       : img_url,
          created_at: date.getTime(),
        }

        // URLをDBに保存
        await setDoc(doc(collection(db, this.page)), img_info)
        this.items.unshift(img_info)

        this.$toast.success(`ファイルがアップロードされました。`, {
          position: 'bottom-right'
        })
      } catch (e) {
        console.log(e)
        this.$toast.error(`ファイルのアップロードに失敗しました。`, {
          position: 'bottom-right'
        })
      }

      this.loadingBtn       = false;
      this.dialogFileUpload = false;
    },


    /** *****************************************************
     * ファイル削除
     ***************************************************** */
    async cloudStorageFileRemove(name) {
      this.loadingBtn = true
      let id;
      const removedDataIndex = this.items.findIndex(v => v.name === name)

      // DBからファイルのドキュメントIDを取得
      const docRef    = query(collection(db, this.page), where('name', '==', name));
      const getDocRef = await getDocs(docRef);
      getDocRef.forEach(doc => id = doc.id)
      console.log(id)

      // Storageからファイルを選択
      const imageRef = ref(this.fbStorage, `${this.page}/${name}`);

      try {
        // DBから画像の情報を削除
        await deleteDoc(doc(collection(db, this.page), id))

        // Storageから画像を削除
        await deleteObject(imageRef)

        this.$toast.success(`ファイルが削除されました。`, {
          position: 'bottom-right'
        })

        this.items.splice(removedDataIndex, 1)
      } catch (e) {
        console.error("Error adding document: ", e)
        this.$toast.error(`ファイルを削除できませんでした。`, {
          position: 'bottom-right'
        })
      }

      this.loadingBtn = false
      this.dialogRemove = false
    },


    /** *****************************************************
     * データ一覧取得
     ***************************************************** */
    async getDataList() {
      const getDocRef = await getDocs(collection(db, this.page))
      let data, arrData = [];
      getDocRef.forEach(doc => {
        data = doc.data()
        data['id'] = doc.id
        arrData.push(data)
      });
      return arrData;
    },


    /** *****************************************************
     * URLコピー
     ***************************************************** */
    copyImageUrl(str) {
      navigator.clipboard.writeText(str).then(() => {
        console.log("copied!")
      }).catch(e => {
        console.error(e)
      })
    }
  },
  async beforeRouteUpdate(to, from, next) {
    next()
    this.items = await this.getDataList();
  },
}
</script>