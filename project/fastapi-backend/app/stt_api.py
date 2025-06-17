# stt_api.py
from fastapi import APIRouter, UploadFile, File
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/stt")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        audio_data = await file.read()
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=(file.filename, audio_data, file.content_type)
        )
        return {"text": response.text}
    except Exception as e:
        print("STT 오류:", e)
        return {"error": str(e)}
