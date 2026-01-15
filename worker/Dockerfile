FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./

# Install all dependencies (dev + prod)
RUN npm install

COPY . .

# Build TS
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./

# Only prod deps
RUN npm install --production

# Copy built JS
COPY --from=builder /app/dist ./dist

# Fixed: use index.js instead of worker.js
CMD ["node", "dist/index.js"]