import { useState, useEffect } from 'react';
import ChatBot from '../components/ChatBot';
import Layout from '../components/Layout';
import { useUser } from '../contexts/UserContext';

export default function ChatDetailPage() {
  const [showFullChat, setShowFullChat] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [latestConversation, setLatestConversation] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  const { user } = useUser();
  const user_id = user?.username || "soyeon123";

  const colors = {
    bodyBackgroundColor: '#F3F6FF',
    cardBackgroundColor: '#FFFFFF',
    primaryAccentColor: '#7C8BFF',
    secondaryAccentColor: '#6FCF97',
    textColor: '#333333',
    lightTextColor: '#555555',
    borderColor: '#E0E0E0',
  };

  useEffect(() => {
    if (user_id) {
      loadConversationData();
    }
  }, [user_id]);

  const loadConversationData = async () => {
    try {
      setLoading(true);
      
      const [conversationsRes, latestRes, analyticsRes] = await Promise.all([
        fetch(`https://eunbie.site/api/conversations/${user_id}?limit=5`),
        fetch(`https://eunbie.site/api/conversations/${user_id}/latest`),
        fetch(`https://eunbie.site/api/conversations/${user_id}/analytics`)
      ]);

      if (conversationsRes.ok) {
        const conversationsData = await conversationsRes.json();
        setConversations(conversationsData.conversations || []);
      }

      if (latestRes.ok) {
        const latestData = await latestRes.json();
        setLatestConversation(latestData.conversation);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      '스트레스': '😤',
      '보상심리': '🎁',
      '충동': '⚡',
      '무기력': '😔',
      '습관': '🔄'
    };
    return emojiMap[emotion] || '💭';
  };

  const getEffectColor = (effect) => {
    const colorMap = {
      '좋아짐': colors.secondaryAccentColor,
      '변화없음': '#FFA726',
      '더 안좋아짐': '#EF5350'
    };
    return colorMap[effect] || colors.lightTextColor;
  };

  if (loading) {
    return (
      <Layout
        center={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            fontSize: '18px',
            color: colors.lightTextColor
          }}>
            대화 기록을 불러오는 중...
          </div>
        }
      />
    );
  }

  return (
    <Layout
      left={
        <div style={{
          backgroundColor: colors.cardBackgroundColor,
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '10px', color: colors.textColor }}>
              나의 감정 소비 기록
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: colors.lightTextColor, 
              marginBottom: '30px', 
              lineHeight: '1.6' 
            }}>
              챗봇과의 대화를 통해 감정 소비 패턴을 개선해나가고 있어요.
            </p>

            {/* 분석 통계 */}
            {analytics.totalSessions > 0 && (
              <div style={{
                backgroundColor: colors.bodyBackgroundColor,
                border: `1px solid ${colors.borderColor}`,
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <strong style={{ color: colors.textColor }}>나의 패턴 분석</strong>
                <div style={{ marginTop: '15px', lineHeight: '1.8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: colors.lightTextColor }}>총 대화 세션:</span>
                    <span style={{ fontWeight: 'bold', color: colors.primaryAccentColor }}>
                      {analytics.totalSessions}회
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: colors.lightTextColor }}>주요 감정:</span>
                    <span style={{ fontWeight: 'bold', color: colors.textColor }}>
                      {getEmotionEmoji(analytics.mostCommonEmotion)} {analytics.mostCommonEmotion}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.lightTextColor }}>개선율:</span>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: analytics.improvementRate > 30 ? colors.secondaryAccentColor : '#FFA726'
                    }}>
                      {analytics.improvementRate}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 최근 대화 요약 */}
            {conversations.length > 0 ? (
              <div style={{
                backgroundColor: colors.bodyBackgroundColor,
                border: `1px solid ${colors.borderColor}`,
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '15px'
              }}>
                <strong style={{ color: colors.textColor }}>최근 대화 요약</strong>
                {conversations.slice(0, 3).map((conv, index) => (
                  <div key={index} style={{
                    marginTop: '15px',
                    paddingTop: index > 0 ? '15px' : '0',
                    borderTop: index > 0 ? `1px solid ${colors.borderColor}` : 'none'
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: colors.lightTextColor, 
                      marginBottom: '8px' 
                    }}>
                      {conv.date}
                    </div>
                    <ul style={{ 
                      marginTop: '5px', 
                      paddingLeft: '20px', 
                      color: colors.lightTextColor, 
                      lineHeight: '1.6',
                      fontSize: '14px'
                    }}>
                      <li>소비: {conv.spending}</li>
                      <li>감정: {getEmotionEmoji(conv.emotion)} {conv.emotion}</li>
                      <li style={{ color: getEffectColor(conv.effect) }}>
                        결과: {conv.effect}
                      </li>
                      <li style={{ fontStyle: 'italic', color: colors.primaryAccentColor }}>
                        조언: {conv.advice}
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: colors.bodyBackgroundColor,
                border: `1px solid ${colors.borderColor}`,
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                <p style={{ color: colors.lightTextColor, fontSize: '14px' }}>
                  아직 대화 기록이 없습니다.<br/>
                  오른쪽 챗봇과 대화를 시작해보세요!
                </p>
              </div>
            )}
          </div>

          {/* 상세 대화 보기 버튼 */}
          {latestConversation && (
            <>
              <button
                style={{
                  backgroundColor: colors.primaryAccentColor,
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setShowFullChat(prev => !prev)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#6B7BF7'}
                onMouseLeave={(e) => e.target.style.backgroundColor = colors.primaryAccentColor}
              >
                {showFullChat ? '요약만 보기' : '최근 대화 자세히 보기'}
              </button>

              {showFullChat && (
                <div style={{
                  marginTop: '15px',
                  backgroundColor: '#FAFAFA',
                  border: `1px solid ${colors.borderColor}`,
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: colors.lightTextColor,
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: colors.primaryAccentColor, 
                    marginBottom: '10px',
                    fontWeight: 'bold'
                  }}>
                    📅 {latestConversation.date}
                  </div>
                  {latestConversation.dialogue}
                </div>
              )}
            </>
          )}
        </div>
      }

      center={
        <div style={{
          backgroundColor: colors.cardBackgroundColor,
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
          padding: '30px',
          '--chat-primary-color': colors.primaryAccentColor,
          '--chat-text-color': colors.textColor,
          '--chat-light-text-color': colors.lightTextColor,
          '--chat-border-color': colors.borderColor,
          '--chat-background-color': colors.bodyBackgroundColor,
        }}>
          <ChatBot onConversationComplete={loadConversationData} />
        </div>
      }

      right={
        <div style={{
          backgroundColor: colors.cardBackgroundColor,
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
          padding: '30px'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            marginBottom: '20px', 
            color: colors.textColor 
          }}>
            💡 감정 소비 개선 팁
          </h3>

          <div style={{ lineHeight: '1.8', fontSize: '14px' }}>
            <div style={{
              backgroundColor: colors.bodyBackgroundColor,
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <strong style={{ color: colors.primaryAccentColor }}>
                🎯 이번 주 목표
              </strong>
              <p style={{ color: colors.lightTextColor, marginTop: '8px', margin: 0 }}>
                {analytics.mostCommonEmotion === '스트레스' 
                  ? '스트레스 소비를 운동이나 산책으로 대체해보기'
                  : '감정 소비 전 10초 멈춤 습관 기르기'
                }
              </p>
            </div>

            <div style={{
              backgroundColor: colors.bodyBackgroundColor,
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <strong style={{ color: colors.secondaryAccentColor }}>
                ✨ 대안 활동
              </strong>
              <ul style={{ 
                marginTop: '8px', 
                paddingLeft: '16px', 
                color: colors.lightTextColor,
                margin: '8px 0 0 16px'
              }}>
                <li>5분 심호흡 명상</li>
                <li>짧은 산책하기</li>
                <li>감정 일기 쓰기</li>
                <li>친구에게 전화하기</li>
              </ul>
            </div>

            {analytics.improvementRate > 0 && (
              <div style={{
                backgroundColor: '#E8F5E8',
                border: `1px solid ${colors.secondaryAccentColor}`,
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '5px' }}>🎉</div>
                <strong style={{ color: colors.secondaryAccentColor }}>
                  개선율 {analytics.improvementRate}% 달성!
                </strong>
                <p style={{ 
                  color: colors.lightTextColor, 
                  fontSize: '12px', 
                  marginTop: '5px',
                  margin: '5px 0 0 0'
                }}>
                  계속 이런 식으로 발전해나가고 있어요!
                </p>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}