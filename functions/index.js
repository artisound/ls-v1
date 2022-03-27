'use strict';
require('dotenv').config();
const functions = require("firebase-functions");
const admin     = require('firebase-admin');
const express   = require('express');
const moment    = require('moment');
const axios     = require('axios');
const request     = require('request');
const app       = express();
const lineApi   = require('./line_api');

const region    = 'asia-northeast2'
const timezone  = 'Asia/Tokyo'
admin.initializeApp();

/** **********************************************************************************************************
 * LINE Callback
 ********************************************************************************************************** */
async function handleEvent(event) {
  const lineMsg = new lineApi({
    url        : 'https://api.zp-ls.com/line/',
    accessToken: process.env.LINE_PUBLIC_TOKEN,
  });

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

          let ret = await lineMsg.sendReplyMessage({
            token: event.replyToken,
            messages: [
              {
                type: 'text',
                text: message,
              }
            ],
          });
          // functions.logger.log(JSON.stringify(ret, null, "\t"));

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

            let ret = await lineMsg.sendReplyMessage({
              token   : event.replyToken,
              messages: msg_format,
            });
            functions.logger.log(JSON.stringify(ret, null, "\t"));
          } else {
            let ret = await lineMsg.sendReplyMessage({
              token   : event.replyToken,
              messages: [
                {
                  type: 'text',
                  text: 'メッセージありがとうございます！\n\n \
申し訳ございませんが、送信されたメッセージについて答えできません。\n \
メッセージ文を変えて送っていただくとお答えできるかもしれません。'
                }
              ],
            });
            functions.logger.log(JSON.stringify(ret, null, "\t"));
          }
        }
        return;

      case 'image':
        return await lineMsg.sendReplyMessage({
          token   : event.replyToken,
          messages: [{
            type: 'text',
            text: '画像を受け取りました。'
          }],
        });

      case 'video':
        return await lineMsg.sendReplyMessage({
          token   : event.replyToken,
          messages: [{
            type: 'text',
            text: '動画を受け取りました。'
          }],
        });

      case 'audio':
        return await lineMsg.sendReplyMessage({
          token   : event.replyToken,
          messages: [{
            type: 'text',
            text: '音声を受け取りました。'
          }],
        });

      case 'file':
        return await lineMsg.sendReplyMessage({
          token   : event.replyToken,
          messages: [{
            type: 'text',
            text: 'ファイルを受け取りました。'
          }],
        });

      case 'location':
        return await lineMsg.sendReplyMessage({
          token   : event.replyToken,
          messages: [{
            type: 'text',
            text: '位置情報を受け取りました。'
          }],
        });

      case 'sticker':
        return await lineMsg.sendReplyMessage({
          token   : event.replyToken,
          messages: [{
            type: 'text',
            text: 'スタンプを受け取りました。'
          }],
        });

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

    // --------------------------
    // 初回友だち追加
    // --------------------------
    let ret, changeRichmenu;
    if (!customer) {
      // const init_rm = config.init_richmenu;
      // changeRichmenu = await lineMsg.linkRichmenuToUser(init_rm, event.source.userId);

      ret = await lineMsg.sendReplyMessage({
        token   : event.replyToken,
        messages: config.friend_added_message,
      });
    }
    // --------------------------
    // 友だち再登録
    // --------------------------
    else {
      ret = await lineMsg.sendReplyMessage({
        token   : event.replyToken,
        messages: config.turn_back_message,
      });
    }
    // functions.logger.log(186, changeRichmenu);
    // functions.logger.log(187, ret);

    // Firestoreにユーザーデータ登録
    await admin.firestore().collection('customer').doc(event.source.userId).set({
      'field-line_user_id'        : event.source.userId,
      'field-line_follow_status'  : event.type,
      'field-line_follow_datetime': moment.unix(event.timestamp/1000).format('YYYY-MM-DD HH:mm:ss'),
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
      'field-line_block_datetime': moment.unix(event.timestamp/1000).format('YYYY-MM-DD HH:mm:ss'),
    }, { merge: true }).then(() => {
      functions.logger.log(event);
    }).catch((err) => {
      // 保存に失敗した際の処理
      functions.logger.log(err);
    });
  }
}


exports.webhook = functions.region(region).https.onRequest(async (req, res) => {
  functions.logger.log(237, req.body)

  const events = req.body.events;
  if (events.length) {
    const event = events[0];
    await handleEvent(event)
  }
  res.json([]);
});

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
    functions.logger.log(d.id);
    messages.push(data);
  });
  functions.logger.log(`${messages.length} case applicable`);

  if(messages.length){
    // const config = await admin.firestore().doc('setting/line').get().then(doc => {
    //   return doc.data();
    // });

    const lineMsg = new lineApi({
      url        : 'https://api.zp-ls.com/line/',
      accessToken: process.env.LINE_PUBLIC_TOKEN,
    });

    let dataId, lineRet;
    await Promise.all(messages.map(async doc => {
      doc.sended_at = nowDatetime+':00';
      dataId        = doc.id;
      delete doc.id;

      const msg_format = [];
      for (let msg of doc.msg_format) {
        if (msg.type == 'json') {
          msg.format = strToJson(msg.str_format)
          msg_format.push(msg.format)
        } else {
          msg_format.push(msg)
        }
      }

      if (doc.collection.length) {
        lineRet = await lineMsg.sendMulticastMessage({
          to      : doc.collection,
          messages: msg_format,
          notificationDisabled: doc.notification_disabled,
        });
      } else {
        lineRet = await lineMsg.sendBroadcastMessage({
          messages            : msg_format,
          notificationDisabled: doc.notification_disabled,
        });
      }

      try {
        const lineKeys = Object.keys(lineRet);
        if(!lineKeys.length) {
          return await admin.firestore().doc(`message/${dataId}`).set(doc);
        }
      } catch (e) {
        functions.logger.log(e);
        return;
      }
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

  const now   = moment().add(9, 'h')

  /** **************************************
   * ステップ配信メッセージを取得
   ************************************** */
  const fs01     = await admin.firestore().collection('message').where('step_timing', '!=', '').get();
  const messages = [];
  fs01.forEach(d => messages.push( d.data()) );
  functions.logger.log(`${messages.length} case applicable`);

  if (messages.length) {

    const lineMsg = new lineApi({
      url: 'https://api.zp-ls.com/line/',
      accessToken: process.env.LINE_PUBLIC_TOKEN,
    });

    /** ------------------------+
     * 取得したメッセージを検証 */
    await Promise.all(messages.map(async doc => {
      let timing = doc.step_timing.split('-');
      let timing_day    = timing[0] || 1; // default: 1日前
      let timing_oclock = timing[1] || 8; // default: 08:00
      let target_registered_at = moment(now).subtract(timing_day, 'd').format('YYYY-MM-DD');

      /** *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
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
           * ブロック歴なし・友達登録済み・友だちの場合
           *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=* */
          if(
            data['field-line_user_id'] &&                 // LINEユーザーIDあり
            !data['field-line_block_datetime'] &&         // ブロック歴なし
            data['field-line_follow_status'] == 'follow'  // フォロー中
          ) {
            customers.push(data);
          }
        });

        for (let customer of customers) {
          let customer_name = customer['field-name'] || customer['field-line_user_name'];

          // メッセージフォーマットを再生成
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

          let lineRet = await lineMsg.sendPushMessage({
            to      : customer['field-line_user_id'],
            messages: msg_format,
            notificationDisabled: doc.notification_disabled,
          });
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
.schedule('00 12 * * *')
.timeZone(timezone)
.onRun(async context => {
    // .schedule('*/2 * * * *')
    // --------------------------------------------------------------------------------------------

    functions.logger.log(moment().format('YYYY/MM/DD HH:mm:ss'))
    functions.logger.log(moment().add(9, 'h').format('YYYY/MM/DD HH:mm:ss'))
    const today         = moment().add(9, 'h')
    const tomorrowStart = moment(today).add(1, 'days').startOf('day').valueOf()
    const tomorrowEnd   = moment(today).add(1, 'days').endOf('day').valueOf()
    const tmStYmd       = moment(tomorrowStart).format('YYYY年MM月DD日 HH:mm')
    const tmEnYmd       = moment(tomorrowEnd).format('YYYY年MM月DD日 HH:mm')


    const fs            = await admin.firestore()
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

      const lineMsg = new lineApi({
        url          : 'https://api.zp-ls.com/line/',
        accessToken  : process.env.LINE_PUBLIC_TOKEN,
      });

      let lineRet, startDate;
      await Promise.all(reserve_data.map(async data => {
        startDate = moment(data.start).add(9, 'h').format('YYYY年MM月DD日 HH:mm')

        lineRet = await lineMsg.sendPushMessage({
          to      : data.userId,
          messages: [
            {
              type: 'text',
              text: `明日${startDate}にご予約をいただいております。\nお気をつけてお越しください。`
            }
          ],
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