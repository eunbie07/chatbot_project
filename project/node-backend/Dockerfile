# node-backend/Dockerfile
FROM node:20
# 현재 사용 중인 Node.js 버전을 유지합니다.

WORKDIR /app

COPY package*.json ./
RUN npm install
# 이 단계에서 dependencies와 devDependencies (nodemon 포함) 모두 설치됩니다.

COPY . .
# 소스 코드를 복사합니다.

EXPOSE 8000

# 개발 환경을 위한 CMD 명령어: package.json에 정의된 'dev' 스크립트를 실행합니다.
CMD ["node", "app.js"]