# L's
## 環境準備
### Firebaseセットアップ
1. [Firebase プロジェクト](https://console.firebase.google.com/?hl=ja)にアクセスし、Firebaseプロジェクトを作成。
   |プロジェクト名|GoogleAnalytics|
   |-|-|
   |l's-xxxx|有効<br>アナリティクスアカウント：L's
2. プランを変更。(Free -> Blaze)
3. 各種機能有効化。(Auth, Firestore, Functions, Hosting, Storage)
4. Firebase Authのメール認証を有効化。
5. [Firebase コンソール] > [プロジェクトの設定] > [マイアプリ]欄を開いておく。

### カスタムドメイン設定
1. `Hosting`にアクセスします。
2. `カスタムド メインを追加`ボタンをクリック。
3. `***.zp-ls.com`に設定
4. ドメイン管理サービス([お名前.com](https://navi.onamae.com/auth/signon))にてDNSを設定

### LINE公式アカウント、LINEログイン準備
1. [LINE Devs](https://developers.line.biz/console/)にログインし、業種に合うプロバイダに`顧客用`、`事業者（管理者）用`、`LINEログイン`を作成。
2. 顧客用、事業者用のMessaging APIの「応答メッセージ」や「挨拶メッセージ」のON、OFFを設定する
3. 顧客用Messaging APIにWebhookURLを設定。  
   URL：`https://asia-northeast2-<project-id>.cloudfunctions.net/webhook`
4. LINE公式アカウントに画像を設定。

***
## 環境構築
### Nuxtプロジェクトをclone
1. `dev`ディレクトリ上で
   ```bash
   git clone ssh://k.nishizoe131@gmail.com@source.developers.google.com:2022/p/l-s-zero-product/r/l-s
   ```
2. cloneしたプロジェクトのディレクトリ名を`ls-xxx`に変更
3. プロジェクトディレクトリに移動
   ```bash
   cd ls-xxx
   ```
4. `.env.sample`を`.env`として複製。

### LIFF設定
1. `.env`の該当の箇所に、LINE公式アカウントとLINEログインの情報を書き換えます。
   ```bash
   # LIFF設定
   $ line init

   # チャネルアクセストークン（長期）を取得
   $ line token --issue

   # LIFF追加 *8
   $ liff add
   ```
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

   `***`は「カスタムドメイン設定」で設定したサブドメイン
2. `.env`のFirebase情報の箇所を、「Firebaseセットアップ」5項で表示されているFirebaseConfig情報に書き換えます。


# 初回セットアップ

```bash
# モジュールをインストール & Firebaseセットアップ
$ ./build.sh
```


# バージョンアップ
```bash
# 最新状態を取得
$ git pull origin master

# Firebaseデプロイ
$ ./deploy.sh
```