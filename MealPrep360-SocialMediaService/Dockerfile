###############################################
# MealPrep360-SocialMediaService Dockerfile   #
# Next.js (standalone) production image       #
###############################################

FROM node:18-alpine AS base

# Use Debian for deps and build to avoid SWC binary issues
FROM node:18-bullseye-slim AS deps
WORKDIR /app

# Install dependencies (include dev for build)
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci && npm cache clean --force

FROM node:18-bullseye-slim AS builder
WORKDIR /app
# Accept build-time MONGODB_URI so API routes can compile

# Copy deps and source
ARG MONGODB_URI
ENV MONGODB_URI=${MONGODB_URI}
# Create minimal .env for Next.js build with the MONGODB_URI
RUN printf "MONGODB_URI=${MONGODB_URI}\n" > .env
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
# Build Next.js app (output: .next/standalone)
RUN npm run build

# Runtime on Alpine
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production

# Copy Next.js standalone server and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Install curl for healthcheck
RUN apk add --no-cache curl

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3005

# Health check against the Next API health route
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/api/health || exit 1

# Start the Next.js standalone server
CMD ["node", "server.js"]
