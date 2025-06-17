from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv; load_dotenv();

from app.chat_api import router as chat_router
from app.log_api import router as log_router
from app.logs_api import router as logs_router
from app.convo_log_api import router as convo_log_router
from app.tts_api import router as tts_router  # ✅ 추가
from app.chat_tts_api import router as chat_tts_router
from app.stt_api import router as stt_router
from app.coach import router as coach_router
from app.actual_spending_api import router as actual_spending_router

app = FastAPI(root_path="/fastapi")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(log_router)
app.include_router(logs_router)
app.include_router(convo_log_router)
app.include_router(tts_router)  # ✅ 추가
app.include_router(chat_tts_router)
app.include_router(stt_router)
app.include_router(coach_router)
app.include_router(actual_spending_router)
