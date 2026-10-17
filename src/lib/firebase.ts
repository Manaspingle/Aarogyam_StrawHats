import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBdcrP98QeSszAb8pg9ndfCF-aWCsg0aF0",
  authDomain: "aarogyam-30e7f.firebaseapp.com",
  projectId: "aarogyam-30e7f",
  storageBucket: "aarogyam-30e7f.firebasestorage.app",
  messagingSenderId: "976767570436",
  appId: "1:976767570436:web:aa1b476bf8edac78f29b51",
  measurementId: "G-1H075JXZM9"
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Ignore persistence error if browser storage is restricted
});

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Analytics conditionally
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}
