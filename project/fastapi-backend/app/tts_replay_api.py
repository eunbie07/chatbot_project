# 📄 tts_replay_api.py
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import os, boto3
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name="ap-northeast-2"
)

@router.get("/tts_replay")
def tts_replay(filename: str = Query(..., description="S3에 저장된 mp3 파일 이름")):
    try:
        s3_key = f"tts_audio/{filename}"
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=3600  # 1시간 유효
        )
        return JSONResponse({"url": presigned_url})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Presigned URL 생성 실패: {str(e)}")
