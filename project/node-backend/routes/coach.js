const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await axios.get(`http://13.237.236.117:3000/coach/${userId}`);
    res.json(response.data);
  } catch (err) {
    console.error('AI 코치 프록시 오류:', err.message);
    res.status(500).json({ error: 'FastAPI 연결 실패' });
  }
});

module.exports = router; // ✅ CommonJS 방식
