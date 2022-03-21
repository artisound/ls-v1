source ./.env

path=`pwd`
json_path="${path}/admin/richmenu.json"
echo $json_path

# JSON書き換え（管理画面URL）
jq ".areas[0].action.uri=\"https://${DOMAIN}/\"" $json_path > tmp && mv tmp $json_path

json=`cat $json_path`
json=`echo ${json} | sed 's/ //g'` # 空白削除

# ================================
# 管理者用公式アカウント
# ================================
# リッチメニュー作成
resp=`curl -v -X POST https://api.line.me/v2/bot/richmenu \
-H "Authorization: Bearer ${LINE_ADMIN_TOKEN}" \
-H 'Content-Type: application/json' \
-d $json`
richMenuId=`echo $resp | jq ".richMenuId" | sed 's/\"//g'`
echo "richmenu: ${richMenuId}"


image_path="${path}/admin/richmenu.png"
echo $image_path
# リッチメニューの画像をアップロード
resp=`curl -v -X POST https://api-data.line.me/v2/bot/richmenu/$richMenuId/content \
-H "Authorization: Bearer ${LINE_ADMIN_TOKEN}" \
-H "Content-Type: image/jpeg" \
-T $image_path`

echo "uploaded: ${resp}"

resp=`curl -v -X POST https://api.line.me/v2/bot/user/all/richmenu/$richMenuId \
-H "Authorization: Bearer ${LINE_ADMIN_TOKEN}" \
`
echo "default setted: ${resp}"