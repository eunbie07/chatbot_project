# app/conversation_api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import pymongo
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# MongoDB 연결
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
client = pymongo.MongoClient(MONGO_URI)
db = client.emotion_spending
print(f"DEBUG: Using emotion_spending database for conversations")

class ConversationSummary(BaseModel):
    date: str
    spending: str
    emotion: str
    effect: str
    advice: str
    session_id: Optional[str] = None

@router.get("/{user_id}")
async def get_user_conversations(user_id: str, limit: int = 10):
    """사용자의 최근 대화 기록 조회 - 날짜 정렬 문제 해결"""
    try:
        collection = db.conversations
        query = {"user_id": user_id}
        
        # 🔥 _id로 정렬 (가장 최근 생성된 순서)
        # _id는 MongoDB에서 자동으로 생성되는 ObjectId로, 생성 시간순으로 정렬됨
        results = list(collection.find(query).sort("_id", -1).limit(limit))
        
        print(f"✅ Found {len(results)} conversations using _id sort")
        
        if not results:
            print(f"❌ No conversations found for user: {user_id}")
            return {"conversations": [], "total": 0}
        
        print(f"📋 Document dates found: {[conv.get('date') for conv in results]}")
        
        summaries = []
        for conv in results:
            history = conv.get("history", [])
            
            # 4단계 대화에서 정보 추출
            spending = ""
            emotion = ""
            effect = ""
            advice = ""
            
            for item in history:
                role = item.get("role", "")
                content = item.get("content", "")
                
                if role == "user":
                    if not spending:
                        spending = content
                    elif not emotion:
                        emotion = content  
                    elif not effect:
                        effect = content
                elif role == "gpt" and not advice:
                    advice = content
            
            # 최소한 spending이 있으면 포함
            if spending:
                summaries.append({
                    "date": conv.get("date", str(datetime.now().date())),
                    "spending": spending,
                    "emotion": emotion or "미입력",
                    "effect": effect or "미입력", 
                    "advice": (advice[:100] + "..." if len(advice) > 100 else advice) or "미완료",
                    "session_id": str(conv.get("_id"))
                })
        
        print(f"✅ Returning {len(summaries)} conversation summaries")
        print(f"📅 Summary dates: {[s['date'] for s in summaries]}")
        
        return {"conversations": summaries, "total": len(summaries)}
        
    except Exception as e:
        print(f"❌ Error in get_user_conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"대화 기록 조회 실패: {str(e)}")

@router.get("/{user_id}/latest")
async def get_latest_conversation(user_id: str):
    """사용자의 가장 최근 대화 조회 - _id 기준으로 수정"""
    try:
        collection = db.conversations
        
        # 🔥 _id로 정렬 (가장 최근 생성된 문서)
        latest = collection.find_one(
            {"user_id": user_id},
            sort=[("_id", -1)]
        )
        
        if not latest:
            return {"conversation": None}
            
        print(f"📅 Latest conversation date: {latest.get('date')}")
            
        history = latest.get("history", [])
        
        # 대화 상세 내용 추출
        full_conversation = []
        for item in history:
            role = item.get("role", "")
            content = item.get("content", "")
            
            if role == "system":
                continue
            elif role == "user":
                full_conversation.append(f"나: {content}")
            elif role == "gpt":
                full_conversation.append(f"Chatbot: {content}")
        
        return {
            "conversation": {
                "date": latest.get("date", str(datetime.now().date())),
                "dialogue": "\n".join(full_conversation),
                "session_id": str(latest.get("_id"))
            }
        }
        
    except Exception as e:
        print(f"❌ Error in get_latest_conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"최근 대화 조회 실패: {str(e)}")

# 🔥 추가: 모든 날짜 확인용 엔드포인트
@router.get("/{user_id}/all-dates")
async def get_all_dates(user_id: str):
    """모든 대화의 날짜 확인용"""
    try:
        collection = db.conversations
        
        # 모든 문서를 _id 순으로 정렬
        all_docs = list(collection.find({"user_id": user_id}).sort("_id", -1))
        
        dates_info = []
        for doc in all_docs:
            dates_info.append({
                "date": doc.get("date"),
                "_id": str(doc.get("_id")),
                "created_time": doc.get("_id").generation_time.strftime("%Y-%m-%d %H:%M:%S") if doc.get("_id") else "Unknown"
            })
        
        return {
            "total_conversations": len(all_docs),
            "dates_info": dates_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"날짜 조회 실패: {str(e)}")

@router.get("/{user_id}/analytics")
async def get_conversation_analytics(user_id: str):
    """사용자의 대화 패턴 분석"""
    try:
        # 🔥 최근 30일간의 대화 - 더 유연한 날짜 필터링
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # 먼저 모든 대화를 가져온 후 필터링
        all_conversations = list(db.conversations.find({"user_id": user_id}))
        
        # 날짜 필터링 (문자열 비교로)
        conversations = []
        for conv in all_conversations:
            conv_date = conv.get("date", "")
            if conv_date >= thirty_days_ago:
                conversations.append(conv)
        
        emotion_count = {}
        effect_count = {}
        total_sessions = len(conversations)
        
        for conv in conversations:
            history = conv.get("history", [])
            user_responses = [item.get("content") for item in history if item.get("role") == "user"]
            
            if len(user_responses) >= 2:
                emotion = user_responses[1]  # 두 번째 사용자 응답이 감정
                emotion_count[emotion] = emotion_count.get(emotion, 0) + 1
                
            if len(user_responses) >= 3:
                effect = user_responses[2]  # 세 번째 사용자 응답이 결과
                effect_count[effect] = effect_count.get(effect, 0) + 1
        
        # 가장 많은 감정과 개선 추세 계산
        most_common_emotion = max(emotion_count.items(), key=lambda x: x[1])[0] if emotion_count else "데이터 없음"
        improvement_rate = (effect_count.get("좋아짐", 0) / total_sessions * 100) if total_sessions > 0 else 0
        
        print(f"📊 Analytics for {user_id}: {total_sessions} sessions, {improvement_rate}% improvement")
        
        return {
            "totalSessions": total_sessions,
            "mostCommonEmotion": most_common_emotion,
            "emotionDistribution": emotion_count,
            "effectDistribution": effect_count,
            "improvementRate": round(improvement_rate, 1)
        }
        
    except Exception as e:
        print(f"❌ Error in get_conversation_analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"분석 실패: {str(e)}")

# 🔥 디버깅용 엔드포인트 추가
@router.get("/{user_id}/debug")
async def debug_conversations(user_id: str):
    """디버깅용 - 사용자의 모든 대화 구조 확인"""
    try:
        collection = db.conversations
        
        # 해당 사용자의 모든 문서 조회
        all_docs = list(collection.find({"user_id": user_id}))
        
        debug_info = {
            "total_documents": len(all_docs),
            "sample_structure": {},
            "all_dates": [],
            "collection_info": {}
        }
        
        if all_docs:
            # 첫 번째 문서의 구조
            first_doc = all_docs[0]
            debug_info["sample_structure"] = {
                "keys": list(first_doc.keys()),
                "date_field": first_doc.get("date"),
                "timestamp_field": first_doc.get("timestamp"),
                "history_length": len(first_doc.get("history", []))
            }
            
            # 모든 날짜 수집
            for doc in all_docs:
                date_val = doc.get("date")
                if date_val:
                    debug_info["all_dates"].append(date_val)
        
        # 컬렉션 정보
        debug_info["collection_info"] = {
            "total_docs_in_collection": collection.count_documents({}),
            "user_docs_count": collection.count_documents({"user_id": user_id}),
            "available_collections": db.list_collection_names()
        }
        
        return debug_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"디버깅 실패: {str(e)}")