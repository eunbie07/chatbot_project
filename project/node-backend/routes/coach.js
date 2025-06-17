const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    const { userId } = req.params;
    const response = await axios.get(`${fastApiUrl}/fastapi/coach/${userId}`);
    res.json(response.data);
  } catch (err) {
    console.error('프록시 오류:', err.message);
    res.status(500).json({ error: 'FastAPI 서버 응답 실패' });
  }
});

module.exports = router;
