#!/bin/bash

# 프론트엔드 프로젝트 디렉토리로 이동
echo "프론트엔드 프로젝트 디렉토리로 이동 중..."
cd /chatbot_project/project/frontend

# Docker 이미지 빌드 (캐시 사용 안 함)
echo "Docker 이미지 eunbie/frontend:latest 빌드 중..."
docker build --no-cache -t eunbie/frontend:latest .

# 빌드 성공 여부 확인
if [ $? -ne 0 ]; then
    echo "Docker 이미지 빌드에 실패했습니다. 스크립트를 종료합니다."
    exit 1
fi
echo "Docker 이미지 빌드 완료."

# Docker 이미지 푸시
echo "Docker 이미지 eunbie/frontend:latest 푸시 중..."
docker push eunbie/frontend:latest

# 푸시 성공 여부 확인
if [ $? -ne 0 ]; then
    echo "Docker 이미지 푸시에 실패했습니다. 스크립트를 종료합니다."
    exit 1
fi
echo "Docker 이미지 푸시 완료."

# Kubernetes 배포 롤아웃 재시작
echo "Kubernetes frontend 배포 롤아웃 재시작 중..."
kubectl rollout restart deployment frontend

# 롤아웃 재시작 성공 여부 확인
if [ $? -ne 0 ]; then
    echo "Kubernetes 배포 롤아웃 재시작에 실패했습니다. 스크립트를 종료합니다."
    exit 1
fi
echo "Kubernetes frontend 배포 롤아웃 재시작 완료."

# 사용하지 않는 모든 Docker 이미지 삭제
echo "사용하지 않는 모든 Docker 이미지 삭제 중..."
docker image prune -a -f

echo "모든 프론트엔드 관련 Docker 작업이 완료되었습니다."