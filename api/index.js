'use strict';

const http = require('http');
const crypto = require('crypto');
const axios = require('axios');

const BASE_URL        = 'https://api.line.me';
const USER_ID         = 'Ua1604bd7353af39fd409b3a64c5b5f00'
const REPLY_PATH      = '/v2/bot/message/push';//リプライ用
const CH_SECRET       = '981de084d60af92347bd5591cc245729'; //Channel Secretを指定
const CH_ACCESS_TOKEN = 'oUSINwlxxXsDho11nn7G5htK4kdyubWaTdRVNhcyeGJ7j/hAP35Nf1/3prAYyKJSimxgC8rgv/+RAlJczunR0jW70YU4dZENkULS+IhN7Dages/dnWBSYxg3egCd2Y/p0SyX9mLh3mGOA06YRKt67gdB04t89/1O/w1cDnyilFU='; //Channel Access Tokenを指定
const SIGNATURE       = crypto.createHmac('sha256', CH_SECRET);
const PORT            = 3000;

http.createServer((req, res) => {
  if (req.url !== '/' || req.method !== 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('hello');
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    if (body === '') {
      console.log('bodyが空です。');
      return;
    }

    const sendMessageObject = [{
      type: 'text',
      text: WebhookEventObject.message.text
    }];

    axios.request({
      method: 'post',
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Line-Signature': SIGNATURE,
        'Authorization': `Bearer ${CH_ACCESS_TOKEN}`
      },
      url: REPLY_PATH,
      data: { to: USER_ID, messages: sendMessageObject },
    }).then((res) => {
      console.log(res.status);
    }).catch((error) => {
      console.log(error);
    });

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('success');
  });
}).listen(PORT);