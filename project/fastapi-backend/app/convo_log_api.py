from fastapi import APIRouter, HTTPException # HTTPException도 import하는 것이 좋습니다.
from pydantic import BaseModel
from pymongo import MongoClient
from typing import List
import os

router = APIRouter()

mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(mongo_uri)
db = client["emotion_spending"]
collection = db["conversations"]
print(f"DEBUG: MongoDB URI used by FastAPI: {mongo_uri}")

class HistoryItem(BaseModel):
    role: str
    content: str

class ConvoLog(BaseModel):
    user_id: str
    date: str
    history: List[HistoryItem]

@router.post("/log-convo")
def save_conversation(log: ConvoLog):
    try:
        doc = {
            "user_id": log.user_id,
            "date": log.date,
            "history": [item.dict() for item in log.history]
        }
        print(f"DEBUG: Attempting to insert doc: {doc}") # 삽입 시도 전 데이터 확인
        
        result = collection.insert_one(doc) # <-- 여기를 수정했습니다!
        
        print(f"DEBUG: Data inserted with ID: {result.inserted_id}") # 삽입 성공 시 ID 출력
        return {"message": "대화 로그 저장 완료", "id": str(result.inserted_id)} # ID도 함께 반환 (선택 사항)
    except Exception as e:
        print(f"ERROR: Failed to save conversation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save conversation: {e}")