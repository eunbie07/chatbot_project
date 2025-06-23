// routes/conversations.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 🔥 디버깅용 엔드포인트 추가 (다른 라우트보다 먼저 정의해야 함)
router.get('/:userId/debug', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    
    console.log(`🔧 Debug request for user: ${req.params.userId}`);
    
    const response = await axios.get(`${fastApiUrl}/conversations/${req.params.userId}/debug`);
    res.json(response.data);
  } catch (error) {
    console.error('디버깅 에러:', error.message);
    res.status(500).json({ error: '디버깅 실패', detail: error.message });
  }
});

// 대화 기록 조회
router.get('/:userId', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    const { limit = 10 } = req.query;
    
    console.log(`📋 Fetching conversations for user: ${req.params.userId}, limit: ${limit}`);
    
    const response = await axios.get(`${fastApiUrl}/conversations/${req.params.userId}?limit=${limit}`);
    
    console.log(`✅ Found ${response.data.conversations?.length || 0} conversations`);
    
    res.json(response.data);
  } catch (error) {
    console.error('대화 기록 조회 에러:', error.message);
    res.status(500).json({ error: '대화 기록 조회 실패', detail: error.message });
  }
});

// 최근 대화 조회
router.get('/:userId/latest', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    
    console.log(`🕒 Fetching latest conversation for user: ${req.params.userId}`);
    
    const response = await axios.get(`${fastApiUrl}/conversations/${req.params.userId}/latest`);
    
    console.log(`✅ Latest conversation found: ${response.data.conversation ? 'Yes' : 'No'}`);
    
    res.json(response.data);
  } catch (error) {
    console.error('최근 대화 조회 에러:', error.message);
    res.status(500).json({ error: '최근 대화 조회 실패', detail: error.message });
  }
});

// routes/conversations.js에 추가
router.get('/:userId/all-dates', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    
    const response = await axios.get(`${fastApiUrl}/conversations/${req.params.userId}/all-dates`);
    res.json(response.data);
  } catch (error) {
    console.error('날짜 조회 에러:', error.message);
    res.status(500).json({ error: '날짜 조회 실패', detail: error.message });
  }
});

// 대화 분석
router.get('/:userId/analytics', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    
    console.log(`📊 Fetching analytics for user: ${req.params.userId}`);
    
    const response = await axios.get(`${fastApiUrl}/conversations/${req.params.userId}/analytics`);
    
    console.log(`✅ Analytics: ${response.data.totalSessions} sessions, ${response.data.improvementRate}% improvement`);
    
    res.json(response.data);
  } catch (error) {
    console.error('대화 분석 에러:', error.message);
    res.status(500).json({ error: '대화 분석 실패', detail: error.message });
  }
});

module.exports = router;