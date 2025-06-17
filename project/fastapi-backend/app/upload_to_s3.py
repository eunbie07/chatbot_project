from fastapi import FastAPI, UploadFile, File
from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import NoCredentialsError

# .env 로드
load_dotenv()

app = FastAPI()

# 환경변수에서 S3 설정값 가져오기
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION")

# S3 클라이언트 생성
s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        s3.upload_fileobj(file.file, S3_BUCKET_NAME, file.filename)
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file.filename}"
        return {"file_url": file_url}
    except NoCredentialsError:
        return {"error": "AWS credentials not found"}
    except Exception as e:
        return {"error": str(e)}
