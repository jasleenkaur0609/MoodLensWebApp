

// uploadSongs.js (CommonJS version)
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");
const fs = require("fs");

// Firebase config
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
const db = getFirestore(app);

// Load JSON array (relative path)
const songsData = JSON.parse(fs.readFileSync("C:/Users/DELL/Downloads/moodSuggestion.json", "utf8"));

async function uploadSongs() {
  try {
    for (const song of songsData) {
      await addDoc(collection(db, "moodSuggestions"), song); // auto-generate document ID
      console.log(`Added: ${song.title}`);
    }
    console.log("All Suggestions uploaded successfully!");
  } catch (err) {
    console.error("Error uploading songs:", err);
  }
}

uploadSongs();
