from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# CORS 설정 (웹에서 호출 가능하게)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시 도메인 제한 권장
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://host.docker.internal:11434/api/chat"  # Docker 내부 → 호스트 Ollama 연결

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_message = data.get("message", "")

    payload = {
        "model": "llama3",
        "messages": [{"role": "user", "content": user_message}]
    }

    response = requests.post(OLLAMA_URL, json=payload)
    return response.json()
