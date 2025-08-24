const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

const app = express();
app.use(cors());

// ===== 1️⃣ Search YouTube videos =====
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });

  try {
    const r = await ytSearch(query);
    const results = r.videos.slice(0, 10).map((v) => ({
      title: v.title,
      uploader: v.author.name,
      thumbnail: v.thumbnail,
      url: v.url,
      duration: v.timestamp,
    }));
    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed", details: err.message });
  }
});

// ===== 2️⃣ Get audio URL =====
app.get("/api/get-audio", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing video URL" });

  try {
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const info = await ytdl.getInfo(url);
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

    if (!audioFormats.length) {
      return res.status(404).json({ error: "No audio format found" });
    }

    // Pick first/best audio format
    res.json({
      title: info.videoDetails.title,
      uploader: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.pop().url,
      audioUrl: audioFormats[0].url,
    });
  } catch (err) {
    console.error("Audio error:", err);
    res.status(500).json({ error: "Failed to fetch audio", details: err.message });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
