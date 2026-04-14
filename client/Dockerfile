FROM node:20.19-alpine3.20 AS build

WORKDIR /app

COPY package*.json .
COPY client/package*.json client/
COPY server/package*.json server/

RUN npm ci

COPY . .

WORKDIR /app/client

ARG VITE_API_PATH=/api/v1/trpc
ENV VITE_API_PATH=$VITE_API_PATH

RUN npm run build

FROM nginx:alpine

COPY client/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]