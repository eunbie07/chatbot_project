# filename: chat_api.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

# 수정된 import: deprecated된 langchain.chat_models 대신 langchain_openai 사용
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate

# LangSmith 추적을 위한 import (선택사항)
from langchain import smith
import langsmith

load_dotenv()
router = APIRouter()

# LangChain LLM 초기화 (OpenAI 기반)
llm = ChatOpenAI(
    model="gpt-4",  # 필요 시 gpt-3.5-turbo, gpt-4o로 변경 가능
    temperature=0,
)

# LangChain 프롬프트 템플릿 구성
prompt = PromptTemplate.from_template("""
당신은 감정 소비를 이해하고 공감하며 따뜻한 조언을 해주는 챗봇입니다.
현실적이고 부드러운 대안을 제공합니다.
git commit -m "db 변경사항 커밋"
사용자 메시지:
{message}

한 문장 이내로 따뜻하게 말하면서 감정을 해소할 수 있는 대안을 제시해줘.
""")

# 체인 구성 (프롬프트 → LLM → 문자열 출력)
chain = prompt | llm | StrOutputParser()

# Pydantic 모델 정의
class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str

# FastAPI 라우터 정의
@router.post("/chat", response_model=ChatResponse)
def chat_with_gpt(req: ChatRequest):
    try:
        # LangSmith 추적을 위한 메타데이터 설정 (선택사항)
        result = chain.invoke(
            {"message": req.message},
            config={
                "tags": ["fastapi-chat"],
                "metadata": {"user_id": req.user_id}
            }
        )
        return ChatResponse(reply=result)
    except Exception as e:
        return ChatResponse(reply=f"LangChain 호출 오류: {str(e)}")