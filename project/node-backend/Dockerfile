# --- 1단계: 빌드 스테이지 ---
FROM node:20-slim AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 종속성 설치를 위한 파일만 먼저 복사 (캐시 활용)
COPY package*.json ./

# 종속성 설치
RUN npm install

# 전체 애플리케이션 소스 코드 복사
COPY . .

# (선택) TypeScript나 프론트엔드 빌드가 있다면 여기서 실행
# RUN npm run build


# --- 2단계: 런타임 스테이지 ---
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 스테이지에서 생성된 node_modules 복사
COPY --from=builder /app/node_modules ./node_modules

# 전체 소스 코드 복사 (여기서 .dockerignore의 역할이 중요)
COPY --from=builder /app/. ./

# 컨테이너 외부에서 접근할 수 있도록 포트 오픈
EXPOSE 8000

# 컨테이너 시작 시 실행할 명령어
CMD ["node", "app.js"]
