# app/ocr_api.py - 환경변수 JSON 방식으로 수정

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from google.cloud import vision
from google.oauth2 import service_account
import io
import re
from datetime import datetime
import base64
import os
import json
from typing import List

router = APIRouter()

def initialize_vision_client():
    """Google Vision API 클라이언트 초기화 (수정된 버전)"""
    try:
        # 방법 1: 환경변수에서 JSON 키 읽기 (Kubernetes용)
        credentials_json_str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if credentials_json_str:
            try:
                # ✅ 수정: 이미 디코딩된 JSON 문자열인지 확인
                if credentials_json_str.startswith('{'):
                    # 이미 JSON 문자열인 경우 (Kubernetes에서 자동 디코딩됨)
                    credentials_info = json.loads(credentials_json_str)
                else:
                    # base64 인코딩된 경우 (수동 설정)
                    decoded_json = base64.b64decode(credentials_json_str).decode('utf-8')
                    credentials_info = json.loads(decoded_json)
                
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                client = vision.ImageAnnotatorClient(credentials=credentials)
                
                print("✅ 환경변수 JSON으로 Google Vision API 초기화 성공")
                print(f"📋 프로젝트 ID: {credentials_info.get('project_id')}")
                return client
                
            except Exception as e:
                print(f"❌ 환경변수 JSON 처리 실패: {e}")
        
        # 방법 2: 환경변수로 서비스 계정 키 파일 경로 설정 (로컬 개발용)
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_path and os.path.exists(credentials_path):
            print(f"✅ 서비스 계정 키 파일 사용: {credentials_path}")
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            client = vision.ImageAnnotatorClient(credentials=credentials)
            return client
        
        # 방법 3: 기본 인증 (GCP 환경에서 자동 인증)
        print("🔄 기본 인증 시도 중...")
        client = vision.ImageAnnotatorClient()
        print("✅ 기본 인증으로 Google Vision API 초기화 성공")
        return client
        
    except Exception as e:
        print(f"❌ Google Vision API 초기화 실패: {e}")
        print("💡 확인사항:")
        print("   - GOOGLE_APPLICATION_CREDENTIALS_JSON 환경변수 설정")
        print("   - Google Cloud Vision API 활성화")
        print("   - 서비스 계정 권한 확인")
        return None

# 클라이언트 초기화
client = initialize_vision_client()

class OCRResult(BaseModel):
    store: str
    items: List[str]
    totalAmount: int
    date: str

class OCRRequest(BaseModel):
    image: str  # Base64 인코딩된 이미지

def parse_receipt_text(ocr_text: str) -> dict:
    """OCR 텍스트에서 영수증 정보를 추출하는 함수"""
    lines = [line.strip() for line in ocr_text.split('\n') if line.strip()]
    
    store = ''
    items = []
    total_amount = 0
    receipt_date = ''
    
    print(f"🔍 OCR 텍스트 파싱 시작: {len(lines)}줄")
    
    # 1. 상호명 찾기 (보통 첫 번째나 두 번째 줄, 한글 포함)
    for i, line in enumerate(lines[:5]):  # 상위 5줄에서 찾기
        if re.search(r'[가-힣]', line) and not re.search(r'\d+원|\d+:\d+|\d+\.', line):
            exclude_keywords = ['영수증', '거래', '카드', '현금', '승인', '번호', '시간', '일시']
            if not any(keyword in line for keyword in exclude_keywords):
                if len(line) >= 2:
                    store = line
                    print(f"📍 상호명 발견: {store}")
                    break
    
    # 2. 날짜 찾기
    date_patterns = [
        r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',
        r'(\d{4})\.(\d{1,2})\.(\d{1,2})',
        r'(\d{2})[/-](\d{1,2})[/-](\d{1,2})',
        r'(\d{2})\.(\d{1,2})\.(\d{1,2})',
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
    ]
    
    for line in lines:
        for pattern in date_patterns:
            match = re.search(pattern, line)
            if match:
                groups = match.groups()
                if len(groups[0]) == 4:
                    year, month, day = groups
                elif len(groups[2]) == 4:
                    month, day, year = groups
                else:
                    year, month, day = groups
                    year = '20' + year if int(year) < 50 else '19' + year
                
                receipt_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                print(f"📅 날짜 발견: {receipt_date}")
                break
        if receipt_date:
            break
    
    if not receipt_date:
        receipt_date = datetime.now().strftime('%Y-%m-%d')
        print(f"📅 기본 날짜 사용: {receipt_date}")
    
    # 3. 총 금액 찾기
    total_keywords = ['총계', '합계', '총액', 'TOTAL', '결제금액', '카드승인', '받을금액', '총합', '지불금액']
    
    for line in lines:
        if any(keyword in line for keyword in total_keywords):
            amount_match = re.search(r'(\d{1,3}(?:,\d{3})*)', line)
            if amount_match:
                total_amount = int(amount_match.group(1).replace(',', ''))
                print(f"💰 총액 발견 (키워드): {total_amount}원")
                break
    
    if total_amount == 0:
        amounts = []
        for line in lines:
            amount_matches = re.findall(r'(\d{1,3}(?:,\d{3})*)', line)
            for match in amount_matches:
                amount = int(match.replace(',', ''))
                if 500 <= amount <= 1000000:
                    amounts.append(amount)
        
        if amounts:
            total_amount = max(amounts)
            print(f"💰 총액 추정 (최대값): {total_amount}원")
    
    # 4. 구매 항목 찾기
    item_patterns = [
        r'[가-힣]{2,}(?:\s*[가-힣]*)*',
        r'[A-Za-z]{3,}(?:\s*[A-Za-z]*)*',
    ]
    
    potential_items = []
    exclude_item_keywords = ['원', '카드', '승인', '거래', '시간', ':', 'POS', '번호', '전화', '주소', '사업자']
    
    for line in lines[2:]:
        if any(keyword in line for keyword in exclude_item_keywords):
            continue
        
        if re.match(r'^\d+$', line.strip()):
            continue
            
        for pattern in item_patterns:
            matches = re.findall(pattern, line)
            for match in matches:
                item = match.strip()
                if len(item) >= 2 and not item.isdigit() and item not in potential_items:
                    if not any(exclude in item for exclude in ['매장', '점포', '지점', '대표']):
                        potential_items.append(item)
    
    items = list(dict.fromkeys(potential_items))[:5]
    print(f"🛒 구매 항목: {items}")
    
    # 기본값 설정
    if not store:
        store = "매장명 인식 실패"
    if not items:
        items = ["상품명 인식 실패"]
    
    result = {
        'store': store,
        'items': items,
        'totalAmount': total_amount,
        'date': receipt_date
    }
    
    print(f"✅ 파싱 완료: {result}")
    return result

@router.post("/receipt")
async def process_receipt(file: UploadFile = File(...)):
    """영수증 이미지를 받아서 OCR 처리하는 API"""
    
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="Google Vision API가 초기화되지 않았습니다. 환경변수 GOOGLE_APPLICATION_CREDENTIALS_JSON을 확인해주세요."
        )
    
    try:
        print(f"📷 영수증 OCR 요청: {file.filename}")
        
        # 파일 형식 체크
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail='이미지 파일만 업로드 가능합니다.')
        
        # 파일 크기 체크 (10MB 제한)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail='파일 크기는 10MB 이하여야 합니다.')
        
        print(f"📁 파일 크기: {len(contents)} bytes")
        
        # Google Vision API 요청
        image = vision.Image(content=contents)
        response = client.text_detection(image=image)
        
        # 에러 체크
        if response.error.message:
            raise Exception(f'Google Vision API 에러: {response.error.message}')
        
        # OCR 결과에서 텍스트 추출
        texts = response.text_annotations
        if not texts:
            return {
                'success': False,
                'error': '텍스트를 인식할 수 없습니다. 영수증이 명확하게 보이는지 확인해주세요.'
            }
        
        # 첫 번째 결과가 전체 텍스트
        ocr_text = texts[0].description
        print(f"🔍 OCR 원본 텍스트 (앞 200자):\n{ocr_text[:200]}...")
        
        # 영수증 정보 파싱
        receipt_data = parse_receipt_text(ocr_text)
        
        return {
            'success': True,
            'data': receipt_data,
            'raw_text': ocr_text[:500] + "..." if len(ocr_text) > 500 else ocr_text  # 로그 크기 제한
        }
        
    except Exception as e:
        print(f"❌ OCR 처리 에러: {str(e)}")
        return {
            'success': False,
            'error': f'OCR 처리 중 오류가 발생했습니다: {str(e)}'
        }

@router.post("/receipt-base64")
async def process_receipt_base64(request: OCRRequest):
    """Base64 인코딩된 이미지를 받아서 OCR 처리하는 API"""
    
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="Google Vision API가 초기화되지 않았습니다. 환경변수를 확인해주세요."
        )
    
    try:
        print("📷 Base64 영수증 OCR 요청")
        
        # Base64 디코딩
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        try:
            image_content = base64.b64decode(image_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail='잘못된 Base64 형식입니다.')
        
        print(f"📁 디코딩된 이미지 크기: {len(image_content)} bytes")
        
        # Google Vision API 요청
        image = vision.Image(content=image_content)
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(f'Google Vision API 에러: {response.error.message}')
        
        texts = response.text_annotations
        if not texts:
            return {
                'success': False,
                'error': '텍스트를 인식할 수 없습니다. 영수증이 명확하게 보이는지 확인해주세요.'
            }
        
        ocr_text = texts[0].description
        print(f"🔍 OCR 원본 텍스트 (앞 200자):\n{ocr_text[:200]}...")
        
        receipt_data = parse_receipt_text(ocr_text)
        
        return {
            'success': True,
            'data': receipt_data,
            'raw_text': ocr_text[:500] + "..." if len(ocr_text) > 500 else ocr_text
        }
        
    except Exception as e:
        print(f"❌ Base64 OCR 처리 에러: {str(e)}")
        return {
            'success': False,
            'error': f'OCR 처리 중 오류가 발생했습니다: {str(e)}'
        }

@router.get("/health")
async def health_check():
    """OCR 서비스 상태 확인"""
    
    # 환경변수 확인
    has_json_creds = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON"))
    has_file_creds = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
    
    if client:
        return {
            "status": "OK", 
            "message": "OCR 서비스가 정상 작동 중입니다.",
            "vision_api": "연결됨",
            "credentials": "인증 완료",
            "auth_method": "JSON 환경변수" if has_json_creds else "파일 또는 기본 인증"
        }
    else:
        return {
            "status": "ERROR",
            "message": "Google Vision API 연결 실패",
            "vision_api": "연결 안됨",
            "credentials": "인증 실패",
            "has_json_creds": has_json_creds,
            "has_file_creds": has_file_creds,
            "help": "GOOGLE_APPLICATION_CREDENTIALS_JSON 환경변수를 확인하세요"
        }