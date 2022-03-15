start_time=`date +%s`

# .envファイルをコピー
cp ./.env ./functions/.env

# パッケージ セットアップ
yarn install

# Firebase Functions
cd ./functions
yarn install
cd ../

# Firebase デプロイ
firebase login
firebase init

./deploy.sh

end_time=`date +%s`
run_time=$((end_time - start_time))
echo "Deployed in ${run_time}s"