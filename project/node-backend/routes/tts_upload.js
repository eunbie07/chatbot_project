// 📄 routes/tts_upload.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    const response = await axios.post(`${fastApiUrl}/tts_upload`, req.body);
    res.json(response.data);  // { url, s3_key }
  } catch (error) {
    console.error("❌ TTS 업로드 에러:", error.message);
    res.status(500).json({ error: "TTS 업로드 실패", detail: error.message });
  }
});

module.exports = router;
