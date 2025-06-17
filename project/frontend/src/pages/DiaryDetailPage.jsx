import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import Layout from '../components/Layout';

const diaryEntries = [
  {
    date: '2025-05-10',
    text: '오늘은 충동적으로 옷을 샀다. 기분이 우울했지만, 막상 사고 나니 더 허무했다.',
    image: '/images/diary_stress_shopping.png',
    advice: '충동구매로 위안을 삼고 싶었군요. 오늘의 감정을 억누르지 말고 따뜻하게 안아주세요.',
    emotion: '우울',
    score: -2,
    emoji: '😞'
  },
  {
    date: '2025-05-11',
    text: '스트레스를 풀기 위해 피자를 먹었지만, 후회가 남았다.',
    image: '/images/diary_sad_binge.png',
    advice: '음식으로 해소하고 싶은 마음, 충분히 이해돼요. 오늘 하루를 견뎌낸 자신을 칭찬해요.',
    emotion: '스트레스',
    score: -1,
    emoji: '😣'
  },
  {
    date: '2025-05-12',
    text: '너무 지루해서 게임 아이템을 질렀다. 재미는 잠깐이었다.',
    image: '/images/diary_bored_gamebuy.png',
    advice: '잠깐의 기쁨도 소중했어요. 나중을 위한 작은 기쁨으로 기억해보는 건 어때요?',
    emotion: '지루함',
    score: -1,
    emoji: '😐'
  }
];

export default function DiaryDetailPage() {
  const cardRefs = useRef([]);

  const handleDownloadCard = async (index) => {
    const el = cardRefs.current[index];
    if (!el) return;

    const canvas = await html2canvas(el);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${diaryEntries[index].date}_diary.png`;
    link.click();
  };

  return (
    <Layout
      center={
        <div style={{
          backgroundColor: '#f5f4fc',
          padding: '40px 20px',
          boxSizing: 'border-box',
        }}>
          <h2 style={{
            fontSize: '28px',
            marginBottom: '30px',
            color: '#4c4c7a',
            textAlign: 'center'
          }}>
            Emotion Diary
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}>
            {diaryEntries.map((entry, index) => (
              <div
                key={index}
                style={{
                  flex: '0 0 calc((100% - 48px) / 3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                {/* 카드 내용 */}
                <div
                  ref={(el) => (cardRefs.current[index] = el)}
                  className="download-card"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    padding: '30px 24px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    width: '100%',
                    maxWidth: '360px',
                    minHeight: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* 상단 제목 */}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#6C63FF',
                    marginBottom: '8px'
                  }}>
                    Emotion Diary
                  </h3>

                  {/* 날짜 */}
                  <strong style={{ fontSize: '16px', color: '#444' }}>{entry.date}</strong>

                  {/* 감정 정보 */}
                  <p style={{
                    marginTop: '6px',
                    fontSize: '16px',
                    color: '#333'
                  }}>
                    {entry.emoji} {entry.emotion} (감정 점수: {entry.score})
                  </p>

                  {/* 감정 일러스트 이미지 */}
                  <img
                    src={entry.image}
                    alt="감정 일러스트"
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      marginTop: '12px',
                      marginBottom: '12px',
                    }}
                  />

                  {/* 일기 본문 */}
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    marginTop: '8px',
                    lineHeight: 1.5
                  }}>
                    {entry.text}
                  </p>

                  {/* 조언 말풍선 */}
                  <p style={{
                    marginTop: '10px',
                    padding: '12px 16px',
                    backgroundColor: '#e7e6fb',
                    borderRadius: '16px',
                    fontStyle: 'italic',
                    color: '#4c4c7a',
                    lineHeight: 1.4,
                    width: '100%',
                  }}>
                    💬 {entry.advice}
                  </p>
                </div>

                {/* 다운로드 버튼 */}
                <button
                  onClick={() => handleDownloadCard(index)}
                  style={{
                    marginTop: '12px',
                    backgroundColor: '#6C63FF',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
