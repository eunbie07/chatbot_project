const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3000//logs', { params: req.query });
    res.json(response.data);
  } catch (err) {
    console.error('FastAPI 프록시 오류:', err.message);
    res.status(500).json({ error: 'FastAPI 서버 응답 실패' });
  }
});

module.exports = router; // ✅ CommonJS 방식
