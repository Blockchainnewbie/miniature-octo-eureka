# syntax=docker/dockerfile:1.4

FROM node:16-slim as base

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base as development
CMD ["npm", "run", "dev"]

FROM base as production
COPY . .
RUN npm run build

FROM nginx:alpine as nginx
COPY --from=production /app/dist /usr/share/nginx/html
