# 배포용 예시 (추후 요청 시 제공)/ Dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 정적 파일을 Nginx로 서빙
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
