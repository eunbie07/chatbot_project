const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('🔵 FastAPI URL:', fastApiUrl);
    console.log('🟣 /api/log-convo 요청 도착:', req.body);
    
    const response = await axios.post(`${fastApiUrl}/log-convo`, req.body);
    res.json(response.data);
  } catch (err) {
    console.error('프록시 /log-convo 오류:', err.message);
    console.error('FastAPI URL:', process.env.FASTAPI_URL);
    res.status(500).json({ error: 'FastAPI 서버 응답 실패' });
  }
});

module.exports = router;
