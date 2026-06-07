import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDtuK_Rvq9Ki3QiytCTWON6S4J2iHKlTCU',
  authDomain: 'rubnong-official.firebaseapp.com',
  projectId: 'rubnong-official',
  storageBucket: 'rubnong-official.firebasestorage.app',
  messagingSenderId: '982944596814',
  appId: '1:982944596814:web:cf61c860632eb42b4a541f',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = (() => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ hd: 'student.triamudom.ac.th' });
  return p;
})();

export const SUPER_ADMIN = '8868278@student.triamudom.ac.th';
