FROM node:20.19-alpine3.20

WORKDIR /app

COPY ../package*.json .
COPY client/package*.json client/
COPY server/package*.json server/

RUN npm ci

COPY . .

WORKDIR /app/client

RUN npm run build