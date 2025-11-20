import React, { useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";

// Firebase imports
import { auth } from "../utils/firebaseConfig";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();

  // Email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);

      alert("Login successful!"); // Success popup
      navigate("/dashboard"); // Redirect to dashboard or home page

    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check your email and password."); // Error popup
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      alert("Login successful via Google!");
      navigate("/dashboard"); // Redirect after success
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1>Welcome Back!</h1>
        <p>Track your emotions & start your mood journey</p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="login-btn">Login</button>
          </form>

          <p className="or-text">OR</p>

          <button className="google-btn" onClick={handleGoogleLogin}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
            Sign in with Google
          </button>

          <p className="signup-text">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
