const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Multer setup for temporary uploads
const upload = multer({ dest: "uploads/" });

// Test route
app.get("/", (req, res) => {
  res.send("Mood detection backend running!");
});

/* ======================================================
   📸 MOOD DETECTION USING PYTHON SCRIPT
====================================================== */

app.post("/api/mood-detect", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No file uploaded" });

  const imgPath = path.resolve(req.file.path);

  // Execute Python script
  exec(`python emotion.py "${imgPath}"`, (err, stdout, stderr) => {
    // Always delete temp uploaded file
    fs.unlink(imgPath, (unlinkErr) => {
      if (unlinkErr) console.error("Temp file delete failed:", unlinkErr);
    });

    if (err) {
      console.error("Python Error:", err);
      console.error("stderr:", stderr);
      return res.status(500).json({ error: "Python script failed" });
    }

    try {
      const data = JSON.parse(stdout);

      return res.json({
        detectedMood: data.detectedMood || "unknown",
        confidence: data.confidence || {},
      });

    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr);
      console.error("Python Output:", stdout);

      return res.status(500).json({
        error: "Invalid output from Python script",
      });
    }
  });
});

/* ======================================================
   🚀 START SERVER
====================================================== */

app.listen(PORT, () =>
  console.log(`Server running successfully on port ${PORT}`)
);
