from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 로컬 테스트만 허용
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    message: str

@app.post("/api/chat")
def chat(msg: Message):
    return {"reply": f"'{msg.message}'는 꼭 필요한 소비였나요?"}
