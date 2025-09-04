// Firebase 설정을 별도 파일로 분리
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCaS7yCWD5nSeChx8Rs4g8-W200hct_Tk4",
  authDomain: "phone-film-shop.firebaseapp.com",
  projectId: "phone-film-shop",
  storageBucket: "phone-film-shop.firebasestorage.app",
  messagingSenderId: "597985679251",
  appId: "1:597985679251:web:9920eebb6dff357aa47a66",
  databaseURL: "https://phone-film-shop-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
