FROM node:20 AS build
WORKDIR /app

# 캐시 무효화를 위한 build-arg
ARG CACHEBUSTER=1
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
