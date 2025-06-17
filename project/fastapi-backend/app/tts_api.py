from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from io import BytesIO
import requests, os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
VOICE_ID = "uyVNoMrnUku1dZyVEXwD"

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
        r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
                          headers=headers, json=payload)
        if r.status_code != 200:
            raise Exception(r.text)
        return StreamingResponse(BytesIO(r.content), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {str(e)}")
