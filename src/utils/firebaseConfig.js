import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyDd_rDz5zp81c3p6GNqMoppIbxOa3WoZbE",
  authDomain: "moodlensweb-8a101.firebaseapp.com",
  projectId: "moodlensweb-8a101",
  storageBucket: "moodlensweb-8a101.firebasestorage.app",
  messagingSenderId: "777474900840",
  appId: "1:777474900840:web:fa1aad19464bea29d90cdd",
  measurementId: "G-7Y0R18NHEH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
