# app/log_api.py ← 소비/감정 저장

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from pymongo import MongoClient
from datetime import datetime
import os

router = APIRouter()

client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = client["emotion_spending"]
collection = db["daily_emotion_logs"]

class Emotion(BaseModel):
    label: str
    source: str

class SpendingEntry(BaseModel):
    user_id: str
    date: str
    category: str
    amount: int
    description: str
    emotion: Emotion

@router.post("/log")
def save_log(entry: SpendingEntry):
    entry_dict = entry.dict()
    entry_dict["created_at"] = datetime.now().isoformat()
    result = collection.insert_one(entry_dict)

    # ObjectId를 문자열로 변환하여 응답
    return {
        "message": "저장 완료",
        "inserted_id": str(result.inserted_id)
    }
