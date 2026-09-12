import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDYYCnRAzwSlX8HVa55GTNZYncUcOyGKIA",
  authDomain: "landsync-c3b62.firebaseapp.com",
  projectId: "landsync-c3b62",
  storageBucket: "landsync-c3b62.firebasestorage.app",
  messagingSenderId: "314655085743",
  appId: "1:314655085743:web:4f890623c545207c72305a"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
