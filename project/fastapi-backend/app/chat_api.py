from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import os
from openai import OpenAI  # 최신 SDK 사용
from dotenv import load_dotenv; load_dotenv();

router = APIRouter()

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
def chat_with_gpt(req: ChatRequest):
    user_id = req.user_id
    message = req.message

    gpt_messages = [
        {
            "role": "system",
            "content": "당신은 감정 소비를 이해하고 공감하며 따뜻한 조언을 해주는 챗봇입니다. 현실적이고 부드러운 대안을 제공합니다."
        },
        {
            "role": "user",
            "content": f"{message}\n\n한 문장 이내로 따뜻하게 말하면서 명확한 감정 해소 대안을 제시해줘."
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
        return ChatResponse(reply=f"GPT 호출 중 오류가 발생했습니다: {str(e)}")
