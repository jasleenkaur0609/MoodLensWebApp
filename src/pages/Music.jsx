import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../utils/firebaseConfig";
import "./MusicPage.css";

export default function MusicPage() {
  const { state } = useLocation();
  const { detectedMood, confidence } = state || {};

  const [language, setLanguage] = useState(null);
  const [songs, setSongs] = useState([]);
  const [manualMood, setManualMood] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [suggestion, setSuggestion] = useState("");

  const moodToUse = manualMood || detectedMood;

  useEffect(() => {
    if (language && moodToUse) {
      fetchSongs(moodToUse, language);
      fetchSuggestion(moodToUse);
    }
  }, [language, moodToUse]);

  const fetchSongs = async (mood, lang) => {
    const q = query(
      collection(db, "songs"),
      where("mood", "==", mood),
      where("language", "==", lang)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSongs(list);
  };

  const fetchSuggestion = async (mood) => {
    const q = query(collection(db, "moodSuggestions"), where("mood", "==", mood));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setSuggestion(snapshot.docs[0].data().suggestion);
    }
  };

  const handleSongSelect = async (song) => {
    setSelectedSong(song);
    const user = auth.currentUser;
    if (!user) return alert("Login first");

    await addDoc(collection(db, "mood"), {
      userId: user.uid,
      detectedMood,
      manualMood,
      selectedMoods: manualMood ? [manualMood] : [],
      timestamp: new Date(),
      source: manualMood ? "manual" : "auto",
      confidence,
      selectedLanguage: language,
      selectedSong: song.youtubeUrl
    });
  };

  return (
    <div className="music-wrapper">
      <h2>Your Mood: <span className="current-mood">{moodToUse}</span></h2>
      {suggestion && <p className="mood-suggestion">{suggestion}</p>}

      <h3>Select a language:</h3>
      <div className="lang-buttons">
        {["Hindi", "English", "Punjabi"].map(l => (
          <button
            key={l}
            className={language === l ? "active" : ""}
            onClick={() => setLanguage(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <h3>Or override mood:</h3>
      <div className="manual-mood">
        {["happy","sad","angry","fearful","surprised","neutral"].map(m => (
          <button
            key={m}
            className={manualMood === m ? "active" : ""}
            onClick={() => setManualMood(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="song-list">
        {songs.map(song => (
          <div key={song.id} className="song-card" onClick={() => handleSongSelect(song)}>
            <h4>{song.title}</h4>
            {song.artist && <p>{song.artist}</p>}
          </div>
        ))}
      </div>

      {selectedSong && (
        <div className="player">
          <iframe
            width="560"
            height="315"
            src={selectedSong.youtubeUrl.replace("watch?v=", "embed/")}
            title="YouTube player"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
}
