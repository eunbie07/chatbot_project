// ✅ routes/summary.js (새로운 파일 생성)
const express = require('express');
const axios = require('axios');

const fastApiUrl = process.env.FASTAPI_URL || "http://fastapi.default.svc.cluster.local:3000";

const router = express.Router();

// GET /api/summary/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Summary 프록시 요청: ${userId}`);
    
    const response = await axios.get(`${fastApiUrl}/summary/${userId}`, {
      timeout: 10000, // 10초 타임아웃
    });
    
    console.log(`Summary 프록시 응답 성공: ${userId}`);
    res.json(response.data);
    
  } catch (error) {
    console.error('Summary 프록시 오류:', error.message);
    
    if (error.response) {
      // FastAPI에서 온 에러 응답
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      // 연결 거부
      res.status(503).json({ error: 'FastAPI 서버에 연결할 수 없습니다' });
    } else if (error.code === 'ETIMEDOUT') {
      // 타임아웃
      res.status(504).json({ error: '요청 시간이 초과되었습니다' });
    } else {
      // 기타 오류
      res.status(500).json({ error: 'Summary 데이터 조회 실패' });
    }
  }
});

module.exports = router;

