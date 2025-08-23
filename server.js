const express = require("express");
const cors = require("cors");
const { Innertube } = require("youtubei.js");

const app = express();
app.use(cors());

let yt;

// 🔹 Init YouTube client once
(async () => {
  yt = await Innertube.create();
})();

// ===== 1️⃣ Search YouTube videos =====
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });

  try {
    const search = await yt.search(query, { type: "video" });
    const results = search.videos.slice(0, 10).map((v) => ({
      title: v.title,
      uploader: v.author?.name,
      thumbnail: v.thumbnails?.[0]?.url,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      duration: v.duration,
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
    const videoId = new URL(url).searchParams.get("v");
    const info = await yt.getInfo(videoId);

    // pick best audio format
    const audio = info.streaming_data?.adaptive_formats.find(
      (f) => f.mime_type.includes("audio/")
    );

    if (!audio) return res.status(404).json({ error: "No audio found" });

    res.json({
      title: info.basic_info.title,
      uploader: info.basic_info.author,
      thumbnail: info.basic_info.thumbnail?.[0]?.url,
      audioUrl: audio.url,
    });
  } catch (err) {
    console.error("Audio error:", err);
    res.status(500).json({ error: "Failed to fetch audio", details: err.message });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
