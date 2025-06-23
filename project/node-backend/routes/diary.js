// routes/diary.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 일기 항목들 조회
router.get('/entries/:userId', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('🔵 감정-소비 다이어리 조회:', req.params.userId);
    
    const response = await axios.get(`${fastApiUrl}/diary/entries/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('다이어리 조회 에러:', error.message);
    res.status(500).json({ error: '다이어리 조회 실패', detail: error.message });
  }
});

// 수정된 버전
router.post('/entries/:userId', async (req, res) => {  // ✅ :userId 추가
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('🟣 새 일기 생성:', req.params.userId, req.body);
        
    const response = await axios.post(`${fastApiUrl}/diary/entries/${req.params.userId}`, req.body);  // ✅ user_id 추가
    res.json(response.data);
  } catch (error) {
    console.error('일기 생성 에러:', error.message);
    res.status(500).json({ error: '일기 생성 실패', detail: error.message });
  }
});

// 소비 패턴 분석
router.get('/analytics/:userId', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('🔵 소비 패턴 분석:', req.params.userId);
    
    const response = await axios.get(`${fastApiUrl}/diary/analytics/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    console.error('분석 에러:', error.message);
    res.status(500).json({ error: '분석 실패', detail: error.message });
  }
});

module.exports = router;