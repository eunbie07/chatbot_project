FROM node:20 AS build
WORKDIR /app

ARG CACHEBUSTER=1
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# ✅ nginx 시작 명령 추가!
CMD ["nginx", "-g", "daemon off;"]
