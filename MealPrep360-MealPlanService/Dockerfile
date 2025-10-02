# Multi-stage Dockerfile for MealPrep360-MealPlanService
# =====================================================

###############################################
# MealPrep360-MealPlanService Dockerfile      #
# Next.js production image (non-standalone)   #
###############################################

FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci --only=production --no-audit --no-fund && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy Next.js build artifacts and public assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3003

# Health check against the Next API health route
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/api/health || exit 1

# Start the Next.js server
CMD ["npm", "run", "start"]
