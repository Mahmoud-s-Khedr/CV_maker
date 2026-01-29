# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Add build arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL

# Set them as environment variables for the build process
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .

# Build the app found in /app
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from builder to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
