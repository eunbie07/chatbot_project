import React, { useRef, useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

// 로컬 이미지 매핑 (public/emotions 폴더 기반)
const CONSUMPTION_IMAGES = {
  충동구매: {
    '우울': '/emotions/impulse-sad.png',
    '스트레스': '/emotions/impulse-stress.png',
    '화남': '/emotions/impulse-angry.png',
    '외로움': '/emotions/impulse-lonely.png'
  },
  폭식: {
    '스트레스': '/emotions/binge-stress.png',
    '우울': '/emotions/binge-sad.png',
    '지루함': '/emotions/binge-bored.png',
    '외로움': '/emotions/binge-lonely.png'
  },
  게임결제: {
    '지루함': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=200&fit=crop',
    '스트레스': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=200&fit=crop',
    '성취욕구': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=200&fit=crop'
  },
  배달음식: {
    '피곤함': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300&h=200&fit=crop',
    '귀차니즘': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300&h=200&fit=crop',
    '우울': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300&h=200&fit=crop'
  },
  술소비: {
    '스트레스': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&h=200&fit=crop',
    '우울': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&h=200&fit=crop',
    '외로움': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&h=200&fit=crop'
  },
  취미소비: {
    '지루함': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop',
    '성취욕구': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop'
  },
  패션소비: {
    '스트레스': '/emotions/fashion-stress.png',
    '우울': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop'
  },
  카페소비: {
    '스트레스': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop',
    '중립': '/emotions/food.png'
  },
  음식소비: {
    '스트레스': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop',
    '자기보상': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop'
  },
  필수소비: {
    '중립': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop'
  }
};

// 샘플 데이터 (현재 월 기준으로 동적 생성)
const generateSampleData = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  return [
    {
      id: 1,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-23`,
      text: '스트레스를 받아서 온라인 쇼핑몰에서 옷을 5만원어치 샀다. 일시적으로 기분이 나아졌지만 계좌 잔고를 보니 후회된다.',
      emotion: '스트레스',
      consumptionType: '충동구매',
      amount: 50000,
      satisfaction: 2,
      advice: '스트레스를 받을 때는 쇼핑 대신 산책이나 운동을 해보세요. 더 건강하고 경제적인 스트레스 해소법이에요.'
    },
    {
      id: 2,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-21`,
      text: '우울해서 치킨을 3만원어치 시켜먹었는데 배만 아프고 더 우울해졌다.',
      emotion: '우울',
      consumptionType: '폭식',
      amount: 30000,
      satisfaction: 1,
      advice: '감정적으로 힘들 때는 친구와 대화하거나 따뜻한 차를 마시며 휴식을 취해보세요.'
    },
    {
      id: 3,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-20`,
      text: '지루해서 게임 아이템에 2만원을 썼다. 순간적으로 재미있었지만 곧 무의미하게 느껴졌다.',
      emotion: '지루함',
      consumptionType: '게임결제',
      amount: 20000,
      satisfaction: 2,
      advice: '지루할 때는 새로운 취미를 찾아보거나 책을 읽어보세요. 더 의미있는 시간 보내기가 가능해요.'
    },
    {
      id: 4,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-18`,
      text: '새로운 취미를 위해 요가 매트와 운동복을 샀다. 건강해질 생각에 뿌듯하다.',
      emotion: '성취욕구',
      consumptionType: '취미소비',
      amount: 45000,
      satisfaction: 5,
      advice: '목표를 향한 투자는 좋은 선택이에요! 꾸준히 실천하시면 더 큰 만족감을 느끼실 거예요.'
    },
    {
      id: 5,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
      text: '친구들과 만나서 카페에서 음료와 디저트를 먹었다. 즐거운 시간이었다.',
      emotion: '중립',
      consumptionType: '카페소비',
      amount: 15000,
      satisfaction: 4,
      advice: '사회적 관계를 위한 소비는 의미가 있어요. 적당한 선에서 즐기시면 됩니다.'
    },
    {
      id: 6,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-12`,
      text: '회사에서 스트레스를 받아서 퇴근길에 술을 마셨다. 그 순간은 시원했지만 다음날 후회됐다.',
      emotion: '스트레스',
      consumptionType: '술소비',
      amount: 25000,
      satisfaction: 2,
      advice: '스트레스 해소를 위해 술보다는 운동이나 명상 같은 건강한 방법을 시도해보세요.'
    },
    {
      id: 7,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`,
      text: '혼자 있는 시간이 외로워서 배달음식을 주문했다. 먹는 동안만 외로움이 잊혀졌다.',
      emotion: '외로움',
      consumptionType: '배달음식',
      amount: 18000,
      satisfaction: 2,
      advice: '외로울 때는 가족이나 친구에게 연락해보거나 취미 활동에 참여해보세요.'
    },
    {
      id: 8,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-08`,
      text: '기분이 우울해서 쇼핑으로 기분전환을 하려고 옷을 샀다. 잠깐은 기분이 좋아졌다.',
      emotion: '우울',
      consumptionType: '패션소비',
      amount: 80000,
      satisfaction: 3,
      advice: '우울할 때는 쇼핑보다 자연 속 산책이나 좋아하는 음악 듣기를 추천해요.'
    },
    {
      id: 9,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`,
      text: '오늘 승진 소식을 들어서 자축하는 의미로 좋은 레스토랑에서 식사했다. 정말 뿌듯했다.',
      emotion: '자기보상',
      consumptionType: '음식소비',
      amount: 60000,
      satisfaction: 5,
      advice: '성취에 대한 보상은 적절해요! 이런 긍정적인 소비 패턴을 유지하세요.'
    },
    {
      id: 10,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-02`,
      text: '생활비와 공과금을 납부했다. 필수적인 지출이라 어쩔 수 없다.',
      emotion: '중립',
      consumptionType: '필수소비',
      amount: 120000,
      satisfaction: 3,
      advice: '필수 지출은 계획적으로 관리하시면 됩니다. 가계부 작성을 추천해요.'
    }
  ];
};

const SAMPLE_DIARY_ENTRIES = generateSampleData();

const getConsumptionImage = (emotion, consumptionType) => {
  // 로컬 이미지가 있는 경우 우선 사용
  const specificImage = CONSUMPTION_IMAGES[consumptionType]?.[emotion];
  if (specificImage) {
    return specificImage;
  }
  
  // 없으면 기본 이미지나 Unsplash fallback 사용
  const fallbackImages = {
    충동구매: '/emotions/default.png',
    폭식: '/emotions/default.png',
    게임결제: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=200&fit=crop',
    배달음식: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=300&h=200&fit=crop',
    술소비: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&h=200&fit=crop',
    취미소비: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop',
    패션소비: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop',
    카페소비: '/emotions/cafe.png',
    음식소비: '/emotions/food.png',
    필수소비: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop'
  };
  
  return fallbackImages[consumptionType] || '/emotions/default.png';
};

const getEmotionColor = (emotion, consumptionType) => {
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

export default function EmotionConsumptionDiary() {
  const { user } = useUser();
  const user_id = user?.username || "soyeon123"; // fallback
  const cardRefs = useRef([]);
  const [selectedView, setSelectedView] = useState('grid');
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [newDiaryText, setNewDiaryText] = useState('');
  const [error, setError] = useState(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDiaryData();
  }, []);

  const loadDiaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 실제 API 호출
      const [entriesResponse, analyticsResponse] = await Promise.all([
        fetch(`https://eunbie.site/api/diary/entries/${user_id}`),
        fetch(`https://eunbie.site/api/diary/analytics/${user_id}`)
      ]);

      if (!entriesResponse.ok || !analyticsResponse.ok) {
        throw new Error('API 서버에 연결할 수 없습니다. 샘플 데이터를 표시합니다.');
      }

      const entriesData = await entriesResponse.json();
      const analyticsData = await analyticsResponse.json();

      // 현재 월 데이터만 필터링
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const filteredEntries = (entriesData.entries || []).filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      });

      setDiaryEntries(filteredEntries);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      // API 실패시 샘플 데이터 사용
      setDiaryEntries(SAMPLE_DIARY_ENTRIES);
      setAnalytics({
        stressShoppingRatio: 35,
        totalEntries: SAMPLE_DIARY_ENTRIES.length
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCard = async (index) => {
    try {
      const cardElement = cardRefs.current[index];
      if (!cardElement) {
        alert('카드를 찾을 수 없습니다.');
        return;
      }

      // html2canvas를 사용하여 카드를 이미지로 변환
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 카드 크기 설정
      const cardRect = cardElement.getBoundingClientRect();
      canvas.width = cardRect.width * 2; // 고해상도를 위해 2배
      canvas.height = cardRect.height * 2;
      
      // 배경색 설정
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 간단한 텍스트 기반 카드 생성
      const entry = sortedEntries[index];
      
      // 카드 스타일링
      const cardColor = getEmotionColor(entry.emotion, entry.consumptionType);
      
      // 배경 그라디언트
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, cardColor + '20');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 테두리
      ctx.strokeStyle = cardColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // 텍스트 설정
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.textAlign = 'center';
      
      // 제목
      ctx.fillStyle = cardColor;
      ctx.fillText(`${getConsumptionEmoji(entry.consumptionType)} ${entry.consumptionType}`, canvas.width / 2, 100);
      
      // 날짜
      ctx.fillStyle = '#666666';
      ctx.font = '24px Arial, sans-serif';
      ctx.fillText(new Date(entry.date).toLocaleDateString('ko-KR'), canvas.width / 2, 150);
      
      // 금액
      if (entry.amount > 0) {
        ctx.fillStyle = cardColor;
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillText(`${entry.amount.toLocaleString()}원`, canvas.width / 2, 200);
      }
      
      // 감정
      ctx.fillStyle = '#333333';
      ctx.font = '22px Arial, sans-serif';
      ctx.fillText(`감정: ${entry.emotion}`, canvas.width / 2, 250);
      
      // 만족도
      ctx.fillText(`만족도: ${'⭐'.repeat(entry.satisfaction || 3)}`, canvas.width / 2, 290);
      
      // 일기 내용 (여러 줄 처리)
      ctx.font = '20px Arial, sans-serif';
      ctx.fillStyle = '#444444';
      const text = entry.text;
      const maxWidth = canvas.width - 80;
      const lineHeight = 30;
      let y = 350;
      
      // 텍스트를 여러 줄로 나누기
      const words = text.split(' ');
      let line = '';
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
        
        // 최대 4줄까지만
        if (y > 450) break;
      }
      ctx.fillText(line, canvas.width / 2, y);
      
      // AI 조언
      ctx.fillStyle = '#666666';
      ctx.font = 'italic 18px Arial, sans-serif';
      y += 60;
      ctx.fillText('Chatbot AI 조언', canvas.width / 2, y);
      
      ctx.font = '16px Arial, sans-serif';
      const advice = entry.advice;
      const adviceWords = advice.split(' ');
      let adviceLine = '';
      y += 30;
      
      for (let n = 0; n < adviceWords.length; n++) {
        const testLine = adviceLine + adviceWords[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(adviceLine, canvas.width / 2, y);
          adviceLine = adviceWords[n] + ' ';
          y += 25;
        } else {
          adviceLine = testLine;
        }
        
        // 최대 3줄까지만
        if (y > canvas.height - 100) break;
      }
      ctx.fillText(adviceLine, canvas.width / 2, y);
      
      // 하단 로고
      ctx.fillStyle = cardColor;
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText('💸 감정-소비 다이어리', canvas.width / 2, canvas.height - 40);
      
      // 이미지 다운로드
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `감정소비카드_${new Date(entry.date).toLocaleDateString('ko-KR').replace(/\./g, '')}_${entry.consumptionType}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
      
      alert('감정-소비 카드가 다운로드되었습니다! 📥');
      
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('카드 다운로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleWriteDiary = async () => {
    if (newDiaryText.trim().length < 10) {
      alert('일기를 최소 10자 이상 작성해주세요.');
      return;
    }

    try {
      const response = await fetch(`https://eunbie.site/api/diary/entries/${user_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newDiaryText  // user_id는 URL에 있으니 제거
        }),
      });
      if (!response.ok) {
        throw new Error('일기 저장에 실패했습니다');
      }

      // 성공적으로 저장된 후 데이터 다시 로드
      await loadDiaryData();
      setNewDiaryText('');
      setShowWriteForm(false);
      
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('일기 저장 실패:', error);
      alert('일기 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const sortedEntries = [...diaryEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 로딩 상태 표시
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#667eea'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #667eea',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ fontSize: '18px', fontWeight: '600' }}>감정-소비 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#dc2626',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>⚠️ 데이터 로딩 실패</p>
          <p style={{ marginBottom: '20px' }}>{error}</p>
          <button
            onClick={loadDiaryData}
            style={{
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: '700',
          marginBottom: '12px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
           Emotional Spending Diary 
        </h1>
        <p style={{
          fontSize: '1.2rem',
          opacity: '0.9',
          maxWidth: '600px',
          margin: '0 auto 24px',
          lineHeight: '1.6'
        }}>
          감정-소비 패턴을 분석하여 건강한 소비습관을 만들어가세요
        </p>

        {/* 통계 요약 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '12px 20px',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            🛍️ 스트레스 쇼핑: {(analytics.stressShoppingRatio || 35)}%
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '12px 20px',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            📝 기록 수: {diaryEntries.length}개
          </div>
        </div>
        
        {/* 액션 버튼들 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowWriteForm(!showWriteForm)}
            style={{
              backgroundColor: showWriteForm ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ✍️ {showWriteForm ? '작성 취소' : '소비 기록하기'}
          </button>
          
          <button
            onClick={() => setSelectedView('grid')}
            style={{
              backgroundColor: selectedView === 'grid' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🎨 카드 보기
          </button>
          <button
            onClick={() => setSelectedView('timeline')}
            style={{
              backgroundColor: selectedView === 'timeline' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📅 타임라인 보기
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px', paddingBottom: '40px' }}>
        {/* 일기 작성 폼 */}
        {showWriteForm && (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 40px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '2px solid #667eea20'
          }}>
            <h3 style={{
              fontSize: '20px',
              marginBottom: '20px',
              color: '#667eea',
              textAlign: 'center'
            }}>
              오늘의 감정-소비 패턴을 기록해보세요 💸
            </h3>
            
            <textarea
              value={newDiaryText}
              onChange={(e) => setNewDiaryText(e.target.value)}
              placeholder="오늘 어떤 감정으로 무엇을 소비했나요?
예시:
- 스트레스를 받아서 온라인 쇼핑몰에서 옷을 5만원어치 샀다
- 우울해서 치킨을 3만원어치 시켜먹었는데 후회된다
- 지루해서 게임 아이템에 2만원을 썼다
- 새로운 취미를 위해 책을 샀는데 뿌듯하다"
              style={{
                width: '100%',
                height: '120px',
                padding: '16px',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px'
            }}>
              <span style={{
                fontSize: '13px',
                color: '#6c757d'
              }}>
                {newDiaryText.length}/500자
              </span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowWriteForm(false)}
                  style={{
                    backgroundColor: '#e9ecef',
                    color: '#6c757d',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleWriteDiary}
                  disabled={newDiaryText.trim().length < 10}
                  style={{
                    backgroundColor: newDiaryText.trim().length >= 10 ? '#667eea' : '#ccc',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: newDiaryText.trim().length >= 10 ? 'pointer' : 'not-allowed'
                  }}
                >
                  패턴 분석하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 데이터가 없는 경우 */}
        {!loading && diaryEntries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6c757d'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>아직 기록된 소비 내역이 없습니다.</p>
            <button
              onClick={() => setShowWriteForm(true)}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              첫 번째 일기 작성하기
            </button>
          </div>
        )}

        {/* 일기 목록 */}
        {selectedView === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '28px',
            maxWidth: '1400px',
            margin: '0 auto',
          }}>
            {sortedEntries.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  ref={(el) => (cardRefs.current[index] = el)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    padding: '28px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                    width: '100%',
                    maxWidth: '380px',
                    minHeight: '580px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    border: `3px solid ${getEmotionColor(entry.emotion, entry.consumptionType)}20`,
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.12)';
                  }}
                >
                  {/* 소비 유형 태그 */}
                  <div style={{
                    alignSelf: 'flex-start',
                    backgroundColor: getEmotionColor(entry.emotion, entry.consumptionType),
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '25px',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {getConsumptionEmoji(entry.consumptionType)} {entry.consumptionType}
                  </div>

                  {/* 날짜와 금액 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    width: '100%'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#8e8e93',
                      fontWeight: '500'
                    }}>
                      {new Date(entry.date).toLocaleDateString('ko-KR')}
                    </span>
                    {entry.amount > 0 && (
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: getEmotionColor(entry.emotion, entry.consumptionType)
                      }}>
                        {entry.amount.toLocaleString()}원
                      </span>
                    )}
                  </div>

                  {/* 이미지 */}
                  <div style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                  }}>
                    <img
                      src={getConsumptionImage(entry.emotion, entry.consumptionType)}
                      alt={`${entry.emotion} ${entry.consumptionType} 일러스트`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                  </div>

                  {/* 감정과 만족도 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#f8f9ff',
                    borderRadius: '12px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#667eea',
                      fontWeight: '600'
                    }}>
                      감정: {entry.emotion}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: '#667eea',
                      fontWeight: '600'
                    }}>
                      만족도: {'⭐'.repeat(entry.satisfaction || 3)}
                    </span>
                  </div>

                  {/* 일기 내용 */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <p style={{
                      fontSize: '15px',
                      lineHeight: '1.7',
                      color: '#2c3e50',
                      fontWeight: '400',
                      textAlign: 'center'
                    }}>
                      "{entry.text}"
                    </p>

                    {/* AI 조언 말풍선 */}
                    <div style={{
                      backgroundColor: `${getEmotionColor(entry.emotion, entry.consumptionType)}08`,
                      padding: '18px',
                      borderRadius: '16px',
                      borderLeft: `4px solid ${getEmotionColor(entry.emotion, entry.consumptionType)}`,
                      marginTop: 'auto',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '20px',
                        fontSize: '16px'
                      }}>Chatbot</div>
                      <p style={{
                        fontSize: '13px',
                        color: '#5a6c7d',
                        lineHeight: '1.6',
                        fontStyle: 'italic',
                        margin: 0,
                        marginTop: '4px'
                      }}>
                        {entry.advice}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 다운로드 버튼 */}
                <button
                  onClick={() => handleDownloadCard(index)}
                  style={{
                    marginTop: '20px',
                    backgroundColor: getEmotionColor(entry.emotion, entry.consumptionType),
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    minWidth: '160px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* 타임라인 레이아웃 */
          <div style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {sortedEntries.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  marginBottom: '40px',
                  alignItems: 'flex-start',
                  gap: '20px'
                }}
              >
                {/* 타임라인 점 */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '80px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: getEmotionColor(entry.emotion, entry.consumptionType),
                    boxShadow: '0 0 0 4px rgba(255,255,255,1), 0 0 0 8px ' + getEmotionColor(entry.emotion, entry.consumptionType) + '30'
                  }} />
                  {index < sortedEntries.length - 1 && (
                    <div style={{
                      width: '2px',
                      height: '60px',
                      backgroundColor: '#e9ecef',
                      marginTop: '8px'
                    }} />
                  )}
                </div>

                {/* 타임라인 카드 */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  flex: 1,
                  border: `2px solid ${getEmotionColor(entry.emotion, entry.consumptionType)}20`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#6c757d',
                      fontWeight: '500'
                    }}>
                      {new Date(entry.date).toLocaleDateString('ko-KR')}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        backgroundColor: getEmotionColor(entry.emotion, entry.consumptionType),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {getConsumptionEmoji(entry.consumptionType)} {entry.consumptionType}
                      </span>
                      {entry.amount > 0 && (
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: getEmotionColor(entry.emotion, entry.consumptionType)
                        }}>
                          {entry.amount.toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p style={{
                    fontSize: '15px',
                    color: '#2c3e50',
                    lineHeight: '1.6',
                    marginBottom: '12px'
                  }}>
                    {entry.text}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      color: '#6c757d'
                    }}>
                      감정: {entry.emotion}
                    </span>
                    <span style={{
                      fontSize: '13px',
                      color: '#6c757d'
                    }}>
                      만족도: {'⭐'.repeat(entry.satisfaction || 3)}
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: '13px',
                    color: '#6c757d',
                    fontStyle: 'italic',
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    margin: 0
                  }}>
                    Chatbot {entry.advice}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}