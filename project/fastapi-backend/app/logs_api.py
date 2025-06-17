# app/logs_api.py ← 사용자 기록 조회 

from fastapi import APIRouter, Query
from pymongo import MongoClient
from typing import List
import os

router = APIRouter()

client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = client["emotion_spending"]
collection = db["daily_emotion_logs"]

@router.get("/logs")
def get_logs(user_id: str = Query(..., description="사용자 ID")):
    results = collection.find({"user_id": user_id})
    
    # ObjectId는 문자열로 변환
    logs = []
    for r in results:
        r["_id"] = str(r["_id"])
        logs.append(r)

    return {"user_id": user_id, "logs": logs}
