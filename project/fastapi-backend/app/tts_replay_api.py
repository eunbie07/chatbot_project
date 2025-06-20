from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import os, boto3
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION", "ap-southeast-2")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=S3_REGION
)

@router.get("/tts_replay")
def tts_replay_latest():
    try:
        
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix="tts_audio/"
        )

        
        if 'Contents' not in response or not response['Contents']:
            raise HTTPException(status_code=404, detail="TTS 파일이 존재하지 않습니다.")

        
        latest_file = max(response['Contents'], key=lambda x: x['LastModified'])
        s3_key = latest_file['Key']

        
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=3600
        )

        return JSONResponse({"url": presigned_url, "s3_key": s3_key})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Presigned URL 생성 실패: {str(e)}")
