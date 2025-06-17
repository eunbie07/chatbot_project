# app/actual_spending_api.py

from fastapi import APIRouter
from pymongo import MongoClient
from fastapi.responses import JSONResponse
from collections import defaultdict

router = APIRouter()

# MongoDB 연결
mongo_client = MongoClient("mongodb://13.237.236.117:27017")
db = mongo_client.spending_db
collection = db.spending_logs

@router.get("/actuals/{user_id}")
def get_actuals(user_id: str):
    doc = collection.find_one({"user_id": user_id}, sort=[("month", -1)])
    if not doc:
        return JSONResponse(content={"error": "사용자 데이터 없음"}, status_code=404)

    actuals = defaultdict(int)
    for item in doc.get("data", []):
        if item.get("type") == "expense":
            category = item.get("category", "").strip()
            actuals[category] += item.get("amount", 0)

    return {"user_id": user_id, "actuals": dict(actuals)}
