import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./MoodDetectionChoice.css";

const quotes = [
  "Your emotions matter.",
  "Every feeling is valid.",
  "Let your mind breathe.",
  "Today is a new beginning.",
  "Be kind to your heart.",
  "Your mood is the color of your inner sky.",
  "Healing begins when you notice how you feel.",
  "Every mood tells a story.",
  "Every breath resets your energy.",
  "Let today be gentle with you.",
  "Feelings are visitors; let them teach you.",
  "You deserve peace and space.",
  "Look within—your heart already knows.",
  "Small steps matter today.",
  "You are allowed to pause.",
  "Be proud of how far you've come.",
  "It's okay to restart anytime.",
  "Your inner world matters.",
  "Calmness begins with awareness.",
  "Listen to your mind; it whispers truth.",
  "You're doing the best you can.",
  "You are growing, even on slow days.",
  "Let softness fill your day.",
  "You are more than your mood.",
  "Trust the process—you’re evolving."
];

const MoodDetectionChoice = () => {
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  const cardRef = useRef(null);

  // ⭐ Sound effect
  const playClickSound = () => {
    const audio = new Audio(
      "https://cdn.pixabay.com/audio/2022/03/15/audio_7a0fd4e7b8.mp3"
    );
    audio.volume = 0.4;
    audio.play();
  };

  // ⭐ Quote Rotation (5–6 quotes at a time)
  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      index++;

      // reshuffle after every 6 quotes
      if (index % 6 === 0) {
        quotes.sort(() => Math.random() - 0.5);
      }

      setCurrentQuote(quotes[index % quotes.length]);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // ⭐ Parallax
  useEffect(() => {
    const handleMove = (event) => {
      const card = cardRef.current;
      if (!card) return;

      const x = (window.innerWidth / 2 - event.clientX) / 40;
      const y = (window.innerHeight / 2 - event.clientY) / 40;

      card.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="mood-wrapper">

      {/* Shooting Stars */}
      <div className="shooting-star star1"></div>
      <div className="shooting-star star2"></div>
      <div className="shooting-star star3"></div>

      {/* Sparkles */}
      <div className="sparkle s1"></div>
      <div className="sparkle s2"></div>
      <div className="sparkle s3"></div>
      <div className="sparkle s4"></div>

      {/* Emojis */}
      <div className="emoji e1">🌈</div>
      <div className="emoji e2">✨</div>
      <div className="emoji e3">😊</div>
      <div className="emoji e4">💖</div>
      <div className="emoji e5">😌</div>

      {/* Quotes */}
      <div className="quote-box">
        <p key={currentQuote} className="quote-text fade-quote">{currentQuote}</p>
      </div>

      {/* Main Card */}
      <div className="mood-card" ref={cardRef}>
        <h1 className="main-title">Choose Your Mood Scan</h1>
        <p className="sub-text">Let MoodLens understand how you're feeling today.</p>

        <div className="options-row">
          <div
            className="option"
            onClick={() => {
              playClickSound();
              navigate("/photo-upload");
            }}
          >
            <div className="icon-circle">📸</div>
            <span>Upload Photo</span>
          </div>

          <div
            className="option"
            onClick={() => {
              playClickSound();
              navigate("/live-camera");
            }}
          >
            <div className="icon-circle">🎥</div>
            <span>Live Camera</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodDetectionChoice;
