# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_factor=2 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000

# Install OpenSSL for Prisma (Debian-based)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN sh -c 'for attempt in 1 2 3; do npm ci && exit 0; echo "npm ci failed (attempt ${attempt}), retrying..."; sleep $((attempt * 10)); done; exit 1'
RUN npx prisma generate

# Copy the rest of the code
COPY . .

# Build
RUN npm run build

# Production Stage
FROM node:22-slim

WORKDIR /app

ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_factor=2 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN sh -c 'for attempt in 1 2 3; do npm ci --omit=dev && exit 0; echo "npm ci --omit=dev failed (attempt ${attempt}), retrying..."; sleep $((attempt * 10)); done; exit 1'
RUN npx prisma generate

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["npm", "start"]
