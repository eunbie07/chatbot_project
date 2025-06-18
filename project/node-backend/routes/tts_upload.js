// 📄 routes/tts_upload.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  console.log("📥 /api/tts_upload 요청 수신:", req.body);

  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log("🔗 FastAPI로 요청 전송:", `${fastApiUrl}/tts_upload`);

    const response = await axios.post(`${fastApiUrl}/tts_upload`, req.body);

    console.log("📤 FastAPI 응답:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("❌ TTS 업로드 에러:", error.message);
    res.status(500).json({ error: "TTS 업로드 실패", detail: error.message });
  }
});


module.exports = router;
