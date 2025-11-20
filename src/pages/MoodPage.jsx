import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../utils/firebaseConfig";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import * as faceapi from "@vladmandic/face-api";
import { useNavigate } from "react-router-dom";
import "./MoodPage.css";

const moodGradients = {
  happy: "linear-gradient(135deg, #ff7f50, #ff6b3d)",
  sad: "linear-gradient(135deg, #4b3f72, #6e5a99)",
  angry: "linear-gradient(135deg, #8b2c2c, #b04141)",
  surprised: "linear-gradient(135deg, #6b5b95, #8573a9)",
  neutral: "linear-gradient(135deg, #3a3a3a, #5c5c5c)",
  fearful: "linear-gradient(135deg, #4a4a4a, #7a7a7a)",
  disgusted: "linear-gradient(135deg, #556b2f, #6b7f3f)",
};

const moodsList = ["happy", "sad", "angry", "surprised", "neutral"];

export default function MoodPage() {
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [note, setNote] = useState("");
  const [detectedMood, setDetectedMood] = useState(null);
  const [source, setSource] = useState(null);
  const [expressions, setExpressions] = useState(null);
  const [aiSummary, setAiSummary] = useState("");

  const videoRef = useRef(null);
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
      const video = videoRef.current;
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;

      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true);
      });

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
    const video = videoRef.current;
    const displaySize = { width: 480, height: 360 };

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
        setExpressions(expressions);
        setSource("face");
      } else {
        setDetectedMood(null);
        setExpressions(null);
        setSource(null);
      }
    }, 30000); // detect every 30 sec
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
        aiSummary,
        confidence: expressions, // Save confidence meter to DB
      });

      alert("Mood saved successfully!");
      navigate("/music");
    } catch (error) {
      console.error(error);
      alert("Failed to save mood");
    }
  };

  const generateAISummary = () => {
    const moodText = detectedMood ? `You seem ${detectedMood}. ` : "";
    const noteText = note ? `Note: ${note}` : "";
    setAiSummary(moodText + noteText);
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
      {/* LEFT SECTION */}
      {/* LEFT SECTION */}
<div className="left-section">
  <div className="camera-frame">
    <video ref={videoRef} autoPlay muted width={480} height={360}></video>
  </div>

  {/* Breathing Circle */}
  <div className="breathing-circle"></div>
</div>


      {/* RIGHT SECTION */}
      <div className="right-section glass">
        <h1 className="title">Log Your Mood</h1>

        {/* Live Mood */}
        <div className="live-mood-tags">
          <h4>Detected Mood:</h4>
          <span className="mood-tag">
            {detectedMood ? detectedMood.toUpperCase() : "Detecting..."}
          </span>

          {expressions && (
            <div className="confidence-meter">
              {Object.keys(expressions).map((exp) => (
                <div key={exp} className="confidence-row">
                  <span className="exp-label">{exp}</span>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{ width: `${(expressions[exp] * 100).toFixed(0)}%` }}
                    ></div>
                  </div>
                  <span className="exp-value">{(expressions[exp] * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

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

        <button className="ai-summary-btn" onClick={generateAISummary}>
          Generate AI Summary
        </button>

        {aiSummary && <div className="ai-summary">{aiSummary}</div>}

        <button className="save-btn" onClick={saveMood}>
          Save Mood
        </button>
      </div>
    </div>
  );
}
