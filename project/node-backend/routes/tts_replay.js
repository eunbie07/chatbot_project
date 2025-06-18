// 📄 routes/tts_replay.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    const s3_key = req.body.s3_key;

    if (!s3_key) {
      return res.status(400).json({ error: "s3_key가 필요합니다." });
    }

    const filename = s3_key.split("/").pop();  // "tts_audio/xxx.mp3" → "xxx.mp3"
    const response = await axios.get(`${fastApiUrl}/tts_replay`, {
      params: { filename }
    });

    res.json(response.data);  // { url: ... }
  } catch (error) {
    console.error("❌ TTS 다시듣기 에러:", error.message);
    res.status(500).json({ error: "TTS 다시듣기 실패", detail: error.message });
  }
});

module.exports = router;
