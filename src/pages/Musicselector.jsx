import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../utils/firebaseConfig";
import "./Music.css";

// Mood icons
const moodIcons = {
  happy: "😊",
  sad: "😔",
  neutral: "😐",
  angry: "😡",
  calm: "🌿",
  energetic: "⚡",
};

// Random dark color generator
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 100);
  const g = Math.floor(Math.random() * 100);
  const b = Math.floor(Math.random() * 100);
  return `rgb(${r}, ${g}, ${b})`;
};

export default function MusicSelector() {
  const { state } = useLocation();
  const { detectedMood: navMood } = state || {};

  const [detectedMood, setDetectedMood] = useState(navMood || "");
  const [language, setLanguage] = useState(null);
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [suggestionPara, setSuggestionPara] = useState("");
  const [suggestionPoints, setSuggestionPoints] = useState([]);
  const [bgColor, setBgColor] = useState(getRandomColor());
  const playerRef = useRef(null);

  // Fetch suggestions for mood
  useEffect(() => {
    if (detectedMood) fetchSuggestions(detectedMood);
  }, [detectedMood]);

  // Fetch songs when mood and language are set
  useEffect(() => {
    if (detectedMood && language) fetchSongs(detectedMood, language);
  }, [detectedMood, language]);

  // ----------------------------
  // Fetch songs from Firestore
  // ----------------------------
  const fetchSongs = async (mood, lang) => {
    try {
      const q = query(
        collection(db, "songs"),
        where("mood", "==", mood.toLowerCase()),
        where("language", "==", lang)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSongs(list);
    } catch (err) {
      console.error("Error fetching songs:", err);
    }
  };

  // ----------------------------
  // Fetch suggestions from Firestore
  // ----------------------------
  const fetchSuggestions = async (mood) => {
    try {
      const q = query(collection(db, "moodSuggestions"), where("mood", "==", mood.toLowerCase()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setSuggestionPara(data.paragraph || "");
        setSuggestionPoints(data.points || []);
      } else {
        setSuggestionPara("No suggestions available for this mood.");
        setSuggestionPoints([]);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestionPara("Failed to load suggestions.");
      setSuggestionPoints([]);
    }
  };

  // ----------------------------
  // Handle song click
  // ----------------------------
  const handleSongSelect = (song) => {
    setSelectedSong(song);
    setBgColor(getRandomColor());
  };

  // ----------------------------
  // Add song to Firestore when listened
  // ----------------------------
  const handleSongListen = async () => {
    if (!selectedSong) return;
    const user = auth.currentUser;
    if (!user) return alert("Login first");

    try {
      await addDoc(collection(db, "selectedSongs"), {
        userId: user.uid,
        songTitle: selectedSong.title,
        artist: selectedSong.artist || "",
        mood: detectedMood,
        language: language,
        youtubeUrl: selectedSong.youtubeUrl,
        timestamp: new Date(),
      });
      console.log("Song added to database:", selectedSong.title);
    } catch (err) {
      console.error("Error saving listened song:", err);
    }
  };

  // ----------------------------
  // YouTube embed URL
  // ----------------------------
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
    );
    if (!match) return null;
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&controls=1&mute=0`;
  };

  return (
    <div className="music-wrapper" style={{ background: bgColor }}>
      <div className="main-container">

        {/* LEFT PANEL */}
        <div className="left-panel mixed-card">
          <h2 className="current-mood">
            <span className="mood-icon">{moodIcons[detectedMood]}</span>
            {detectedMood}
          </h2>

          <div className="suggestion-card">
            <h3>Suggestions</h3>
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
                ref={playerRef}
                src={getEmbedUrl(selectedSong.youtubeUrl)}
                title="YouTube audio"
                allow="autoplay"
                className="small-player"
                onLoad={handleSongListen} // Song listened
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
