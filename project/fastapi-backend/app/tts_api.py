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
from fastapi.responses import StreamingResponse, JSONResponse
from io import BytesIO
import requests, os, uuid, boto3
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# 환경 변수 로드
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
VOICE_ID = "uyVNoMrnUku1dZyVEXwD"
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# S3 클라이언트 초기화
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name="ap-northeast-2"
)

# 요청 바디 정의
class TTSRequest(BaseModel):
    user_id: str
    message: str
    return_type: str = "stream"  # "stream" 또는 "url"

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
        "voice_settings": {
            "stability": 0.7,
            "similarity_boost": 0.7
        }
    }

    try:
        # 1. ElevenLabs API 호출 (TTS 생성)
        r = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers=headers,
            json=payload
        )

        if r.status_code != 200:
            raise Exception(f"ElevenLabs 오류: {r.text}")

        # 2. mp3 파일 메모리로 로드
        audio_bytes = BytesIO(r.content)

        # 3. S3 저장
        filename = f"{req.user_id}_{uuid.uuid4().hex}.mp3"
        s3_key = f"tts_audio/{filename}"

        s3_client.upload_fileobj(
            audio_bytes,
            S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': 'audio/mpeg'}
        )

        # 4. presigned URL 생성 (다시듣기용)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=3600  # 1시간 유효
        )

        # 5. 클라이언트가 원하면 presigned URL만 응답
        if req.return_type == "url":
            return JSONResponse({"url": presigned_url})

        # 6. 기본은 스트리밍 응답 + presigned URL 같이 제공
        audio_bytes.seek(0)
        return StreamingResponse(
            audio_bytes,
            media_type="audio/mpeg",
            headers={"X-Audio-URL": presigned_url}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {str(e)}")

