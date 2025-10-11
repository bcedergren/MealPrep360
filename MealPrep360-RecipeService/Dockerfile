# Multi-stage build for Recipe Service
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production=false

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

# Copy dependencies and pre-built dist
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs ./dist ./dist
COPY --chown=nodeuser:nodejs ./package*.json ./

USER nodeuser

EXPOSE 3002

ENV PORT=3002

CMD ["node", "dist/index.js"]

