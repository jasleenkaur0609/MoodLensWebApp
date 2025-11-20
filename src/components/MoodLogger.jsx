import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../utils/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import EmojiPicker from "emoji-picker-react";
import * as faceapi from "@vladmandic/face-api";

const moodsList = ["happy", "sad", "angry", "surprised", "neutral", "fearful", "disgusted"];

const Mood = () => {
  const videoRef = useRef(null);
  const [detectedMood, setDetectedMood] = useState("");
  const [manualMoods, setManualMoods] = useState([]);
  const [note, setNote] = useState("");
  const [emoji, setEmoji] = useState("");
  const [user, setUser] = useState(null);
  const [voiceMood, setVoiceMood] = useState("");

  // -------------------- AUTH --------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (!currentUser) window.location.href = "/login";
      else setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // -------------------- CAMERA SETUP --------------------
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    async function loadModels() {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);
      detectMood();
    }

    startCamera();
    loadModels();
  }, []);

  // -------------------- FACE MOOD DETECTION --------------------
  const detectMood = async () => {
    if (!videoRef.current) return;

    const result = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (result) {
      const expressions = result.expressions;
      const mood = Object.keys(expressions).reduce((a, b) => (expressions[a] > expressions[b] ? a : b));
      setDetectedMood(mood);
    }

    setTimeout(detectMood, 3000); // repeat every 3s
  };

  // -------------------- MANUAL MOOD --------------------
  const handleMoodChange = (e) => {
    const value = e.target.value;
    setManualMoods(prev => prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]);
  };

  const onEmojiClick = (event, emojiObject) => {
    setEmoji(emojiObject.emoji);
  };

  // -------------------- VOICE MOOD DETECTION --------------------
  const startVoiceDetection = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition not supported!");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      const mood = detectMoodFromText(speechText);
      setVoiceMood(mood);
    };

    recognition.start();
  };

  const detectMoodFromText = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("happy") || lower.includes("joy")) return "happy";
    if (lower.includes("sad") || lower.includes("down")) return "sad";
    if (lower.includes("angry") || lower.includes("mad")) return "angry";
    if (lower.includes("surprised") || lower.includes("wow")) return "surprised";
    if (lower.includes("fear") || lower.includes("scared")) return "fearful";
    if (lower.includes("disgust") || lower.includes("gross")) return "disgusted";
    return "neutral";
  };

  // -------------------- SAVE MOOD --------------------
  const saveMood = async () => {
    if (!user) return alert("User not logged in!");
    try {
      await addDoc(collection(db, "moods"), {
        userId: user.uid,
        detectedMood,
        manualMoods,
        voiceMood,
        note,
        emoji,
        timestamp: Timestamp.now()
      });
      setManualMoods([]);
      setNote("");
      setEmoji("");
      alert("Mood saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving mood!");
    }
  };

  return (
    <div className="mood-container" style={{ display:"flex", gap:"30px", padding:"30px", flexWrap:"wrap" }}>
      
      {/* LEFT PANEL: Camera & Detected Mood */}
      <div className="left-panel" style={{ flex:1.5, minWidth:"320px", padding:"25px", borderRadius:"25px", background:"rgba(255,255,255,0.05)" }}>
        <h1 style={{ fontSize:"2rem", marginBottom:"10px" }}>AI Mood Detection</h1>
        <video ref={videoRef} autoPlay muted style={{ width:"100%", borderRadius:"20px" }}></video>
        <p style={{ marginTop:"10px", fontWeight:"600" }}>Detected Mood: <span style={{ color:"#ff75b5", fontWeight:"700" }}>{detectedMood}</span></p>
        <button onClick={startVoiceDetection} style={{ padding:"10px 20px", marginTop:"10px", borderRadius:"12px", cursor:"pointer" }}>
          🎤 Detect Mood via Voice
        </button>
        {voiceMood && <p>Voice Mood Detected: <strong>{voiceMood}</strong></p>}
      </div>

      {/* RIGHT PANEL: Manual Mood, Notes, Emoji */}
      <div className="right-panel" style={{ flex:1, minWidth:"300px", padding:"25px", borderRadius:"25px", background:"rgba(255,255,255,0.05)" }}>
        <h2>Log Mood Manually</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {moodsList.map(m => (
            <label key={m}>
              <input type="checkbox" value={m} checked={manualMoods.includes(m)} onChange={handleMoodChange} /> {m.charAt(0).toUpperCase() + m.slice(1)}
            </label>
          ))}
        </div>

        <textarea
          placeholder="Add a note..."
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ width:"100%", height:"80px", marginTop:"10px", borderRadius:"12px", padding:"10px" }}
        />

        <EmojiPicker onEmojiClick={onEmojiClick} />
        {emoji && <p>Selected Emoji: {emoji}</p>}

        <button onClick={saveMood} style={{ marginTop:"12px", padding:"12px 20px", borderRadius:"12px", cursor:"pointer", background:"#ff75b5", color:"#fff" }}>
          💾 Save Mood
        </button>
      </div>

    </div>
  );
};

export default Mood;
