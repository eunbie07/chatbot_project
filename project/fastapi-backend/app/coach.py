# ✅ app/coach.py (월 동기화 문제 해결 버전)
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

# ✅ 월 추출 함수 추가 (다른 API와 동일한 로직)
def get_latest_month_from_records(records):
    """다른 API와 동일한 월 추출 로직"""
    if not records or not isinstance(records, list):
        return "2025-06"  # 기본값
    
    available_months = set()
    
    for record in records:
        if isinstance(record, dict) and "날짜" in record:
            date_str = record["날짜"]
            if isinstance(date_str, str) and len(date_str) >= 7:
                available_months.add(date_str[:7])
    
    # 가장 최근 월 반환 (다른 API와 동일)
    if available_months:
        return max(available_months)
    else:
        return "2025-06"  # 기본값

# ✅ 카테고리 정규화 함수 개선
def normalize_category_backend(category):
    """백엔드용 카테고리 정규화 - 실제 소비를 예산 카테고리로 매핑"""
    if not category or not isinstance(category, str):
        return "기타"
    
    category = category.strip().lower()
    
    category_map = {
        # 식비 관련
        "점심식사": "식비", "점심": "식비", "아침식사": "식비", "아침": "식비",
        "저녁식사": "식비", "저녁": "식비", "식사": "식비",
        "카페": "식비", "커피": "식비", "음료": "식비",
        "식당": "식비", "배달": "식비", "배달음식": "식비",
        "간식": "식비", "디저트": "식비", "음식": "식비",
        
        # 쇼핑 관련  
        "스트레스 쇼핑": "쇼핑", "스트레스쇼핑": "쇼핑",
        "패션": "쇼핑", "의류": "쇼핑", "옷": "쇼핑",
        "온라인쇼핑": "쇼핑", "온라인 쇼핑": "쇼핑",
        "화장품": "쇼핑", "뷰티": "쇼핑",
        "액세서리": "쇼핑", "잡화": "쇼핑",
        "생활용품": "쇼핑", "일용품": "쇼핑",
        
        # 교통 관련
        "교통": "교통", "택시": "교통", "버스": "교통", "지하철": "교통",
        "기차": "교통", "항공": "교통", "주유": "교통", "주차": "교통",
        
        # 문화/오락
        "문화": "문화", "영화": "문화", "게임": "문화", "책": "문화",
        "콘서트": "문화", "전시": "문화", "여행": "문화",
        
        # 의료/건강
        "의료": "의료", "병원": "의료", "약국": "의료", "헬스": "의료",
        "운동": "의료", "피트니스": "의료",
        
        # 기타
        "업무비품": "기타", "교육": "기타", "세금": "기타",
        "보험": "기타", "통신": "기타", "utilities": "기타"
    }
    
    return category_map.get(category, "기타")

# ✅ 기본 예산 계산 함수 추가
def calculate_default_budgets(total_income, current_expenses=None):
    """수입 기반 기본 예산 계산"""
    
    # 최소 예산 설정 (수입이 없거나 적을 때)
    min_budgets = {
        "식비": 300000,
        "쇼핑": 200000,
        "교통": 100000,
        "문화": 100000,
        "의료": 50000,
        "기타": 150000
    }
    
    if total_income <= 0:
        print("DEBUG: No income data, using minimum budgets")
        return min_budgets
    
    # 수입 기반 예산 계산 (수입의 80% 내에서)
    max_total_budget = int(total_income * 0.8)
    
    # 기본 비율 설정
    income_based_budgets = {
        "식비": max(min_budgets["식비"], int(total_income * 0.30)),      # 수입의 30%
        "쇼핑": max(min_budgets["쇼핑"], int(total_income * 0.20)),      # 수입의 20%
        "교통": max(min_budgets["교통"], int(total_income * 0.10)),      # 수입의 10%
        "문화": max(min_budgets["문화"], int(total_income * 0.10)),      # 수입의 10%
        "의료": max(min_budgets["의료"], int(total_income * 0.05)),      # 수입의 5%
        "기타": max(min_budgets["기타"], int(total_income * 0.05))       # 수입의 5%
    }
    
    # 현재 지출 패턴 반영 (있는 경우)
    if current_expenses and isinstance(current_expenses, dict):
        for category, current_amount in current_expenses.items():
            if category in income_based_budgets and current_amount > 0:
                base_budget = income_based_budgets[category]
                
                if current_amount > base_budget * 1.5:  # 현재 지출이 기본 예산의 150% 초과
                    # 점진적 감소 목표 (현재의 70%)
                    income_based_budgets[category] = max(base_budget, int(current_amount * 0.7))
                elif current_amount < base_budget * 0.5:  # 현재 지출이 기본 예산의 50% 미만
                    # 현재 수준 유지하되 최소한 기본 예산의 70%는 확보
                    income_based_budgets[category] = max(int(base_budget * 0.7), current_amount)
    
    # 총 예산이 수입의 80%를 넘지 않도록 조정
    total_budget = sum(income_based_budgets.values())
    if total_budget > max_total_budget:
        adjustment_ratio = max_total_budget / total_budget
        for category in income_based_budgets:
            income_based_budgets[category] = max(
                min_budgets[category], 
                int(income_based_budgets[category] * adjustment_ratio)
            )
    
    print(f"DEBUG: Calculated budgets - Income: {total_income:,}, Total Budget: {sum(income_based_budgets.values()):,}")
    print(f"DEBUG: Budget breakdown: {income_based_budgets}")
    
    return income_based_budgets

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
            print(f"DEBUG: User '{user_id}' not found")
            raise HTTPException(status_code=404, detail=f"사용자 '{user_id}'를 찾을 수 없습니다")

        print(f"DEBUG: User found successfully")

        # Profile 및 Records 확인
        if "profile" not in user or not isinstance(user["profile"], dict):
            print(f"ERROR: Invalid profile structure")
            raise HTTPException(status_code=404, detail="사용자 프로필이 없습니다")
        
        if "records" not in user["profile"] or not isinstance(user["profile"]["records"], list):
            print(f"ERROR: Invalid records structure")
            raise HTTPException(status_code=404, detail="소비 기록이 없습니다")
        
        records = user["profile"]["records"]
        
        if len(records) == 0:
            print(f"ERROR: 'records' list is empty")
            raise HTTPException(status_code=404, detail="소비 기록이 비어있습니다")

        print(f"DEBUG: Found {len(records)} records")

        # ✅ 최근 월 추출 (다른 API와 동일한 로직 사용)
        last_month = get_latest_month_from_records(records)
        print(f"DEBUG: Processing data for month: {last_month} (using same logic as other APIs)")
        
        # ✅ 데이터 처리 (다른 API와 동일한 로직)
        data = []
        processed_records = 0

        for i, record in enumerate(records):
            try:
                if not isinstance(record, dict):
                    continue
                    
                # 날짜 필드 확인 (다른 API와 동일)
                if "날짜" not in record:
                    continue
                    
                날짜 = record["날짜"]
                if not isinstance(날짜, str) or not 날짜.startswith(last_month):
                    continue

                # 소비목록 확인 (다른 API와 동일)
                if "소비목록" not in record or not isinstance(record["소비목록"], list):
                    continue
                    
                소비목록 = record["소비목록"]
                
                for item in 소비목록:
                    try:
                        if not isinstance(item, dict):
                            continue
                            
                        # 필드 추출 (다른 API와 동일)
                        분류 = item.get("분류", "지출")
                        항목 = item.get("항목", "기타")
                        금액 = item.get("금액", 0)
                        
                        # 금액 변환
                        if isinstance(금액, str):
                            try:
                                import re
                                금액_숫자 = re.sub(r'[^\d.-]', '', 금액)
                                금액 = float(금액_숫자) if 금액_숫자 else 0
                            except:
                                continue
                        else:
                            try:
                                금액 = float(금액)
                            except:
                                continue
                        
                        if 금액 <= 0:
                            continue
                        
                        type_ = "income" if 분류 == "수입" else "expense"
                        
                        data.append({
                            "date": 날짜,
                            "type": type_,
                            "category": 항목,
                            "amount": 금액,
                            "description": item.get("상세내역", "")
                        })
                        processed_records += 1
                        
                        if processed_records <= 5:
                            print(f"DEBUG: Processed item: {type_} / {항목} / {금액:,.0f}원")
                        
                    except Exception as item_error:
                        print(f"DEBUG: Error processing item in record {i}: {str(item_error)}")
                        continue
                        
            except Exception as record_error:
                print(f"DEBUG: Error processing record {i}: {str(record_error)}")
                continue

        print(f"DEBUG: Total processed {processed_records} items from {len(records)} records")

        if not data:
            print(f"ERROR: No data found for month {last_month}")
            raise HTTPException(status_code=404, detail=f"{last_month} 월의 소비 데이터가 없습니다")

        # ✅ 수입/지출 계산
        total_income = sum(i["amount"] for i in data if i["type"] == "income")
        total_expense = sum(i["amount"] for i in data if i["type"] == "expense")
        
        print(f"DEBUG: Total income: {total_income:,.0f}원, Total expense: {total_expense:,.0f}원")
        
        # ✅ 수입이 0인 경우 처리
        if total_income == 0 and total_expense > 0:
            # 지출만 있는 경우, 지출의 1.5배를 가상 수입으로 설정
            total_income = total_expense * 1.5
            print(f"DEBUG: No income found, using virtual income: {total_income:,.0f}원")
        elif total_income == 0 and total_expense == 0:
            # 아무 데이터가 없는 경우 기본값
            total_income = 3000000  # 300만원 기본
            print(f"DEBUG: No financial data found, using default income: {total_income:,.0f}원")
        
        # ✅ 카테고리별 지출 계산 (정규화 적용)
        expense_by_category = {}
        normalized_expenses = {}
        
        for item in data:
            if item["type"] == "expense" and item["category"]:
                category = item["category"]
                expense_by_category[category] = expense_by_category.get(category, 0) + item["amount"]
                
                # 정규화된 카테고리로도 집계
                normalized_cat = normalize_category_backend(category)
                normalized_expenses[normalized_cat] = normalized_expenses.get(normalized_cat, 0) + item["amount"]

        print(f"DEBUG: Original categories: {expense_by_category}")
        print(f"DEBUG: Normalized categories: {normalized_expenses}")

        # ✅ 예산 계산
        budgets = calculate_default_budgets(total_income, normalized_expenses)
        
        # ✅ AI 처리 시도 (수정된 프롬프트)
        if client is not None and expense_by_category:
            try:
                print("DEBUG: Attempting AI processing")
                
                # 과소비 여부 판단
                is_overspending = total_expense > total_income * 0.8
                overspending_text = "⚠️ 수입 대비 과소비 상태입니다!" if is_overspending else "수입 범위 내 소비입니다."
                
                # ✅ 수정된 AI 프롬프트 (올바른 형식 요구)
                prompt = f"""
사용자의 {last_month} 소비 분석:
- 총 수입: {total_income:,.0f}원
- 총 지출: {total_expense:,.0f}원
- 상태: {overspending_text}

정규화된 카테고리별 실제 지출:
{chr(10).join([f"- {cat}: {amount:,.0f}원" for cat, amount in normalized_expenses.items()])}

현재 계산된 기본 예산:
{chr(10).join([f"- {cat}: {amount:,.0f}원" for cat, amount in budgets.items()])}

이 예산을 검토하고 필요시 조정해주세요. 

⚠️ 중요: 반드시 다음 JSON 형식으로만 응답하세요:

{{
    "budgets": {{
        "식비": 숫자,
        "쇼핑": 숫자,
        "교통": 숫자,
        "문화": 숫자,
        "의료": 숫자,
        "기타": 숫자
    }},
    "saving_goal": 숫자,
    "tips": ["팁1", "팁2", "팁3"]
}}

다른 형식이나 키는 사용하지 마세요.
"""

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system", 
                            "content": "당신은 전문 가계부 코치입니다. 사용자가 요청한 정확한 JSON 형식으로만 응답하세요. budgets, saving_goal, tips 키만 사용하세요."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    max_tokens=800,
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )

                raw_content = response.choices[0].message.content.strip()
                print(f"DEBUG: GPT Raw Response: {raw_content}")
                
                try:
                    parsed = json.loads(raw_content)
                    
                    # ✅ AI 응답 검증 및 변환
                    if "budgets" in parsed and isinstance(parsed["budgets"], dict):
                        ai_budgets = parsed["budgets"]
                        
                        # 숫자 타입 검증
                        valid_budgets = {}
                        for cat, amount in ai_budgets.items():
                            try:
                                valid_budgets[cat] = int(float(amount))
                            except:
                                valid_budgets[cat] = budgets.get(cat, 0)
                        
                        total_ai_budget = sum(valid_budgets.values())
                        max_budget = int(total_income * 0.85)  # 85% 한도
                        
                        # 예산 검증 통과시 AI 예산 사용
                        if total_ai_budget <= max_budget and all(v > 0 for v in valid_budgets.values()):
                            budgets = valid_budgets
                            print("DEBUG: Using AI-generated budgets")
                        else:
                            print("DEBUG: AI budgets failed validation, using calculated budgets")
                    
                    # 나머지 필드 설정
                    saving_goal = parsed.get("saving_goal", max(200000, int(total_income * 0.2)))
                    try:
                        saving_goal = int(float(saving_goal))
                    except:
                        saving_goal = max(200000, int(total_income * 0.2))
                    
                    tips = parsed.get("tips", ["소비를 줄여보세요"])
                    if not isinstance(tips, list):
                        tips = ["소비를 줄여보세요"]
                    tips = tips[:3]  # 최대 3개
                    
                    response_data = {
                        "budgets": budgets,
                        "saving_goal": saving_goal,
                        "tips": tips
                    }
                    
                    print("DEBUG: AI response successful")
                    print(f"DEBUG: Final response data: {response_data}")
                    return JSONResponse(content=response_data)
                    
                except json.JSONDecodeError as json_error:
                    print(f"DEBUG: JSON parsing failed: {json_error}, using fallback")
                    
            except Exception as ai_error:
                print(f"DEBUG: AI processing failed: {str(ai_error)}, using fallback")
        
        # ✅ 폴백 로직 (AI 실패 시)
        print("DEBUG: Using fallback logic")
        
        # 개선된 맞춤형 팁
        tips = []
        
        # 전체 소비 패턴 기반 팁
        if total_expense > total_income * 0.9:
            tips.append("월 지출이 수입의 90%를 초과했습니다. 고정비부터 점검해보세요")
        elif total_expense > total_income * 0.8:
            tips.append("월 지출이 수입의 80%를 넘었습니다. 변동비 절약을 시작해보세요")
        
        # 카테고리별 맞춤 팁
        for category, amount in normalized_expenses.items():
            if category == "쇼핑" and amount > total_income * 0.25:
                tips.append("쇼핑비가 과도합니다. 구매 전 24시간 대기 규칙을 적용해보세요")
            elif category == "식비" and amount > total_income * 0.35:
                tips.append("식비가 많습니다. 집에서 요리하는 횟수를 늘려보세요")
        
        # 기본 팁 추가
        if len(tips) < 3:
            default_tips = [
                "가계부 작성 습관으로 소비 패턴을 파악하세요",
                "목표 저축률 20%를 달성해보세요",
                "고정비와 변동비를 구분하여 관리하세요"
            ]
            for tip in default_tips:
                if len(tips) < 3 and tip not in tips:
                    tips.append(tip)
        
        # 최종 응답 데이터
        response_data = {
            "budgets": budgets,
            "saving_goal": max(200000, int(total_income * 0.2)),
            "tips": tips[:3]
        }
        
        print(f"DEBUG: Final fallback response: {response_data}")
        return JSONResponse(content=response_data)

    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL ERROR in coach API: {str(e)}")
        print(f"CRITICAL ERROR traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")