// node-backend/routes/actuals.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await axios.get(`http://localhost:3000/actuals/${userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('FastAPI 연동 오류:', error.message);
    res.status(500).json({ error: 'FastAPI에서 데이터를 가져오는 중 오류 발생' });
  }
});

module.exports = router;
