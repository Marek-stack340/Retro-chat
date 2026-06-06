FROM node:20-slim

WORKDIR /usr/src/app

# Install dependencies first for caching
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source
COPY . ./

# Expose port used by Cloud Run
EXPOSE 3000

CMD ["node", "server.js"]
