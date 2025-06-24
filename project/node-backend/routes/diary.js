// routes/diary.js
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const router = express.Router();

// ✅ 멀터 설정 (메모리에 저장)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
});

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

// 새 일기 생성
router.post('/entries/:userId', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('🟣 새 일기 생성:', req.params.userId, req.body);
         
    const response = await axios.post(`${fastApiUrl}/diary/entries/${req.params.userId}`, req.body);
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

// ✅ OCR 엔드포인트 - 파일 업로드
router.post('/ocr/receipt', upload.single('image'), async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('📷 영수증 OCR 요청');
     
    if (!req.file) {
      return res.status(400).json({ 
        success: false, // ✅ success 필드 추가
        error: '이미지 파일이 필요합니다.' 
      });
    }

    console.log(`📁 파일 정보: ${req.file.originalname}, 크기: ${req.file.size} bytes`); // ✅ 로그 추가
     
    // FormData로 FastAPI에 전송
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
     
    const response = await axios.post(`${fastApiUrl}/ocr/receipt`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30초 타임아웃
      maxContentLength: Infinity, // ✅ 추가: 대용량 파일 지원
      maxBodyLength: Infinity     // ✅ 추가: 대용량 파일 지원
    });

    console.log('✅ OCR 처리 완료:', response.data.success); // ✅ 성공 로그 추가
    res.json(response.data);
    
  } catch (error) {
    console.error('OCR 처리 에러:', error.message);
    
    // ✅ 더 자세한 에러 처리
    if (error.response) {
      // FastAPI에서 온 에러 응답
      console.error('FastAPI 에러 응답:', error.response.data);
      res.status(error.response.status).json({
        success: false,
        error: 'OCR 처리 실패',
        detail: error.response.data?.error || error.message
      });
    } else if (error.code === 'ECONNREFUSED') {
      // 연결 거부 에러
      res.status(503).json({
        success: false,
        error: 'FastAPI 서버에 연결할 수 없습니다',
        detail: 'FastAPI 서버가 실행 중인지 확인해주세요'
      });
    } else {
      // 기타 에러
      res.status(500).json({ 
        success: false, 
        error: 'OCR 처리 실패', 
        detail: error.message 
      });
    }
  }
});

// ✅ Base64 OCR 엔드포인트
router.post('/ocr/receipt-base64', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    console.log('📷 Base64 영수증 OCR 요청');

    if (!req.body.image) { // ✅ 입력 검증 추가
      return res.status(400).json({
        success: false,
        error: 'Base64 이미지 데이터가 필요합니다.'
      });
    }
     
    const response = await axios.post(`${fastApiUrl}/ocr/receipt-base64`, req.body, {
      timeout: 30000,
      headers: { // ✅ 헤더 명시적 설정
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Base64 OCR 처리 완료:', response.data.success);
    res.json(response.data);
    
  } catch (error) {
    console.error('Base64 OCR 처리 에러:', error.message);
    
    // ✅ 동일한 에러 처리 패턴 적용
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: 'OCR 처리 실패',
        detail: error.response.data?.error || error.message
      });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: 'FastAPI 서버에 연결할 수 없습니다',
        detail: 'FastAPI 서버가 실행 중인지 확인해주세요'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'OCR 처리 실패', 
        detail: error.message 
      });
    }
  }
});

// ✅ OCR 서비스 상태 확인 엔드포인트 추가
router.get('/ocr/health', async (req, res) => {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:3000';
    const response = await axios.get(`${fastApiUrl}/ocr/health`);
    res.json(response.data);
  } catch (error) {
    console.error('OCR 상태 확인 에러:', error.message);
    res.status(500).json({
      status: "ERROR",
      message: "OCR 서비스 연결 실패",
      detail: error.message
    });
  }
});

module.exports = router;