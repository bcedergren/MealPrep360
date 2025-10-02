# Multi-stage Dockerfile for MealPrep360 Frontend
# ===============================================

# Base images
FROM node:18-alpine AS base

# Dependencies on Debian for SWC compatibility
FROM node:18-bullseye-slim AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY next.config.* ./
COPY tsconfig*.json ./

# Install all dependencies for build (ignore lockfile to avoid tarball URL errors)
RUN rm -f package-lock.json && npm install && npm cache clean --force

# Build the application on Debian
FROM node:18-bullseye-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Accept build-time env for database and public runtime values
ARG MONGODB_URI
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL

# Provide them to the build so pages that read env don't crash during prerender
ENV MONGODB_URI=${MONGODB_URI}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production image on Alpine
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy package.json for runtime dependencies
COPY --from=builder /app/package.json ./package.json

# Install curl for healthcheck and set permissions
RUN apk add --no-cache curl \
  && chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["node", "server.js"]
