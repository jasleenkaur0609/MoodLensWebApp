import React, { useEffect, useState } from "react";
import { auth, db } from "../utils/firebaseConfig";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import * as faceapi from "@vladmandic/face-api";
import { useNavigate } from "react-router-dom";
import "./MoodPage.css";

// Mood → Premium Soft Gradient Backgrounds
const moodGradients = {
  happy: "linear-gradient(135deg, #ffcf9f, #ffeca8)",   // peach → soft gold
  sad: "linear-gradient(135deg, #5f82c6, #d4deef)",     // steel blue → mist gray
  angry: "linear-gradient(135deg, #ff7a7a, #ffd0d0)",   // coral → rose mist
  surprised: "linear-gradient(135deg, #a58bff, #e9e1ff)", // violet → ice lavender
  neutral: "linear-gradient(135deg, #5c5c5c, #cfcfcf)", // graphite → silver
};

const moodsList = ["happy", "sad", "angry", "surprised", "neutral"];

export default function MoodPage() {
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [note, setNote] = useState("");
  const [detectedMood, setDetectedMood] = useState(null);
  const [source, setSource] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    startCamera();
    loadModels();
  }, []);

  const handleMoodChange = (e) => {
    const value = e.target.value;
    setSelectedMoods((prev) =>
      prev.includes(value)
        ? prev.filter((m) => m !== value)
        : [...prev, value]
    );
  };

  const startCamera = async () => {
    try {
      const video = document.getElementById("camera");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.play();
    } catch (err) {
      console.error("Camera error: ", err);
    }
  };

  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    startFaceDetection();
  };

  const startFaceDetection = () => {
    const video = document.getElementById("camera");

    setInterval(async () => {
      if (!video) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detection) {
        const expressions = detection.expressions;
        const mood = Object.keys(expressions).reduce((a, b) =>
          expressions[a] > expressions[b] ? a : b
        );

        setDetectedMood(mood);
        setSource("face");
      } else {
        setDetectedMood(null);
        setSource(null);
      }
    }, 1000);
  };

  const saveMood = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login first");

    const finalMood =
      selectedMoods.length > 0
        ? `${detectedMood || "none"} | ${selectedMoods.join(",")}`
        : detectedMood;

    if (!finalMood) return alert("No mood detected or selected!");

    try {
      await addDoc(collection(db, "mood"), {
        userId: user.uid,
        detectedMood,
        selectedMoods: selectedMoods.length ? selectedMoods : [],
        note,
        timestamp: Timestamp.now(),
        source: selectedMoods.length ? "manual" : source,
      });

      alert("Mood saved successfully!");

      navigate("/music"); // Redirect only after success

    } catch (error) {
      console.error(error);
      alert("Failed to save mood");
    }
  };

  return (
    <div
      className="mood-wrapper"
      style={{
        background: detectedMood
          ? moodGradients[detectedMood]
          : "linear-gradient(135deg, #1f1f1f, #3b3b3b)",
      }}
    >
      <div className="aurora"></div>

      {/* LEFT SECTION */}
      <div className="left-section">
        <div className="camera-frame">
          <video id="camera" autoPlay muted></video>
        </div>

        <div className="detected-mood-tag">
          {detectedMood ? detectedMood.toUpperCase() : "Detecting..."}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="right-section glass">
        <h1 className="title">Log Your Mood</h1>

        <h3 className="sub">Optional Manual Mood Selection</h3>
        <div className="mood-options">
          {moodsList.map((m) => (
            <label key={m} className="mood-chip">
              <input
                type="checkbox"
                value={m}
                checked={selectedMoods.includes(m)}
                onChange={handleMoodChange}
              />
              {m}
            </label>
          ))}
        </div>

        <textarea
          placeholder="Add a note about your mood..."
          className="note-box"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button className="save-btn" onClick={saveMood}>
          Save Mood
        </button>
      </div>
    </div>
  );
}
