// ===================================================================================================
// JS 共通関数
//
// ・ 設定ファイル読み込み
// ・ cryptoJS 文字列暗号化・復号化
// ・ LIFF情報を取得（LIFF v2）
// ・ 年齢と年代を算出
// ・ 郵便番号にハイフンを自動挿入するメソッド
// ・ URLパラメータ（クエリ文字列）取得
// ・ URLパラメータ記号部分変換
// ・ 【GoogleGeocodingAPI】郵便番号から住所取得
// ・ JSON文字列判定
// ・ 文字列変換（大文字、小文字、一文字目大文字）
// ・ 日付計算（加算・減算）
// ===================================================================================================


/** **************************************************************************
 * 設定ファイル読み込み
 * @returns {Object}
 ************************************************************************** */
async function getConfigJson() {
    // let configJson = await $.getJSON('../_src/json/config.json', data => { return data });
    let configJson = await fetch('../_src/json/config.json').then(response => {
        return response.json();
    }).then((data) => {
        return data;
    }).catch((e) => {
        console.log(e);
    });
    return configJson;
}



/** **************************************************************************
 * cryptoJS 文字列暗号化・復号化(AES-256-CBC)
 * @param {string} string - 指定の環境のディレクトリ
 * @param {string} mode - 'enc':暗号化 | 'dec': 復号化
 * @return {object} - 復号された設定情報
 ************************************************************************** */
function cryptoJSencdec(string, passphrase, mode = 'enc') {
    // 暗号化・復号化処理
    const CryptoJSAes = {
        stringify: function (cipherParams) {
            let j = [cipherParams.ciphertext.toString(CryptoJS.enc.Base64)];
            if (cipherParams.iv) j.push(cipherParams.iv.toString());
            if (cipherParams.salt) j.push(cipherParams.salt.toString());
            return j.join('-');
        },
        parse: function (jsonStr) {
            let j = jsonStr.split('-');
            let cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(j[0]) });
            if (j[1]) cipherParams.iv = CryptoJS.enc.Hex.parse(j[1]);
            if (j[2]) cipherParams.salt = CryptoJS.enc.Hex.parse(j[2]);
            return cipherParams;
        }
    }

    let ret;
    if (mode == 'dec') {
        // 復号化
        ret = CryptoJS.AES.decrypt(string, passphrase, { format: CryptoJSAes }).toString(CryptoJS.enc.Utf8);
    } else {
        // 暗号化
        ret = CryptoJS.AES.encrypt(string, passphrase, { format: CryptoJSAes }).toString();
    }

    return ret;
}


/** **************************************************************************
 * LIFF情報を取得（LIFF v2を使用）
 * - LINEユーザーID、表示名、プロフィール画像URL、ステータスメッセージ、OS、言語、LINEバージョン
 * @param {string} liffId - LINNE Login LIFF ID
 * @param {string} url - ログイン後に遷移するURL
 * @returns {Object}
 ************************************************************************** */
async function getLiffInfo(liffId, url = null) {
    let liffInfo = await liff.init({ liffId: liffId }).then(() => {
        if (liff.isLoggedIn()) {
            // OS、使用言語、LINEバージョンを取得
            return {
                os: liff.getOS(),
                language: liff.getLanguage(),
                lineVersion: liff.getLineVersion()
            };
        } else {
            if (url) {
                liff.login({ redirectUri: url });
            } else {
                liff.login();
            }
        }
    }).catch((err) => { console.log(err); });

    if (liffInfo) {
        // ユーザープロフィール取得
        let liffUser = await liff.getProfile().then(function (profile) {
            return profile;
        });

        // 端末情報とユーザープロフィール情報を統合
        return Object.assign(liffInfo, liffUser);
    }
}




/** **************************************************************************
 * 年齢と年代を算出
 * @typedef {Object} yourBirthDay - 年月日オブジェクト
 * @property {number} year - 年
 * @property {number} month - 月
 * @property {number} date - 日
 * @param yourBirthDay
 * @returns {Object} - 年齢・年代オブジェクト
 ************************************************************************** */
function getAgeAndRoundage(yourBirthDay) {

    let aryRet = { age: "", roundAge: "" };

    yourBirthDay.year = yourBirthDay.year.toString(10);
    yourBirthDay.month = yourBirthDay.month.toString(10);
    yourBirthDay.date = yourBirthDay.date.toString(10);

    // 末尾に"年","月","日"があれば削除
    yourBirthDay.year = (yourBirthDay.year.endsWith('年')) ? yourBirthDay.year.replace(/年/g, '') : yourBirthDay.year;
    yourBirthDay.month = (yourBirthDay.month.endsWith('月')) ? yourBirthDay.month.replace(/月/g, '') : yourBirthDay.month;
    yourBirthDay.date = (yourBirthDay.date.endsWith('日')) ? yourBirthDay.date.replace(/日/g, '') : yourBirthDay.date;

    // 年月日入力時
    //  - 年齢を算出
    let today = new Date();
    if (!yourBirthDay.month) { yourBirthDay.month = today.getMonth() + 1; }
    if (!yourBirthDay.date) { yourBirthDay.date = today.getDate(); }

    // Dateインスタンスに変換
    let birthDate = new Date(yourBirthDay.year, yourBirthDay.month - 1, yourBirthDay.date);

    // 文字列に分解
    let y2 = birthDate.getFullYear().toString().padStart(4, '0');
    let m2 = (birthDate.getMonth() + 1).toString().padStart(2, '0');
    let d2 = birthDate.getDate().toString().padStart(2, '0');

    // 今日の日付
    let y1 = today.getFullYear().toString().padStart(4, '0');
    let m1 = (today.getMonth() + 1).toString().padStart(2, '0');
    let d1 = today.getDate().toString().padStart(2, '0');


    // 引き算
    let age = Math.floor((Number(y1 + m1 + d1) - Number(y2 + m2 + d2)) / 10000);

    // 年代を計算
    let round_age = Math.floor(age / 10) * 10;	// 10の位切り捨て
    if (round_age >= 10 && round_age < 110) {
        round_age += "代";
    } else {
        round_age = "";
    }

    if (!yourBirthDay.month || !yourBirthDay.date) {
        age = "";
    }
    aryRet['age'] = age;
    aryRet['roundAge'] = round_age;

    return aryRet;
}


/** **************************************************************************
 * 経過年・月・日数の計算
 * @param {Date} dt1 - new Dateで取得した開始年月日の Date オブジェクト
 * @param {Date} dt2 - new Dateで取得した終了年月日の Date オブジェクト
 * @param {String} u
 *                   - 'Y': 経過年数を求める
 *                   - 'M': 経過月数を求める
 *                   - 'D': 経過日数を求める
 *                   - 'YM': 1年に満たない月数
 *                   - 'MD': 1ヶ月に満たない日数
 *                   - 'YD': 1年に満たない日数
 * @param {Boolean} f
 *                   - true: 初日算入
 *                   - false: 初日不算入
 * @return - 第三引数で指定したパラメータを元に出力
 ************************************************************************** */
function dateDiff(dt1, dt2 = new Date, u = 'D', f = null) {
    if (f) dt1 = dateAdd(dt1, -1, 'D');
    let y1 = dt1.getFullYear();
    let m1 = dt1.getMonth();
    let y2 = dt2.getFullYear();
    let m2 = dt2.getMonth();
    let dt3, r = 0;

    switch (u) {
        case 'D':
            r = parseInt((dt2 - dt1) / (24 * 3600 * 1000));
            break;
        case 'M':
            r = (y2 * 12 + m2) - (y1 * 12 + m1);
            dt3 = dateAdd(dt1, r, 'M');
            if (dateDiff(dt3, dt2, 'D') < 0) {
                --r;
            }
            break;
        case 'Y':
            r = parseInt(dateDiff(dt1, dt2, 'M') / 12);
            break;
        case 'YM':
            r = dateDiff(dt1, dt2, 'M') % 12;
            break;
        case 'MD':
            r = dateDiff(dt1, dt2, 'M');
            dt3 = dateAdd(dt1, r, 'M');
            r = dateDiff(dt3, dt2, 'D');
            break;
        case 'YD':
            r = dateDiff(dt1, dt2, 'Y');
            dt3 = dateAdd(dt1, r * 12, 'M');
            r = dateDiff(dt3, dt2, 'D');
            break;
    }


    function dateAdd(dt, dd, u) {
        var y = dt.getFullYear();
        var m = dt.getMonth();
        var d = dt.getDate();
        var r = new Date(y, m, d);
        if (typeof u == 'undefined' || u == 'D') {
            r.setDate(d + dd);
        } else if (u == 'M') {
            m += dd;
            y += parseInt(m / 12);
            m %= 12;
            var e = (new Date(y, m + 1, 0)).getDate();
            r.setFullYear(y, m, (d > e ? e : d));
        }
        return r;
    };


    return r;
};



/** **************************************************************************
 * 郵便番号にハイフンを自動挿入するメソッド
 * - https://qiita.com/ozackiee/items/85bb545d02f7049ab1b4
 * @param {number} value - 数値のみの郵便番号
 * @returns {string} - ハイフン付きの郵便番号
 ************************************************************************** */
function insertHyphenForZipcode(value) {
    let ret = "";
    let addr = value.replace(/-/g, "");

    if (addr.length > 3) {
        ret = addr.slice(0, 3) + '-' + addr.slice(3, addr.length);
        if (ret == "-") { ret = ""; }
        return ret;
    } else {
        return addr;
    }
}


/** **************************************************************************
 * URLパラメータ（クエリ文字列）取得
 * @param {string} name - URLパラメータのキー
 * @param {string} url - 指定のURL
 * @returns {string} - URLパラメータの値
 ************************************************************************** */
function getParam(name, url) {
    url = url || window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


/** **************************************************************************
 * URLパラメータ記号部分変換
 * %3F：? | %3D：= | %26：&
 * @param {string} url - 変換したいURL
 * @returns {string} - 変換されたURL
 ************************************************************************** */
function urlDecode(url) {
    url = url || window.location.href;
    let urlDec;
    if (url.indexOf('%3F') > 0 || url.indexOf('%3D') > 0 || url.indexOf('%26') > 0) {
        urlDec = url.replace(/%3F/g, '?').replace(/%3D/g, '=').replace(/%26/g, '&');
        return urlDec;
    } else {
        return url;
    }
}



// ============================================================================================
// 現在地
// ============================================================================================
/** **************************************************************************
 * 【BingMapsAPI】緯度経度から住所取得
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @returns {Object} - 住所
 ************************************************************************** */
async function getAddressByLatlng(lat, lng, apiKey) {
    // BingMap Location APIで緯度経度から住所取得
    let url = `https://dev.virtualearth.net/REST/v1/Locations/${lat},${lng}?c=ja-jp&key=${apiKey}`;

    let address = await $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json'
    }).then(function (resp) {
        return {
            name: resp['resourceSets'][0]['resources'][0]['name'],
            address: resp['resourceSets'][0]['resources'][0]['address'],
        };
    }).catch(function (err) { console.log(err); });

    // 住所を出力
    return address;
}


/** ****************************************************************
 * 【GoogleGeocodingAPI】郵便番号から住所取得
 * @param {string} zipCode - 郵便番号（ハイフンあってもなくてもおｋ）
 * @param {string} apiKey - GoogleGeocodingAPIキー
 * @returns {Object} - 住所
***************************************************************** */
async function getAddressByZipcodeFromGmap(zipCode, apiKey, full = false) {
    let url = 'https://maps.googleapis.com/maps/api/geocode/json';
    let query_params = new URLSearchParams({
        key: apiKey,
        address: zipCode,
        language: 'ja'
    });

    let address = await fetch(`${url}?${query_params}`).then(response => {
        return response.json();
    }).then((resp) => {
        console.log(resp)
        if (resp.status == 'OK') {
            return (full) ? resp.results[0] : resp.results[0].address_components.reverse();
        }
    }).catch((e) => {
        console.log(e);
        // console.log({ 'Message': '住所が取得できませんでした' })
        return [];
    });

    // 住所を出力
    return address;
}



/** ****************************************************************
 * GPSから緯度経度座標取得
 * @returns {Object} - 緯度経度
***************************************************************** */
async function getLatLng(elId) {
    // 位置情報許可時
    if (navigator.geolocation) {
        // 位置情報取得
        let position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // 位置情報取得時
        if (position.coords) {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;

            showGoogleMap(elId, lat, lng);

            // 戻り値に緯度経度を指定
            return { lat: lat, lng: lng };
        }
    } else {
        failGetGPS();
        return false;
    }
}


/** ****************************************************************
 * GoogleMap表示（GoogleMapsAPI使用）
 * @param {string} elId - 要素ID
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
***************************************************************** */
function showGoogleMap(elId, lat, lng) {

    // マップ表示
    let latLng = new google.maps.LatLng(lat, lng);
    let map = new google.maps.Map(document.getElementById(elId), {
        center: latLng,
        zoom: 18,
        disableDefaultUI: true,
        draggable: false,
    });

    // マップにスタイルを適用
    let mapEl = document.getElementById(elId);
    mapEl.style.padding = 0;
    mapEl.style.margin = '0 10px';
    mapEl.style.width = 'calc(100% - 20px)';
    mapEl.style.height = '250px';
    mapEl.style.boxSizing = 'border-box';


    // マーカー表示
    new MarkerWithLabel({
        position: latLng,
        clickable: true,
        draggable: false,
        map: map,
        labelContent: '現在地',
        labelAnchor: new google.maps.Point(-21, 3),
        labelClass: 'gmap_marker_label',
        labelStyle: { opacity: 1.0 },
    });
}


/** ****************************************************************
 * GPS情報取得失敗時のアラートおよびテキスト表示
***************************************************************** */
function failGetGPS() {
    // アラートプラグイン発火
    Swal.fire({
        icon: 'error',
        text: 'GPSが許可されていないため、損傷箇所の報告ができません。',
    });

    $('#vue-app').hide();
    $('#button-area').children().hide();
    $('#button-area').children().eq(2).show();
    $('.conf-area').show();
    $('.conf-area p').text('GPSが許可されていないため、損傷場所等の報告ができません。');
}

/** ****************************************************************
 * JSON文字列判定
***************************************************************** */
function isJsonStr(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false
    }
}



/** ****************************************************************
 * 文字列変換（大文字、小文字、一文字目大文字）
 * @param {string} string - 英文字列
 * @param {string} type - allUpper | allLower | firstUpper
 * @returns {string} - 変換後文字列
 ***************************************************************** */
function convertStringCase(string, type) {
    switch (type) {
        case 'allUpper':
            return string.toUpperCase();
        case 'allLower':
            return string.toLowerCase();
        case 'firstUpper':
            return string.slice(0, 1).toUpperCase() + string.slice(1);
    }
}


/** ************************************************************************
 * 日付計算（加算・減算）
 * @param {number} y - 年
 * @param {number} m - 月
 * @param {number} d - 日
 * @param {boolean} plus - true：加算 | false：減算
 * @returns MySQL日付フォーマット
 ************************************************************************ */
function createDateFormat(y = 0, m = 0, d = 0, plus = true) {
    let now = luxon.DateTime.now();
    let year, month, day;
    // 加算
    if (plus) {
        year = (y > 0) ? now.plus({ years: y }) : now.plus({ years: 0 });
        month = (m > 0) ? year.plus({ months: m }) : year.plus({ months: 0 });
        day = (d > 0) ? month.plus({ days: d }) : month.plus({ days: 0 });
    }
    // 減産
    else {
        year = (y > 0) ? now.minus({ years: y }) : now.minus({ years: 0 });
        month = (m > 0) ? year.minus({ months: m }) : year.minus({ months: 0 });
        day = (d > 0) ? month.minus({ days: d }) : month.minus({ days: 0 });
    }
    return day.toFormat('yyyy-MM-dd HH:mm:ss');
}