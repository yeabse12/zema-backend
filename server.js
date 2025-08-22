const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

const app = express();
app.use(cors());

// Search YouTube videos
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

// Get audio URL for a video
app.get("/api/get-audio", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing video URL" });

  try {
    const info = await ytdl.getInfo(url);
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
    if (!audioFormat?.url) return res.json({ error: "No audio found" });

    res.json({
      title: info.videoDetails.title,
      uploader: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.pop().url,
      audioUrl: audioFormat.url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audio" });
  }
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
