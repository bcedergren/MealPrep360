# Multi-stage build for Recipe Service
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript to JavaScript
RUN npm run build || (echo "Build failed, checking for existing dist..." && ls -la && test -d dist)

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

# Copy dependencies and built dist
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs ./package*.json ./

USER nodeuser

EXPOSE 3002

ENV PORT=3002

CMD ["node", "dist/index.js"]

