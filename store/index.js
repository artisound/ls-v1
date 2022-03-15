import { signOut, setPersistence, signInWithEmailAndPassword, browserSessionPersistence } from 'firebase/auth'
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from '~/plugins/firebase.js'

export const strict = false

export const state = () => ({
    user: null,
})

export const mutations = {
  setUser(state, payload) {
    state.user = payload
  }
}

export const actions = {
  // signUp({ commit }, { email, password }) {
  //     return createUserWithEmailAndPassword(email, password)
  // },

  async signInWithEmail({ commit }, { email, password }) {
    // await setPersistence(auth, browserSessionPersistence).then(async () => {
    const login = await signInWithEmailAndPassword(auth, email, password);
    console.log(login)
    if(login.user) {
      const uid = login.user.uid

      const q   = query(collection(db, 'staff'), where('field-uid', '==', uid));
      const qs  = await getDocs(q);

      const staff = {};
      if (!login.user.email.startsWith('admin@')) {
        qs.forEach(d => staff[d.id] = d.data() );

        if (!Object.keys(staff).length) {
          await signOut(auth)
          throw {
            status: 'error',
            message: 'スタッフがみつかりませんでした。'
          }
        } else {
          return login.user
        }
      } else {
        return login.user
      }
    }
    // })
  },

  // signInWithTwitter({ commit }){
  //     return signInWithPopup(new auth.TwitterAuthProvider())
  // },

  // signInWithFacebook({ commit }){
  //     return signInWithPopup(new auth.FacebookAuthProvider())
  // },

  // signInWithGoogle({ commit }){
  //     return signInWithPopup(new auth.GoogleAuthProvider())
  // },

  async signOut() {
    return await signOut(auth)
  }
}

export const getters = {
  user(state){
    return state.user
  },
  isAuthenticated (state) {
    return !!state.user;
  }
}