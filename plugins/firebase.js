import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey           : process.env.FB_API_KEY,
  authDomain       : process.env.FB_AUTH_DOMAIN,
  projectId        : process.env.FB_PROJECT_ID,
  storageBucket    : process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.FB_MSG_SENDER_ID,
  appId            : process.env.FB_APP_ID,
  measurementId    : process.env.FB_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp, {});
const functions   = getFunctions(firebaseApp, {});
export { firebaseApp, auth, functions, db };