import React, { useEffect, useState } from "react";
import { auth, db } from "../utils/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Bar, Pie, Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import "./DashboardPage.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const moodsList = ["happy", "sad", "angry", "surprised", "neutral"];
const moodMapping = { happy: 5, surprised: 4, neutral: 3, sad: 2, angry: 1 };

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [moods, setMoods] = useState([]);
  const [filterMood, setFilterMood] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // ⭐ NEW — CONFIDENCE OBJECT
  const [confidence, setConfidence] = useState(null);

  const navigate = useNavigate();

  // AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate("/login");
      else {
        setUser(currentUser);
        fetchMoodData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // FETCH MOOD DATA
  const fetchMoodData = async (uid) => {
    if (!uid) return;

    try {
      const q = query(collection(db, "mood"), orderBy("timestamp", "asc"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((m) => m.userId === uid);

      setMoods(data);

      // ⭐ EXTRACT FULL CONFIDENCE OBJECT FROM LAST ENTRY
      if (data.length > 0 && data[data.length - 1].confidence) {
        setConfidence(data[data.length - 1].confidence);
      }

    } catch (err) {
      console.error("Error fetching moods:", err);
      alert("Error fetching moods. Check Firebase rules.");
    }
  };

  // FILTER LOGIC
  const filteredMoods = moods.filter((m) => {
    const date =
      m.timestamp?.seconds
        ? new Date(m.timestamp.seconds * 1000)
        : new Date(m.timestamp);

    const formatted = date.toISOString().split("T")[0];

    return (
      (filterMood === "all" ? true : m.detectedMood === filterMood) &&
      (filterDate ? formatted === filterDate : true)
    );
  });

  // STATISTICS
  const totalMoods = filteredMoods.length;
  const happyDays = filteredMoods.filter((m) => m.detectedMood === "happy").length;
  const sadDays = filteredMoods.filter((m) => m.detectedMood === "sad").length;

  const avgMood = totalMoods
    ? (
        filteredMoods.reduce(
          (acc, m) => acc + moodMapping[m.detectedMood],
          0
        ) / totalMoods
      ).toFixed(2)
    : "N/A";

  const topMood = (() => {
    const counts = {};
    filteredMoods.forEach(
      (m) => (counts[m.detectedMood] = (counts[m.detectedMood] || 0) + 1)
    );

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  })();

  let streak = 0,
    maxStreak = 0;
  filteredMoods.forEach((m) => {
    if (m.detectedMood === "happy") {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 0;
    }
  });

  // CHART DATA
  const pieData = {
    labels: moodsList,
    datasets: [
      {
        data: moodsList.map(
          (m) => filteredMoods.filter((x) => x.detectedMood === m).length
        ),
        backgroundColor: ["#a18e5d", "#5d7aa2", "#a25d5d", "#8b5da2", "#7a7a7a"]
      }
    ]
  };

  const barData = {
    labels: moodsList,
    datasets: [
      {
        label: "Mood Count",
        data: moodsList.map(
          (m) => filteredMoods.filter((x) => x.detectedMood === m).length
        ),
        backgroundColor: ["#a18e5d", "#5d7aa2", "#a25d5d", "#8b5da2", "#7a7a7a"]
      }
    ]
  };

  const lineData = {
    labels: filteredMoods.map((m) =>
      new Date(m.timestamp.seconds * 1000).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Mood Trend",
        data: filteredMoods.map((m) => moodMapping[m.detectedMood]),
        borderColor: "#f0c674",
        fill: false,
        tension: 0.3
      }
    ]
  };

  // EXPORT CSV
  const exportCSV = () => {
    if (!filteredMoods.length) return;

    let csv = "Date,Mood,Note\n";

    filteredMoods.forEach((d) => {
      const dateStr = new Date(d.timestamp.seconds * 1000)
        .toISOString()
        .split("T")[0];

      csv += `${dateStr},${d.detectedMood},"${d.note || ""}"\n`;
    });

    saveAs(new Blob([csv], { type: "text/csv" }), "mood_history.csv");
  };

  // EXPORT PDF
  const exportPDF = () => {
    if (!filteredMoods.length) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("MoodLens Mood History", 14, 20);

    let y = 30;

    filteredMoods.forEach((d) => {
      const dateStr = new Date(d.timestamp.seconds * 1000)
        .toISOString()
        .split("T")[0];

      doc.setFontSize(12);
      doc.text(`${dateStr} - ${d.detectedMood} - ${d.note || ""}`, 14, y);

      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("mood_history.pdf");
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>MoodLens</h1>
        <button onClick={() => signOut(auth).then(() => navigate("/login"))}>
          Logout
        </button>
      </header>

      <div className="detect-mood">
        <h3>Detect Your Mood</h3>
        <button className="detect-btn" onClick={() => navigate("/mood-choice")}>
          🎯 Detect Mood
        </button>
      </div>

      <div className="header-controls">
        <div className="filters">
          <select value={filterMood} onChange={(e) => setFilterMood(e.target.value)}>
            <option value="all">All Moods</option>
            {moodsList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <div className="export-buttons">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={exportPDF}>Export PDF</button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="cards-grid">
        <div className="card">Total Moods: {totalMoods}</div>
        <div className="card">Happy Days: {happyDays}</div>
        <div className="card">Sad Days: {sadDays}</div>
        <div className="card">Average Mood: {avgMood}</div>
        <div className="card">Top Mood: {topMood}</div>
        <div className="card">Happy Streak: {maxStreak}</div>
      </div>

      {/* ⭐ CONFIDENCE ANALYTICS SECTION */}
      <div className="confidence-analytics">
        <h2>AI Confidence Analysis</h2>

        {confidence ? (
          <div className="confidence-charts">

            {/* BAR CHART */}
            <div className="chart-container">
              <h3>Confidence Bar Chart</h3>
              <Bar
                data={{
                  labels: Object.keys(confidence),
                  datasets: [
                    {
                      label: "Confidence (%)",
                      data: Object.values(confidence),
                      backgroundColor: [
                        "#FFB3BA",
                        "#BAE1FF",
                        "#FFFFBA",
                        "#BFFCC6",
                        "#FFDFBA",
                        "#C7CEEA",
                        "#B5EAD7"
                      ]
                    }
                  ]
                }}
              />
            </div>

            {/* PIE CHART */}
            <div className="chart-container">
              <h3>Confidence Pie Chart</h3>
              <Pie
                data={{
                  labels: Object.keys(confidence),
                  datasets: [
                    {
                      label: "AI Confidence",
                      data: Object.values(confidence),
                      backgroundColor: [
                        "#FFB3BA",
                        "#BAE1FF",
                        "#FFFFBA",
                        "#BFFCC6",
                        "#FFDFBA",
                        "#C7CEEA",
                        "#B5EAD7"
                      ]
                    }
                  ]
                }}
              />
            </div>

          </div>
        ) : (
          <p>No confidence data available</p>
        )}
      </div>

      {/* PANELS */}
      <div className="container">
        <div className="left-panel">
          <div className="chart-container">
            <Pie data={pieData} />
          </div>
          <div className="chart-container">
            <Bar data={barData} />
          </div>
        </div>

        <div className="right-panel">
          <div className="recent-notes">
            <h3>Recent Notes</h3>
            <ul>
              {filteredMoods
                .slice(-5)
                .reverse()
                .map((m) => (
                  <li key={m.id}>
                    {new Date(m.timestamp.seconds * 1000).toLocaleDateString()} -{" "}
                    {m.detectedMood} - {m.note || ""}
                  </li>
                ))}
            </ul>
          </div>

          <div className="chart-container heatmap-container">
            <h3>Mood Heatmap</h3>
            <div className="heatmap">
              {filteredMoods.map((m) => (
                <div key={m.id} data-mood={m.detectedMood}></div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <Line data={lineData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
