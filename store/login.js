export const strict = false
export const state = () => ({
  fbLogin: null,  // ログイン状態
})

export const mutations = {
  statusLogin ( state, data ) {
    state.fbLogin = data;   // ログイン情報更新
  }
}