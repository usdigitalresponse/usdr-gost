# Dockerfile

FROM node:16.14.0-alpine as app_base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
