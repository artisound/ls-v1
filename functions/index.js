'use strict';
require('dotenv').config();
const functions = require("firebase-functions");
const admin     = require('firebase-admin');
const express   = require('express');
const moment    = require('moment');
const axios     = require('axios');
const line      = require('@line/bot-sdk');
const middleware = line.middleware;

const region    = 'asia-northeast2'
const timezone  = 'Asia/Tokyo'
admin.initializeApp();

/** **********************************************************************************************************
 * LINE Callback
 ********************************************************************************************************** */
const config = {
  channelSecret     : process.env.LINE_PUBLIC_SECRET,
  channelAccessToken: process.env.LINE_PUBLIC_TOKEN,
}
const line_wh     = express();
const line_client = new line.Client(config);
line_wh.use(middleware(config))
line_wh.post('/', async (req, res) => {
  req.body.destination // user ID of the bot (optional)

  req.body.events // webhook event objects
  const events = req.body.events;
  if (events.length) {
    const event = events[0];
    await handleEvent(event)
  }
  res.json([]);
});
line_wh.use((err, req, res, next) => {
  if (err instanceof SignatureValidationFailed) {
    res.status(401).send(err.signature)
    return
  } else if (err instanceof JSONParseError) {
    res.status(400).send(err.raw)
    return
  }
  next(err) // will throw default 500
});

/** **********************************************************************************************************
 * LINE Callback
 ********************************************************************************************************** */
async function handleEvent(event) {
  // *********************************************************
  // メッセージイベント
  // *********************************************************
  if(event.type == 'message') {
    //ユーザから送られた各メッセージに対する処理を実装する。
    switch (event.message.type) {
      case 'text':

        if (event.message.text == '予約確認') {
          const reseives = await admin.firestore()
            .collection('schedule')
            .where('start', '>', event.timestamp)
            .get();

          let data;
          const arrMsg = [];
          reseives.forEach(d => {
            data = d.data();
            if (data.userId === event.source.userId) {
              arrMsg.push(moment(data.start).add(9, 'h').format('YYYY年M月D日 H:mm') + '～');
            }
          });

          let message;
          message = (arrMsg.length) ? arrMsg.join('\n') : 'ご予約はありません。'

          let ret = await line_client.replyMessage(event.replyToken, {
            type: 'text',
            text: message,
          })
          functions.logger.log(JSON.stringify(ret, null, "\t"));

        } else {
          const fs = await admin.firestore()
            .collection('scenario')
            .where('call_text', '==', event.message.text)
            .get();

          let data;
          fs.forEach(d => {
            data = d.data();
          });

          if (data && data.status == 'publish') {
            const msg_format = [];
            for (let msg of data.format) {
              if (msg.type == 'json') {
                msg.format = strToJson(msg.str_format)
                msg_format.push(msg.format)
              } else {
                msg_format.push(msg)
              }
            }
            functions.logger.log(JSON.stringify(msg_format));

            let ret = await line_client.replyMessage(event.replyToken, msg_format);
            functions.logger.log(JSON.stringify(ret, null, "\t"));
          } else {
            let ret = await line_client.replyMessage(event.replyToken, {
              type: 'text',
              text: 'メッセージありがとうございます！\n\n \
申し訳ございませんが、送信されたメッセージについて答えできません。\n \
メッセージ文を変えて送っていただくとお答えできるかもしれません。'
            });
            functions.logger.log(JSON.stringify(ret, null, "\t"));
          }
        }
        return;

      // case 'image':
      //   return await line_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: '画像を受け取りました。'
      //   });

      // case 'video':
      //   return await line_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: '動画を受け取りました。'
      //   });

      // case 'audio':
      //   return await line_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: '音声を受け取りました。'
      //   });

      // case 'file':
      //   return await line_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: 'ファイルを受け取りました。'
      //   });

      // case 'location':
      //   return await line_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: '位置情報を受け取りました。'
      //   });

      // case 'sticker':
      //   return await line_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: 'スタンプを受け取りました。'
      //   });

      default:
        return Promise.resolve(null);
    }
  }

  // *********************************************************
  // フォローイベント
  // *********************************************************
  else if (event.type == 'follow') {
    // 顧客情報
    const customer = await admin.firestore().doc('customer/' + event.source.userId).get().then(doc => {
      return doc.data();
    });

    // LINE設定
    const config = await admin.firestore().doc('setting/line').get().then(doc => {
      return doc.data();
    });

    let ret, changeRichmenu;
    if (!customer) {
      // --------------------------
      // 初回友だち追加
      // --------------------------
      ret = await line_client.replyMessage(event.replyToken, config.friend_added_message);
    } else {
      // --------------------------
      // 友だち再登録
      // --------------------------
      ret = await line_client.replyMessage(event.replyToken, config.turn_back_message);
    }

    // Firestoreにユーザーデータ登録
    const profile = await line_client.getProfile(event.source.userId);
    await admin.firestore().collection('customer').doc(event.source.userId).set({
      'field-line_user_id'        : event.source.userId,
      'field-line_user_name'      : profile.displayName,
      'field-line_follow_status'  : event.type,
      'field-line_language'       : profile.language,
      'field-line_picture'        : profile.pictureUrl,
      'field-line_follow_datetime': event.timestamp,
    }, { merge: true }).then(() => {
      functions.logger.log(event);
    }).catch((err) => {
      // 保存に失敗した際の処理
      functions.logger.log(err);
    });
  }

  // *********************************************************
  // ブロック（アンフォロー）イベント
  // *********************************************************
  else if(event.type == 'unfollow') {
    // Firestoreにユーザーデータ登録
    await admin.firestore().collection('customer').doc(event.source.userId).update({
      'field-line_user_id'       : event.source.userId,
      'field-line_follow_status' : event.type,
      'field-line_block_datetime': event.timestamp,
    }, { merge: true }).then(() => {
      functions.logger.log(event);
    }).catch((err) => {
      // 保存に失敗した際の処理
      functions.logger.log(err);
    });
  }
}


exports.webhook = functions.region(region).https.onRequest(line_wh);

/** **********************************************************************************************************
 * Firebase ユーザーIDトークン取得
 ********************************************************************************************************** */
exports.getIdToken = functions.region(region).https.onCall(async (data, context) => {
  // return data;
  const url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + process.env.FB_API_KEY;
  return await axios.post(url, {
    email   : process.env.FB_ADMIN_USER_ID,
    password: process.env.FB_ADMIN_USER_PW,
    returnSecureToken: true,
  }).then(resp => {
    return resp.data;
  }).catch(err => {
    return err;
  })
});

/** **********************************************************************************************************
 * 【定期実行処理】
 * メッセージ - 予約配信
 ********************************************************************************************************** */
exports.scheduledMessage = functions.region(region).pubsub
  .schedule('*/10 * * * *')
  .timeZone(timezone)
  .onRun(async () => {

  // --------------------------------------------------------------------------------------------

  const nowDatetime = moment().add(9, 'h').format('YYYY-MM-DD HH:mm');
  const fs = await admin.firestore()
    .collection('message')
    .where('active', '==', true)
    .where('reserve_at', '==', nowDatetime)
    .get();

  const messages = [];
  let data;
  fs.forEach(d => {
    data = d.data();
    data.id = d.id;
    messages.push(data);
  });
  functions.logger.log(`${messages.length} case applicable`);

  /** ------------------------+
   * 取得したメッセージを検証 */
  if(messages.length){
    let dataId, lineRet;
    await Promise.all(messages.map(async doc => {
      dataId = doc.id;
      delete doc.id;


      /** *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
       * 判定１
       * メッセージの条件に合うユーザーを取得
       * - 対象のユーザーIDにメッセージ送信
       *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=* */
      const customers = [];
      if (doc.collection.length) {
        /** *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
         * 判定２
         * メッセージに"text"または"json"がある
         * - 対象のユーザーIDごとにメッセージ送信
         *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=* */
        if (doc.msg_format.filter(v => ['text', 'json'].includes(v.type))) {
          for (let customer of doc.collection) {
            /** **************************************
             * ユーザー情報取得
             ************************************** */
            await admin.firestore()
              .collection('customer')
              .doc(customer)
              .get()
              .then( resp => {
                functions.logger.log(301, resp);
                functions.logger.log(302, resp.data());
                customers.push(resp.data());
              }).catch( err => functions.logger.log(301, err) );
          }

          functions.logger.log(309, customers);
          for (let customer of customers) {
            let customer_name = customer['field-name'] || customer['field-line_user_name'];
            functions.logger.log(312, customer_name);

            /** **************************************
             * メッセージフォーマットを再生成
             ************************************** */
            const msg_format = [];
            doc.msg_format.forEach(msg => {
              if (msg.type == 'json') {
                let replaced_str_format = msg.str_format.replace(/\{\{name\}\}/g, customer_name);
                msg.format = strToJson(replaced_str_format)
                msg_format.push(msg.format)
              } else if (msg.type == 'text') {
                msg.text = msg.text.replace(/\{\{name\}\}/g, customer_name);
                msg_format.push(msg);
              } else {
                msg_format.push(msg);
              }
            })

            /** **************************************
             * メッセージ送信
             ************************************** */
            lineRet = await line_client.pushMessage(customer['field-line_user_id'], msg_format, doc.notification_disabled);
            functions.logger.log(333, lineRet);
          }
        }
        /** *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
         * 判定２
         * メッセージに"text"または"json"がある
         * - 対象のユーザーIDに一斉メッセージ送信
         *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=* */
        else {
          const msg_format = [];
          for (let msg of doc.msg_format) {
            if (msg.type == 'json') {
              msg.format = this.strToJson(msg.str_format)
              msg_format.push(msg.format)
            } else {
              msg_format.push(msg)
            }
          }
          /** **************************************
           * メッセージ送信
           ************************************** */
          lineRet = await line_client.multicast(doc.collection, msg_format, doc.notification_disabled);
          functions.logger.log(346, lineRet);
        }
      }
      /** *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
       * 判定１
       * メッセージの条件に合うユーザーを取得
       * - 全ユーザーに一斉送信
       *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=* */
      else {
        const msg_format = [];
        for (let msg of doc.msg_format) {
          if (msg.type == 'json') {
            msg.format = this.strToJson(msg.str_format)
            msg_format.push(msg.format)
          } else {
            msg_format.push(msg)
          }
        }
        /** **************************************
         * メッセージ送信
         ************************************** */
        lineRet = await line_client.broadcast(msg_format, doc.notification_disabled);
        functions.logger.log(359, lineRet);
      }

      functions.logger.log(362, lineRet);

      /** **************************************
       * 送信日時を更新
       ************************************** */
      if (lineRet) await admin.firestore().doc(`message/${dataId}`).set({sended_at: nowDatetime+':00'}, { merge: true });
    }));
  }


  return null;

    // --------------------------------------------------------------------------------------------
});

/** **********************************************************************************************************
 * 【定期実行処理】
 * メッセージ - ステップ配信
 ********************************************************************************************************** */
exports.steppedMessage = functions.region(region).pubsub
  .schedule('0 * * * *')
  .timeZone(timezone)
  .onRun(async () => {

  // --------------------------------------------------------------------------------------------

  const now = moment().add(9, 'h')

  /** **************************************
   * ステップ配信メッセージを取得
   ************************************** */
  const fs01     = await admin.firestore().collection('message').where('step_timing', '!=', '').get();
  const messages = [];
  fs01.forEach(d => messages.push( d.data()) );
  functions.logger.log(`${messages.length} case applicable`);

  if (messages.length) {

    /** ------------------------+
     * 取得したメッセージを検証 */
    await Promise.all(messages.map(async doc => {
      let timing = doc.step_timing.split('-');
      let timing_day    = timing[0] || 1; // default: 1日前
      let timing_oclock = timing[1] || 8; // default: 08:00
      let target_registered_at = moment(now).subtract(timing_day, 'd').format('YYYY-MM-DD');

      /** *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
       * 判定１
       * 現在時とメッセージの送信指定時刻が同じ場合に実行
       *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=* */
      if (now.format('H') == timing_oclock) {
        /** **************************************
         * メッセージの条件に合うユーザーを取得
         ************************************** */
        let fs02 = await admin.firestore()
          .collection('customer')
          .orderBy('field-line_follow_datetime')
          .startAt(target_registered_at)
          .endAt(target_registered_at + "\uf8ff")
          .get();

        const customers = [];
        fs02.forEach(d => {
          let data = d.data();
          /** *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
           * 判定２
           * 友達登録済み・友だちの場合
           *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=* */
          if(
            data['field-line_user_id'] &&                 // LINEユーザーIDあり
            // !data['field-line_block_datetime'] &&         // ブロック歴なし
            data['field-line_follow_status'] == 'follow'  // フォロー中
          ) {
            customers.push(data);
          }
        });
        functions.logger.log(375, customers);

        for (let customer of customers) {
          let customer_name = customer['field-name'] || customer['field-line_user_name'];

          /** **************************************
           * メッセージフォーマットを再生成
           ************************************** */
          const msg_format = [];
          doc.msg_format.forEach(msg => {
            if (msg.type == 'json') {
              let replaced_str_format = msg.str_format.replace(/\{\{name\}\}/g, customer_name);
              msg.format = strToJson(replaced_str_format)
              msg_format.push(msg.format)
            } else if (msg.type == 'text') {
              msg.text = msg.text.replace(/\{\{name\}\}/g, customer_name);
              msg_format.push(msg)
            } else {
              msg_format.push(msg)
            }
          })

          let lineRet = await line_client.pushMessage(customer['field-line_user_id'], msg_format, doc.notification_disabled);
          functions.logger.log(418, JSON.stringify(lineRet));
        }
      }
    }))
    return null;
  }
  // --------------------------------------------------------------------------------------------
});


/** **********************************************************************************************************
 * 【定期実行処理】
 * 予約1日前配信
 ********************************************************************************************************** */
exports.scheduledReserve = functions.region(region).pubsub
  .schedule('0 12 * * *')
  .timeZone(timezone)
  .onRun(async () => {
    // .schedule('*/2 * * * *')
    // --------------------------------------------------------------------------------------------

    functions.logger.log(moment().format('YYYY/MM/DD HH:mm:ss'))
    functions.logger.log(moment().add(9, 'h').format('YYYY/MM/DD HH:mm:ss'))
    const today         = moment().add(9, 'h')
    const tomorrowStart = moment(today).add(1, 'days').startOf('day').valueOf()
    const tomorrowEnd   = moment(today).add(1, 'days').endOf('day').valueOf()
    const tmStYmd       = moment(tomorrowStart).format('YYYY年MM月DD日 HH:mm')
    const tmEnYmd       = moment(tomorrowEnd).format('YYYY年MM月DD日 HH:mm')


    const fs = await admin.firestore()
      .collection('schedule')
      .where('start', '>', tomorrowStart)
      .where('start', '<', tomorrowEnd)
      .get()


    const reserve_data = []
    let data
    fs.forEach(d => {
      data = d.data()
      if (data.userId) reserve_data.push(data)
    })

    if (reserve_data.length) {
      // const config = await admin.firestore().doc('setting/line').get().then(doc => {
      //   return doc.data();
      // });

      await Promise.all(reserve_data.map(async data => {
        let startDate = moment(data.start).add(9, 'h').format('YYYY年MM月DD日 HH:mm')

        let lineRet = await line_client.pushMessage(data.userId, {
          type: 'text',
          text: `明日${startDate}にご予約をいただいております。\nお気をつけてお越しください。`
        });
        // functions.logger.log(lineRet);
      }));
    }
    return null;

    // --------------------------------------------------------------------------------------------
});


function strToJson(str) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return {}
  }
}