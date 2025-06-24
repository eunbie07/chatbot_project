#!/bin/bash
# update_fastapi_secret.sh - 기존 fastapi-secret에 Google 인증 추가

set -e

echo "🔄 기존 fastapi-secret에 Google 인증 정보 추가..."

# 설정
KEY_FILE="./google-vision-key.json"
SECRET_NAME="fastapi-secret"
NAMESPACE="default"

# 1. 키 파일 존재 확인
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Google 서비스 계정 키 파일이 없습니다: $KEY_FILE"
    echo "📋 Google Cloud Console에서 키를 다운로드하고 $KEY_FILE 경로에 저장하세요"
    exit 1
fi

echo "✅ 키 파일 발견: $KEY_FILE"

# 2. 키 파일 유효성 검사
echo "🔍 키 파일 유효성 검사..."
if python3 -c "
import json
try:
    with open('$KEY_FILE', 'r') as f:
        data = json.load(f)
    print('✅ 유효한 JSON 키 파일')
    print(f'📋 프로젝트: {data.get(\"project_id\", \"N/A\")}')
    print(f'📋 이메일: {data.get(\"client_email\", \"N/A\")}')
except Exception as e:
    print(f'❌ 키 파일 오류: {e}')
    exit(1)
"; then
    echo "✅ 키 파일 검증 완료"
else
    echo "❌ 키 파일 검증 실패"
    exit 1
fi

# 3. 기존 Secret 존재 확인
if ! kubectl get secret $SECRET_NAME -n $NAMESPACE &>/dev/null; then
    echo "❌ 기존 Secret을 찾을 수 없습니다: $SECRET_NAME"
    exit 1
fi

echo "✅ 기존 Secret 발견: $SECRET_NAME"

# 4. Google 키를 base64로 인코딩
echo "🔐 Google 키 인코딩 중..."
GOOGLE_KEY_BASE64=$(base64 -w 0 < "$KEY_FILE")

# 5. Secret에 Google 인증 정보 추가
echo "🔄 Secret 업데이트 중..."

# kubectl patch를 사용해서 기존 Secret에 새 키 추가
kubectl patch secret $SECRET_NAME -n $NAMESPACE --type='merge' -p="{
  \"data\": {
    \"GOOGLE_APPLICATION_CREDENTIALS_JSON\": \"$GOOGLE_KEY_BASE64\"
  }
}"

if [ $? -eq 0 ]; then
    echo "✅ Secret 업데이트 완료"
else
    echo "❌ Secret 업데이트 실패"
    exit 1
fi

# 6. 업데이트된 Secret 확인
echo "📋 업데이트된 Secret의 키 목록:"
kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data}' | jq -r 'keys[]' | sort

# 7. 수정된 deployment.yaml 생성
echo "📝 deployment.yaml 업데이트..."