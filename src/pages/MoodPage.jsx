import React, { useEffect, useState } from "react";
import { auth, db } from "../utils/firebaseConfig";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import * as faceapi from "@vladmandic/face-api";
import "./MoodPage.css";

const moodsList = ["happy", "sad", "angry", "surprised", "neutral"];
const moodColors = {
  happy: "#fcd34d",
  sad: "#3b82f6",
  angry: "#ef4444",
  surprised: "#a855f7",
  neutral: "#6b7280",
};

export default function MoodPage() {
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [note, setNote] = useState("");
  const [detectedMood, setDetectedMood] = useState(null);
  const [source, setSource] = useState(null);
  const [bgColor, setBgColor] = useState("#111827");

  useEffect(() => {
    startCamera();
    loadModels();
  }, []);

  const handleMoodChange = (e) => {
    const value = e.target.value;
    setSelectedMoods((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  };

  const startCamera = async () => {
    const video = document.getElementById("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.error("Camera error:", err);
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
      if (video.paused || video.ended) return;

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
        setBgColor(moodColors[mood] || "#111827");
      } else {
        setDetectedMood(null);
        setSource(null);
        setBgColor("#111827");
      }
    }, 1000);
  };

  const saveMood = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login first");

    const moodToSave = selectedMoods.length ? selectedMoods.join(",") : detectedMood;
    if (!moodToSave) return alert("No mood detected or selected!");

    try {
      await addDoc(collection(db, "mood"), {
        userId: user.uid,
        mood: moodToSave,
        note,
        datetime: Timestamp.now(),
        source: selectedMoods.length ? "manual" : source,
      });
      alert("Mood saved!");
      setNote("");
      setSelectedMoods([]);
      setDetectedMood(null);
      setSource(null);
      setBgColor("#111827");
    } catch (err) {
      console.error(err);
      alert("Failed to save mood");
    }
  };

  return (
    <div className="mood-container" style={{ backgroundColor: bgColor }}>
      <h2>Log Your Mood</h2>
      <div className="content">
        {/* Camera Panel */}
        <div className="camera-panel">
          <video id="camera" autoPlay muted></video>
          <p className="detected-mood">
            Detected Mood:{" "}
            <span>{detectedMood ? detectedMood.toUpperCase() : "—"}</span>
          </p>
        </div>

        {/* Controls Panel */}
        <div className="controls-panel">
          <h3>Manual Mood Selection</h3>
          <div className="checkboxes">
            {moodsList.map((m) => (
              <label key={m}>
                <input
                  type="checkbox"
                  value={m}
                  onChange={handleMoodChange}
                  checked={selectedMoods.includes(m)}
                />{" "}
                {m}
              </label>
            ))}
          </div>

          <textarea
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button className="save-btn" onClick={saveMood}>
            Save Mood
          </button>
        </div>
      </div>
    </div>
  );
}
