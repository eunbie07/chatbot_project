// EmotionConsumptionDiary.js
import React, { useRef, useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { X, Check, Brain, Receipt } from 'lucide-react';
import '../styles/EmotionConsumptionDiary.css';

// 로컬 이미지 매핑 (실제 존재하는 파일만)
const CONSUMPTION_IMAGES = {
  충동구매: {
    '우울': '/emotions/impulse-sad.png',
    '스트레스': '/emotions/impulse-stress.png', // 배열에서 단일 이미지로 변경
    '화남': '/emotions/impulse-angry.png',
    '외로움': '/emotions/impulse-lonely.png'
  },
  폭식: {
    '스트레스': '/emotions/binge-stress.png',
    '우울': '/emotions/binge-sad.png',
    '지루함': '/emotions/binge-bored.png',
    '외로움': '/emotions/binge-lonely.png'
  },
  패션소비: {
    '스트레스': '/emotions/fashion-stress.png'
  },
  카페소비: {
    '중립': '/emotions/cafe.png'
  }
};

// 기본 이미지 매핑 (다양한 버전)
const FALLBACK_IMAGES = {
  게임결제: [
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop&q=80'
  ],
  배달음식: [
    'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&q=80'
  ],
  술소비: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop&q=80',
  취미소비: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&q=80',
  패션소비: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&q=80'
  ],
  카페소비: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&q=80',
  음식소비: '/emotions/food-2.png',
  필수소비: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&q=80'
};

// 샘플 데이터
const SAMPLE_DIARY_ENTRIES = [
  {
    id: 1,
    date: '2025-06-23',
    text: '스트레스를 받아서 온라인 쇼핑몰에서 옷을 5만원어치 샀다.',
    emotion: '스트레스',
    consumptionType: '충동구매',
    amount: 50000,
    satisfaction: 2,
    advice: '스트레스를 받을 때는 쇼핑 대신 산책이나 운동을 해보세요.'
  },
  {
    id: 2,
    date: '2025-06-21',
    text: '우울해서 치킨을 3만원어치 시켜먹었는데 배만 아프고 더 우울해졌다.',
    emotion: '우울',
    consumptionType: '폭식',
    amount: 30000,
    satisfaction: 1,
    advice: '감정적으로 힘들 때는 친구와 대화하거나 따뜻한 차를 마시며 휴식을 취해보세요.',
    receiptData: {
      store: '치킨나라',
      items: ['양념치킨 1마리', '콜라 2병'],
      totalAmount: 30000
    }
  }
];

// 이미지 경로 가져오기 함수 (강화된 버전)
const getConsumptionImage = (emotion, consumptionType, entryId) => {
  console.log('getConsumptionImage 호출:', { emotion, consumptionType, entryId });
  
  const images = CONSUMPTION_IMAGES[consumptionType]?.[emotion];
  console.log('매핑된 이미지:', images);
  
  // 배열인 경우
  if (Array.isArray(images) && images.length > 0) {
    const index = (entryId || 0) % images.length;
    const selectedImage = images[index];
    console.log('배열에서 선택된 이미지:', selectedImage, '(인덱스:', index, ')');
    
    // undefined 체크
    if (selectedImage && typeof selectedImage === 'string') {
      return selectedImage;
    }
    console.log('배열 이미지가 유효하지 않음, fallback으로 이동');
  }
  
  // 단일 이미지인 경우
  if (images && typeof images === 'string') {
    console.log('단일 이미지 사용:', images);
    return images;
  }
  
  // fallback 이미지들
  const fallbackImages = FALLBACK_IMAGES[consumptionType];
  console.log('fallback 이미지 확인:', fallbackImages);
  
  if (Array.isArray(fallbackImages) && fallbackImages.length > 0) {
    const index = (entryId || 0) % fallbackImages.length;
    const selectedFallback = fallbackImages[index];
    console.log('fallback 배열에서 선택:', selectedFallback);
    
    if (selectedFallback && typeof selectedFallback === 'string') {
      return selectedFallback;
    }
  }
  
  if (fallbackImages && typeof fallbackImages === 'string') {
    console.log('fallback 단일 이미지 사용:', fallbackImages);
    return fallbackImages;
  }
  
  // 최종 기본 이미지
  const defaultImage = '/emotions/default.png';
  console.log('최종 기본 이미지 사용:', defaultImage);
  return defaultImage;
};

// 안전한 이미지 컴포넌트 (개선된 버전)
const SafeImage = ({ emotion, consumptionType, entryId, alt }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const src = getConsumptionImage(emotion, consumptionType, entryId);
    console.log('SafeImage: 이미지 소스 설정:', src);
    setImageSrc(src);
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
  }, [emotion, consumptionType, entryId]);

  const handleLoad = () => {
    console.log('SafeImage: 이미지 로딩 성공:', imageSrc);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleError = () => {
    console.log('SafeImage: 이미지 로딩 실패:', imageSrc, 'retry:', retryCount);
    
    if (retryCount === 0) {
      // 첫 번째 실패: 기본 이미지로 시도
      console.log('SafeImage: 기본 이미지로 재시도');
      setImageSrc('/emotions/default.png');
      setRetryCount(1);
      setImageError(false);
    } else if (retryCount === 1) {
      // 두 번째 실패: 안전한 외부 이미지로 시도
      console.log('SafeImage: 외부 이미지로 재시도');
      setImageSrc('https://via.placeholder.com/400x300/f8f9fa/6c757d?text=Image+Not+Found');
      setRetryCount(2);
      setImageError(false);
    } else {
      // 최종 실패: 에러 상태로 표시
      console.log('SafeImage: 최종 실패, 에러 상태로 전환');
      setImageError(true);
      setImageLoaded(false);
    }
  };

  // 에러 상태일 때
  if (imageError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#f8f9fa',
        color: '#6c757d',
        textAlign: 'center',
        padding: '20px',
        borderRadius: '16px'
      }}>
        <span style={{ fontSize: '2rem', marginBottom: '8px' }}>🖼️</span>
        <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: '1.4' }}>
          이미지를 불러올 수 없습니다
        </p>
        <small style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>
          {emotion} · {consumptionType}
        </small>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 로딩 상태 */}
      {!imageLoaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          color: '#6c757d',
          zIndex: 2,
          borderRadius: '16px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e9ecef',
            borderTop: '2px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '8px'
          }} />
          <span style={{ fontSize: '12px' }}>로딩중...</span>
          {retryCount > 0 && (
            <small style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
              재시도 중... ({retryCount}/2)
            </small>
          )}
        </div>
      )}

      {/* 실제 이미지 */}
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '16px',
          display: 'block',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
};

const getEmotionColor = (consumptionType) => {
  const colors = {
    충동구매: '#ff6b9d',
    폭식: '#ff8a50',
    게임결제: '#3b82f6',
    배달음식: '#f59e0b',
    술소비: '#dc2626',
    취미소비: '#10b981',
    패션소비: '#ff6b9d',
    카페소비: '#8b5cf6',
    음식소비: '#ff8a50',
    필수소비: '#64748b'
  };
  return colors[consumptionType] || '#9e9e9e';
};

const getConsumptionEmoji = (consumptionType) => {
  const emojiMap = {
    충동구매: '🛍️',
    폭식: '🍕',
    게임결제: '🎮',
    배달음식: '🚚',
    술소비: '🍺',
    취미소비: '📚',
    패션소비: '👗',
    카페소비: '☕',
    음식소비: '🍽️',
    필수소비: '📋'
  };
  return emojiMap[consumptionType] || '💰';
};

// OCR 처리 함수
const processReceiptOCR = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('https://eunbie.site/api/diary/ocr/receipt', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error || '영수증 인식에 실패했습니다.');
  }
};

export default function EmotionConsumptionDiary() {
  const { user } = useUser();
  const user_id = user?.username || "soyeon123";
  const cardRefs = useRef([]);
  const fileInputRef = useRef(null);
  
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [newDiaryText, setNewDiaryText] = useState('');
  const [error, setError] = useState(null);

  // OCR 관련 state
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // 데이터 로드
  const loadDiaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [entriesResponse, analyticsResponse] = await Promise.all([
        fetch(`https://eunbie.site/api/diary/entries/${user_id}`),
        fetch(`https://eunbie.site/api/diary/analytics/${user_id}`)
      ]);

      if (!entriesResponse.ok || !analyticsResponse.ok) {
        throw new Error('API 서버에 연결할 수 없습니다.');
      }

      const entriesData = await entriesResponse.json();
      const analyticsData = await analyticsResponse.json();

      // 현재 월 데이터만 표시
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      const filteredEntries = (entriesData.entries || []).filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
      });

      setDiaryEntries(filteredEntries);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      
      // 샘플 데이터도 현재 월만
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const monthString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      
      const filteredSampleData = SAMPLE_DIARY_ENTRIES.filter(entry => {
        return entry.date.startsWith(monthString);
      });
      
      setDiaryEntries(filteredSampleData);
      setAnalytics({
        stressShoppingRatio: 35,
        totalEntries: filteredSampleData.length
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiaryData();
    
    return () => {
      setDiaryEntries([]);
      setAnalytics({});
    };
  }, [user_id]);

  // 이미지 업로드 처리
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target.result);
    reader.readAsDataURL(file);

    setShowOCRModal(true);
    setOcrLoading(true);
    setOcrResult(null);

    try {
      const result = await processReceiptOCR(file);
      setOcrResult(result);
    } catch (error) {
      console.error('OCR 처리 실패:', error);
      const errorMessage = error.message.includes('network') 
        ? '네트워크 연결을 확인해주세요.' 
        : `영수증 인식에 실패했습니다: ${error.message}`;
      
      alert(errorMessage);
      setShowOCRModal(false);
    } finally {
      setOcrLoading(false);
    }
  };

  // OCR 결과 확인
  const handleOCRConfirm = () => {
    if (!ocrResult) return;

    const autoText = `${ocrResult.store}에서 ${ocrResult.totalAmount.toLocaleString()}원을 소비했다. ${ocrResult.items.join(', ')}을 구매했는데, `;
    
    setNewDiaryText(autoText);
    setShowWriteForm(true);
    setShowOCRModal(false);
    setSelectedImage(null);
  };

  // 카드 다운로드
  const handleDownloadCard = async (index) => {
    try {
      const cardElement = cardRefs.current[index];
      if (!cardElement) {
        alert('카드를 찾을 수 없습니다.');
        return;
      }

      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const canvas = await window.html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `감정소비카드_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');

    } catch (error) {
      console.error('캡처 실패:', error);
      alert('다운로드에 실패했습니다. 스크린샷을 이용해주세요.');
    }
  };

  // 일기 저장
  const handleWriteDiary = async () => {
    if (newDiaryText.trim().length < 10) {
      alert('일기를 최소 10자 이상 작성해주세요.');
      return;
    }

    try {
      const requestBody = {
        text: newDiaryText,
        ...(ocrResult && { receiptData: ocrResult })
      };

      const response = await fetch(`https://eunbie.site/api/diary/entries/${user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) throw new Error('일기 저장에 실패했습니다');

      await loadDiaryData();
      setNewDiaryText('');
      setShowWriteForm(false);
      setOcrResult(null);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('일기 저장 실패:', error);
      alert('일기 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const sortedEntries = [...diaryEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 로딩 상태
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner" />
          <p>감정-소비 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="diary-container">
      {/* 헤더 */}
      <div className="header">
        <h1 className="title">💸 Emotional Spending Diary</h1>
        <p className="subtitle">
          감정-소비 패턴을 분석하여 건강한 소비습관을 만들어가세요
        </p>

        {/* 통계 요약 */}
        <div className="stats-container">
          <div className="stat-item">
            🛍️ 스트레스 쇼핑: {analytics.stressShoppingRatio || 35}%
          </div>
          <div className="stat-item">
            📅 이번 달 기록: {diaryEntries.length}개
          </div>
        </div>
        
        {/* 액션 버튼들 */}
        <div className="action-buttons">
          <button
            onClick={() => setShowWriteForm(!showWriteForm)}
            className={`btn btn-primary ${showWriteForm ? 'active' : ''}`}
          >
            ✍️ {showWriteForm ? '작성 취소' : '소비 기록하기'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-success btn-receipt"
          >
            <Receipt size={20} />
            📷 영수증 스캔
          </button>
        </div>
      </div>

      <div className="content">
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden-input"
        />

        {/* OCR 모달 */}
        {showOCRModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  <Brain size={24} color="#667eea" />
                  영수증 AI 분석
                </h3>
                <button
                  onClick={() => setShowOCRModal(false)}
                  className="modal-close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* 이미지 프리뷰 */}
              {selectedImage && (
                <div className="image-preview">
                  <img src={selectedImage} alt="업로드된 영수증" />
                </div>
              )}

              {/* OCR 진행 상태 */}
              {ocrLoading && (
                <div className="ocr-loading">
                  <div className="spinner" />
                  <p>AI가 영수증을 분석중입니다...</p>
                </div>
              )}

              {/* OCR 결과 */}
              {ocrResult && !ocrLoading && (
                <div className="ocr-result">
                  <div className="result-success">
                    <div className="success-header">
                      <Check size={20} color="#16a34a" />
                      <span>분석 완료!</span>
                    </div>
                    
                    <div className="result-details">
                      <div className="detail-item">
                        <span className="label">매장명: </span>
                        <span className="value">{ocrResult.store}</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="label">구매 항목: </span>
                        <span className="value">{ocrResult.items.join(', ')}</span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="label">총 금액: </span>
                        <span className="amount">{ocrResult.totalAmount.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 버튼들을 항상 표시하되, 로딩 중일 때는 비활성화 */}
              <div style={{ 
                marginTop: '20px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                width: '100%',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={() => setShowOCRModal(false)} 
                  disabled={ocrLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    cursor: ocrLoading ? 'not-allowed' : 'pointer',
                    opacity: ocrLoading ? 0.6 : 1,
                    fontWeight: '600',
                    fontSize: '14px',
                    minWidth: '100px', // 최소 너비 증가
                    flex: '0 0 auto'
                  }}
                >
                  취소
                </button>
                <button 
                  onClick={handleOCRConfirm} 
                  disabled={ocrLoading || !ocrResult}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (ocrLoading || !ocrResult) ? '#ccc' : '#667eea',
                    color: 'white',
                    cursor: (ocrLoading || !ocrResult) ? 'not-allowed' : 'pointer',
                    opacity: (ocrLoading || !ocrResult) ? 0.6 : 1,
                    fontWeight: '600',
                    fontSize: '14px',
                    minWidth: '140px', // 최소 너비 증가
                    flex: '0 0 auto'
                  }}
                >
                  {ocrLoading ? '분석 중...' : '일기 작성하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 일기 작성 폼 */}
        {showWriteForm && (
          <div className="write-form">
            <h3 className="form-title">오늘의 감정-소비 패턴을 기록해보세요 💸</h3>

            {/* OCR 결과 미리보기 */}
            {ocrResult && (
              <div className="receipt-preview">
                <div className="preview-header">
                  <Receipt size={16} color="#d97706" />
                  <span>영수증 정보</span>
                </div>
                <p className="store-name">{ocrResult.store}</p>
                <p className="items-info">
                  {ocrResult.items.join(', ')} - {ocrResult.totalAmount.toLocaleString()}원
                </p>
              </div>
            )}
            
            <textarea
              value={newDiaryText}
              onChange={(e) => setNewDiaryText(e.target.value)}
              placeholder="오늘 어떤 감정으로 무엇을 소비했나요?"
              className="diary-textarea"
            />
            
            <div className="form-footer">
              <span className="char-count">{newDiaryText.length}/500자</span>
              
              <div className="form-actions">
                <button
                  onClick={() => {
                    setShowWriteForm(false);
                    setOcrResult(null);
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleWriteDiary}
                  disabled={newDiaryText.trim().length < 10}
                  className="btn btn-primary"
                >
                  🤖 패턴 분석하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 데이터가 없는 경우 */}
        {!loading && diaryEntries.length === 0 && (
          <div className="empty-state">
            <p>이번 달에는 아직 기록된 소비 내역이 없습니다.</p>
            <button onClick={() => setShowWriteForm(true)} className="btn btn-primary">
              이번 달 첫 일기 작성하기
            </button>
          </div>
        )}

        {/* 일기 카드 목록 */}
        <div className="cards-grid">
          {sortedEntries.map((entry, index) => (
            <div key={entry.id} className="card-wrapper">
              <div
                ref={(el) => (cardRefs.current[index] = el)}
                className="diary-card"
                style={{ borderColor: `${getEmotionColor(entry.consumptionType)}20` }}
              >
                {/* 소비 유형 태그 */}
                <div 
                  className="consumption-tag"
                  style={{ backgroundColor: getEmotionColor(entry.consumptionType) }}
                >
                  {getConsumptionEmoji(entry.consumptionType)} {entry.consumptionType}
                </div>

                {/* 영수증 데이터 표시 */}
                {entry.receiptData && (
                  <div className="receipt-info">
                    <div className="receipt-header">
                      <Receipt size={16} color="#d97706" />
                      <span>영수증 정보</span>
                    </div>
                    <p className="receipt-store">{entry.receiptData.store}</p>
                    <p className="receipt-items">{entry.receiptData.items.join(', ')}</p>
                  </div>
                )}

                {/* 날짜와 금액 */}
                <div className="date-amount">
                  <span className="date">
                    {new Date(entry.date).toLocaleDateString('ko-KR')}
                  </span>
                  {entry.amount > 0 && (
                    <span 
                      className="amount"
                      style={{ color: getEmotionColor(entry.consumptionType) }}
                    >
                      {entry.amount.toLocaleString()}원
                    </span>
                  )}
                </div>

                {/* 이미지 - SafeImage 컴포넌트 사용 */}
                <div className="card-image">
                  <SafeImage
                    emotion={entry.emotion}
                    consumptionType={entry.consumptionType}
                    entryId={entry.id}
                    alt={`${entry.emotion} ${entry.consumptionType} 일러스트`}
                  />
                </div>

                {/* 감정과 만족도 */}
                <div className="emotion-satisfaction">
                  <span className="emotion">감정: {entry.emotion}</span>
                  <span className="satisfaction">만족도: {'⭐'.repeat(entry.satisfaction || 3)}</span>
                </div>

                {/* 일기 내용 */}
                <div className="diary-content">
                  <p className="diary-text">"{entry.text}"</p>

                  {/* AI 조언 말풍선 */}
                  <div 
                    className="ai-advice"
                    style={{ 
                      backgroundColor: `${getEmotionColor(entry.consumptionType)}08`,
                      borderLeftColor: getEmotionColor(entry.consumptionType)
                    }}
                  >
                    <div className="ai-icon">🤖</div>
                    <p>{entry.advice}</p>
                  </div>
                </div>
              </div>

              {/* 다운로드 버튼 */}
              <button
                onClick={() => handleDownloadCard(index)}
                className="download-btn"
                style={{ backgroundColor: getEmotionColor(entry.consumptionType) }}
              >
                📥 소비 카드 다운로드
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}