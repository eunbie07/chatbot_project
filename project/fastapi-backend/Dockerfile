FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3000

# 개발 환경을 위한 CMD 명령어: --reload 플래그를 추가하여 코드 변경 시 자동으로 재시작합니다.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]