const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

const app = express();
app.use(cors());

// ===== Root route (health check) =====
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "🎶 Zema Backend is running" });
});

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

    // Prefer itag 140 (m4a)
    let audio = info.formats.find((f) => f.itag === 140);
    if (!audio) {
      const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
      audio = audioFormats[0];
    }

    if (!audio) return res.status(404).json({ error: "No audio format found" });

    res.json({
      title: info.videoDetails.title,
      uploader: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.pop().url,
      audioUrl: audio.url,
    });
  } catch (err) {
    console.error("Audio error:", err);
    res.status(500).json({ error: "Failed to fetch audio", details: err.message });
  }
});

// ===== 3️⃣ Proxy stream =====
app.get("/api/stream", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    ytdl(url, { filter: "audioonly", quality: "highestaudio" }).pipe(res);
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).send("Stream failed");
  }
});

// ===== Start Server =====
const PORT = process.env.PORT; // Render assigns this automatically
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
