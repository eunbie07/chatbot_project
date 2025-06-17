# 컨테이너 안에서 (이미 들어가 있으니)
cat > ./routes/chatbot.js << 'EOF'
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // 환경변수 사용하고, 없으면 기본값 사용
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    const response = await axios.post(`${fastApiUrl}/chat`, req.body);
    console.log('🟣 /api/chat 요청 도착:', req.body);
    res.json(response.data);
  } catch (err) {
    console.error('FastAPI 프록시 오류:', err.message);
    res.status(500).json({ error: 'FastAPI 서버 응답 실패' });
  }
});

module.exports = router;
EOF