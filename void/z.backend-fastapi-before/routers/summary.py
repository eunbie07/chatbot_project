from fastapi import APIRouter
from db import collection

router = APIRouter()

@router.get("/summary/{user_id}")
def get_summary(user_id: str):
    doc = collection.find_one({"user_id": user_id})
    if not doc:
        return {"error": "User not found"}

    data = doc.get("data", [])
    total_income = sum(x["amount"] for x in data if x["type"] == "income")
    total_expense = sum(x["amount"] for x in data if x["type"] == "expense")
    return {
        "user_id": user_id,
        "month": doc.get("month", ""),
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense
    }
