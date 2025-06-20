from fastapi import APIRouter
from openai import OpenAI
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from fastapi.responses import JSONResponse
import json

load_dotenv()
router = APIRouter()

# OpenAI API 클라이언트 설정
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))



mongo_uri = os.getenv("MONGODB_URI", "mongodb://mongodb.default.svc.cluster.local:27017")
print(f"DEBUG: MongoDB URI used: {mongo_uri}")
mongo = MongoClient(mongo_uri)

collection = mongo.spending_db.spending_logs

@router.get("/coach/{user_id}")
def get_coaching(user_id: str):
    # MongoDB에서 사용자 소비 데이터 조회
    doc = collection.find_one({"user_id": user_id}, sort=[("month", -1)])
    if not doc:
        return {"error": "소비 데이터가 없습니다."}

    month = doc.get("month")
    data = doc.get("data", [])
    total_income = sum(item["amount"] for item in data if item["type"] == "income")
    total_expense = sum(item["amount"] for item in data if item["type"] == "expense")

    summary_lines = [
        f"{item['date']} - {item['type']} / {item['category']} / {item['amount']}원"
        for item in data
    ]
    summary_text = "\n".join(summary_lines)

    # 프롬프트 구성
    prompt = f"""
아래는 사용자의 월별 소비 내역입니다.

- 월: {month}
- 총 수입: {total_income}원
- 총 지출: {total_expense}원

[상세 내역]
{summary_text}

이 정보를 바탕으로 아래 JSON 구조로 예산안을 추천해 주세요.
**설명 없이 아래 구조만 그대로 출력**하세요:

예시:
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

    try:
        # GPT 호출 (response_format 제거)
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "너는 소비 코치야. 반드시 설명 없이 JSON 형식만 출력해야 해."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        # 문자열 응답을 직접 파싱
        raw_content = response.choices[0].message.content.strip()
        print("GPT 응답 내용:\n", raw_content)

        parsed = json.loads(raw_content)
        if not all(k in parsed for k in ("budgets", "saving_goal", "tips")):
            return {"error": "GPT 응답이 예상한 JSON 형식이 아닙니다.", "raw": raw_content}

        return JSONResponse(content=parsed)

    except json.JSONDecodeError:
        return {"error": "GPT 응답이 JSON 형식이 아닙니다. (파싱 실패)", "raw": raw_content}
    except Exception as e:
        return {"error": f"GPT 호출 중 오류 발생: {str(e)}"}
