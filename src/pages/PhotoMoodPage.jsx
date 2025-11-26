import React, { useState, useRef } from "react";
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
const API = process.env.REACT_APP_BACKEND_URL;

const emojiOptions = [
  { mood: "happy", emoji: "😊" },
  { mood: "sad", emoji: "😢" },
  { mood: "angry", emoji: "😡" },
  { mood: "surprised", emoji: "😲" },
  { mood: "neutral", emoji: "😐" },
];

const PhotoMoodPage = () => {
  const [image, setImage] = useState(null);
  const [capturedFromCamera, setCapturedFromCamera] = useState(false);
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

  // =============================
  // Handle image upload or camera capture
  // =============================
  const handleImage = async (fileOrBlob) => {
    setImage(URL.createObjectURL(fileOrBlob));

    const formData = new FormData();
    formData.append("file", fileOrBlob);

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/mood-detect`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDetectedMood(res.data.detectedMood);

      // Convert confidence values safely to 0-100 and clamp
      const sampleValue = Object.values(res.data.confidence)[0];
      const converted = {};
      for (let key in res.data.confidence) {
        let val = res.data.confidence[key];
        if (sampleValue <= 1) {
          // backend returns 0-1
          val = val * 100;
        }
        converted[key] = Math.min(Math.round(val), 100);
      }
      setConfidence(converted);

    } catch (err) {
      console.error(err);
      alert("Mood detection failed. Make sure backend is running.");
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCapturedFromCamera(false);
      handleImage(file);
    }
  };

  // =============================
  // Camera functions
  // =============================
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

  const capturePhoto = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 280, 280);

    canvasRef.current.toBlob(blob => {
      setCapturedFromCamera(true);
      handleImage(blob);
    }, "image/jpeg");
  };

  const retakePhoto = () => {
    setImage(null);
    setDetectedMood("");
    setConfidence({});
    setCapturedFromCamera(false);
  };

  // =============================
  // Emoji & mood selection
  // =============================
  const pickEmoji = (mood) => {
    setEmojiMood(mood);
    if (!selectedMoods.includes(mood)) {
      setSelectedMoods(prev => [...prev, mood]);
    }
  };

  // =============================
  // Save mood to Firestore
  // =============================
  const saveMood = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert("User not logged in!");
        return;
      }

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

      // Stop camera automatically after saving
      stopCamera();

      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        navigate("/musicselector", { state: { detectedMood } });
      }, 1500);

      // Reset state
      setImage(null);
      setDetectedMood("");
      setSelectedMoods([]);
      setEmojiMood("");
      setNote("");
      setConfidence({});
      setCapturedFromCamera(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save mood");
    }
  };

  // =============================
  // JSX
  // =============================
  return (
    <div className="photo-mood-wrapper new-layout">

      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="section-header">
          <h2>Photo Mood Detection</h2>
        </div>

        {/* UPLOAD */}
        <div className="image-input-area card-hover">
          <div className="upload-block">
            <h3>Upload Image</h3>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* CAMERA */}
          <div className="camera-block">
            <h3>Capture Photo</h3>
            <div className="camera-preview">
              <video ref={videoRef} width="280" height="280" className="video-feed" />
              <canvas ref={canvasRef} width="280" height="280" style={{ display: "none" }} />
            </div>
            <div className="camera-buttons">
              <button className="btn" onClick={startCamera}>Start</button>
              <button className="btn" onClick={capturePhoto}>Capture</button>
              <button className="btn" onClick={stopCamera}>Stop</button>
              {capturedFromCamera && (
                <button className="btn" onClick={retakePhoto}>Retake</button>
              )}
            </div>
          </div>
        </div>

        {image && (
          <div className="preview-card card-hover">
            <h3>Preview</h3>
            <img src={image} alt="Preview" className="preview-image" />
          </div>
        )}

        {loading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Detecting mood...</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">

        {detectedMood && (
          <div className="detected-card card-hover">
            <h3>Mood Detected: {detectedMood}</h3>

            <div className="confidence-list">
              {Object.entries(confidence).map(([mood, value]) => (
                <div key={mood} style={{ marginBottom: "10px" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                    {mood} — {value}%
                  </p>

                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mood chip selection */}
        <div className="mood-chip-section card-hover">
          <h3>Select Mood(s)</h3>
          <div className="mood-chip-container">
            {moodChips.map(m => (
              <div
                key={m}
                className={`mood-chip ${selectedMoods.includes(m) ? "selected" : ""}`}
                onClick={() => {
                  if (selectedMoods.includes(m)) {
                    setSelectedMoods(selectedMoods.filter(chip => chip !== m));
                  } else {
                    setSelectedMoods([...selectedMoods, m]);
                  }
                }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Emoji */}
        <div className="emoji-section card-hover">
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

        {/* Note */}
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
