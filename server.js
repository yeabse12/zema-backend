const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

const app = express();
app.use(cors());

// Search YouTube
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });

  try {
    const results = await ytSearch(query);
    const videos = results.videos.slice(0, 5).map(video => ({
      title: video.title,
      uploader: video.author.name,
      thumbnail: video.thumbnail,
      url: video.url,
    }));
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search YouTube" });
  }
});

// Get audio URL
app.get("/api/get-audio", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

  try {
    const info = await ytdl.getInfo(url);
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" });
    res.json({
      title: info.videoDetails.title,
      uploader: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.pop().url,
      audioUrl: audioFormat.url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audio" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
