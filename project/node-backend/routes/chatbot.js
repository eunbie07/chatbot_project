const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:3000/chat', req.body);
    console.log('🟣 /api/chat 요청 도착:', req.body);
    res.json(response.data);
  } catch (err) {
    console.error('FastAPI 프록시 오류:', err.message);
    res.status(500).json({ error: 'FastAPI 서버 응답 실패' });
  }
});

module.exports = router; // ✅ CommonJS 방식
