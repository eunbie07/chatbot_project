# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from fastapi.responses import StreamingResponse
# from io import BytesIO
# import requests, os
# from dotenv import load_dotenv

# load_dotenv()
# router = APIRouter()

# ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
# VOICE_ID = "uyVNoMrnUku1dZyVEXwD"

# class TTSRequest(BaseModel):
#     user_id: str
#     message: str

# @router.post("/tts")
# def tts(req: TTSRequest):
#     text = req.message.strip()
#     if len(text) > 4900:
#         text = text[:4900]

#     headers = {
#         "xi-api-key": ELEVEN_API_KEY,
#         "Content-Type": "application/json",
#         "Accept": "audio/mpeg"
#     }
#     payload = {
#         "text": text,
#         "model_id": "eleven_multilingual_v2",
#         "voice_settings": {"stability": 0.7, "similarity_boost": 0.7}
#     }

#     try:
#         r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
#                           headers=headers, json=payload)
#         if r.status_code != 200:
#             raise Exception(r.text)
#         return StreamingResponse(BytesIO(r.content), media_type="audio/mpeg")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {str(e)}")


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from io import BytesIO
import requests, os, uuid, boto3
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
VOICE_ID = "uyVNoMrnUku1dZyVEXwD"

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name="ap-northeast-2"
)

class TTSRequest(BaseModel):
    user_id: str
    message: str

@router.post("/tts")
def tts(req: TTSRequest):
    text = req.message.strip()
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
        # 1. ElevenLabs TTS 생성
        r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
                          headers=headers, json=payload)
        if r.status_code != 200:
            raise Exception(r.text)

        # 2. 파일명 생성
        filename = f"{req.user_id}_{uuid.uuid4().hex}.mp3"
        s3_key = f"tts_audio/{filename}"

        # 3. S3 업로드
        s3_client.upload_fileobj(BytesIO(r.content), S3_BUCKET_NAME, s3_key)

        # 4. S3 URL 생성 (퍼블릭일 경우 바로 URL 접근 가능)
        s3_url = f"https://{S3_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/{s3_key}"

        return JSONResponse({"url": s3_url})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {str(e)}")
