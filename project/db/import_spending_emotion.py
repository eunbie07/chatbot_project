from pymongo import MongoClient
import json
from datetime import datetime

client = MongoClient("mongodb://localhost:27017")
db = client["emotion_spending"]
collection = db["monthly_logs"]

# 감정 포함된 JSON 파일 로드
with open("spending_with_emotion.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# MongoDB 저장 (기존 _id 제거)
for user_log in data:
    user_log.pop("_id", None)  # 오류 방지
    user_log["created_at"] = datetime.now().isoformat()
    collection.insert_one(user_log)

print("감정 포함 소비 데이터 저장 완료 (monthly_logs)")
