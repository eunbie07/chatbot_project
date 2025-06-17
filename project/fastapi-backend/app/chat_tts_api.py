from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import requests
from openai import OpenAI
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
from io import BytesIO

# .env 환경변수 로드
load_dotenv()
router = APIRouter()

# API 키 설정
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")

# 한국어에 더 적합한 VOICE_ID를 ElevenLabs Voice Library에서 찾아서 여기에 입력하세요.
# 예시:
# VOICE_ID = "21m00Tcm4TlvDq8ikWAM" # 한국어 여성 음성 (ElevenLabs 기본 Voice Library 중 하나)
# VOICE_ID = "EXAVO3S0K6yihJmXm9mB" # 한국어 남성 음성 (ElevenLabs 기본 Voice Library 중 하나)
# VOICE_ID = "YOUR_KOREAN_VOICE_ID_HERE" # 실제 사용하실 VOICE_ID로 변경 필요
VOICE_ID = "uyVNoMrnUku1dZyVEXwD" # 임시 한국어 여성 Voice ID (ElevenLabs 기본 샘플 중 하나)

# 키 유효성 확인 (실제 배포 시에는 로깅 레벨 조정)
print("✅ ELEVEN_API_KEY 로드됨:", bool(ELEVEN_API_KEY))

# 요청/응답 모델 정의
class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str

# GPT만 사용하는 기존 엔드포인트
@router.post("/chat", response_model=ChatResponse)
def chat_with_gpt(req: ChatRequest):
    message = req.message

    gpt_messages = [
        {
            "role": "system",
            "content": "당신은 감정 소비를 이해하고 공감하며 따뜻한 조언을 해주는 챗봇입니다. 현실적이고 부드러운 대안을 제공합니다."
        },
        {
            "role": "user",
            "content": f"{message}\n\n세 문장 이내로 따뜻하게 말하면서 명확한 감정 해소 대안을 제시해줘."
        }
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=gpt_messages
        )
        reply = response.choices[0].message.content
        return ChatResponse(reply=reply)
    except Exception as e:
        # 오류 메시지를 사용자에게 직접 보여주기보다는 내부 로깅 후 일반적인 메시지 반환 권장
        print(f"GPT 호출 중 오류 발생: {e}")
        return ChatResponse(reply=f"죄송합니다, 현재 답변을 드릴 수 없습니다. 잠시 후 다시 시도해주세요.")


# GPT + TTS 동시 처리
@router.post("/chat-tts")
def chat_with_gpt_and_tts(req: ChatRequest):
    message = req.message

    # 1. GPT 응답 생성
    gpt_messages = [
        {
            "role": "system",
            "content": "당신은 감정 소비를 이해하고 공감하며 따뜻한 조언을 해주는 챗봇입니다. 현실적이고 부드러운 대안을 제공합니다."
        },
        {
            "role": "user",
            "content": f"{message}\n\n세 문장 이내로 따뜻하게 말하면서 명확한 감정 해소 대안을 제시해줘."
        }
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=gpt_messages
        )
        reply = response.choices[0].message.content.strip()
        print("🧠 GPT 응답:", reply)
    except Exception as e:
        print(f"GPT 호출 실패: {e}")
        raise HTTPException(status_code=500, detail=f"GPT 응답 생성에 실패했습니다. {str(e)}")

    # 2. TTS 요청 준비
    # ElevenLabs API는 텍스트 길이에 제한이 있습니다 (무료 플랜 기준 약 5000자, 유료 플랜은 더 길어짐)
    # 현재 코드는 4900자로 잘라내지만, 실제 제한에 맞춰 조정하는 것이 좋습니다.
    if len(reply) > 4900: # 5000자 제한을 고려하여 안전하게 4900자로 설정
        reply = reply[:4900]
        print("✂ 응답이 너무 길어 잘라냄")

    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    tts_headers = {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    tts_payload = {
        "text": reply,
        # eleven_monolingual_v1 대신 eleven_multilingual_v2 사용
        "model_id": "eleven_multilingual_v2", # <-- 한국어 지원에 더 적합한 모델로 변경
        "voice_settings": {
            "stability": 0.7,
            "similarity_boost": 0.7
            # "style": 0.5, # eleven_v3에서 사용 가능한 설정 (감정 표현)
            # "use_speaker_boost": True # eleven_v3에서 사용 가능한 설정
        }
    }

    # 3. ElevenLabs 호출
    try:
        tts_response = requests.post(tts_url, json=tts_payload, headers=tts_headers)
        print("🎤 TTS 응답 코드:", tts_response.status_code)

        if tts_response.status_code != 200:
            print("❌ TTS 응답 오류:", tts_response.text)
            raise Exception(f"ElevenLabs TTS 오류: {tts_response.status_code} - {tts_response.text}")

        # 4. mp3 파일 StreamingResponse로 반환
        audio_stream = BytesIO(tts_response.content)
        return StreamingResponse(audio_stream, media_type="audio/mpeg")

    except Exception as e:
        print(f"TTS 생성 실패: {e}")
        raise HTTPException(status_code=500, detail=f"음성 생성에 실패했습니다. {str(e)}")

