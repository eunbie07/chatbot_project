const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('🔵 FastAPI URL:', fastApiUrl);
    console.log('🟣 /api/tts 요청 도착:', req.body);
    
    const response = await axios.post(`${fastApiUrl}/tts`, req.body, {
      responseType: 'arraybuffer',
    });

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);
  } catch (error) {
    console.error('TTS 에러:', error.message);
    res.status(500).json({ error: 'TTS 요청 실패', detail: error.message });
  }
});

module.exports = router;