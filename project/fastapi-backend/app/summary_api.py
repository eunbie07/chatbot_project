# ✅ app/summary_api.py (개선된 버전)
from fastapi import APIRouter, HTTPException, Query
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import traceback
from datetime import datetime
from typing import Optional

load_dotenv()
router = APIRouter()

# MongoDB 연결 - 시작 시 확실히 체크
def init_mongodb():
    try:
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
        print(f"DEBUG: MongoDB URI used by summary API: {mongo_uri}")
        
        mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        mongo_client.admin.command('ismaster')
        print("DEBUG: MongoDB connection successful for summary")
        
        db = mongo_client.consumption_db
        return db.users
    except Exception as e:
        print(f"ERROR: MongoDB connection failed for summary: {str(e)}")
        raise Exception(f"데이터베이스 연결 실패: {str(e)}")

# 전역 변수로 컬렉션 초기화
try:
    collection = init_mongodb()
except Exception as e:
    print(f"FATAL: {str(e)}")
    collection = None

def find_latest_month(records):
    """레코드에서 가장 최신 월을 찾는 함수"""
    latest_date = None
    
    for record in records:
        if not isinstance(record, dict):
            continue
            
        # 날짜 필드 찾기
        date_value = None
        for field in ["날짜", "날", "date"]:
            if field in record:
                date_value = record[field]
                break
        
        if date_value and isinstance(date_value, str) and len(date_value) >= 7:
            try:
                # YYYY-MM 형태로 추출
                month_str = date_value[:7]
                # 최신 날짜 비교
                if latest_date is None or month_str > latest_date:
                    latest_date = month_str
            except:
                continue
    
    return latest_date or datetime.now().strftime("%Y-%m")

def calculate_month_summary(records, target_month):
    """특정 월의 수입/지출 합계 계산"""
    total_income = 0
    total_expense = 0
    processed_count = 0
    
    for record in records:
        if not isinstance(record, dict):
            continue
            
        # 날짜 확인
        date_value = None
        for field in ["날짜", "날", "date"]:
            if field in record:
                date_value = record[field]
                break
        
        # 해당 월의 데이터가 아니면 스킵
        if not date_value or not isinstance(date_value, str) or not date_value.startswith(target_month):
            continue

        # 소비목록 확인
        consumption_list = None
        for field in ["소비목록", "consumption_list", "items"]:
            if field in record:
                consumption_list = record[field]
                break
        
        if not isinstance(consumption_list, list):
            continue
            
        # 각 항목 처리
        for item in consumption_list:
            if not isinstance(item, dict):
                continue
                
            category = item.get("분류", item.get("type", ""))
            amount = item.get("금액", item.get("amount", 0))
            
            if isinstance(amount, (int, float)) and amount > 0:
                if category == "수입":
                    total_income += amount
                elif category == "지출":
                    total_expense += amount
                processed_count += 1

    return total_income, total_expense, processed_count

@router.get("/summary/{user_id}")
def get_summary(
    user_id: str, 
    month: Optional[str] = Query(None, description="조회할 월 (YYYY-MM 형태, 예: 2025-06)")
):
    """
    사용자의 월별 수입/지출 요약 조회
    
    Args:
        user_id: 사용자 ID
        month: 조회할 월 (선택사항, 없으면 최신 월 자동 선택)
    
    Returns:
        월별 수입/지출 요약 데이터
    """
    try:
        print(f"DEBUG: ======= Starting summary API for user: {user_id} =======")
        
        if collection is None:
            raise HTTPException(status_code=500, detail="데이터베이스 연결 오류")
        
        # 사용자 데이터 조회
        user = collection.find_one({"username": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자 데이터 없음")

        print(f"DEBUG: User found for summary")
        
        # 레코드 존재 여부 확인
        if "profile" not in user or "records" not in user["profile"]:
            current_month = month or datetime.now().strftime("%Y-%m")
            return {
                "user_id": user_id, 
                "total_income": 0, 
                "total_expense": 0,
                "month": current_month,
                "balance": 0,
                "processed_items": 0
            }
            
        records = user["profile"]["records"]
        
        if not isinstance(records, list) or len(records) == 0:
            current_month = month or datetime.now().strftime("%Y-%m")
            return {
                "user_id": user_id, 
                "total_income": 0, 
                "total_expense": 0,
                "month": current_month,
                "balance": 0,
                "processed_items": 0
            }

        # 조회할 월 결정
        if month:
            # 사용자가 지정한 월
            target_month = month
            print(f"DEBUG: Using user-specified month: {target_month}")
        else:
            # 최신 월 자동 탐지
            target_month = find_latest_month(records)
            print(f"DEBUG: Auto-detected latest month: {target_month}")

        # 월별 합계 계산
        total_income, total_expense, processed_count = calculate_month_summary(records, target_month)

        print(f"DEBUG: Summary for {target_month} - processed {processed_count} items")
        print(f"DEBUG: Total income: {total_income:,}, Total expense: {total_expense:,}")
        
        return {
            "user_id": user_id,
            "total_income": total_income,
            "total_expense": total_expense,
            "month": target_month,
            "balance": total_income - total_expense,
            "processed_items": processed_count
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in summary API: {str(e)}")
        print(f"ERROR traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"요약 데이터 조회 중 오류 발생: {str(e)}")

@router.get("/summary/{user_id}/months")
def get_available_months(user_id: str):
    """
    사용자의 데이터가 있는 모든 월 목록 조회
    """
    try:
        print(f"DEBUG: Getting available months for user: {user_id}")
        
        if collection is None:
            raise HTTPException(status_code=500, detail="데이터베이스 연결 오류")
        
        user = collection.find_one({"username": user_id})
        
        if not user or "profile" not in user or "records" not in user["profile"]:
            return {"user_id": user_id, "available_months": []}
            
        records = user["profile"]["records"]
        
        if not isinstance(records, list):
            return {"user_id": user_id, "available_months": []}

        # 모든 월 수집
        months = set()
        for record in records:
            if not isinstance(record, dict):
                continue
                
            date_value = None
            for field in ["날짜", "날", "date"]:
                if field in record:
                    date_value = record[field]
                    break
            
            if date_value and isinstance(date_value, str) and len(date_value) >= 7:
                try:
                    month_str = date_value[:7]
                    months.add(month_str)
                except:
                    continue
        
        # 월 정렬 (최신순)
        sorted_months = sorted(list(months), reverse=True)
        
        print(f"DEBUG: Found {len(sorted_months)} months with data")
        
        return {
            "user_id": user_id,
            "available_months": sorted_months,
            "latest_month": sorted_months[0] if sorted_months else None
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_available_months: {str(e)}")
        raise HTTPException(status_code=500, detail=f"월 목록 조회 중 오류 발생: {str(e)}")