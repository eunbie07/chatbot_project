#!/bin/bash

docker build -t eunbie/fastapi:latest .

docker push eunbie/fastapi:latest

kubectl rollout restart deployment fastapi

# 완료
echo "✅ FastAPI 재배포 완료!"

kubectl get pods