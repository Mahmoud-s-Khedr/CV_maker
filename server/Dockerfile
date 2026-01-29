# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma (Debian-based)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN npm install
RUN npx prisma generate

# Copy the rest of the code
COPY . .

# Build
RUN npm run build

# Production Stage
FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --only=production
RUN npx prisma generate

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["npm", "start"]
