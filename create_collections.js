const fb_admin = require("firebase-admin");
const collections_json = require('./init_collections.json');
const serviceAccount = require('./firebase_serviceAccountKey.json');

fb_admin.initializeApp({
  credential: fb_admin.credential.cert(serviceAccount)
});
const db = fb_admin.firestore();
const auth = fb_admin.auth();



/** ***********************************
 * Firebase Auth
 * アカウント作成
 *********************************** */
// 作成するユーザー
const init_users = [
  { email: 'admin@zp-ls.com', password: 'y6sz38#g' },
  { email: 'liff@zp-ls.com',  password: 'y6sz38#g' },
];
// 作成
for (let user of init_users) {
  auth.createUser(user).then(userRecord => {
    console.log('Successfully created new user:', userRecord);
  }).catch(error => {
    console.log('Error creating new user:', error);
  });
}

/** ***********************************
 * Firestore
 * コレクション、ドキュメント作成
 *********************************** */
for (let col_key in collections_json) {
  let col_obj = collections_json[col_key];

  // 空コレクション作成
  if (!Object.keys(col_obj).length) {
    db.collection(col_key).doc('dummy').set({}).then(async resp => {
      await db.collection(col_key).doc('dummy').delete()
    });
  }

  // ドキュメント追加
  else {
    for (let doc_key in col_obj) {
      let doc_obj = col_obj[doc_key];

      if (doc_obj['__collections__']) {
        subcols = doc_obj['__collections__'];
        delete doc_obj['__collections__'];

        // ドキュメント追加
        db.collection(col_key).doc(doc_key).set(doc_obj).then(async resp => {
          console.log(resp);

          for (let subcol_key in subcols) {
            subcol_obj = subcols[subcol_key];

            for (let subdoc_key in subcol_obj) {
              subdoc_obj = subcol_obj[subdoc_key];
              // サブコレクションドキュメント追加
              db.collection(col_key).doc(doc_key).collection(subcol_key).doc(subdoc_key).set(subdoc_obj).then(async resp => {
                console.log(resp);
              });
            }
          }
        });
      } else {
        if (doc_key == 'line') doc_obj.friend_added_message[0].contents.footer.contents[0].uri = 'https://liff.line.me/' + process.env.LIFF_REGIST;

        // ドキュメント追加
        db.collection(col_key).doc(doc_key).set(doc_obj).then(async resp => {
          console.log(resp);
        });
      }

    }
  }
}