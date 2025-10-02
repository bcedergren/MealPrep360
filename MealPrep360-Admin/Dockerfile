# Multi-stage Dockerfile for MealPrep360-Admin
# ============================================

# Base image(s)
FROM node:18-alpine AS base

# Dependencies stage (use Debian to ensure Next SWC native binary works)
FROM node:18-bullseye-slim AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY next.config.js ./
COPY tsconfig.json ./

# Install all deps (including dev) for build
RUN npm ci && npm cache clean --force

# Build the application (on Debian for SWC compatibility)
FROM node:18-bullseye-slim AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Accept and set public envs during build to satisfy runtime checks in prerender
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production image (slim Alpine runtime)
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy package.json for runtime dependencies
COPY --from=builder /app/package.json ./package.json

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set proper permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3008

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3008 || exit 1

# Start the application
CMD ["node", "server.js"]
