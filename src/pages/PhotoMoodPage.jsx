import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./PhotoMoodPage.css";

import { db } from "../utils/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const moodChips = [
  "happy","joyful","excited","content","sad","angry","fearful","disgusted","surprised",
  "anxious","bored","calm","confused","curious","determined","energetic","frustrated",
  "grateful","hopeful","inspired","lonely","nervous","proud","relaxed","tired"
];

const emojiOptions = [
  { mood: "happy", emoji: "😊" },
  { mood: "sad", emoji: "😢" },
  { mood: "angry", emoji: "😡" },
  { mood: "surprised", emoji: "😲" },
  { mood: "neutral", emoji: "😐" },
];

const moodColors = {
  happy: "linear-gradient(135deg, #ffe0b2, #ffcc80)",
  joyful: "linear-gradient(135deg, #fff9c4, #fff59d)",
  excited: "linear-gradient(135deg, #ffab91, #ff8a65)",
  content: "linear-gradient(135deg, #b2dfdb, #80cbc4)",
  sad: "linear-gradient(135deg, #b3e5fc, #81d4fa)",
  angry: "linear-gradient(135deg, #ff8a80, #ff5252)",
  fearful: "linear-gradient(135deg, #b0bec5, #90a4ae)",
  disgusted: "linear-gradient(135deg, #c5e1a5, #aed581)",
  surprised: "linear-gradient(135deg, #f48fb1, #f06292)",
  neutral: "linear-gradient(135deg, #e0e0e0, #bdbdbd)",
  default: "linear-gradient(135deg, #f5f5f5, #e0e0e0)"
};

const PhotoMoodPage = () => {
  const [image, setImage] = useState(null);
  const [detectedMood, setDetectedMood] = useState("");
  const [confidence, setConfidence] = useState({});
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [emojiMood, setEmojiMood] = useState("");
  const [note, setNote] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const handleImage = async (fileOrBlob) => {
    setImage(URL.createObjectURL(fileOrBlob));
    const formData = new FormData();
    formData.append("file", fileOrBlob);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/mood-detect", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDetectedMood(res.data.detectedMood);
      setConfidence(res.data.confidence);
    } catch (err) {
      console.error(err);
      alert("Mood detection failed. Make sure backend is running.");
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleImage(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      console.error(err);
      alert("Cannot access camera");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());
    videoRef.current.srcObject = null;
  };

  const retakePhoto = () => {
    setImage(null);
    setDetectedMood("");
    setConfidence({});
  };

  const capturePhoto = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 300, 300);
    canvasRef.current.toBlob(blob => handleImage(blob), "image/jpeg");
  };

  const pickEmoji = (mood) => {
    setEmojiMood(mood);
    if (!selectedMoods.includes(mood)) setSelectedMoods(prev => [...prev, mood]);
  };

  const saveMood = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) { alert("User not logged in!"); return; }

      await addDoc(collection(db, "mood"), {
        userId: user.uid,
        detectedMood,
        selectedMoods,
        emojiMood,
        note,
        timestamp: Timestamp.now(),
        confidence: confidence || {},
        detectionMethod: "Image upload / capture"
      });

      setShowPopup(true);
      setTimeout(() => { setShowPopup(false); navigate("/musicselector"); }, 1500);

      setImage(null);
      setDetectedMood("");
      setSelectedMoods([]);
      setEmojiMood("");
      setNote("");
      setConfidence({});
    } catch (err) {
      console.error(err);
      alert("Failed to save mood");
    }
  };

  return (
    <div className="photo-mood-wrapper">
      
      {/* LEFT SECTION */}
      <div className="left-section">
        <h2>Photo Mood Detection</h2>

        <div className="image-actions">
          <div className="upload-capture card-hover">

            <h3>Upload Image</h3>
            <input type="file" accept="image/*" onChange={handleFileChange} />

            <h3>Capture Photo</h3>
            <video ref={videoRef} width="250" height="250" className="video-feed" />
            <canvas ref={canvasRef} width="250" height="250" style={{ display: "none" }} />

            <div className="btn-group">
              <button className="btn" onClick={startCamera}>Start Camera</button>
              <button className="btn" onClick={capturePhoto}>Capture Photo</button>
              <button className="btn" onClick={stopCamera}>Stop Camera</button>
              <button className="btn" onClick={retakePhoto}>Retake</button>
            </div>
          </div>

          {image && (
            <div className="preview-wrapper card-hover">
              <h4>Preview</h4>
              <img src={image} alt="Preview" className="preview-image" />
            </div>
          )}
        </div>

        {loading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Detecting mood...</p>
          </div>
        )}

      </div>

      {/* RIGHT SECTION */}
      <div className="right-section">
        {detectedMood && (
          <div className="detected-mood-section card-hover">
            <h3>Mood Detected: {detectedMood}</h3>
            {Object.entries(confidence).map(([key, val]) => (
              <div key={key} className="confidence-bar">
                <span>{key}: {val}%</span>
                <div className="confidence-fill" style={{ "--fill-width": `${val}%` }} />
              </div>
            ))}
          </div>
        )}

        <div className="mood-chip-section card-hover">
          <h3>Select Mood(s)</h3>
          <div className="mood-chip-container">
            {moodChips.map(m => (
              <div
                key={m}
                className={`mood-chip ${selectedMoods.includes(m) ? "selected" : ""}`}
                onClick={() => {
                  if (selectedMoods.includes(m)) setSelectedMoods(selectedMoods.filter(chip => chip !== m));
                  else setSelectedMoods([...selectedMoods, m]);
                }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        <div className="emoji-selection card-hover">
          <h3>Emoji Mood</h3>
          <div className="emoji-container">
            {emojiOptions.map(e => (
              <button
                key={e.mood}
                className={`emoji-btn ${emojiMood === e.mood ? "selected" : ""}`}
                onClick={() => pickEmoji(e.mood)}
              >
                {e.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="note-section card-hover">
          <h3>Add a Note</h3>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Write about your mood..."
            rows={6}
          />
        </div>

        <button className="save-mood-btn card-hover" onClick={saveMood}>
          Save Mood
        </button>
      </div>

      {showPopup && <div className="popup">Mood saved successfully!</div>}
    </div>
  );
};

export default PhotoMoodPage;
