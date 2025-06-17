// src/components/SummaryCard.jsx

export default function SummaryCard() {
  return (
    <div style={{
      marginTop: '25px',
      backgroundColor: '#F9F9F9',
      border: '1px solid #E0E0E0',
      padding: '20px',
      borderRadius: '12px'
    }}>
      <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>이번 주 소비 요약</h3>
      <ul style={{
        fontSize: '15px',
        color: '#555',
        lineHeight: '1.6',
        paddingLeft: '18px',
        margin: 0
      }}>
        <li>총 소비 횟수: 6회</li>
        <li>주요 감정: 스트레스, 피곤함</li>
        <li>GPT 조언: 충분한 수면과 수분 섭취를 잊지 마세요!</li>
      </ul>
    </div>
  );
}
