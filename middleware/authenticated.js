import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from '~/plugins/firebase.js'
import { signOut } from 'firebase/auth'
export default async ({ store, route, redirect }) => {

  if (store.getters.user) {
    // +==============================
    // | ログイン済み
    console.log(store.getters.user)
    const user  =store.getters.user
    const uid   = user.uid;
    const q     = query(collection(db, 'staff'), where('field-uid', '==', uid));
    const qs    = await getDocs(q);

    const staff = {};
    qs.forEach(d => staff[d.id] = d.data());
    if (Object.keys(staff).length || user.email.startsWith('admin@')) {
      // ==============================
      // ログイン
      if (route.name === 'login') redirect('/')
    } else {
      // ==============================
      // ログアウト
      await signOut(auth);
    }
  } else {
    // +==============================
    // | 未ログイン
    if ( route.name !== 'login' && !route.fullPath.startsWith('/liff') ) {
      redirect('/login')
    }
  }

}