# app/actual_spending_api.py
from fastapi import APIRouter
from pymongo import MongoClient
from fastapi.responses import JSONResponse
from collections import defaultdict
import os
from dotenv import load_dotenv

load_dotenv()  # 추가
router = APIRouter()

# MongoDB 연결 수정
mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
print(f"DEBUG: MongoDB URI used by actuals API: {mongo_uri}")  # 디버그 로그 추가
mongo_client = MongoClient(mongo_uri)
db = mongo_client.spending_db
collection = db.spending_logs

@router.get("/actuals/{user_id}")
def get_actuals(user_id: str):
    try:  # 예외 처리 추가
        doc = collection.find_one({"user_id": user_id}, sort=[("month", -1)])
        if not doc:
            return JSONResponse(content={"error": "사용자 데이터 없음"}, status_code=404)

        actuals = defaultdict(int)
        for item in doc.get("data", []):
            if item.get("type") == "expense":
                category = item.get("category", "").strip()
                actuals[category] += item.get("amount", 0)

        return {"user_id": user_id, "actuals": dict(actuals)}
    
    except Exception as e:
        print(f"ERROR in actuals API: {str(e)}")  # 에러 로깅
        return JSONResponse(
            content={"error": f"데이터 조회 중 오류 발생: {str(e)}"}, 
            status_code=500
        )