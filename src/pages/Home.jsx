import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // We'll create this file for all styles

export default function Home() {
  return (
    <div className="home-container">

      {/* NAVBAR */}
      <header className="header">
        <div className="logo">MoodLens</div>
        <nav>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#benefits">Benefits</a>
          <a href="#about">About</a>
          <Link to="/login" className="btn">Login</Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <h1 className="big-title">Understand Emotions With AI</h1>
        <p className="hero-sub">
          MoodLens uses advanced face-expression AI to detect your emotions in real time
          and help you improve your mental well-being, productivity, and self-awareness.
        </p>
        <Link to="/login" className="start-btn">Start Your Emotional Journey →</Link>
        
      </section>

      {/* PROBLEM SECTION */}
      <section className="problem">
        <h2>Why MoodLens?</h2>
        <p>
          70% people struggle to track their emotional health. Traditional apps require 
          the user to type their feelings manually — which most people avoid.
        </p>
        <p className="highlight">
          MoodLens solves this using <strong>AI-powered automatic mood detection</strong>,  
          so users don’t need to do anything — simply look at the camera.
        </p>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="features">
        <h2>Powerful Features</h2>
        <div className="feature-cards">
          <div className="f-card">
            <h3>🎭 Real-Time Mood Detection</h3>
            <p>Uses deep learning to analyze your face and detect emotions such as: Happy, Sad, Angry, Fear, Surprise, Neutral & more.</p>
          </div>
          <div className="f-card">
            <h3>📊 Mood Tracking Dashboard</h3>
            <p>Track emotional changes over hours, days, and weeks through beautiful charts.</p>
          </div>
          <div className="f-card">
            <h3>🎵 Personalized Music Suggestions</h3>
            <p>Your current mood is matched with curated music playlists.</p>
          </div>
          <div className="f-card">
            <h3>✨ Interactive UI</h3>
            <p>A clean, animated design built to impress judges, investors, and users.</p>
          </div>
          <div className="f-card">
            <h3>🔥 Mood History Timeline</h3>
            <p>See how your emotions fluctuate daily with timestamped logs.</p>
          </div>
          <div className="f-card">
            <h3>🔒 Secure with Firebase</h3>
            <p>Login + signup authentication and encrypted cloud data storage.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="how">
        <h2>How MoodLens Works</h2>
        <div className="steps">
          <div className="step">
            <h3>1️⃣ Login or Sign Up</h3>
            <p>Create an account to store your emotional data securely.</p>
          </div>
          <div className="step">
            <h3>2️⃣ Allow Camera Access</h3>
            <p>Your webcam helps the AI detect facial expressions in real time.</p>
          </div>
          <div className="step">
            <h3>3️⃣ AI Analyzes Your Emotions</h3>
            <p>Our trained TensorFlow model identifies your mood instantly.</p>
          </div>
          <div className="step">
            <h3>4️⃣ Get Insights & Suggestions</h3>
            <p>Receive mood-based recommendations including playlists, activities, and wellness tips.</p>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="benefits">
        <h2>The Impact of MoodLens</h2>
        <div className="benefit-list">
          <div className="benefit">✔ Enhances emotional self-awareness</div>
          <div className="benefit">✔ Helps track mental health trends</div>
          <div className="benefit">✔ Boosts productivity & focus</div>
          <div className="benefit">✔ Supports therapy & mood monitoring</div>
          <div className="benefit">✔ Perfect for corporate wellness programs</div>
          <div className="benefit">✔ Useful for students, professionals & creators</div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about">
        <h2>The Vision Behind MoodLens</h2>
        <p>
          MoodLens was created to bridge the gap between technology and emotional health.
          With rising stress levels around the world, there is a need for tools that help humans
          understand themselves better.
        </p>
        <p>Our mission is simple:</p>
        <p className="highlight">“Make emotional intelligence accessible through AI.”</p>
        <p>
          This project uses cutting-edge machine learning techniques, TensorFlow.js models,
          Firebase authentication, and a beautifully designed interface to create a product
          that feels alive, personal, and caring.
        </p>
        <p>
          Whether you are presenting this to judges, investors, or end users,
          MoodLens showcases how AI can transform the way we understand emotions.
        </p>
      </section>

      {/* CTA */}
      <section className="cta">
        <h1>Ready to Discover Your Emotions?</h1>
        <Link to="/login" className="start-btn big">Start Now</Link>
      </section>

      {/* FOOTER */}
      <footer>
        <p>© 2025 MoodLens — AI Emotion Intelligence</p>
      </footer>

    </div>
  );
}
