'use strict';
require('dotenv').config();
const functions  = require("firebase-functions");
const admin      = require('firebase-admin');
const express    = require('express');
const moment     = require('moment');
const axios      = require('axios');
const line       = require('@line/bot-sdk');
const middleware = line.middleware;

const logger    = functions.logger;
const date      = new Date();
const region    = 'asia-northeast2';
const timezone  = 'Asia/Tokyo';

admin.initializeApp();

/** **********************************************************************************************************
 * LINE Callback
 ********************************************************************************************************** */
const line_public_config = {
  channelSecret     : process.env.LINE_PUBLIC_SECRET,
  channelAccessToken: process.env.LINE_PUBLIC_TOKEN,
};
const line_admin_config = {
  channelSecret     : process.env.LINE_ADMIN_SECRET,
  channelAccessToken: process.env.LINE_ADMIN_TOKEN,
};

const line_wh             = express();
const line_public_client  = new line.Client(line_public_config);
const line_admin_client   = new line.Client(line_admin_config);
line_wh.use(middleware(line_public_config))
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
  logger.log(event.message)
  // *********************************************************
  // メッセージイベント
  // *********************************************************
  if(event.type == 'message') {
    const profile = await line_public_client.getProfile(event.source.userId);
    //ユーザから送られた各メッセージに対する処理を実装する。
    switch (event.message.type) {
      case 'text':

        if (event.message.text == '予約確認') {
          const reseives = await admin.firestore()
            .collection('schedule')
            .where('start', '>=', event.timestamp)
            .get();

          let data;
          const arrMsg = [];
          reseives.forEach(d => {
            data = d.data();
            if (data.userId === event.source.userId) {
              arrMsg.push(moment(data.start).format('YYYY年M月D日 H:mm') + '～');
            }
          });

          let message;
          message = (arrMsg.length) ? arrMsg.join('\n') : 'ご予約はありません。'

          let ret = await line_public_client.replyMessage(event.replyToken, {
            type: 'text',
            text: message,
          })
          logger.log(JSON.stringify(ret, null, "\t"));

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
            logger.log(JSON.stringify(msg_format));

            let ret = await line_public_client.replyMessage(event.replyToken, msg_format);
            logger.log(JSON.stringify(ret, null, "\t"));
          } else {
            // LINE設定
            // const config = await admin.firestore().doc('setting/line').get().then(doc => {
            //   return doc.data();
            // });
            // const msgText = config.no_such_scenario_message || 'メッセージありがとうございます！\n\n申し訳ございませんが、送信されたメッセージについて答えできません。\nメッセージ文を変えて送っていただくとお答えできるかもしれません。';


            const config = await admin.firestore().doc(`customer/${event.source.userId}`).get().then(doc => { return doc.data() });
            const staffs = await admin.firestore().collection('staff').get().then(docs => {
              const staffs = [];
              docs.forEach(d => {
                let document = d.data();
                if (document['field-line_user_id']) staffs.push(document['field-line_user_id']);
              });
              return staffs;
            });
            logger.log(staffs);

            const user_name = config['field-line_user_name'] || profile.displayName;
            const msgText   = `From: ${user_name}\n----------\n${event.message.text}`;

            let ret = await line_admin_client.multicast(staffs, { type: 'text', text: msgText });
            logger.log(JSON.stringify(ret, null, "\t"));
          }
        }
        return;

      // case 'image':
      //   return await line_public_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: '画像を受け取りました。'
      //   });

      // case 'video':
      //   return await line_public_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: '動画を受け取りました。'
      //   });

      // case 'audio':
      //   return await line_public_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: '音声を受け取りました。'
      //   });

      // case 'file':
      //   return await line_public_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: 'ファイルを受け取りました。'
      //   });

      // case 'location':
      //   return await line_public_client.replyMessage(event.replyToken, {
      //     type: 'text',
      //     text: '位置情報を受け取りました。'
      //   });

      case 'sticker':
        const config = await admin.firestore().doc(`customer/${event.source.userId}`).get().then(doc => { return doc.data() });
        const staffs = await admin.firestore().collection('staff').get().then(docs => {
          const staffs = [];
          docs.forEach(d => {
            let document = d.data();
            if (document['field-line_user_id']) staffs.push(document['field-line_user_id']);
          });
          return staffs;
        });
        logger.log(staffs);

        const user_name = config['field-name'] || profile.displayName;
        const msgText   = `From: ${user_name}\n----------\nスタンプが届きました。`;

        let ret = await line_admin_client.multicast(staffs, { type: 'text', text: msgText });
        logger.log(ret);
        return;

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

    let ret, msgText;
    if (!customer) {
      // --------------------------
      // 初回友だち追加
      // --------------------------
      msgText = config.friend_added_message || { type: 'text', text: '友だち登録ありがとうございます！' };

      /** **************************************
       * メッセージ送信
       ************************************** */
      ret = await line_public_client.replyMessage(event.replyToken, msgText);
    } else {
      // --------------------------
      // 友だち再登録
      // --------------------------
      msgText = config.turn_back_message || { type: 'text', text: 'おかえりなさいませ！' };

      /** **************************************
       * メッセージ送信
       ************************************** */
      ret = await line_public_client.replyMessage(event.replyToken, msgText);
    }

    /** **************************************
     * メッセージログ保存
     ************************************** */
    const log = await admin.firestore().collection('msg_log').add({
      timestamp : moment().valueOf(),
      action    : '再フォロー',
      sended_to : event.source.userId,
      response  : msgText,
      message_obj: ret,
    });
    logger.log(log)

    // Firestoreにユーザーデータ登録
    const profile = await line_public_client.getProfile(event.source.userId);
    await admin.firestore().collection('customer').doc(event.source.userId).set({
      'field-line_user_id'        : event.source.userId,
      'field-line_user_name'      : profile.displayName,
      'field-line_follow_status'  : event.type,
      'field-line_language'       : profile.language,
      'field-line_picture'        : profile.pictureUrl,
      'field-line_follow_datetime': event.timestamp,
    }, { merge: true }).then(() => {
      logger.log(event);
    }).catch((err) => {
      // 保存に失敗した際の処理
      logger.log(err);
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
      logger.log(event);
    }).catch((err) => {
      // 保存に失敗した際の処理
      logger.log(err);
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
  const now   = moment().valueOf();
  const start = moment().startOf('minute');
  const end   = moment().endOf('minute');

  logger.log(start);
  logger.log(moment(start).valueOf());

  const fs  = await admin.firestore()
    .collection('message')
    .where('active', '==', true)
    .get();

  const messages = [];
  let data;
  fs.forEach(d => {
    data = d.data();
    data.id = d.id;
    if (data.reserve_at && data.reserve_at == start) messages.push(data);
  });
  logger.log(`${messages.length} case applicable`);

  /** ------------------------+
   * 取得したメッセージを検証 */
  if(messages.length){
    await Promise.all(messages.map( async msg => send_line_message(msg) ));
  }

  async function send_line_message(doc) {
    let lineRet;
    let dataId = doc.id;
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
            .then( resp => customers.push(resp.data()) )
            .catch( err => logger.log(301, err) );
        }

        for (let customer of customers) {
          let msg_format = JSON.stringify(doc.msg_format);
          msg_format = JSON.parse(msg_format);

          let customer_name = customer['field-name'] || customer['field-line_user_name'];

          /** **************************************
           * メッセージフォーマットを再生成
           ************************************** */
          const send_msg_format = [];
          msg_format.forEach(msg => {
            if (msg.type == 'json') {
              let replaced_str_format = msg.str_format.replace(/\{\{name\}\}/g, customer_name);
              msg.format = strToJson(replaced_str_format)
              send_msg_format.push(msg.format)
            } else if (msg.type == 'text') {
              msg.text = msg.text.replace(/\{\{name\}\}/g, customer_name);
              send_msg_format.push(msg)
            } else {
              send_msg_format.push(msg)
            }
          })

          /** **************************************
           * メッセージ送信
           ************************************** */
          lineRet = await line_public_client.pushMessage(customer['field-line_user_id'], send_msg_format, doc.notification_disabled);

          /** **************************************
           * メッセージログ保存
           ************************************** */
          await admin.firestore().collection('msg_log').add({
            timestamp  : moment().valueOf(),
            action     : '予約配信',
            sended_to  : customer['field-line_user_id'],
            response   : lineRet,
            message_obj: send_msg_format,
          });
          logger.log(333, lineRet);
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
        lineRet = await line_public_client.multicast(doc.collection, msg_format, doc.notification_disabled);

        /** **************************************
         * メッセージログ保存
         ************************************** */
        await admin.firestore().collection('msg_log').add({
          timestamp  : moment().valueOf(),
          action     : '予約配信',
          sended_to  : doc.collection,
          response   : lineRet,
          message_obj: msg_format,
        });
        logger.log(346, lineRet);
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
      lineRet = await line_public_client.broadcast(msg_format, doc.notification_disabled);

      /** **************************************
       * メッセージログ保存
       ************************************** */
      await admin.firestore().collection('msg_log').add({
        timestamp  : moment().valueOf(),
        action     : '予約配信',
        sended_to  : 'all_user',
        response   : lineRet,
        message_obj: msg_format,
      });
      logger.log(359, lineRet);
    }

    logger.log(362, lineRet);

    /** **************************************
     * 送信日時を更新
     ************************************** */
    if (lineRet){
      await admin.firestore().doc(`message/${dataId}`).set({sended_at: now }, { merge: true });
    }
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


  /** **************************************
   * ステップ配信メッセージを取得
   ************************************** */
  const fs01        = await admin.firestore().collection('message').where('step_timing', '!=', '').get();
  const messages    = [];
  const now_oclock  = moment().format('H');
  fs01.forEach(d => messages.push( d.data() ));
  logger.log(`${messages.length} case applicable`);

  if (messages.length) {
    /** ------------------------+
     * 取得したメッセージを検証 */
    await Promise.all(messages.map( async msg => send_line_message(msg) ));

    async function send_line_message(doc) {
      const timing = doc.step_timing.split('-');
      const timing_day    = timing[0] || 1; // default: 1日前
      const timing_oclock = timing[1] || 8; // default: 08:00
      const target_registered_start = moment().subtract(timing_day, 'd').startOf('day').valueOf();
      const target_registered_end   = moment().subtract(timing_day, 'd').endOf('day').valueOf();

      /** *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
       * 判定１
       * 現在時とメッセージの送信指定時刻が同じ場合に実行
       *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=* */
      if (now_oclock == timing_oclock) {
        /** **************************************
         * メッセージの条件に合うユーザーを取得
         ************************************** */
        let fs02 = await admin.firestore()
          .collection('customer')
          .where('field-line_follow_datetime', '>=', target_registered_start)
          .where('field-line_follow_datetime', '<=', target_registered_end)
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
          ) customers.push(data);
        });

        for (let customer of customers) {
          let msg_format = JSON.stringify(doc.msg_format);
          msg_format = JSON.parse(msg_format);

          let customer_name = customer['field-name'] || customer['field-line_user_name'];

          /** **************************************
           * メッセージフォーマットを再生成
           ************************************** */
          const send_msg_format = [];
          msg_format.forEach(msg => {
            if (msg.type == 'json') {
              let replaced_str_format = msg.str_format.replace(/\{\{name\}\}/g, customer_name);
              msg.format = strToJson(replaced_str_format)
              send_msg_format.push(msg.format)
            } else if (msg.type == 'text') {
              msg.text = msg.text.replace(/\{\{name\}\}/g, customer_name);
              send_msg_format.push(msg)
            } else {
              send_msg_format.push(msg)
            }
          })

          /** **************************************
           * メッセージ送信
           ************************************** */
          let lineRet = await line_public_client.pushMessage(customer['field-line_user_id'], send_msg_format, doc.notification_disabled);

          /** **************************************
           * メッセージログ保存
           ************************************** */
          await admin.firestore().collection('msg_log').add({
            timestamp  : moment().valueOf(),
            action     : 'ステップ配信',
            sended_to  : customer['field-line_user_id'],
            response   : lineRet,
            message_obj: send_msg_format,
          });
          // logger.log(418, JSON.stringify(lineRet));
        }
      }
    }
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
    // --------------------------------------------------------------------------------------------

    const tomorrowStart = moment().add(1, 'days').startOf('day');
    const tomorrowEnd   = moment().add(1, 'days').endOf('day');


    const fs = await admin.firestore()
      .collection('schedule')
      .where('start', '>=', moment(tomorrowStart).valueOf())
      .where('start', '<=', moment(tomorrowEnd).valueOf())
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
        let startDate = moment(data.start).format('YYYY年MM月DD日 HH:mm')

        /** **************************************
         * メッセージ送信
         ************************************** */
        const msg_format = [{
          type: 'text',
          text: `明日${startDate}にご予約をいただいております。\nお気をつけてお越しください。`
        }];
        let lineRet = await line_public_client.pushMessage(data.userId, msg_format);

        /** **************************************
         * メッセージログ保存
         ************************************** */
        await admin.firestore().collection('msg_log').add({
          timestamp  : moment().valueOf(),
          action     : '予約1日前配信',
          sended_to  : data.userId,
          response   : lineRet,
          message_obj: msg_format,
        });
        // logger.log(lineRet);
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