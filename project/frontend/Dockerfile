# FROM node:20 AS build
# WORKDIR /app

# ARG CACHEBUSTER=1
# COPY package*.json ./
# RUN npm install

# COPY . .
# RUN npm run build

# FROM nginx:alpine
# COPY --from=build /app/dist /usr/share/nginx/html

# # ✅ nginx 시작 명령 추가!
# CMD ["nginx", "-g", "daemon off;"]


FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# ✅ 아래 라인 추가: custom nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ✅ 새로 추가: 자동 새로고침 방지 패치
RUN sed -i 's/window\.location\.reload()/console.log("Prevented automatic reload")/g' /usr/share/nginx/html/assets/*.js || true

CMD ["nginx", "-g", "daemon off;"]