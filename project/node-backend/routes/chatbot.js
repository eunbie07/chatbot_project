const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('🔵 FastAPI URL:', fastApiUrl);
    console.log('🟣 /api/chat 요청 도착:', req.body);
    
    // user_id가 없으면 기본값 추가
    const requestData = {
      message: req.body.message,
      user_id: req.body.user_id || 'default_user'
    };
    
    const response = await axios.post(`${fastApiUrl}/chat`, requestData);
    res.json(response.data);
  } catch (err) {
    console.error('FastAPI 프록시 오류:', err.message);
    console.error('FastAPI URL:', process.env.FASTAPI_URL);
    res.status(500).json({ error: 'FastAPI 서버 응답 실패' });
  }
});

module.exports = router;
