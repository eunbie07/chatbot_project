# ✅ app/actuals.py (동기화 개선 버전)
from fastapi import APIRouter, HTTPException
from pymongo import MongoClient
from collections import defaultdict
import os
from dotenv import load_dotenv
import traceback

load_dotenv()
router = APIRouter()

# MongoDB 연결
collection = None
try:
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
    print(f"DEBUG: MongoDB URI used by actuals API: {mongo_uri}")
    
    mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    mongo_client.admin.command('ismaster')
    print("DEBUG: MongoDB connection successful for actuals")
    
    db = mongo_client.consumption_db
    collection = db.users
except Exception as e:
    print(f"ERROR: MongoDB connection failed for actuals: {str(e)}")
    collection = None

@router.get("/actuals/{user_id}")
def get_actuals(user_id: str):
    try:
        print(f"DEBUG: ======= Starting actuals API for user: {user_id} =======")
        
        if collection is None:
            raise HTTPException(status_code=500, detail="데이터베이스 연결 오류")
        
        user = collection.find_one({"username": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자 데이터 없음")

        print(f"DEBUG: User found for actuals")
        
        if "profile" not in user or "records" not in user["profile"]:
            return {"user_id": user_id, "actuals": {}}
            
        records = user["profile"]["records"]
        
        if not isinstance(records, list):
            return {"user_id": user_id, "actuals": {}}

        # ✅ coach.py와 동일한 월 계산 로직
        last_month = "2025-06"  # 기본값
        try:
            for record in reversed(records):
                if isinstance(record, dict):
                    for field in ["날짜", "날", "date"]:
                        if field in record:
                            date_field = record[field]
                            if date_field and isinstance(date_field, str) and len(date_field) >= 7:
                                last_month = date_field[:7]
                                break
                    if last_month != "2025-06":  # 기본값에서 변경되었으면 중단
                        break
        except Exception as date_error:
            print(f"DEBUG: Error extracting last month: {str(date_error)}")

        print(f"DEBUG: Processing actuals for month: {last_month}")

        actuals = defaultdict(int)
        processed_count = 0
        
        for record in records:
            if not isinstance(record, dict):
                continue
                
            # 날짜 확인 (coach.py와 동일한 로직)
            날짜 = None
            for field in ["날짜", "날", "date"]:
                if field in record:
                    날짜 = record[field]
                    break
            
            if not 날짜 or not isinstance(날짜, str) or not 날짜.startswith(last_month):
                continue

            # 소비목록 확인
            소비목록 = None
            for field in ["소비목록", "consumption_list", "items"]:
                if field in record:
                    소비목록 = record[field]
                    break
            
            if not isinstance(소비목록, list):
                continue
                
            for item in 소비목록:
                if not isinstance(item, dict):
                    continue
                    
                분류 = item.get("분류", item.get("type", ""))
                if 분류 == "지출":
                    category = item.get("항목", item.get("category", "")).strip()
                    amount = item.get("금액", item.get("amount", 0))
                    
                    if isinstance(amount, (int, float)) and amount > 0 and category:
                        actuals[category] += amount
                        processed_count += 1

        print(f"DEBUG: Actuals processed {processed_count} items for {last_month}: {dict(actuals)}")
        return {"user_id": user_id, "actuals": dict(actuals)}

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in actuals API: {str(e)}")
        print(f"ERROR traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"데이터 조회 중 오류 발생: {str(e)}")