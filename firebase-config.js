// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAWlvjlWQ1bdzLBs-qgM_WId7tb9OQq86w",
    authDomain: "priem-pkgod.firebaseapp.com",
    projectId: "priem-pkgod",
    storageBucket: "priem-pkgod.firebasestorage.app",
    messagingSenderId: "291583024843",
    appId: "1:291583024843:web:3de2fd404395bd2f66454e",
    measurementId: "G-DJNKBYRCB4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Экспортируем всё необходимое
export { db, auth, collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, signInWithEmailAndPassword, createUserWithEmailAndPassword };