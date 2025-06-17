import React from 'react';

const DiaryCard = () => {
  // 예시 메시지 - 추후 GPT 응답 or 감정 통계와 연동 가능
  const todayMessage = "기분이 울적할 땐 다른 방법으로 풀어보면 좋을 것 같아!";

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <img
        src="diary.png"
        alt="감정 캐릭터"
        style={{ width: '350px', marginBottom: '12px' }}
      />
      <h3 style={{ marginBottom: '10px' }}>소비 다이어리</h3>
      <p><strong>오늘 나의 소비 감정:</strong></p>
      <p style={{ fontStyle: 'italic', color: '#555' }}>{todayMessage}</p>
      <button style={{ marginTop: '15px' }}>Share</button>
    </div>
  );
};

export default DiaryCard;
