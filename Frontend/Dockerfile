# syntax=docker/dockerfile:1
FROM node:16-alpine3.11

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5020
ENV HOST=0.0.0.0
ENTRYPOINT ["npm", "run", "dev"]
