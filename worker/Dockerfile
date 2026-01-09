# # Use Node Alpine image
# FROM node:20-alpine

# WORKDIR /app

# # Copy package files and install dependencies
# COPY package*.json ./
# RUN npm install --production

# # Copy all source files
# COPY . .

# # Build TypeScript to JavaScript
# RUN npm run build

# # Start the server with compiled JS
# CMD ["npm", "start"]
# Stage 1: Build
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

CMD ["node", "dist/index.js"]
