import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ChatContainer,
  ChatHeader,
  ChatArea,
  MessageBox,
  MessageText,
  MessageMeta,
  InputArea,
  Button,
  DotLoader,
  NameTag,
  SpeakingIndicator,
  SpeakingText
} from './ChatStyles';

const ChatBot = () => {
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

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const user_id = "user_female";
  const getTime = () => new Date().toTimeString().slice(0, 5);

  const addMessage = (role, content) => {
    setHistory((prev) => [...prev, { role, content, time: getTime() }]);
  };

  const handleSubmitSpending = () => {
    if (!spending.trim()) return;
    addMessage('user', spending);
    addMessage('bot', "그 소비를 하신 이유나 기분은 어땠나요?");
    setSpending('');
    setStep(2);
  };

  const handleSelectEmotion = (e) => {
    addMessage('user', e);
    setEmotion(e);
    addMessage('bot', "그 소비 이후 기분은 어땠나요?");
    setStep(3);
  };

  const handleSelectEffect = async (e) => {
    addMessage('user', e);
    setEffect(e);
    setStep(4);

    const prompt = `
      사용자가 '${spending}'라는 소비를 했고,
      그 이유는 '${emotion}' 때문이었어요.
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

      await axios.post("https://eunbie.site/api/log-convo", {
        user_id,
        date: new Date().toISOString().slice(0, 10),
        history: [
          { role: "system", content: "4단계 감정 소비 반성 대화" },
          { role: "user", content: spending },
          { role: "user", content: emotion },
          { role: "user", content: e },
          { role: "gpt", content: reply }
        ]
      });

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
    setSpending('');
    setEmotion('');
    setEffect('');
    setRecommendation('');
    setHistory([{ role: 'bot', content: "오늘 어떤 소비를 하셨나요?", time: getTime() }]);
    setStep(1);
    setS3Key(null);
  };

  useEffect(() => {
    reset();
  }, []);

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
          setSpending(res.data.text);
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

  const handleTestUpload = async () => {
    const testMessage = "테스트 업로드용 음성입니다.";
    try {
      console.log("🛰️ 업로드 테스트 시작");

      const res = await axios.post("https://eunbie.site/api/tts_upload", {
        user_id,
        message: testMessage
      });

      console.log("✅ 업로드 성공:", res.data);
      alert("업로드 성공!\n" + res.data.url);
      setS3Key(res.data.s3_key);
    } catch (err) {
      console.error("❌ 업로드 실패:", err);
      alert("업로드 실패: " + (err?.response?.data?.detail || err.message));
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>감정 소비 반성 챗봇</ChatHeader>

      <ChatArea>
        {history.map((item, idx) => (
          <MessageBox key={idx} align={item.role === 'user' ? 'right' : 'left'}>
            <NameTag>{item.role === 'user' ? '나' : 'Chatbot'}</NameTag>
            {item.content !== null ? (
              <>
                <MessageText bg={item.role === 'user' ? '#d7d0ff' : '#e3f0ff'}>
                  {item.content}
                </MessageText>
                <MessageMeta>{item.time}</MessageMeta>
              </>
            ) : (
              <DotLoader><span></span><span></span><span></span></DotLoader>
            )}
          </MessageBox>
        ))}
      </ChatArea>

      {isSpeaking && (
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <SpeakingIndicator><span></span><span></span><span></span></SpeakingIndicator>
          <SpeakingText>챗봇이 말하고 있어요...</SpeakingText>
        </div>
      )}

      {step === 1 && (
        <InputArea>
          <input
            value={spending}
            onChange={(e) => setSpending(e.target.value)}
            placeholder="예: 카페, 옷, 배달 등"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitSpending()}
            disabled={loading}
          />
          <Button onClick={handleSubmitSpending} disabled={loading}>전송</Button>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
          >
            {isRecording ? "🛑 멈추기" : "🎙️ 녹음하기"}
          </Button>
        </InputArea>
      )}

      {step === 2 && (
        <InputArea>
          {["스트레스", "보상심리", "충동", "무기력", "습관"].map((e) => (
            <Button key={e} onClick={() => handleSelectEmotion(e)} disabled={loading}>{e}</Button>
          ))}
        </InputArea>
      )}

      {step === 3 && (
        <InputArea>
          {["좋아짐", "변화없음", "더 안좋아짐"].map((e) => (
            <Button key={e} onClick={() => handleSelectEffect(e)} disabled={loading}>{e}</Button>
          ))}
        </InputArea>
      )}

      {step === 4 && (
        <>
          <InputArea>
            <Button onClick={reset} disabled={loading}>다시 시작하기</Button>
            <Button onClick={handleReplay} disabled={!s3Key || loading}>다시 듣기</Button>
          </InputArea>
          <InputArea>
            <Button onClick={handleTestUpload} disabled={loading}>🛰️ 업로드 테스트</Button>
          </InputArea>
        </>
      )}
    </ChatContainer>
  );
};

export default ChatBot;
