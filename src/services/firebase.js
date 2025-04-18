// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCQ225_qYxDSz0xNmV0CkgTF-_xOi3CEgg",
    authDomain: "ligasys-c78d0.firebaseapp.com",
    projectId: "ligasys-c78d0",
    storageBucket: "ligasys-c78d0.firebasestorage.app",
    messagingSenderId: "1070308554390",
    appId: "1:1070308554390:web:fb86608756ac9f0ea7b4b7",
    measurementId: "G-66KPW9QNGQ"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
