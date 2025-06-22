# ✅ app/summary_api.py (새로운 파일 생성)
from fastapi import APIRouter, HTTPException
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import traceback

load_dotenv()
router = APIRouter()

# MongoDB 연결
collection = None
try:
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
    print(f"DEBUG: MongoDB URI used by summary API: {mongo_uri}")
    
    mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    mongo_client.admin.command('ismaster')
    print("DEBUG: MongoDB connection successful for summary")
    
    db = mongo_client.consumption_db
    collection = db.users
except Exception as e:
    print(f"ERROR: MongoDB connection failed for summary: {str(e)}")
    collection = None

@router.get("/summary/{user_id}")
def get_summary(user_id: str):
    try:
        print(f"DEBUG: ======= Starting summary API for user: {user_id} =======")
        
        if collection is None:
            raise HTTPException(status_code=500, detail="데이터베이스 연결 오류")
        
        user = collection.find_one({"username": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자 데이터 없음")

        print(f"DEBUG: User found for summary")
        
        if "profile" not in user or "records" not in user["profile"]:
            return {
                "user_id": user_id, 
                "total_income": 0, 
                "total_expense": 0,
                "month": "N/A"
            }
            
        records = user["profile"]["records"]
        
        if not isinstance(records, list):
            return {
                "user_id": user_id, 
                "total_income": 0, 
                "total_expense": 0,
                "month": "N/A"
            }

        # 최신 월 계산 (coach.py와 동일한 로직)
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

        print(f"DEBUG: Processing summary for month: {last_month}")

        total_income = 0
        total_expense = 0
        processed_count = 0
        
        for record in records:
            if not isinstance(record, dict):
                continue
                
            # 날짜 확인
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
                금액 = item.get("금액", item.get("amount", 0))
                
                if isinstance(금액, (int, float)) and 금액 > 0:
                    if 분류 == "수입":
                        total_income += 금액
                    elif 분류 == "지출":
                        total_expense += 금액
                    processed_count += 1

        print(f"DEBUG: Summary processed {processed_count} items for {last_month}")
        print(f"DEBUG: Total income: {total_income:,}, Total expense: {total_expense:,}")
        
        return {
            "user_id": user_id,
            "total_income": total_income,
            "total_expense": total_expense,
            "month": last_month,
            "balance": total_income - total_expense
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in summary API: {str(e)}")
        print(f"ERROR traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"요약 데이터 조회 중 오류 발생: {str(e)}")


