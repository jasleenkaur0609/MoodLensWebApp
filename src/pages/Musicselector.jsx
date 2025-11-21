import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../utils/firebaseConfig";
import "./Music.css";

const songGradients = [
  "linear-gradient(135deg, #ff7f50, #ff6b3d)",
  "linear-gradient(135deg, #4b3f72, #6e5a99)",
  "linear-gradient(135deg, #8b2c2c, #b04141)",
  "linear-gradient(135deg, #6b5b95, #8573a9)",
  "linear-gradient(135deg, #3a3a3a, #5c5c5c)",
  "linear-gradient(135deg, #556b2f, #6b7f3f)",
];

export default function MusicSelector() {
  const { state } = useLocation();
  const { detectedMood, confidence } = state || {};

  const [language, setLanguage] = useState(null);
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [suggestion, setSuggestion] = useState("");
  const [bgGradient, setBgGradient] = useState(
    "linear-gradient(135deg, #1f1f1f, #2e2e2e)"
  );

  // Fetch songs & suggestions when language or detectedMood changes
  useEffect(() => {
    if (!detectedMood) return;
    fetchSuggestion(detectedMood);
    if (language) fetchSongs(detectedMood, language);
  }, [detectedMood, language]);

  const fetchSongs = async (mood, lang) => {
    try {
      const q = query(
        collection(db, "songs"),
        where("mood", "==", mood),
        where("language", "==", lang)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSongs(list);
    } catch (err) {
      console.error("Error fetching songs:", err);
    }
  };

  const fetchSuggestion = async (mood) => {
    try {
      const q = query(
        collection(db, "moodSuggestions"),
        where("mood", "==", mood)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setSuggestion(snapshot.docs[0].data().suggestion);
      } else {
        setSuggestion("No suggestions available for this mood.");
      }
    } catch (err) {
      console.error("Error fetching suggestion:", err);
    }
  };

  const handleSongSelect = async (song, index) => {
    setSelectedSong(song);
    setBgGradient(songGradients[index % songGradients.length]);

    const user = auth.currentUser;
    if (!user) return alert("Login first");

    try {
      const moodData = {
        userId: user.uid,
        detectedMood,
        selectedMoods: [detectedMood],
        timestamp: new Date(),
        source: "auto",
        selectedLanguage: language,
        selectedSong: song.youtubeUrl,
      };
      if (confidence !== undefined) moodData.confidence = confidence;

      await addDoc(collection(db, "mood"), moodData);
    } catch (err) {
      console.error("Error saving selected song:", err);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    return url.replace("watch?v=", "embed/") + "?autoplay=1&controls=1&showinfo=0";
  };

  return (
    <div className="music-wrapper" style={{ background: bgGradient }}>
      <h2>
        Your Mood:{" "}
        <span className="current-mood">
          {detectedMood || "Detecting..."}
        </span>
      </h2>
      {suggestion && <p className="mood-suggestion">{suggestion}</p>}

      <h3>Select a language:</h3>
      <div className="lang-buttons">
        {["Hindi", "English", "Punjabi"].map((l) => (
          <button
            key={l}
            className={language === l ? "active" : ""}
            onClick={() => setLanguage(l)}
          >
            {l}
          </button>
        ))}
      </div>

      {songs.length > 0 && (
        <div className="song-list">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="song-card"
              onClick={() => handleSongSelect(song, index)}
            >
              <h4>{song.title}</h4>
              {song.artist && <p>{song.artist}</p>}
            </div>
          ))}
        </div>
      )}

      {selectedSong && (
        <div className="player">
          <iframe
            width="300"
            height="60"
            src={getEmbedUrl(selectedSong.youtubeUrl)}
            title="YouTube audio"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
}
