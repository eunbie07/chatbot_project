import os
import json
from pymongo import MongoClient

# MongoDB 연결
client = MongoClient("mongodb://localhost:32017")
db = client["consumption_db"]
collection = db["users"]

# 사용자 매핑
user_info = {
    ("여", 34, "직장인"): {
        "id": 1,
        "username": "soyeon123",
        "name": "김소연",
        "email": "soyeon.kim@example.com",
        "password": "test1234"
    },
    ("남", 22, "학생"): {
        "id": 2,
        "username": "eunwoo123",
        "name": "차은우",
        "email": "eunwoo.cha@example.com",
        "password": "test1235"
    },
    ("남", 42, "프리랜서"): {
        "id": 3,
        "username": "minseok123",
        "name": "박민석",
        "email": "minseok.park@example.com",
        "password": "test1236"
    }
}

# JSON 파일 폴더 위치
folder = "./json_data"
file_list = os.listdir(folder)

# 사용자별 데이터 묶기
user_data = {}

for filename in file_list:
    if filename.endswith(".json"):
        parts = filename.split("_")
        gender = parts[0]
        age = int(parts[1])
        job = parts[2].replace(".json", "")  # 확장자 제거
        key = (gender, age, job)

        if key not in user_info:
            continue

        # JSON 로딩
        with open(os.path.join(folder, filename), encoding='utf-8') as f:
            records = json.load(f)  # 이 records는 [{날짜, 소비목록: []}, ...]

        # 사용자 초기화
        if key not in user_data:
            user = user_info[key]
            user_data[key] = {
                "id": user["id"],
                "username": user["username"],
                "name": user["name"],
                "email": user["email"],
                "password": user["password"],
                "profile": {
                    "gender": gender,
                    "age": age,
                    "job": job,
                    "records": []  # 날짜 + 소비목록 유지
                }
            }

        # ✅ 날짜별 소비목록 그대로 누적
        user_data[key]["profile"]["records"].extend(records)

# MongoDB 저장
collection.delete_many({})  # 기존 데이터 제거 (선택)
for doc in user_data.values():
    collection.insert_one(doc)

print("MongoDB 저장 완료!")
