import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MoodPage from './pages/MoodPage';
import DashboardPage from './pages/DashboardPage'; // ✅ default import
import AdminPage from './pages/AdminPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Musicselector from './pages/Musicselector';
import MoodDetectionChoice from './pages/MoodDetectionChoice';
import PhotoMoodPage from './pages/PhotoMoodPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mood" element={<MoodPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/musicselector" element={<Musicselector />} />
        <Route path="/photo-upload" element={<PhotoMoodPage />} />
        <Route path="/mood-choice" element={<MoodDetectionChoice />} />

      </Routes>
    </Router>
  );
}

export default App;
