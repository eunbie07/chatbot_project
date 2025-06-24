# app/diary_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import pymongo
import os
import re  # ✅ 추가!
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# MongoDB 연결
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
client = pymongo.MongoClient(MONGO_URI)
db = client.consumption_db

class ReceiptData(BaseModel):
    store: str
    items: List[str]
    totalAmount: int
    date: str

class DiaryEntry(BaseModel):
    text: str
    emotion: Optional[str] = None
    consumption_type: Optional[str] = None
    amount: Optional[int] = None
    satisfaction: Optional[int] = None
    receiptData: Optional[ReceiptData] = None  # ✅ 영수증 데이터 추가

class DiaryResponse(BaseModel):
    id: str
    date: str
    text: str
    emotion: str
    consumption_type: str
    amount: int
    satisfaction: int
    advice: str
    emoji: str
    score: int

# 감정-소비 패턴 키워드 매핑
EMOTION_CONSUMPTION_KEYWORDS = {
    "충동구매": {
        "emotions": ["우울", "스트레스", "화남", "외로움"],
        "keywords": ["샀다", "질렀다", "구매", "주문", "카트", "쇼핑", "옷", "신발", "가방", "화장품"],
        "reasons": ["기분전환", "스트레스", "충동", "우울", "화풀이"]
    },
    "폭식": {
        "emotions": ["스트레스", "우울", "지루함", "외로움"],
        "keywords": ["먹었다", "시켰다", "폭식", "야식", "치킨", "피자", "떡볶이", "과자", "아이스크림"],
        "reasons": ["스트레스", "허전함", "심심", "우울"]
    },
    "게임결제": {
        "emotions": ["지루함", "스트레스", "성취욕구"],
        "keywords": ["게임", "아이템", "캐시", "코인", "가챠", "뽑기", "충전", "결제"],
        "reasons": ["지루함", "성취감", "스트레스"]
    }
}

def classify_consumption_type(항목: str, 상세내역: str) -> str:
    """MongoDB 항목을 소비 타입으로 분류"""
    type_map = {
        "스트레스 쇼핑": "충동구매",
        "패션": "패션소비",
        "카페": "카페소비", 
        "점심식사": "음식소비",
        "업무비품": "필수소비"
    }
    
    # 상세내역에서 감정 키워드 분석
    for consumption_type, data in EMOTION_CONSUMPTION_KEYWORDS.items():
        if any(keyword in 상세내역 for keyword in data["keywords"]):
            return consumption_type
            
    return type_map.get(항목, "기타")

def map_emotion_tag(감정개입: str, 상세내역: str) -> str:
    """감정 태그 매핑"""
    if 감정개입:
        emotion_map = {
            "자기보상": "스트레스",
            "스트레스": "스트레스"
        }
        return emotion_map.get(감정개입, "스트레스")
    
    # 상세내역에서 감정 추출
    if any(word in 상세내역 for word in ["지쳐서", "스트레스", "더위에"]):
        return "스트레스"
    elif any(word in 상세내역 for word in ["우울", "허무", "외로"]):
        return "우울"
    elif any(word in 상세내역 for word in ["지루", "심심"]):
        return "지루함"
    
    return "중립"

def calculate_satisfaction(상세내역: str) -> int:
    """만족도 계산"""
    if any(word in 상세내역 for word in ["후회", "허무", "실망", "텅장"]):
        return 1
    elif any(word in 상세내역 for word in ["뿌듯", "만족", "좋았"]):
        return 5
    elif any(word in 상세내역 for word in ["보통", "그저그래"]):
        return 3
    return 2

def generate_advice(emotion: str, consumption_type: str, amount: int) -> str:
    """조언 생성"""
    advice_map = {
        "충동구매": {
            "스트레스": "스트레스 쇼핑 대신 산책이나 운동으로 기분전환해보세요.",
            "우울": "우울할 때의 쇼핑은 일시적 위안일 뿐이에요. 친구와 대화해보세요.",
            "지루함": "지루함을 쇼핑으로 달래기보다는 새로운 취미를 찾아보세요."
        },
        "음식소비": {
            "스트레스": "스트레스를 음식으로 달래려 하셨군요. 차 한 잔과 심호흡도 도움이 될 거예요.",
            "우울": "음식으로 위안을 찾는 마음 이해해요. 가벼운 산책은 어떨까요?"
        },
        "카페소비": {
            "스트레스": "카페에서 잠시 쉬어가는 것도 좋은 방법이에요.",
            "중립": "적당한 카페 방문은 일상의 소소한 즐거움이죠!"
        },
        "폭식": {
            "스트레스": "스트레스를 받을 때는 음식보다 가벼운 운동이나 산책을 추천해요.",
            "우울": "우울할 때의 폭식은 더 우울해질 수 있어요. 따뜻한 차 한 잔은 어떨까요?"
        }
    }
    
    # 기본 조언
    default_advice = "건강한 소비 습관을 위해 감정을 기록하는 게 좋은 시작이에요!"
    
    # 소비 유형별 조언 가져오기
    type_advice = advice_map.get(consumption_type, {})
    emotion_advice = type_advice.get(emotion, default_advice)
    
    if amount > 100000:
        return f"고액 소비가 감지되었어요. {emotion_advice}"
    
    return emotion_advice

def get_emoji(consumption_type: str) -> str:
    """소비 타입별 이모지"""
    emoji_map = {
        "충동구매": "🛍️",
        "음식소비": "🍕", 
        "카페소비": "☕",
        "패션소비": "👗",
        "필수소비": "📋",
        "폭식": "🍟",
        "게임결제": "🎮",
        "술소비": "🍺",
        "취미소비": "📚",
        "기타": "💰"
    }
    return emoji_map.get(consumption_type, "💰")

def classify_consumption_type_from_receipt(store: str, items: List[str]) -> str:
    """영수증 정보로 소비 타입 분류"""
    store_lower = store.lower()
    items_text = ' '.join(items).lower()
    
    if any(keyword in store_lower for keyword in ['스타벅스', '카페', '커피', 'cafe', 'coffee']):
        return '카페소비'
    elif any(keyword in store_lower for keyword in ['치킨', '피자', '맥도날드', '버거킹', '음식점']):
        return '음식소비'
    elif any(keyword in store_lower for keyword in ['편의점', 'gs25', 'cu', '세븐일레븐']):
        if any(keyword in items_text for keyword in ['아이스크림', '과자', '라면', '음료']):
            return '폭식'
        return '필수소비'
    elif any(keyword in store_lower for keyword in ['마트', '이마트', '롯데마트']):
        return '필수소비'
    elif any(keyword in store_lower for keyword in ['온라인', '쇼핑', '옷', '신발']):
        return '충동구매'
    else:
        return '기타'

def extract_amount_from_text(text: str) -> int:
    """텍스트에서 금액 추출"""
    # 정규식으로 금액 패턴 찾기
    amount_patterns = [
        r'(\d{1,3}(?:,\d{3})*)\s*원',
        r'(\d+)\s*원',
        r'(\d+)만원',
    ]
    
    for pattern in amount_patterns:
        match = re.search(pattern, text)
        if match:
            amount_str = match.group(1).replace(',', '')
            amount = int(amount_str)
            if '만원' in match.group(0):
                amount *= 10000
            return amount
    
    return 0

@router.get("/entries/{user_id}")
async def get_diary_entries(user_id: str):
    try:
        user = db.users.find_one({"username": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        diary_entries = []
        
        # 1. 기존 데이터 (users 컬렉션의 profile.records)
        records = user.get("profile", {}).get("records", [])
        
        for record in records:
            date = record.get("날짜")
            consumption_items = record.get("소비목록", [])
            
            # 해당 날짜의 소비 항목들을 하나의 일기로 합치기
            if consumption_items:
                total_amount = sum(item.get("금액", 0) for item in consumption_items if item.get("분류") == "지출")
                
                # 주요 소비 항목 선택 (금액이 가장 큰 것)
                main_item = max(consumption_items, key=lambda x: x.get("금액", 0) if x.get("분류") == "지출" else 0)
                
                if main_item.get("분류") == "지출":
                    emotion = map_emotion_tag(main_item.get("감정개입", ""), main_item.get("상세내역", ""))
                    consumption_type = classify_consumption_type(main_item.get("항목", ""), main_item.get("상세내역", ""))
                    satisfaction = calculate_satisfaction(main_item.get("상세내역", ""))
                    advice = generate_advice(emotion, consumption_type, main_item.get("금액", 0))
                    
                    diary_entry = {
                        "id": date,
                        "date": date,
                        "text": main_item.get("상세내역", ""),
                        "emotion": emotion,
                        "consumptionType": consumption_type,
                        "amount": total_amount,
                        "satisfaction": satisfaction,
                        "advice": advice,
                        "emoji": get_emoji(consumption_type),
                        "score": -1 if consumption_type in ["충동구매", "폭식"] else 0,
                        "receiptData": None  # ✅ 기존 데이터에는 영수증 정보 없음
                    }
                    diary_entries.append(diary_entry)
        
        # 2. 새로 작성한 일기 (diary_entries 컬렉션)
        new_entries = db.diary_entries.find({"user_id": user_id})
        for entry in new_entries:
            diary_entry = {
                "id": str(entry["_id"]),
                "date": entry["date"],
                "text": entry["text"],
                "emotion": entry["emotion"],
                "consumptionType": entry["consumptionType"],
                "amount": entry["amount"],
                "satisfaction": entry["satisfaction"],
                "advice": entry["advice"],
                "emoji": get_emoji(entry.get("consumptionType", "")),
                "score": -1 if entry.get("consumptionType") in ["충동구매", "폭식"] else 0,
                "receiptData": entry.get("receiptData")  # ✅ 영수증 데이터 포함
            }
            diary_entries.append(diary_entry)
        
        # 3. 날짜순 정렬 (최신순)
        diary_entries.sort(key=lambda x: x["date"], reverse=True)
        
        return {"entries": diary_entries, "total": len(diary_entries)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터 조회 실패: {str(e)}")

@router.post("/entries/{user_id}")
async def create_diary_entry(user_id: str, entry: DiaryEntry):
    try:
        # 영수증 데이터가 있으면 해당 정보 활용
        if entry.receiptData:
            # 영수증에서 추출한 정보 사용
            emotion = map_emotion_tag("", entry.text)
            consumption_type = classify_consumption_type_from_receipt(entry.receiptData.store, entry.receiptData.items)
            amount = entry.receiptData.totalAmount
            satisfaction = calculate_satisfaction(entry.text)
            date = entry.receiptData.date
        else:
            # 기존 텍스트 분석 방식
            emotion = map_emotion_tag("", entry.text)
            consumption_type = classify_consumption_type("", entry.text)
            amount = extract_amount_from_text(entry.text)
            satisfaction = calculate_satisfaction(entry.text)
            date = datetime.now().isoformat().split('T')[0]
        
        advice = generate_advice(emotion, consumption_type, amount)
        
        new_entry = {
            "user_id": user_id,
            "date": date,
            "text": entry.text,
            "emotion": emotion,
            "consumptionType": consumption_type,
            "amount": amount,
            "satisfaction": satisfaction,
            "advice": advice,
            "receiptData": entry.receiptData.dict() if entry.receiptData else None,
            "created_at": datetime.now()
        }
        
        result = db.diary_entries.insert_one(new_entry)
        
        return {"message": "저장 완료", "id": str(result.inserted_id)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일기 생성 실패: {str(e)}")

@router.get("/analytics/{user_id}")
async def get_consumption_analytics(user_id: str):
    try:
        user = db.users.find_one({"username": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        total_spent = 0
        stress_shopping_amount = 0
        consumption_by_type = {}
        
        records = user.get("profile", {}).get("records", [])
        
        for record in records:
            for item in record.get("소비목록", []):
                if item.get("분류") == "지출":
                    amount = item.get("금액", 0)
                    total_spent += amount
                    
                    item_type = item.get("항목", "")
                    if item_type == "스트레스 쇼핑":
                        stress_shopping_amount += amount
                    
                    consumption_by_type[item_type] = consumption_by_type.get(item_type, 0) + amount
        
        return {
            "totalSpent": total_spent,
            "stressShoppingAmount": stress_shopping_amount,
            "stressShoppingRatio": round(stress_shopping_amount / total_spent * 100, 1) if total_spent > 0 else 0,
            "consumptionByType": consumption_by_type,
            "avgSatisfaction": 2.3
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 실패: {str(e)}")

# # app/diary_api.py
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from typing import List, Optional
# from datetime import datetime
# import pymongo
# import os
# from dotenv import load_dotenv

# load_dotenv()
# router = APIRouter()

# # MongoDB 연결
# MONGO_URI = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
# client = pymongo.MongoClient(MONGO_URI)
# db = client.consumption_db

# class DiaryEntry(BaseModel):
#     text: str  # user_id 제거 (URL에서 받으니까)
#     emotion: Optional[str] = None
#     consumption_type: Optional[str] = None
#     amount: Optional[int] = None
#     satisfaction: Optional[int] = None

# class DiaryResponse(BaseModel):
#     id: str
#     date: str
#     text: str
#     emotion: str
#     consumption_type: str
#     amount: int
#     satisfaction: int
#     advice: str
#     emoji: str
#     score: int

# # 감정-소비 패턴 키워드 매핑
# EMOTION_CONSUMPTION_KEYWORDS = {
#     "충동구매": {
#         "emotions": ["우울", "스트레스", "화남", "외로움"],
#         "keywords": ["샀다", "질렀다", "구매", "주문", "카트", "쇼핑", "옷", "신발", "가방", "화장품"],
#         "reasons": ["기분전환", "스트레스", "충동", "우울", "화풀이"]
#     },
#     "폭식": {
#         "emotions": ["스트레스", "우울", "지루함", "외로움"],
#         "keywords": ["먹었다", "시켰다", "폭식", "야식", "치킨", "피자", "떡볶이", "과자", "아이스크림"],
#         "reasons": ["스트레스", "허전함", "심심", "우울"]
#     },
#     "게임결제": {
#         "emotions": ["지루함", "스트레스", "성취욕구"],
#         "keywords": ["게임", "아이템", "캐시", "코인", "가챠", "뽑기", "충전", "결제"],
#         "reasons": ["지루함", "성취감", "스트레스"]
#     }
# }

# def classify_consumption_type(항목: str, 상세내역: str) -> str:
#     """MongoDB 항목을 소비 타입으로 분류"""
#     type_map = {
#         "스트레스 쇼핑": "충동구매",
#         "패션": "패션소비",
#         "카페": "카페소비", 
#         "점심식사": "음식소비",
#         "업무비품": "필수소비"
#     }
    
#     # 상세내역에서 감정 키워드 분석
#     for consumption_type, data in EMOTION_CONSUMPTION_KEYWORDS.items():
#         if any(keyword in 상세내역 for keyword in data["keywords"]):
#             return consumption_type
            
#     return type_map.get(항목, "기타")

# def map_emotion_tag(감정개입: str, 상세내역: str) -> str:
#     """감정 태그 매핑"""
#     if 감정개입:
#         emotion_map = {
#             "자기보상": "스트레스",
#             "스트레스": "스트레스"
#         }
#         return emotion_map.get(감정개입, "스트레스")
    
#     # 상세내역에서 감정 추출
#     if any(word in 상세내역 for word in ["지쳐서", "스트레스", "더위에"]):
#         return "스트레스"
#     elif any(word in 상세내역 for word in ["우울", "허무", "외로"]):
#         return "우울"
#     elif any(word in 상세내역 for word in ["지루", "심심"]):
#         return "지루함"
    
#     return "중립"

# def calculate_satisfaction(상세내역: str) -> int:
#     """만족도 계산"""
#     if any(word in 상세내역 for word in ["후회", "허무", "실망", "텅장"]):
#         return 1
#     elif any(word in 상세내역 for word in ["뿌듯", "만족", "좋았"]):
#         return 5
#     elif any(word in 상세내역 for word in ["보통", "그저그래"]):
#         return 3
#     return 2

# def generate_advice(emotion: str, consumption_type: str, amount: int) -> str:
#     """조언 생성"""
#     advice_map = {
#         "충동구매": {
#             "스트레스": "스트레스 쇼핑 대신 산책이나 운동으로 기분전환해보세요.",
#             "우울": "우울할 때의 쇼핑은 일시적 위안일 뿐이에요. 친구와 대화해보세요.",
#             "지루함": "지루함을 쇼핑으로 달래기보다는 새로운 취미를 찾아보세요."
#         },
#         "음식소비": {
#             "스트레스": "스트레스를 음식으로 달래려 하셨군요. 차 한 잔과 심호흡도 도움이 될 거예요.",
#             "우울": "음식으로 위안을 찾는 마음 이해해요. 가벼운 산책은 어떨까요?"
#         }
#     }
    
#     # 기본 조언
#     default_advice = "건강한 소비 습관을 위해 감정을 기록하는 게 좋은 시작이에요!"
    
#     # 소비 유형별 조언 가져오기
#     type_advice = advice_map.get(consumption_type, {})
#     emotion_advice = type_advice.get(emotion, default_advice)
    
#     if amount > 100000:
#         return f"고액 소비가 감지되었어요. {emotion_advice}"
    
#     return emotion_advice

# def get_emoji(consumption_type: str) -> str:
#     """소비 타입별 이모지"""
#     emoji_map = {
#         "충동구매": "🛍️",
#         "음식소비": "🍕", 
#         "카페소비": "☕",
#         "패션소비": "👗",
#         "필수소비": "📋",
#         "기타": "💰"
#     }
#     return emoji_map.get(consumption_type, "💰")

# @router.get("/entries/{user_id}")
# async def get_diary_entries(user_id: str):
#     try:
#         user = db.users.find_one({"username": user_id})
#         if not user:
#             raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
#         diary_entries = []
        
#         # 1. 기존 데이터 (users 컬렉션의 profile.records)
#         records = user.get("profile", {}).get("records", [])
        
#         for record in records:
#             date = record.get("날짜")
#             consumption_items = record.get("소비목록", [])
            
#             # 해당 날짜의 소비 항목들을 하나의 일기로 합치기
#             if consumption_items:
#                 total_amount = sum(item.get("금액", 0) for item in consumption_items if item.get("분류") == "지출")
                
#                 # 주요 소비 항목 선택 (금액이 가장 큰 것)
#                 main_item = max(consumption_items, key=lambda x: x.get("금액", 0) if x.get("분류") == "지출" else 0)
                
#                 if main_item.get("분류") == "지출":
#                     emotion = map_emotion_tag(main_item.get("감정개입", ""), main_item.get("상세내역", ""))
#                     consumption_type = classify_consumption_type(main_item.get("항목", ""), main_item.get("상세내역", ""))
#                     satisfaction = calculate_satisfaction(main_item.get("상세내역", ""))
#                     advice = generate_advice(emotion, consumption_type, main_item.get("금액", 0))
                    
#                     diary_entry = {
#                         "id": date,
#                         "date": date,
#                         "text": main_item.get("상세내역", ""),
#                         "emotion": emotion,
#                         "consumptionType": consumption_type,
#                         "amount": total_amount,
#                         "satisfaction": satisfaction,
#                         "advice": advice,
#                         "emoji": get_emoji(consumption_type),
#                         "score": -1 if consumption_type in ["충동구매", "폭식"] else 0
#                     }
#                     diary_entries.append(diary_entry)
        
#         # 2. 새로 작성한 일기 (diary_entries 컬렉션) - ✅ 들여쓰기 수정
#         new_entries = db.diary_entries.find({"user_id": user_id})
#         for entry in new_entries:
#             diary_entry = {
#                 "id": str(entry["_id"]),
#                 "date": entry["date"],
#                 "text": entry["text"],
#                 "emotion": entry["emotion"],
#                 "consumptionType": entry["consumptionType"],
#                 "amount": entry["amount"],
#                 "satisfaction": entry["satisfaction"],
#                 "advice": entry["advice"],
#                 "emoji": get_emoji(entry.get("consumptionType", "")),  # ✅ emoji 추가
#                 "score": -1 if entry.get("consumptionType") in ["충동구매", "폭식"] else 0  # ✅ score 추가
#             }
#             diary_entries.append(diary_entry)
        
#         # 3. 날짜순 정렬 (최신순)
#         diary_entries.sort(key=lambda x: x["date"], reverse=True)
        
#         return {"entries": diary_entries, "total": len(diary_entries)}
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"데이터 조회 실패: {str(e)}")
# @router.post("/entries/{user_id}")
# async def create_diary_entry(user_id: str, entry: DiaryEntry):
#     try:
#         # NLP 분석으로 감정-소비 패턴 추출
#         emotion = map_emotion_tag("", entry.text)
#         consumption_type = classify_consumption_type("", entry.text)
#         satisfaction = calculate_satisfaction(entry.text)
#         advice = generate_advice(emotion, consumption_type, 0)
        
#         new_entry = {
#             "user_id": user_id,
#             "date": datetime.now().isoformat(),
#             "text": entry.text,
#             "emotion": emotion,
#             "consumptionType": consumption_type,  # 프론트엔드 형식에 맞춤
#             "amount": 0,  # 텍스트에서 추출하거나 기본값
#             "satisfaction": satisfaction,
#             "advice": advice,
#             "created_at": datetime.now()
#         }
        
#         result = db.diary_entries.insert_one(new_entry)
        
#         return {"message": "저장 완료", "id": str(result.inserted_id)}
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"일기 생성 실패: {str(e)}")

# @router.get("/analytics/{user_id}")
# async def get_consumption_analytics(user_id: str):
#     try:
#         user = db.users.find_one({"username": user_id})
#         if not user:
#             raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
#         total_spent = 0
#         stress_shopping_amount = 0
#         consumption_by_type = {}
        
#         # ✅ 수정: profile.records로 경로 변경
#         records = user.get("profile", {}).get("records", [])
        
#         for record in records:
#             for item in record.get("소비목록", []):
#                 if item.get("분류") == "지출":
#                     amount = item.get("금액", 0)
#                     total_spent += amount
                    
#                     item_type = item.get("항목", "")
#                     if item_type == "스트레스 쇼핑":
#                         stress_shopping_amount += amount
                    
#                     consumption_by_type[item_type] = consumption_by_type.get(item_type, 0) + amount
        
#         return {
#             "totalSpent": total_spent,
#             "stressShoppingAmount": stress_shopping_amount,
#             "stressShoppingRatio": round(stress_shopping_amount / total_spent * 100, 1) if total_spent > 0 else 0,
#             "consumptionByType": consumption_by_type,
#             "avgSatisfaction": 2.3  # 임시값, 실제로는 계산 필요
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"분석 실패: {str(e)}")