# L's
## 初期設定
1. LINE公式アカウントとLINEログインを作成します。
2. `.env.sample`を`.env`にリネームします。
3. `.env`の該当の箇所に、LINE公式アカウントとLINEログインの情報を書き換えます。
   |LIFFタイトル|URL|
   |-|-|
   |ユーザー登録|https://***.zp-ls.com/liff/regist|
   |問い合わせ|https://***.zp-ls.com/liff/contact|
   |予約|https://***.zp-ls.com/liff/reserve|
   |従業員LINE連携|https://***.zp-ls.com/liff/sync-staff|
   |【開発】ユーザー登録|https://localhost:3000/liff/regist|
   |【開発】問い合わせ|https://localhost:3000/liff/contact|
   |【開発】予約|https://localhost:3000/liff/reserve|
   |【開発】従業員LINE連携|https://localhost:3000/sync-staff|
4. [Firebase プロジェクト](https://console.firebase.google.com/u/0/?hl=ja)にアクセスし、Firebaseプロジェクトを作成します。
   |プロジェクト名|GoogleAnalytics|
   |-|-|
   |l's-xxxx|有効<br>アナリティクスアカウント：L's
5. プランを`Blaze`にアップグレードします。
6. アプリを`ウェブ`で追加します。
   |項目|値・操作|
   |-|-|
   |アプリのニックネーム|l's-xxxx (プロジェクト名と同じ)|
   |Firebase Hostingにも～|true|
7. `.env`の該当の箇所に、`Firebase SDK の追加`の項目で表示されているFirebaseConfig情報を書き換えます。


## Firebase Authentication
1. アカウントを作成
    |ID|用途|
    |-|-|
    |`admin@zp-ls.com`|管理者用アカウント|
    |`liff@zp-ls.com`|LIFF用アカウント|
2. `.env`の該当の箇所を、`1.`で作成したアカウント情報に書き換えます。


## セットアップ
```bash
# LIFF設定
$ line init

# チャネルアクセストークン（長期）を取得
$ line token --issue

# LIFF追加 *8
$ liff add


# モジュールをインストール & Firebaseセットアップ
$ ./build.sh

# Firebaseデプロイ
$ ./deploy.sh
```

## Firestoreへ初期データをインポート


## カスタムドメイン設定
1. `Hosting`にアクセスします。
2. `カスタムドメインを追加`ボタンをクリック。
3. `***.zp-ls.com`に設定

