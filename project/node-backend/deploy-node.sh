#!/bin/bash

# Node.js 백엔드 프로젝트 디렉토리로 이동
echo "Node.js 백엔드 프로젝트 디렉토리로 이동 중..."
cd /chatbot_project/project/node-backend

# Docker 이미지 빌드 
echo "Docker 이미지 eunbie/node-backend:latest 빌드 중..."
docker build --no-cache -t eunbie/node-backend:latest .

# 빌드 성공 여부 확인
if [ $? -ne 0 ]; then
    echo "Docker 이미지 빌드에 실패했습니다. 스크립트를 종료합니다."
    exit 1
fi
echo "Docker 이미지 빌드 완료."

# Docker 이미지 푸시
echo "Docker 이미지 eunbie/node-backend:latest 푸시 중..."
docker push eunbie/node-backend:latest

# 푸시 성공 여부 확인
if [ $? -ne 0 ]; then
    echo "Docker 이미지 푸시에 실패했습니다. 스크립트를 종료합니다."
    exit 1
fi
echo "Docker 이미지 푸시 완료."

# Kubernetes 배포 롤아웃 재시작
echo "Kubernetes node-backend 배포 롤아웃 재시작 중..."
kubectl rollout restart deployment node-backend

# 롤아웃 재시작 성공 여부 확인
if [ $? -ne 0 ]; then
    echo "Kubernetes 배포 롤아웃 재시작에 실패했습니다. 스크립트를 종료합니다."
    exit 1
fi
echo "Kubernetes node-backend 배포 롤아웃 재시작 완료."

echo "모든 Node.js 백엔드 관련 Docker 작업이 완료되었습니다."