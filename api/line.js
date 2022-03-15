'use strict';

const http = require('http');
const functions = require("firebase-functions");
const admin     = require('firebase-admin')
const express   = require('express');
const line      = require('@line/bot-sdk');
const moment    = require('moment');
const axios     = require('axios');
const app       = express();
const lineApi   = require('./line_api');
admin.initializeApp();



const config = {
  // LINE Developersでの準備②でメモったChannel Secret
  channelSecret: '60403db92578cac9ebc7b278c64a2f5e',
  // LINE Developersでの準備②でメモったアクセストークン
  channelAccessToken: 'yPh/FotJkX4Aa/HaCVWMvV4w0aOUoroBS9Vw87R6HDNPuQ6zTl4LfZ4wg82ngnnHoCNNIHkjS8Q5cdzUIHRZkEOt3F9EhZoqbChM1kzXhAHQsWs+7QMMRseE8+Txrz1WPsKKU2VpG9kle886RLgOUQdB04t89/1O/w1cDnyilFU='
};

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}));

app.get("/", (req, res) => {
  res.sendStatus(200)
});

app.post("/webhook", line.middleware(config), function (req, res) {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((result) => functions.logger.log(result));
});

async function handleEvent(event) {
  const client  = new line.Client(config);
  const lineMsg = new lineApi({
    url          : 'https://api.zp-ls.com/line/',
    accessToken  : config.channelAccessToken,
    channelSecret: config.channelSecret,
  });


  // *********************************************************
  // メッセージイベント
  // *********************************************************
  if(event.type == 'message') {
    //ユーザから送られた各メッセージに対する処理を実装する。
    //https://developers.line.biz/ja/reference/messaging-api/#message-event を参照。
    switch (event.message.type) {
      case 'text':
        // event.message.text

        return await lineMsg.sendReplyMessage({
          token   : event.replyToken,
          messages: [{
            type: 'text',
            text: JSON.stringify(event, null, "\t")
          }],
        })
        // return client.replyMessage(event.replyToken, message);

      case 'image':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '画像を受け取りました。'
        });

      case 'video':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '動画を受け取りました。'
        });

      case 'audio':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '音声を受け取りました。'
        });

      case 'file':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ファイルを受け取りました。'
        });

      case 'location':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '位置情報を受け取りました。'
        });

      case 'sticker':
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'スタンプを受け取りました。'
        });

      default:
        return Promise.resolve(null);
    }
  }

  // *********************************************************
  // フォローイベント
  // *********************************************************
  else if(event.type == 'follow') {
    await lineMsg.sendReplyMessage({
      token   : event.replyToken,
      messages: [{
        type: 'text',
        text: JSON.stringify(event, null, "\t")
      }],
    });

    // Firestoreにユーザーデータ登録
    await admin.firestore().collection('customer').doc(event.source.userId).set({
      'field-line_user_id'        : event.source.userId,
      'field-line_follow_status'  : event.type,
      'field-line_follow_datetime': moment.unix(event.timestamp/1000).format('YYYY-MM-DD HH:mm:ss'),
    });
  }

  // *********************************************************
  // ブロック（アンフォロー）イベント
  // *********************************************************
  else if(event.type == 'unfollow') {
    // Firestoreにユーザーデータ登録
    await admin.firestore().collection('customer').doc(event.source.userId).set({
      'field-line_user_id'       : event.source.userId,
      'field-line_follow_status' : event.type,
      'field-line_block_datetime': moment.unix(event.timestamp/1000).format('YYYY-MM-DD HH:mm:ss'),
    }).then(() => {
      functions.logger.log(event);
    }).catch((err) => {
      functions.logger.log(err);
      // 保存に失敗した際の処理
    });
  }
}

http.createServer(app);