start_time=`date +%s`

# パッケージ セットアップ
yarn install

# Firebase Functions
cd ./functions
yarn install
cd ../

if [ $# = 1 ]; then
    echo "Only $1 deploy"
  if [ $1 = "hosting" ]; then
    yarn generate
  fi

  firebase deploy --only $1
else
  echo "Full deploy"
  yarn generate
  firebase deploy
fi

end_time=`date +%s`
run_time=$((end_time - start_time))
echo "Deployed in ${run_time}s"