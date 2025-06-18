# 📄 tts_upload_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from io import BytesIO
import requests, os, uuid, boto3
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# 환경 변수 로드
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
VOICE_ID = os.getenv("VOICE_ID", "uyVNoMrnUku1dZyVEXwD")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION", "ap-northeast-2")

# S3 클라이언트 생성
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=S3_REGION
)

# 요청 Body 모델
class TTSUploadRequest(BaseModel):
    user_id: str
    message: str

@router.post("/tts_upload")
def tts_upload(req: TTSUploadRequest):
    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="메시지가 비어 있습니다.")

    if len(text) > 4900:
        text = text[:4900]

    headers = {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.7, "similarity_boost": 0.7}
    }

    try:
        # TTS 음성 생성
        r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
                          headers=headers, json=payload)
        if r.status_code != 200:
            raise Exception(f"ElevenLabs 오류: {r.status_code} - {r.text}")

        # S3에 업로드
        filename = f"{req.user_id}_{uuid.uuid4().hex}.mp3"
        s3_key = f"tts_audio/{filename}"
        s3_client.upload_fileobj(
            BytesIO(r.content),
            S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': 'audio/mpeg'}
        )

        s3_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{s3_key}"
        return JSONResponse({"url": s3_url, "s3_key": s3_key})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS 업로드 실패: {str(e)}")
