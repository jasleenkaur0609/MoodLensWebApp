import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../utils/firebaseConfig";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import * as faceapi from "@vladmandic/face-api";
import * as tf from "@tensorflow/tfjs";
import { useNavigate } from "react-router-dom";
import "./MoodPage.css";

const moodGradients = {
  happy: "linear-gradient(135deg, #6FCF97, #4CAF8C)",
  sad: "linear-gradient(135deg, #8E6CC8, #6B4F9F)",
  angry: "linear-gradient(135deg, #9C5F80, #7A3F60)",
  surprised: "linear-gradient(135deg, #7BBFA7, #4F8C7F)",
  neutral: "linear-gradient(135deg, #B3B3B3, #6E6E6E)",
  fearful: "linear-gradient(135deg, #5C4B8B, #3A2D6D)",
  disgusted: "linear-gradient(135deg, #58745F, #3C5B45)",
};

const moodsList = [
  "happy","sad","angry","anxious","stressed","excited",
  "bored","relaxed","lonely","confused","tired","peaceful",
  "overwhelmed","motivated","frustrated","curious","grateful",
  "hopeful","disappointed","energetic","drained","content",
  "insecure","proud","scared"
];

const noteBackgrounds = {
  happy: "rgba(111, 207, 151, 0.3)",
  sad: "rgba(142, 108, 200, 0.3)",
  angry: "rgba(156, 95, 128, 0.3)",
  anxious: "rgba(123, 191, 167, 0.3)",
  stressed: "rgba(92, 75, 139, 0.3)",
  excited: "rgba(88, 116, 95, 0.3)",
  relaxed: "rgba(179, 179, 179, 0.3)",
  neutral: "rgba(179, 179, 179, 0.3)"
};

const emojiOptions = [
  { mood: "happy", emoji: "😊" },
  { mood: "sad", emoji: "😢" },
  { mood: "angry", emoji: "😡" },
  { mood: "surprised", emoji: "😲" },
  { mood: "neutral", emoji: "😐" },
];

export default function MoodPage() {
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [emojiMood, setEmojiMood] = useState("");
  const [note, setNote] = useState("");
  const [detectedMood, setDetectedMood] = useState(null);
  const [expressions, setExpressions] = useState(null);

  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  // ----------------- CAMERA & FACE API -----------------
  useEffect(() => {
    startCamera();
    loadFaceAPI();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => videoRef.current.play();
    } catch (err) {
      alert("Camera permission denied.");
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video?.srcObject) video.srcObject.getTracks().forEach((t) => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const loadFaceAPI = async () => {
    try {
      await tf.setBackend("webgl").catch(() => tf.setBackend("cpu"));
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      detectFaceLoop();
    } catch (err) {
      console.log(err);
    }
  };

  const detectFaceLoop = () => {
    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.paused) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detection?.expressions) {
        const ex = Object.fromEntries(
          Object.entries(detection.expressions).map(([k, v]) => [
            k,
            Math.round(v * 100),
          ])
        );
        const mood = Object.keys(ex).reduce((a, b) =>
          ex[a] > ex[b] ? a : b
        );

        setDetectedMood(mood);
        setExpressions(ex);
      }
    }, 3000);
  };

  const pickEmoji = (mood) => {
    setEmojiMood(mood);
    if (!selectedMoods.includes(mood))
      setSelectedMoods((prev) => [...prev, mood]);
  };

  // ----------------- SAVE TO FIREBASE -----------------
  const saveMood = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please login.");

    try {
      await addDoc(collection(db, "mood"), {
        userId: user.uid,
        detectedMood, // detected by face
        selectedMoods,
        emojiMood,
        note,
        timestamp: Timestamp.now(),
        confidence: expressions || {},
        detectionMethod: "live-camera" // 🎯 NEW FIELD
      });

      alert("Mood saved!");
      navigate("/musicselector", { state: { detectedMood } });
    } catch (err) {
      alert("Save failed.");
    }
  };

  return (
    <div
      className="mood-wrapper"
      style={{
        background: detectedMood
          ? moodGradients[detectedMood]
          : "linear-gradient(135deg, #2B2B2B, #4D4D4D)",
      }}
    >
      <div className="left-section">
        <div className="camera-frame">
          <video ref={videoRef} autoPlay muted></video>
        </div>
      </div>

      <div className="right-section glass">
        <div className="scrollable-panel">
          <h1>Log Your Mood</h1>
          <h2>Detected Live Mood: {detectedMood || "Detecting..."}</h2>

          {/* Confidence Meter */}
          {expressions && (
            <div className="confidence-meter">
              {Object.keys(expressions).map((exp) => (
                <div key={exp} className="confidence-row">
                  <span>{exp}</span>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${expressions[exp]}%` }}
                    ></div>
                  </div>
                  <span>{expressions[exp]}%</span>
                </div>
              ))}
            </div>
          )}

          <h3>Emoji Mood</h3>
          <div className="emoji-picker">
            {emojiOptions.map((e) => (
              <button
                key={e.mood}
                className={`emoji-btn ${
                  emojiMood === e.mood ? "selected" : ""
                }`}
                onClick={() => pickEmoji(e.mood)}
              >
                {e.emoji}
              </button>
            ))}
          </div>

          <h3>Select Your Mood(s)</h3>
          <div className="mood-options">
            {moodsList.map((m) => (
              <label key={m} className="mood-chip">
                <input
                  type="checkbox"
                  checked={selectedMoods.includes(m)}
                  onChange={() =>
                    setSelectedMoods((prev) =>
                      prev.includes(m)
                        ? prev.filter((x) => x !== m)
                        : [...prev, m]
                    )
                  }
                />
                <span>{m}</span>
              </label>
            ))}
          </div>

          {/* Removed Photo Upload Completely */}

          <textarea
            className="note-box"
            placeholder="Write something..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              background:
                selectedMoods.length > 0
                  ? noteBackgrounds[selectedMoods[0]] ||
                    "rgba(247, 246, 246, 0.72)"
                  : detectedMood
                  ? noteBackgrounds[detectedMood] ||
                    "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.2)",
            }}
          />

          <button className="save-btn" onClick={saveMood}>
            Save Mood
          </button>
        </div>
      </div>
    </div>
  );
}
