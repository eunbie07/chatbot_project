import { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';
import {
  ChatContainer,
  ChatHeader,
  ChatArea,
  MessageBox,
  ProfileImage,
  MessageContent,
  MessageText,
  MessageMeta,
  InputArea,
  Button,
  DotLoader,
  NameTag,
  SpeakingIndicator,
  SpeakingText
} from './ChatStyles';

const ChatBot = ({ onConversationComplete }) => {
  // 모든 훅을 먼저 선언
  const [step, setStep] = useState(1);
  const [spending, setSpending] = useState('');
  const [emotion, setEmotion] = useState('');
  const [effect, setEffect] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [s3Key, setS3Key] = useState(null);
  const [userInputs, setUserInputs] = useState({ spending: '', emotion: '', effect: '' });

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const { user } = useUser();

  // 초기화 useEffect
  useEffect(() => {
    initializeChat();
  }, []);

  // 유틸리티 함수들
  const getTime = () => new Date().toTimeString().slice(0, 5);

  const addMessage = (role, content) => {
    setHistory((prev) => [...prev, { role, content, time: getTime() }]);
  };

  const initializeChat = () => {
    const currentTime = new Date().toTimeString().slice(0, 5);
    setSpending('');
    setEmotion('');
    setEffect('');
    setRecommendation('');
    setHistory([{ role: 'bot', content: "오늘 어떤 소비를 하셨나요?", time: currentTime }]);
    setStep(1);
    setS3Key(null);
    setUserInputs({ spending: '', emotion: '', effect: '' });
  };

  // 로그인되지 않은 경우 처리
  if (!user?.username) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>로그인이 필요합니다.</div>;
  }

  const user_id = user.username;

  const handleSubmitSpending = () => {
    const trimmed = spending.trim();
    if (!trimmed) return;

    setUserInputs(prev => ({ ...prev, spending: trimmed }));
    addMessage('user', trimmed);
    addMessage('bot', "그 소비를 하신 이유나 기분은 어땠나요?");
    setSpending('');
    setStep(2);
  };

  const handleSelectEmotion = (e) => {
    setUserInputs(prev => ({ ...prev, emotion: e }));
    addMessage('user', e);
    setEmotion(e);
    addMessage('bot', "그 소비 이후 기분은 어땠나요?");
    setStep(3);
  };

  const handleSelectEffect = async (e) => {
    setUserInputs(prev => ({ ...prev, effect: e }));
    addMessage('user', e);
    setEffect(e);
    setStep(4);

    const currentInputs = {
      spending: userInputs.spending,
      emotion: userInputs.emotion,
      effect: e
    };

    const prompt = `
      사용자가 '${currentInputs.spending}'라는 소비를 했고,
      그 이유는 '${currentInputs.emotion}' 때문이었어요.
      하지만 그 소비 후 감정은 '${e}'였어요.
      이 사용자가 다음엔 감정을 더 건강하게 해소할 수 있도록 따뜻하게 조언해줘.
    `;

    setLoading(true);
    addMessage('bot', null);

    try {
      const res = await axios.post("https://eunbie.site/api/chat", {
        user_id,
        message: prompt,
      });

      const reply = res.data.reply;
      setRecommendation(reply);

      setHistory((prev) => [
        ...prev.slice(0, -1),
        { role: 'bot', content: reply, time: getTime() }
      ]);

      const convoHistory = [
        { role: "system", content: "4단계 감정 소비 반성 대화" },
        { role: "user", content: currentInputs.spending },
        { role: "user", content: currentInputs.emotion },
        { role: "user", content: currentInputs.effect },
        { role: "gpt", content: reply }
      ].filter(item => item.content && item.content.trim() !== "");
      
      console.log('📝 대화 저장 시작...');
      await axios.post("https://eunbie.site/api/log-convo", {
        user_id,
        date: new Date().toISOString().slice(0, 10),
        history: convoHistory
      });
      console.log('✅ 대화 저장 완료!');

      const streamRes = await fetch("https://eunbie.site/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, message: reply })
      });

      const blob = await streamRes.blob();
      const audioStream = new Audio(URL.createObjectURL(blob));
      setIsSpeaking(true);
      audioStream.play();
      audioStream.onended = () => setIsSpeaking(false);
      audioStream.onerror = () => {
        alert("음성을 재생할 수 없습니다.");
        setIsSpeaking(false);
      };

      const uploadRes = await axios.post("https://eunbie.site/api/tts_upload", {
        user_id,
        message: reply
      });

      setS3Key(uploadRes.data.s3_key);
      
      console.log('✅ 대화 완료! 다시시작하기 버튼을 눌러 새로운 대화를 시작하세요.');
      
    } catch (err) {
      console.error("GPT 또는 업로드 오류:", err);
      setHistory((prev) => [
        ...prev.slice(0, -1),
        { role: 'bot', content: "GPT 응답 또는 업로드 중 오류가 발생했어요.", time: getTime() }
      ]);
    }

    setLoading(false);
  };

  const reset = () => {
    initializeChat();
    
    if (onConversationComplete) {
      console.log('🔄 다시시작하기 - 대화 목록 새로고침!');
      onConversationComplete();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');

        try {
          const res = await axios.post("https://eunbie.site/api/stt", formData);
          const text = res.data.text?.trim();
          if (text) {
            setSpending(text);
          } else {
            alert("음성 인식 결과가 비어 있습니다.");
          }
        } catch (err) {
          console.error("STT 오류:", err);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("마이크 접근이 거부되었습니다. 마이크 권한을 확인해주세요.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleReplay = async () => {
    if (!s3Key) return;
    try {
      const res = await axios.post("https://eunbie.site/api/tts_replay", {
        s3_key: s3Key
      });
      const audioUrl = res.data.url;
      const audio = new Audio(audioUrl);
      setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        alert("다시듣기 음성을 재생할 수 없습니다.");
        setIsSpeaking(false);
      };
      audio.play();
    } catch (err) {
      alert("다시듣기 요청에 실패했습니다.");
    }
  };

  return (
    <ChatContainer style={{
      height: '70vh',
      minHeight: '500px',
      maxHeight: '800px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <ChatHeader>Mindful Spending Chatbot</ChatHeader>

      <ChatArea style={{
        flex: 1,
        overflowY: 'auto',
        maxHeight: 'calc(70vh - 200px)',
        padding: '16px'
      }}>
        {history.map((item, idx) => (
          <MessageBox
            key={idx}
            $align={item.role === 'user' ? 'right' : 'left'}
          >
            {/* 챗봇 프로필 이미지 (왼쪽에만) */}
            {item.role === 'bot' && (
              <ProfileImage $isBot={true}>
                <img 
                  src="/chatbot-profile.png" 
                  alt="챗봇" 
                  style={{width: '100%', height: '100%', borderRadius: '50%'}} 
                />
              </ProfileImage>
            )}
            
            <MessageContent $align={item.role === 'user' ? 'right' : 'left'}>
              {/* 이름 태그 */}
              <NameTag $align={item.role === 'user' ? 'right' : 'left'}>
                {item.role === 'user' ? '나' : 'Chatbot'}
              </NameTag>
              
              {/* 메시지 내용 */}
              {item.content !== null ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  flexDirection: item.role === 'user' ? 'row-reverse' : 'row',
                  gap: '8px'
                }}>
                  <MessageText $align={item.role === 'user' ? 'right' : 'left'}>
                    {item.content}
                  </MessageText>
                  
                  <MessageMeta $align={item.role === 'user' ? 'right' : 'left'}>
                    {item.time}
                  </MessageMeta>
                </div>
              ) : (
                // 로딩 인디케이터
                <div style={{
                  backgroundColor: '#f1f3f4',
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <DotLoader>
                    <span></span>
                    <span></span>
                    <span></span>
                  </DotLoader>
                </div>
              )}
            </MessageContent>
            
            {/* 사용자 프로필 이미지 (오른쪽에만) */}
            {item.role === 'user' && (
              <ProfileImage $isBot={false}>
                <img 
                  src="/user-profile.png" 
                  alt="사용자" 
                  style={{width: '100%', height: '100%', borderRadius: '50%'}} 
                />
              </ProfileImage>
            )}
          </MessageBox>
        ))}
      </ChatArea>

      {isSpeaking && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          margin: '8px 16px'
        }}>
          <SpeakingIndicator>
            <span></span>
            <span></span>
            <span></span>
          </SpeakingIndicator>
          <SpeakingText>챗봇이 말하고 있어요...</SpeakingText>
        </div>
      )}

      {step === 1 && (
        <InputArea style={{
          flexShrink: 0,
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#ffffff'
        }}>
          <input
            value={spending}
            onChange={(e) => setSpending(e.target.value)}
            placeholder="예: 카페, 옷, 배달 등"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitSpending()}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '8px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleSubmitSpending} disabled={loading}>
              전송
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              {isRecording ? "🔚 마침" : "🎧 마이크"}
            </Button>
          </div>
        </InputArea>
      )}

      {step === 2 && (
        <InputArea style={{
          flexShrink: 0,
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {["스트레스", "보상심리", "충동", "무기력", "습관"].map((e) => (
            <Button key={e} onClick={() => handleSelectEmotion(e)} disabled={loading}>
              {e}
            </Button>
          ))}
        </InputArea>
      )}

      {step === 3 && (
        <InputArea style={{
          flexShrink: 0,
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {["좋아짐", "변화없음", "더 안좋아짐"].map((e) => (
            <Button key={e} onClick={() => handleSelectEffect(e)} disabled={loading}>
              {e}
            </Button>
          ))}
        </InputArea>
      )}

      {step === 4 && recommendation && (
        <InputArea style={{
          flexShrink: 0,
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          display: 'flex',
          gap: '8px'
        }}>
          <Button onClick={reset} disabled={loading}>
            다시 시작하기
          </Button>
          <Button onClick={handleReplay} disabled={!s3Key || loading}>
            다시 듣기
          </Button>
        </InputArea>
      )}
    </ChatContainer>
  );
};

export default ChatBot;