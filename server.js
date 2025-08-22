const express = require("express");
const cors = require("cors");
const youtubedl = require("yt-dlp-exec");

const app = express();
app.use(cors());

app.get("/api/get-audio", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
    });

    // Find best audio format
    const audio = info.formats.find((f) => f.acodec !== "none" && f.vcodec === "none");

    res.json({
      title: info.title,
      uploader: info.uploader,
      thumbnail: info.thumbnail,
      audioUrl: audio.url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audio" });
  }
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
