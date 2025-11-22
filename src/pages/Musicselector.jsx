import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../utils/firebaseConfig";
import "./Music.css";

// Dark shades for moods
const moodColors = {
  happy: "#58492D",
  sad: "#2E364F",
  neutral: "#4A3F3F",
  angry: "#4A2E2E",
  calm: "#2F4A38",
  energetic: "#4A3A20",
};

const moodIcons = {
  happy: "😊",
  sad: "😔",
  neutral: "😐",
  angry: "😡",
  calm: "🌿",
  energetic: "⚡",
};

export default function MusicSelector() {
  const { state } = useLocation();
  const { detectedMood } = state || {};

  const [language, setLanguage] = useState(null);
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [suggestionPara, setSuggestionPara] = useState("");
  const [suggestionPoints, setSuggestionPoints] = useState([]);
  const [bgColor, setBgColor] = useState("#1c1c1c");

  // Initial mood background
  useEffect(() => {
    if (detectedMood) setBgColor(moodColors[detectedMood] || "#1c1c1c");
    if (language) fetchSongs(detectedMood, language);
    fetchSuggestion(detectedMood);
  }, [detectedMood, language]);

  // Background animation when song changes
  useEffect(() => {
    if (selectedSong) {
      const darkRandom = `#${Math.floor(Math.random() * 0x555555 + 0x111111).toString(16)}`;
      setBgColor(darkRandom);
    }
  }, [selectedSong]);

  const fetchSongs = async (mood, lang) => {
    try {
      const q = query(
        collection(db, "songs"),
        where("mood", "==", mood),
        where("language", "==", lang)
      );

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSongs(list);
    } catch (err) {
      console.error("Error fetching songs:", err);
    }
  };

  const fetchSuggestion = async (mood) => {
    try {
      const q = query(collection(db, "moodSuggestions"), where("mood", "==", mood));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setSuggestionPara(data.paragraph || "");
        setSuggestionPoints(data.points || []);
      }
    } catch (err) {
      console.error("Error fetching suggestion:", err);
    }
  };

  // UPDATED: Save in "selectedSongs" and removed confidence
  const handleSongSelect = async (song) => {
    setSelectedSong(song);
    const user = auth.currentUser;
    if (!user) return alert("Login first");

    try {
      await addDoc(collection(db, "selectedSongs"), {
        userId: user.uid,
        songTitle: song.title,
        artist: song.artist || "",
        mood: detectedMood,
        language: language,
        youtubeUrl: song.youtubeUrl,
        timestamp: new Date(),
      });

      console.log("Song saved in selectedSongs collection");
    } catch (err) {
      console.error("Error saving selected song:", err);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
    );
    if (!match) return null;
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&controls=0&mute=0`;
  };

  return (
    <div className="music-wrapper" style={{ background: bgColor }}>
      <div className="blob-layer"></div>
      <div className="bubble-layer"></div>
      <div className="aurora-layer"></div>

      <div className="main-container">
        {/* LEFT PANEL */}
        <div className="left-panel mixed-card">
          <h2 className="current-mood">
            <span className="mood-icon">{moodIcons[detectedMood]}</span>
            {detectedMood}
          </h2>

          <div className="suggestion-card">
            <p className="suggestion-para">{suggestionPara}</p>
            <ul className="suggestion-points">
              {suggestionPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="language-card mixed-card">
            <h3>Select Language</h3>
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
          </div>

          {songs.length > 0 && (
            <div className="song-card mixed-card">
              <h3>Songs for you</h3>
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="song-item"
                  onClick={() => handleSongSelect(song)}
                >
                  <h4>{song.title}</h4>
                  {song.artist && <p>{song.artist}</p>}
                </div>
              ))}
            </div>
          )}

          {selectedSong && (
            <div className="player-card mixed-card">
              <iframe
                src={getEmbedUrl(selectedSong.youtubeUrl)}
                title="YouTube audio"
                allow="autoplay"
                className="small-player"
              ></iframe>

              <div className="equalizer">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
