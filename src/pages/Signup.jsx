import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

// Firebase imports
import { auth, db } from "../utils/firebaseConfig"; // Make sure this file exists
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // 1️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Store additional info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        email: email,
        createdAt: new Date()
      });

      // 3️⃣ Success popup
      alert("Signup successful! You can now login.");

      // 4️⃣ Redirect to login page
      navigate("/login");

    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed: " + error.message);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save user in Firestore if not exists
      await setDoc(doc(db, "users", user.uid), {
        fullName: user.displayName || "Google User",
        email: user.email,
        createdAt: new Date()
      });

      alert("Signup successful via Google!");
      navigate("/login");
    } catch (error) {
      console.error("Google signup error:", error);
      alert("Google signup failed: " + error.message);
    }
  };

  return (
    <div className="signup-page">
      <div className="animated-bg"></div>

      <header className="navbar">
        <div className="logo">MoodLens</div>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/signup" className="active">Sign Up</Link>
        </nav>
      </header>

      <section className="signup-container">
        <div className="signup-left">
          <h1>Welcome to MoodLens</h1>
          <p>Track your moods, understand yourself better, and start your emotional wellness journey today.</p>
        </div>

        <div className="signup-right">
          <div className="signup-card">
            <h2>Create Account</h2>

            <form onSubmit={handleSubmit}>
              <div className="input-box">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="input-box">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-box">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-box">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="main-btn">Create Account</button>
            </form>

            <p className="form-foot">
              Already have an account? <Link to="/login">Login</Link>
            </p>

            <div className="divider"><span>OR</span></div>

            <button className="google-btn" onClick={handleGoogleSignup}>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                width="20"
                alt="Google"
              />
              Sign up with Google
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Signup;
