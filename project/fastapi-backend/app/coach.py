# ✅ app/coach.py (완전 수정 버전)
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from fastapi.responses import JSONResponse
import json
import traceback

load_dotenv()
router = APIRouter()

# 전역 변수 초기화
client = None
collection = None

# OpenAI 클라이언트 초기화
try:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        client = OpenAI(api_key=openai_api_key)
        print("DEBUG: OpenAI client initialized successfully")
    else:
        print("WARNING: OPENAI_API_KEY not found in environment variables")
except Exception as openai_error:
    print(f"ERROR: Failed to initialize OpenAI client: {str(openai_error)}")
    client = None

# MongoDB 연결
try:
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
    print(f"DEBUG: MongoDB URI used: {mongo_uri}")
    
    mongo = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    # 연결 테스트
    mongo.admin.command('ismaster')
    print("DEBUG: MongoDB connection successful for coach")
    
    db = mongo.consumption_db
    collection = db.users
    print("DEBUG: Collection initialized successfully")
    
except Exception as mongo_error:
    print(f"ERROR: Failed to connect to MongoDB: {str(mongo_error)}")
    mongo = None
    collection = None

@router.get("/coach/{user_id}")
def get_coaching(user_id: str):
    try:
        print(f"DEBUG: ======= Starting coach API for user: {user_id} =======")
        
        # 기본 검증
        if collection is None:
            print("ERROR: No MongoDB connection available")
            raise HTTPException(status_code=500, detail="데이터베이스 연결 오류")
        
        # 사용자 검색
        print(f"DEBUG: Searching for user with username: {user_id}")
        
        try:
            user = collection.find_one({"username": user_id})
            print(f"DEBUG: MongoDB query completed")
        except Exception as query_error:
            print(f"ERROR: MongoDB query failed: {str(query_error)}")
            raise HTTPException(status_code=500, detail="데이터베이스 쿼리 오류")
        
        if not user:
            print(f"DEBUG: User '{user_id}' not found, checking database contents...")
            try:
                # 데이터베이스 상태 확인
                total_users = collection.count_documents({})
                print(f"DEBUG: Total users in database: {total_users}")
                
                # 첫 몇 명의 사용자 확인
                sample_users = list(collection.find({}, {"username": 1, "name": 1}).limit(3))
                print(f"DEBUG: Sample users: {sample_users}")
                
            except Exception as debug_error:
                print(f"DEBUG: Error checking database contents: {str(debug_error)}")
            
            raise HTTPException(status_code=404, detail=f"사용자 '{user_id}'를 찾을 수 없습니다")

        print(f"DEBUG: User found successfully")
        print(f"DEBUG: User top-level keys: {list(user.keys())}")

        # Profile 확인
        if "profile" not in user:
            print(f"ERROR: No 'profile' field in user data")
            raise HTTPException(status_code=404, detail="사용자 프로필이 없습니다")
        
        if not isinstance(user["profile"], dict):
            print(f"ERROR: 'profile' is not a dictionary: {type(user['profile'])}")
            raise HTTPException(status_code=404, detail="사용자 프로필 형식 오류")
        
        print(f"DEBUG: Profile keys: {list(user['profile'].keys())}")

        # Records 확인
        if "records" not in user["profile"]:
            print(f"ERROR: No 'records' field in profile")
            raise HTTPException(status_code=404, detail="소비 기록이 없습니다")
        
        records = user["profile"]["records"]
        
        if not isinstance(records, list):
            print(f"ERROR: 'records' is not a list: {type(records)}")
            raise HTTPException(status_code=404, detail="소비 기록 형식 오류")
        
        if len(records) == 0:
            print(f"ERROR: 'records' list is empty")
            raise HTTPException(status_code=404, detail="소비 기록이 비어있습니다")

        print(f"DEBUG: Found {len(records)} records")

        # 첫 번째 레코드 구조 확인
        if records:
            first_record = records[0]
            print(f"DEBUG: First record keys: {list(first_record.keys()) if isinstance(first_record, dict) else 'Not a dict'}")

        # 최근 월 추출
        last_month = "2025-06"  # 기본값
        try:
            for record in reversed(records):
                if isinstance(record, dict):
                    # 여러 가능한 날짜 필드 확인
                    date_field = None
                    for field in ["날짜", "날", "date"]:
                        if field in record:
                            date_field = record[field]
                            break
                    
                    if date_field and isinstance(date_field, str) and len(date_field) >= 7:
                        last_month = date_field[:7]
                        print(f"DEBUG: Found last month: {last_month}")
                        break
        except Exception as date_error:
            print(f"DEBUG: Error extracting last month: {str(date_error)}")
            
        print(f"DEBUG: Processing data for month: {last_month}")
        
        # 데이터 처리
        data = []
        processed_records = 0

        for i, record in enumerate(records):
            try:
                if not isinstance(record, dict):
                    continue
                    
                # 날짜 필드 찾기
                날짜 = None
                for field in ["날짜", "날", "date"]:
                    if field in record:
                        날짜 = record[field]
                        break
                
                if not 날짜 or not isinstance(날짜, str):
                    continue
                    
                if not 날짜.startswith(last_month):
                    continue

                # 소비목록 찾기
                소비목록 = None
                for field in ["소비목록", "consumption_list", "items"]:
                    if field in record:
                        소비목록 = record[field]
                        break
                
                if not isinstance(소비목록, list):
                    continue
                    
                for item in 소비목록:
                    try:
                        if not isinstance(item, dict):
                            continue
                            
                        # 필드 매핑
                        분류 = item.get("분류", item.get("type", item.get("종류", "")))
                        항목 = item.get("항목", item.get("category", item.get("카테고리", "")))
                        금액 = item.get("금액", item.get("amount", item.get("가격", 0)))
                        
                        if not isinstance(금액, (int, float)):
                            try:
                                금액 = float(금액) if 금액 else 0
                            except:
                                continue
                        
                        type_ = "income" if 분류 == "수입" else "expense"
                            
                        data.append({
                            "date": 날짜,
                            "type": type_,
                            "category": 항목,
                            "amount": 금액,
                            "description": item.get("상세내역", item.get("description", ""))
                        })
                        processed_records += 1
                        
                        if processed_records <= 3:  # 처음 몇 개만 로그
                            print(f"DEBUG: Processed item: {type_} / {항목} / {금액}")
                        
                    except Exception as item_error:
                        print(f"DEBUG: Error processing item in record {i}: {str(item_error)}")
                        continue
                        
            except Exception as record_error:
                print(f"DEBUG: Error processing record {i}: {str(record_error)}")
                continue

        print(f"DEBUG: Total processed {processed_records} items from {len(records)} records")

        if not data:
            print(f"ERROR: No data found for month {last_month}")
            # 디버깅: 어떤 월의 데이터가 있는지 확인
            available_months = set()
            for record in records[:10]:  # 처음 10개만 체크
                if isinstance(record, dict):
                    for field in ["날짜", "날", "date"]:
                        if field in record:
                            date_str = record[field]
                            if isinstance(date_str, str) and len(date_str) >= 7:
                                available_months.add(date_str[:7])
            print(f"DEBUG: Available months in data: {list(available_months)}")
            raise HTTPException(status_code=404, detail=f"{last_month} 월의 소비 데이터가 없습니다")

        total_income = sum(i["amount"] for i in data if i["type"] == "income")
        total_expense = sum(i["amount"] for i in data if i["type"] == "expense")
        
        print(f"DEBUG: Total income: {total_income:,}, Total expense: {total_expense:,}")
        
        # 카테고리별 지출 계산
        expense_by_category = {}
        for item in data:
            if item["type"] == "expense" and item["category"]:
                category = item["category"]
                expense_by_category[category] = expense_by_category.get(category, 0) + item["amount"]

        # AI 처리 시도, 실패 시 폴백
        if client is not None and expense_by_category:
            try:
                print("DEBUG: Attempting AI processing")
                
                summary_text = "\n".join([
                    f"{i['date']} - {i['type']} / {i['category']} / {i['amount']:,}원" 
                    for i in data[:50]
                ])

                prompt = f"""
아래는 사용자의 월별 소비 내역입니다.

- 월: {last_month}
- 총 수입: {total_income:,}원
- 총 지출: {total_expense:,}원

[카테고리별 지출]
{chr(10).join([f"{cat}: {amount:,}원" for cat, amount in expense_by_category.items()])}

[상세 내역 (일부)]
{summary_text}

이 정보를 바탕으로 아래 JSON 구조로 예산안을 추천해 주세요. **설명 없이 아래 구조만 그대로 출력**하세요:

{{
  "budgets": {{
    "식비": 300000,
    "쇼핑": 100000,
    "기타": 50000
  }},
  "saving_goal": 400000,
  "tips": [
    "불필요한 구독 정리",
    "배달 대신 요리하기",
    "소비 기록 습관 들이기"
  ]
}}
"""

                response = client.chat.completions.create(
                    model="gpt-4-turbo",
                    messages=[
                        {"role": "system", "content": "너는 소비 코치야. 반드시 설명 없이 JSON 형식만 출력해야 해."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=1000,
                    temperature=0.7
                )

                raw_content = response.choices[0].message.content.strip()
                print(f"DEBUG: GPT Raw Response: {raw_content}")
                
                # JSON 파싱 전 정리
                if raw_content.startswith("```json"):
                    raw_content = raw_content[7:-3].strip()
                elif raw_content.startswith("```"):
                    raw_content = raw_content[3:-3].strip()
                    
                parsed = json.loads(raw_content)

                if all(k in parsed for k in ("budgets", "saving_goal", "tips")):
                    print("DEBUG: AI response successful")
                    return JSONResponse(content=parsed)
                else:
                    print(f"DEBUG: AI response missing keys, using fallback")
                    raise ValueError("Invalid AI response structure")
                    
            except Exception as ai_error:
                print(f"DEBUG: AI processing failed: {str(ai_error)}, using fallback")
        
        # 폴백: AI 없는 간단한 예산 추천
        print("DEBUG: Using fallback budget calculation")
        
        budgets = {}
        for category, amount in expense_by_category.items():
            budgets[category] = int(amount * 1.1)  # 10% 여유
        
        if not budgets:
            budgets = {"기타": 100000}
        
        # 사용자별 맞춤 팁
        tips = ["소비 패턴을 정기적으로 확인하세요"]
        
        if "스트레스 쇼핑" in expense_by_category:
            tips.append("스트레스 쇼핑을 줄이기 위해 대체 활동을 찾아보세요")
        if "카페" in expense_by_category:
            tips.append("카페 대신 집에서 커피를 만들어 드셔보세요")
        if "패션" in expense_by_category:
            tips.append("의류 구매 전 30일 대기 규칙을 적용해보세요")
        
        if len(tips) == 1:
            tips.extend([
                "불필요한 지출을 줄여보세요",
                "목표 저축액을 설정하세요"
            ])
        
        response_data = {
            "budgets": budgets,
            "saving_goal": max(100000, int(total_income * 0.2)) if total_income > 0 else 100000,
            "tips": tips[:3]  # 최대 3개
        }
        
        print(f"DEBUG: Returning response: {response_data}")
        return JSONResponse(content=response_data)

    except HTTPException:
        # HTTPException은 그대로 전달
        raise
    except Exception as e:
        print(f"CRITICAL ERROR in coach API: {str(e)}")
        print(f"CRITICAL ERROR traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")


