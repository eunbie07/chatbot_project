from pymongo import MongoClient
import json
import os

# MongoDB 연결
client = MongoClient("mongodb://localhost:32017")
db = client["spending_db"]
collection = db["spending_logs"]

# 파일 목록과 사용자 설정
files = [
    {"filename": "dummy_spending.json", "user_id": "user_female", "month": "2025-05"},
    {"filename": "dummy_spending_male.json", "user_id": "user_male", "month": "2025-05"},
    {"filename": "dummy_spending_young_employee.json", "user_id": "user_young", "month": "2025-05"}
]

# JSON 삽입
for entry in files:
    if not os.path.exists(entry["filename"]):
        print(f"파일 없음: {entry['filename']}")
        continue

    with open(entry["filename"], "r", encoding="utf-8") as f:
        data = json.load(f)

    document = {
        "user_id": entry["user_id"],
        "month": entry["month"],
        "data": data
    }

    collection.insert_one(document)
    print(f"{entry['filename']} → MongoDB 삽입 완료")

print("모든 JSON 파일 삽입 완료.")
print(db.list_collection_names())

