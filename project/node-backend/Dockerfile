# project/node-backend/Dockerfile

# --- 1단계: 빌드 스테이지 ---
# 패키지 설치 및 빌드(필요시)를 위한 환경
FROM node:20-slim AS builder 
# 빌드 스테이지에서는 'slim' 버전도 충분 (이 주석을 다음 줄로 내렸습니다)

WORKDIR /app

# package.json과 package-lock.json (또는 yarn.lock)만 먼저 복사하여 종속성 캐싱 활용
COPY package*.json ./

# npm install 실행. node_modules가 이 레이어에 생성됨
RUN npm install

# 나머지 모든 소스 코드 복사
COPY . .

# 만약 TypeScript를 사용하거나, 프론트엔드 빌드 과정이 포함된다면 여기에 빌드 명령 추가
# RUN npm run build

# --- 2단계: 런타임 스테이지 ---
# 최종 애플리케이션 실행을 위한 최소한의 환경
# 여기서는 더 작고 보안에 강한 'alpine' 버전을 사용하는 것이 일반적
FROM node:20-alpine 
# 또는 node:20-slim (이 주석을 다음 줄로 내렸습니다)

WORKDIR /app

# 빌드 스테이지에서 생성된 node_modules와 소스 코드만 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/. # 전체 소스 코드 복사 (여기서 .dockerignore의 역할이 중요)

# 만약 TypeScript 빌드 결과물이 dist 폴더에 있다면:
# COPY --from=builder /app/dist ./dist

EXPOSE 8000

CMD ["node", "app.js"]