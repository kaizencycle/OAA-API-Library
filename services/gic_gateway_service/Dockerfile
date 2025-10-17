# services/gic_gateway_service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
ENV PORT=8787
EXPOSE 8787
CMD ["node","src/index.js"]