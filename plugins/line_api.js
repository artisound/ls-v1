import axios from 'axios'
import moment from 'moment'


/** +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  LINE Messaging API処理
 * ooooo        ooooo ooooo      ooo oooooooooooo   ooo        ooooo                             .o.       ooooooooo.   ooooo
 * `888'        `888' `888b.     `8' `888'     `8   `88.       .888'                            .888.      `888   `Y88. `888'
 *  888          888   8 `88b.    8   888            888b     d'888   .oooo.o  .oooooooo       .8"888.      888   .d88'  888
 *  888          888   8   `88b.  8   888oooo8       8 Y88. .P  888  d88(  "8 888' `88b       .8' `888.     888ooo88P'   888
 *  888          888   8     `88b.8   888    "       8  `888'   888  `"Y88b.  888   888      .88ooo8888.    888          888
 *  888       o  888   8       `888   888       o    8    Y     888  o.  )88b `88bod8P'     .8'     `888.   888          888
 * o888ooooood8 o888o o8o        `8  o888ooooood8   o8o        o888o 8""888P' `8oooooo.    o88o     o8888o o888o        o888o
 *                                                                            d"     YD
 * https://patorjk.com/software/taag/#p=display&f=Roman                       "Y88888P'
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

export class lineMsgApi {
  /** *************************************************************************************
   * 初期設定
   * --------------------------------------------------------------------------------------
   * @param {string} params.url - リクエスト送信先URL
   * @param {string} params.dbInfo - DB設定情報
   * @param {string} params.method - リクエストメソッド
   * @param {string} params.dataType - レスポンスデータタイプ
   ************************************************************************************* */
  constructor(params) {
    this.url           = params.url;
    this.accessToken   = params.accessToken;
  }

  /** *************************************************************************************
   * 実行
   * @param {Object} data - 送信データオブジェクト
   ************************************************************************************* */
  async axios_execution(data) {
    return await axios.post(this.url, {
      data         : data,
      action       : this.action,
      accessToken  : this.accessToken,
    }).then(resp => {
      // console.log(resp);
      if (resp.status === 200) {
        return resp.data;
      } else {
        console.error(resp)
        return resp;
      }
    }).catch(error => {
      console.error(error);
    });
  }


  /** +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * メッセージ
   * ooo        ooooo
   * `88.       .888'
   *  888b     d'888   .ooooo.   .oooo.o  .oooo.o  .oooo.    .oooooooo  .ooooo.
   *  8 Y88. .P  888  d88' `88b d88(  "8 d88(  "8 `P  )88b  888' `88b  d88' `88b
   *  8  `888'   888  888ooo888 `"Y88b.  `"Y88b.   .oP"888  888   888  888ooo888
   *  8    Y     888  888    .o o.  )88b o.  )88b d8(  888  `88bod8P'  888    .o
   * o8o        o888o `Y8bod8P' 8""888P' 8""888P' `Y888""8o `8oooooo.  `Y8bod8P'
   *                                                        d"     YD
   *                                                        "Y88888P'
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  /** ===========================================================================
   * プッシュメッセージ
   * ----------------------------------------------------------------------------
   * @param {string} params.to      - 【必須】ユーザーID（グループID）
   * @param {array} params.messages - 【必須】メッセージボディ
   * @param {boolean} params.notificationDisabled - 通知無効
   =========================================================================== */
  async sendPushMessage(params) {
    this.action = 'sendPushMessage';
    return await this.axios_execution({
      to      : params.to,
      messages: params.messages,
      notificationDisabled: params.notificationDisabled || false,
    });
  }

  /** ===========================================================================
   * マルチキャストメッセージ
   * ----------------------------------------------------------------------------
   * @param {array} params.to       - 【必須】ユーザーID（グループID）
   * @param {array} params.messages - 【必須】メッセージボディ
   * @param {boolean} params.notificationDisabled - 通知無効
   =========================================================================== */
  async sendMulticastMessage(params) {
    this.action = 'sendMulticastMessage';
    return await this.axios_execution({
      to      : params.to,
      messages: params.messages,
      notificationDisabled: params.notificationDisabled || false,
    });
  }

  /** ===========================================================================
   * ブロードキャストメッセージ
   * ----------------------------------------------------------------------------
   * @param {Object} params.messages - 【必須】メッセージボディ
   * @param {boolean} params.notificationDisabled - 通知無効
   =========================================================================== */
  async sendBroadcastMessage(params) {
    this.action = 'sendBroadcastMessage';
    return await this.axios_execution({
      messages: params.messages,
      notificationDisabled: params.notificationDisabled || false,
    });
  }
  /** ===========================================================================
   * 当月のメッセージ数取得
   * - 無料枠のリプライメッセージ数は除く
   * ----------------------------------------------------------------------------
   * @param {number} date - 前日の日付(8桁)
   =========================================================================== */
  async getMessageQuotaConsumption(date = null) {
    date = date || moment().subtract(1, 'days').format('YYYYMMDD')
    console.log(date)

    this.action = 'getMessageQuotaConsumption';
    return await this.axios_execution({ date: date });
  }



  /** +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * 分析
   * ooooo                       o8o             oooo            .
   * `888'                       `"'             `888          .o8
   *  888  ooo. .oo.    .oooo.o oooo   .oooooooo  888 .oo.   .o888oo
   *  888  `888P"Y88b  d88(  "8 `888  888' `88b   888P"Y88b    888
   *  888   888   888  `"Y88b.   888  888   888   888   888    888
   *  888   888   888  o.  )88b  888  `88bod8P'   888   888    888 .
   * o888o o888o o888o 8""888P' o888o `8oooooo.  o888o o888o   "888"
   *                                  d"     YD
   *                                  "Y88888P'
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  /** ===========================================================================
   * メッセージ数取得
   * ----------------------------------------------------------------------------
   * @param {number} date - 前日の日付(8桁)
   =========================================================================== */
  async getMessagesForMonth(date = null) {
    date = date || moment().subtract(1, 'days').format('YYYYMMDD')
    console.log(date)

    this.action = 'getNumberOfMessagesForMonth';
    return await this.axios_execution({ date: date });
  }

  /** ===========================================================================
   * 友だち数を取得
   * ----------------------------------------------------------------------------
   * @param {number} date - 前日までの日付(8桁)
   =========================================================================== */
  async getFollowers(date = null) {
    date = date || moment().subtract(1, 'days').format('YYYYMMDD'),

    this.action = 'getNumberOfFollowers';
    return await this.axios_execution({ date: date });
  }


  /** +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * ユーザー
   * ooooo     ooo
   * `888'     `8'
   *  888       8   .oooo.o  .ooooo.  oooo d8b
   *  888       8  d88(  "8 d88' `88b `888""8P
   *  888       8  `"Y88b.  888ooo888  888
   *  `88.    .8'  o.  )88b 888    .o  888
   *    `YbodP'    8""888P' `Y8bod8P' d888b
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  /** ===========================================================================
   * ユーザープロフィール情報を取得
   * ----------------------------------------------------------------------------
   * @param {string} userId - 【必須】前日までの日付
   =========================================================================== */
  async getUserProfile(userId) {
    this.action = 'getUserProfile';
    return await this.axios_execution({
      userId: userId,
    });
  }

  /** ===========================================================================
   * LINE公式アカウントを友だち追加したユーザーのリストを取得
   * ----------------------------------------------------------------------------
   * @param {number} limit - 取得したいユーザー数（Max:1000）
   * @param {string} start - 継続トークン値
   =========================================================================== */
  async getUsers(limit, start) {
    this.action = 'getUsers';
    return await this.axios_execution({
      limit : limit,
      start : start,
    });
  }


  /** +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * oooooooooo.                .
   * `888'   `Y8b             .o8
   *  888     888  .ooooo.  .o888oo
   *  888oooo888' d88' `88b   888
   *  888    `88b 888   888   888
   *  888    .88P 888   888   888 .
   * o888bood8P'  `Y8bod8P'   "888"
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  /** ===========================================================================
   * ボット情報を取得
   =========================================================================== */
  async getBotInfo() {
    this.action = 'getBotInfo';
    return await this.axios_execution({
    });
  }


  /** +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   *   .oooooo.
   *  d8P'  `Y8b
   * 888           oooo d8b  .ooooo.  oooo  oooo  oo.ooooo.
   * 888           `888""8P d88' `88b `888  `888   888' `88b
   * 888     ooooo  888     888   888  888   888   888   888
   * `88.    .88'   888     888   888  888   888   888   888
   *  `Y8bood8P'   d888b    `Y8bod8P'  `V88V"V8P'  888bod8P'
   *                                               888
   *                                              o888o
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  /** ===========================================================================
   * グループ情報を取得
   * ----------------------------------------------------------------------------
   * @param {string} groupId - 【必須】グループID
   =========================================================================== */
  async getGroupInfo(groupId) {
    this.action = 'getGroupInfo';
    return await this.axios_execution({
      groupId: groupId,
    });
  }

  /** ===========================================================================
   * グループに参加しているユーザーの人数を取得
   * ----------------------------------------------------------------------------
   * @param {string} groupId - 【必須】グループID
   =========================================================================== */
  async getNumberOfUsersInGroup(groupId) {
    this.action = 'getNumberOfUsersInGroup';
    return await this.axios_execution({
      groupId: groupId,
    });
  }

  /** ===========================================================================
   * グループメンバーのユーザーIDを取得
   * ----------------------------------------------------------------------------
   * @param {string} groupId - 【必須】グループID
   =========================================================================== */
  async getUserIdsInGroup(groupId) {
    this.action = 'getNumberOfUsersInGroup';
    return await this.axios_execution({
      groupId: groupId,
    });
  }

  /** ===========================================================================
   * グループメンバーのプロフィール情報を取得
   * ----------------------------------------------------------------------------
   * @param {string} groupId - 【必須】グループID
   * @param {string} userId - 【必須】ユーザーID
   =========================================================================== */
  async getUserProfileInGroup(groupId) {
    this.action = 'getNumberOfUsersInGroup';
    return await this.axios_execution({
      groupId: groupId,
    });
  }

  /** ===========================================================================
   * グループから退出
   * ----------------------------------------------------------------------------
   * @param {string} groupId - 【必須】グループID
   =========================================================================== */
  async leaveFromGroup(groupId) {
    this.action = 'leaveFromGroup';
    return await this.axios_execution({
      groupId: groupId,
    });
  }


  /** +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   * ooooooooo.    o8o            oooo
   * `888   `Y88.  `"'            `888
   *  888   .d88' oooo   .ooooo.   888 .oo.   ooo. .oo.  .oo.    .ooooo.  ooo. .oo.   oooo  oooo
   *  888ooo88P'  `888  d88' `"Y8  888P"Y88b  `888P"Y88bP"Y88b  d88' `88b `888P"Y88b  `888  `888
   *  888`88b.     888  888        888   888   888   888   888  888ooo888  888   888   888   888
   *  888  `88b.   888  888   .o8  888   888   888   888   888  888    .o  888   888   888   888
   * o888o  o888o o888o `Y8bod8P' o888o o888o o888o o888o o888o `Y8bod8P' o888o o888o  `V88V"V8P'
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  /** ===========================================================================
   * リッチメニュー作成
   * ----------------------------------------------------------------------------
   * @param {string} menuObj - 【必須】リッチメニューオブジェクト
   =========================================================================== */
  async createRichmenu(menuObj) {
    this.action = 'createRichmenu';
    return await this.axios_execution({
      format: menuObj
    });
  }

  /** ===========================================================================
   * リッチメニューの画像をアップロード
   * ----------------------------------------------------------------------------
   * @param {string} image - 【必須】リッチメニュー画像
   =========================================================================== */
  async uploadRichmenuImage(param) {
    this.action = 'uploadRichmenuImage';
    return await this.axios_execution(param);
  }

  /** ===========================================================================
   * リッチメニュー画像をダウンロード
   * ----------------------------------------------------------------------------
   * @param {string} richMenuId - 【必須】リッチメニューID
   =========================================================================== */
  async getRichmenuImage(richMenuId) {
    this.action = 'getRichmenuImage';
    return await this.axios_execution({
      richMenuId: richMenuId,
    });
  }

  /** ===========================================================================
   * リッチメニューを取得
   * ----------------------------------------------------------------------------
   * @param {string} richMenuId - 【必須】リッチメニューID
   =========================================================================== */
  async getRichmenu(richMenuId) {
    this.action = 'getRichmenu';
    return await this.axios_execution({
      richMenuId: richMenuId,
    });
  }

  /** ===========================================================================
   * リッチメニューの配列を取得
   =========================================================================== */
  async getRichmenuList() {
    this.action = 'getRichmenuList';
    return await this.axios_execution();
  }

  /** ===========================================================================
   * リッチメニュー削除
   * ----------------------------------------------------------------------------
   * @param {string} richMenuId - 【必須】リッチメニューID
   =========================================================================== */
  async deleteRichmenu(richMenuId) {
    this.action = 'deleteRichmenu';
    return await this.axios_execution({
      richMenuId: richMenuId,
    });
  }

  /** ===========================================================================
   * デフォルトリッチメニュー設定
   * ----------------------------------------------------------------------------
   * @param {string} richMenuId - 【必須】リッチメニューID
   =========================================================================== */
  async setDefaultRichmenu(richMenuId) {
    this.action = 'setDefaultRichmenu';
    return await this.axios_execution({
      richMenuId: richMenuId,
    });
  }

  /** ===========================================================================
   * デフォルトリッチメニューIDを取得
   =========================================================================== */
  async getDefaultRichmenu() {
    this.action = 'getDefaultRichmenu';
    return await this.axios_execution();
  }

  /** ===========================================================================
   * デフォルトのリッチメニューを解除
   * ----------------------------------------------------------------------------
   * @param {string} richMenuId - 【必須】リッチメニューID
   =========================================================================== */
  async deleteDefaultRichmenu(richMenuId) {
    this.action = 'deleteDefaultRichmenu';
    return await this.axios_execution({
      richMenuId: richMenuId,
    });
  }

  /** ===========================================================================
   * リッチメニューとユーザーをリンク
   * ----------------------------------------------------------------------------
   * @param {string} richMenuId - 【必須】リッチメニューID
   * @param {string} userId - 【必須】ユーザーID
   =========================================================================== */
  async linkRichmenuToUser(richMenuId, userId) {
    this.action = 'linkRichmenuToUser';
    return await this.axios_execution({
      userId    : userId,
      richMenuId: richMenuId,
    });
  }

  /** ===========================================================================
   * リッチメニューと複数のユーザーをリンク
   * ----------------------------------------------------------------------------
   * @param {string} richMenuId - 【必須】リッチメニューID
   * @param {array} userIds - 【必須】ユーザーIDの配列
   =========================================================================== */
  async linkRichmenuToUsers(richMenuId, userIds) {
    this.action = 'linkRichmenuToUsers';
    return await this.axios_execution({
      userIds   : userIds,
      richMenuId: richMenuId,
    });
  }


  /** +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   *       .o.                                                                 .        oooo   o8o              oooo
   *      .888.                                                              .o8        `888   `"'              `888
   *     .8"888.      .ooooo.   .ooooo.   .ooooo.  oooo  oooo  ooo. .oo.   .o888oo       888  oooo  ooo. .oo.    888  oooo
   *    .8' `888.    d88' `"Y8 d88' `"Y8 d88' `88b `888  `888  `888P"Y88b    888         888  `888  `888P"Y88b   888 .8P'
   *   .88ooo8888.   888       888       888   888  888   888   888   888    888         888   888   888   888   888888.
   *  .8'     `888.  888   .o8 888   .o8 888   888  888   888   888   888    888 .       888   888   888   888   888 `88b.
   * o88o     o8888o `Y8bod8P' `Y8bod8P' `Y8bod8P'  `V88V"V8P' o888o o888o   "888"      o888o o888o o888o o888o o888o o888o
   * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
  /** ===========================================================================
   * 連携トークンを発行する
   * ----------------------------------------------------------------------------
   * @param {string} userId - 【必須】ユーザーID
   =========================================================================== */
  async createLinkToken(userId) {
    this.action = 'createLinkToken';
    return await this.axios_execution({
      userId: userId,
    });
  }
}
