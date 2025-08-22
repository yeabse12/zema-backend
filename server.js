const express = require("express");
const cors = require("cors");
const ytSearch = require("yt-search");
const youtubedl = require("yt-dlp-exec");

const app = express();
app.use(cors());

// ===== 1️⃣ Search YouTube videos =====
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });

  try {
    const r = await ytSearch(query);
    const videos = r.videos.slice(0, 10); // Limit to 10 results
    const results = videos.map(v => ({
      title: v.title,
      uploader: v.author.name,
      thumbnail: v.thumbnail,
      url: v.url
    }));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// ===== 2️⃣ Get audio URL for a video =====
app.get("/api/get-audio", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing video URL" });

  try {
    // Use yt-dlp to get video info
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
    });

    // Select best audio-only format
    const audio = info.formats.find(f => f.acodec !== "none" && f.vcodec === "none");
    if (!audio) return res.json({ error: "No audio found" });

    res.json({
      title: info.title,
      uploader: info.uploader,
      thumbnail: info.thumbnail,
      audioUrl: audio.url
    });
  } catch (err) {
    console.error("Error fetching audio:", err.message);
    res.status(500).json({ error: "Failed to fetch audio" });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
