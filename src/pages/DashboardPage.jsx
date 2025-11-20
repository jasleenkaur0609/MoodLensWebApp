import React, { useEffect, useState } from "react";
import { auth, db } from "../utils/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend } from "chart.js";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import "./DashboardPage.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend);

const moodsList = ["happy", "sad", "angry", "surprised", "neutral"];
const moodMapping = { happy:5, surprised:4, neutral:3, sad:2, angry:1 };

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [moods, setMoods] = useState([]);
  const [filterMood, setFilterMood] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const navigate = useNavigate();

  // ===== AUTH & FETCH DATA =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate("/login");
      else setUser(currentUser);
      fetchMoodData(currentUser?.uid);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchMoodData = async (uid) => {
    if (!uid) return;
    try {
      const q = query(collection(db, "users", uid, "moods"), orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMoods(data);
    } catch (err) {
      console.error(err);
      alert("Error fetching moods. Check Firebase rules/config.");
    }
  };

  // ====== FILTERING ======
  const filteredMoods = moods.filter(m => 
    (filterMood==="all"?true:m.mood===filterMood) &&
    (filterDate ? new Date(m.createdAt.seconds*1000).toISOString().split('T')[0]===filterDate : true)
  );

  // ====== CARD DATA ======
  const totalMoods = filteredMoods.length;
  const happyDays = filteredMoods.filter(m=>m.mood==="happy").length;
  const sadDays = filteredMoods.filter(m=>m.mood==="sad").length;
  const avgMood = totalMoods ? (filteredMoods.reduce((acc,m)=>acc+moodMapping[m.mood],0)/totalMoods).toFixed(2) : "N/A";
  const topMood = (()=>{ 
    const counts={};
    filteredMoods.forEach(m=>counts[m.mood]=(counts[m.mood]||0)+1);
    let max=0,key="N/A";
    Object.keys(counts).forEach(k=>{ if(counts[k]>max){max=counts[k]; key=k;}});
    return key;
  })();
  let streak=0,maxStreak=0;
  filteredMoods.forEach(m=>{ if(m.mood==="happy"){ streak++; if(streak>maxStreak) maxStreak=streak;} else streak=0; });

  // ====== CHART DATA ======
  const pieData = {
    labels:moodsList,
    datasets:[{
      data:moodsList.map(m=>filteredMoods.filter(x=>x.mood===m).length),
      backgroundColor:["#a18e5d","#5d7aa2","#a25d5d","#8b5da2","#7a7a7a"]
    }]
  };
  const barData = {
    labels:moodsList,
    datasets:[{
      label:"Mood Count",
      data:moodsList.map(m=>filteredMoods.filter(x=>x.mood===m).length),
      backgroundColor:["#a18e5d","#5d7aa2","#a25d5d","#8b5da2","#7a7a7a"]
    }]
  };
  const lineData = {
    labels: filteredMoods.map(m=>new Date(m.createdAt.seconds*1000).toLocaleDateString()),
    datasets:[{
      label:"Mood Trend",
      data: filteredMoods.map(m=>moodMapping[m.mood]),
      borderColor:"#f0c674",
      fill:false,
      tension:0.3
    }]
  };

  // ====== EXPORT ======
  const exportCSV = () => {
    if(!filteredMoods.length) return;
    let csv="Date,Mood,Note\n";
    filteredMoods.forEach(d=>{
      let dateStr=new Date(d.createdAt.seconds*1000).toISOString().split('T')[0];
      csv+=`${dateStr},${d.mood},"${d.note || ''}"\n`;
    });
    saveAs(new Blob([csv],{type:"text/csv"}),"mood_history.csv");
  };

  const exportPDF = () => {
    if(!filteredMoods.length) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("MoodLens Mood History",14,20);
    let y=30;
    filteredMoods.forEach(d=>{
      let dateStr=new Date(d.createdAt.seconds*1000).toISOString().split('T')[0];
      doc.setFontSize(12);
      doc.text(`${dateStr} - ${d.mood} - ${d.note || ""}`,14,y);
      y+=8;
      if(y>280){ doc.addPage(); y=20;}
    });
    doc.save("mood_history.pdf");
  };

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-header">
        <h1>MoodLens</h1>
        <button onClick={()=>signOut(auth).then(()=>navigate("/login"))}>Logout</button>
      </header>

      {/* DETECT MOOD BUTTON */}
      <div className="detect-mood">
        <h3>Detect Your Mood</h3>
        <button className="detect-btn" onClick={()=>navigate("/mood")}>
          <span className="btn-icon">🎯</span>
          Detect Mood
        </button>
      </div>

      {/* FILTERS & EXPORT */}
      <div className="header-controls">
        <div className="filters">
          <select value={filterMood} onChange={e=>setFilterMood(e.target.value)}>
            <option value="all">All Moods</option>
            {moodsList.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
        </div>
        <div className="export-buttons">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={exportPDF}>Export PDF</button>
        </div>
      </div>

      {/* CARDS */}
      <div className="cards-grid">
        <div className="card">Total Moods: {totalMoods}</div>
        <div className="card">Happy Days: {happyDays}</div>
        <div className="card">Sad Days: {sadDays}</div>
        <div className="card">Average Mood: {avgMood}</div>
        <div className="card">Top Mood: {topMood}</div>
        <div className="card">Happy Streak: {maxStreak}</div>
      </div>

      {/* PANELS */}
      <div className="container">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="chart-container"><Pie data={pieData} /></div>
          <div className="chart-container"><Bar data={barData} /></div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="recent-notes">
            <h3>Recent Notes</h3>
            <ul>
              {filteredMoods.slice(-5).reverse().map(m=>(
                <li key={m.id}>{new Date(m.createdAt.seconds*1000).toLocaleDateString()} - {m.mood} - {m.note || ""}</li>
              ))}
            </ul>
          </div>

          {/* HEATMAP */}
          <div className="chart-container heatmap-container">
            <h3>Mood Heatmap</h3>
            <div className="heatmap">
              {filteredMoods.map(m=>(
                <div key={m.id} data-mood={m.mood} data-note={m.note}></div>
              ))}
            </div>
          </div>

          {/* LINE CHART UNDER HEATMAP */}
          <div className="chart-container">
            <Line data={lineData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
