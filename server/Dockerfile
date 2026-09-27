# Dockerfile for Node.js Express Backend
FROM node:20-alpine

WORKDIR /app

# Copy package files & install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
