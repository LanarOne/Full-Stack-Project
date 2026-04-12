FROM node:20.19-alpine3.20 AS build

WORKDIR /app

COPY ../package*.json .
COPY client/package*.json client/
COPY server/package*.json server/

RUN npm ci

COPY . .

WORKDIR /app/client

RUN npm run build

FROM nginx:alpine

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]