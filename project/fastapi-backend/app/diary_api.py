# app/diary_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, time
import pymongo
import os
import re
import random
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
    receiptData: Optional[ReceiptData] = None

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

def get_time_based_advice(consumption_type: str, emotion: str) -> str:
    """시간대별 맞춤 조언"""
    current_hour = datetime.now().hour
    
    if 22 <= current_hour or current_hour <= 6:  # 야간 (10PM-6AM)
        night_advice = {
            "충동구매": [
                "밤에 쇼핑하면 다음날 후회 확률 90%! 폰 충전기 뽑고 잠시 눈 좀 붙여보세요 😴",
                "새벽 쇼핑의 유혹... 내일 아침에도 정말 갖고 싶을까요? 일단 자고 생각해보기!",
                "야밤에 들른 온라인 쇼핑몰... 장바구니에 담기만 하고 결제는 내일로 미뤄보세요!"
            ],
            "폭식": [
                "야식의 유혹이 찾아왔군요! 물 한 잔 마시고 5분만 참아보세요 💧",
                "배달앱 대신 수면앱을 켜보는 건 어떨까요? 잠이 최고의 야식 차단제예요!",
                "새벽 폭식은 내일 아침 후회의 지름길... 따뜻한 차 한 잔으로 달래보세요 🍵"
            ]
        }
        return random.choice(night_advice.get(consumption_type, ["늦은 시간 소비보다는 충분한 휴식이 필요해 보여요!"]))
    
    elif 6 <= current_hour <= 11:  # 오전
        morning_advice = {
            "카페소비": ["아침 카페인 충전! 오늘 하루 화이팅하세요 ☕", "모닝 커피로 하루를 시작하는 소소한 행복이네요!"],
            "충동구매": ["아침부터 쇼핑 욕구가? 오늘 할 일 리스트부터 작성해보는 건 어떨까요? 📝"]
        }
        return random.choice(morning_advice.get(consumption_type, ["오늘도 건강한 하루 보내세요!"]))
    
    elif 12 <= current_hour <= 18:  # 오후
        afternoon_advice = {
            "음식소비": ["점심시간 맛있는 한 끼! 오후도 힘내세요 🍽️", "맛있는 점심으로 오후 에너지 충전 완료!"],
            "충동구매": ["오후 쇼핑 타임... 정말 필요한 건지 한 번 더 생각해보세요!", "일과 중 잠깐의 쇼핑 휴식? 잠시 산책은 어떨까요? 🚶‍♀️"]
        }
        return random.choice(afternoon_advice.get(consumption_type, ["오후 시간을 알차게 보내고 계시네요!"]))
    
    else:  # 저녁 (6PM-10PM)
        evening_advice = {
            "음식소비": ["저녁 식사 시간! 맛있게 드세요 🌆", "하루 고생한 자신에게 주는 맛있는 저녁!"],
            "충동구매": ["퇴근 후 쇼핑? 하루 동안 고생한 스트레스 때문일 수 있어요. 잠시 휴식부터!"]
        }
        return random.choice(evening_advice.get(consumption_type, ["저녁 시간 잘 보내고 계시네요!"]))

def get_amount_based_advice(amount: int, consumption_type: str, emotion: str) -> str:
    """금액별 맞춤 조언"""
    if amount >= 500000:  # 50만원 이상
        return f"와... {amount:,}원! 이 돈으로 해외여행도 갈 수 있어요! 정말정말 확신하시나요? 🛫"
    elif amount >= 200000:  # 20만원 이상
        return f"{amount:,}원... 신중하게 생각해보세요. 이번 달 용돈의 몇 %인가요? 💸"
    elif amount >= 100000:  # 10만원 이상
        return f"{amount:,}원 소비! 혹시 스트레스 때문은 아닌가요? 잠시 심호흡 🌬️"
    elif amount >= 50000:  # 5만원 이상
        return f"{amount:,}원... 중간 정도 소비네요. 만족도는 어떠셨나요?"
    elif amount >= 10000:  # 1만원 이상
        return "적당한 소비 수준이에요! 가끔은 자신에게 선물하는 것도 필요해요 ✨"
    else:
        return "소소한 소비! 일상의 작은 즐거움이네요 😊"

def get_creative_advice_by_type(consumption_type: str, emotion: str) -> List[str]:
    """소비 유형별 창의적인 조언 모음"""
    advice_pool = {
        "충동구매": {
            "스트레스": [
                "쇼핑카트에 담기 → 30분 타이머 설정 → 여전히 갖고 싶으면 구매하기!",
                "스트레스 쇼핑 대신 '내가 정말 좋아하는 것들' 리스트 만들어보기 📝",
                "온라인 쇼핑몰 창 닫고 유튜브에서 '강아지 영상' 검색해보세요 🐕",
                "쇼핑 욕구 = 뇌의 도파민 갈망! 대신 좋아하는 음악 들으며 춤춰보세요 💃",
                "결제하기 전에 '6개월 뒤에도 이걸 쓸까?' 자문해보기!"
            ],
            "우울": [
                "우울할 때 산 물건들 한 번 돌아보세요. 지금도 행복한가요? 🤔",
                "쇼핑 대신 과거에 샀던 좋아하는 물건들을 다시 꺼내보세요 ✨",
                "온라인 쇼핑몰 대신 예쁜 카페나 도서관에 가보는 건 어떨까요? ☕",
                "우울쇼핑 = 일시적 기분전환. 진짜 필요한 건 따뜻한 위로일지도요 🤗"
            ],
            "지루함": [
                "지루해서 쇼핑? 위시리스트 정리하기, 옷장 정리하기는 어떨까요? 🗂️",
                "쇼핑 대신 새로운 취미 찾기 미션! 요리, 그림, 독서 중 하나 도전해보세요",
                "지루함의 진짜 해결책은 새로운 자극! 동네 산책이나 친구 연락해보기 📞"
            ]
        },
        "폭식": {
            "스트레스": [
                "배달앱 대신 스마트폰 타이머 5분 설정! 진짜 배고픈지 확인해보세요 ⏰",
                "스트레스 폭식 전에 물 2컵 천천히 마시며 창밖 바라보기 💧",
                "냉장고 문 앞에서 10까지 천천히 세어보세요. 여전히 배고픈가요?",
                "폭식 욕구 = 감정의 신호! 지금 진짜 필요한 건 음식일까 위로일까요? 🤔",
                "스트레스 먹기 대신 스트레스 해소 플레이리스트 만들어보기 🎵"
            ],
            "우울": [
                "우울할 때 음식으로 마음을 달래려 하셨군요. 마음이 많이 힘드신가 봐요 💙",
                "폭식 후의 죄책감보다는 지금의 마음을 돌봐주는 게 우선이에요",
                "음식 대신 따뜻한 차 한 잔과 좋아하는 영상 하나는 어떨까요? 🍵",
                "우울한 마음, 혼자 견디지 마세요. 누군가에게 연락해보는 건 어떨까요?"
            ],
            "지루함": [
                "지루해서 먹는 건... 진짜 배고픔인지 입심심한지 구분해보세요!",
                "지루함을 음식으로? 대신 손으로 할 수 있는 간단한 일 찾아보기 ✋",
                "무료한 마음에 든 먹거리... 산책하며 팟캐스트 듣는 건 어떨까요? 🎧"
            ]
        },
        "게임결제": {
            "지루함": [
                "게임 과금 전에 '이 돈으로 진짜 게임 하나 더 살 수 있는데?' 생각해보기 🎮",
                "가챠 욕구 참기 어렵죠... 대신 무료 이벤트나 일일미션에 집중해보세요!",
                "게임 과금 = 확률의 함정! 그 돈으로 확실한 재미를 찾아보는 건 어떨까요?"
            ],
            "성취욕구": [
                "게임에서의 성취감도 좋지만, 현실에서의 작은 성취도 만들어보세요! 💪",
                "과금으로 얻는 성취 vs 실력으로 얻는 성취... 어떤 게 더 뿌듯할까요?",
                "게임 실력 늘리기 도전! 공략 영상 보며 연습하는 건 어떨까요? 📚"
            ]
        },
        "카페소비": {
            "스트레스": [
                "카페에서 잠시 쉬어가는 시간! 커피 향으로 마음의 여유를 찾으세요 ☕",
                "카페 시간 = 나만의 힐링 타임! 좋아하는 음악과 함께 즐기세요 🎵",
                "스트레스 받을 때 카페 한 잔... 완벽한 선택이에요! 마음의 쉼표 찍기 📍"
            ],
            "중립": [
                "일상의 소소한 카페 타임! 오늘도 수고했어요 ✨",
                "카페에서의 여유로운 시간, 자신에게 주는 작은 선물이네요 🎁",
                "맛있는 커피 한 잔으로 에너지 충전! 좋은 하루 되세요 ☀️"
            ]
        },
        "음식소비": {
            "스트레스": [
                "맛있는 음식으로 스트레스 해소! 가끔은 이런 힐링도 필요해요 🍽️",
                "스트레스를 음식으로 달래는 마음 이해해요. 맛있게 드시고 마음도 달래세요",
                "음식으로 위로받는 시간! 죄책감 갖지 마시고 잘 드세요 😊"
            ],
            "중립": [
                "맛있는 한 끼! 음식은 삶의 즐거움 중 하나죠 🍴",
                "좋은 음식과 함께하는 시간, 소중한 일상이에요",
                "맛있게 드시고 든든한 하루 보내세요! 🌟"
            ]
        }
    }
    
    return advice_pool.get(consumption_type, {}).get(emotion, ["건강한 소비 습관을 만들어가고 계시네요! 화이팅! 💪"])

def get_contextual_advice(consumption_type: str, emotion: str) -> str:
    """요일/상황별 맞춤 조언"""
    today = datetime.now()
    
    # 월요일 특별 조언
    if today.weekday() == 0:  # Monday
        monday_advice = {
            "충동구매": "월요병과 함께 온 쇼핑 욕구군요! 이번 주 목표부터 세워보는 건 어떨까요? 📅",
            "폭식": "월요일 스트레스를 음식으로? 이번 주는 건강한 식단으로 시작해보세요! 🥗",
            "카페소비": "월요일 모닝커피! 새로운 한 주를 활기차게 시작하세요 ☕"
        }
        if consumption_type in monday_advice:
            return monday_advice[consumption_type]
    
    # 금요일 특별 조언
    elif today.weekday() == 4:  # Friday
        friday_advice = {
            "충동구매": "불금 쇼핑? 주말에 더 즐거운 일들을 계획해보는 건 어떨까요? 🎉",
            "폭식": "금요일 저녁 치킨? 일주일 고생한 자신에게 주는 선물이네요! 🍗",
            "카페소비": "불금 카페 타임! 한 주 마무리 수고하셨어요 ✨"
        }
        if consumption_type in friday_advice:
            return friday_advice[consumption_type]
    
    # 주말 특별 조언
    elif today.weekday() in [5, 6]:  # Weekend
        weekend_advice = {
            "충동구매": "주말 쇼핑! 평일에 스트레스 받았던 마음을 달래려 하시나요? 🛍️",
            "폭식": "주말 맛집 탐방? 가끔은 이런 즐거움도 필요해요! 😋",
            "카페소비": "여유로운 주말 카페 시간! 힐링하세요 🌸"
        }
        if consumption_type in weekend_advice:
            return weekend_advice[consumption_type]
    
    return None

def check_repetitive_pattern(user_id: str, consumption_type: str) -> bool:
    """최근 반복 패턴 체크"""
    try:
        # 최근 7일간의 기록 확인
        recent_entries = list(db.diary_entries.find({
            "user_id": user_id,
            "date": {"$gte": (datetime.now() - datetime.timedelta(days=7)).isoformat().split('T')[0]}
        }).sort("date", -1).limit(10))
        
        # 같은 소비 타입이 3번 이상 반복되면 True
        same_type_count = sum(1 for entry in recent_entries if entry.get("consumptionType") == consumption_type)
        return same_type_count >= 3
    except:
        return False

def generate_advice(emotion: str, consumption_type: str, amount: int, user_id: str = None) -> str:
    """개선된 조언 생성 - 다양하고 창의적인 조언"""
    
    # 1. 시간대별 조언 우선 체크
    time_advice = get_time_based_advice(consumption_type, emotion)
    if time_advice and random.random() < 0.3:  # 30% 확률로 시간대별 조언
        return time_advice
    
    # 2. 요일/상황별 조언 체크
    contextual_advice = get_contextual_advice(consumption_type, emotion)
    if contextual_advice and random.random() < 0.25:  # 25% 확률로 상황별 조언
        return contextual_advice
    
    # 3. 금액별 조언 (고액일 때 우선)
    if amount > 50000:
        amount_advice = get_amount_based_advice(amount, consumption_type, emotion)
        if random.random() < 0.4:  # 40% 확률로 금액 기반 조언
            return amount_advice
    
    # 4. 반복 패턴 감지
    if user_id and check_repetitive_pattern(user_id, consumption_type):
        repetitive_advice = f"최근 {consumption_type} 패턴이 반복되고 있어요! 잠시 다른 활동은 어떨까요? 🔄"
        if random.random() < 0.5:  # 50% 확률로 반복 패턴 조언
            return repetitive_advice
    
    # 5. 기본 창의적 조언들 중 랜덤 선택
    creative_advice_list = get_creative_advice_by_type(consumption_type, emotion)
    selected_advice = random.choice(creative_advice_list)
    
    # 6. 금액이 높으면 금액 정보 추가
    if amount > 100000:
        return f"고액 소비({amount:,}원) 감지! {selected_advice}"
    
    return selected_advice

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
                    # ✅ 수정: 카드에 표시되는 총 금액과 동일한 값으로 조언 생성
                    individual_amount = main_item.get("금액", 0)  # 주요 항목의 개별 금액
                    advice = generate_advice(emotion, consumption_type, individual_amount, user_id)
                    
                    diary_entry = {
                        "id": date,
                        "date": date,
                        "text": main_item.get("상세내역", ""),
                        "emotion": emotion,
                        "consumptionType": consumption_type,
                        "amount": individual_amount,
                        "satisfaction": satisfaction,
                        "advice": advice,
                        "emoji": get_emoji(consumption_type),
                        "score": -1 if consumption_type in ["충동구매", "폭식"] else 0,
                        "receiptData": None
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
                "receiptData": entry.get("receiptData")
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
        
        # 개선된 조언 생성 (user_id 포함)
        advice = generate_advice(emotion, consumption_type, amount, user_id)
        
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