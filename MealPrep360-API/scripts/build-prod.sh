#!/bin/bash
# build-prod.sh - Production build script for MealPrep360-API

set -e

echo "🏗️  Building MealPrep360-API for Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Set production environment
export NODE_ENV=production

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Type checking
echo "Running TypeScript type checking..."
npx tsc --noEmit

# Linting
echo "Running ESLint..."
npm run lint:prod

# Testing
echo "Running tests..."
npm run test:prod

# Build Next.js application
echo "Building Next.js application..."
npm run build

# Build TypeScript library
echo "Building TypeScript library..."
npm run build:lib

# Security audit
echo "Running security audit..."
npm audit --audit-level=moderate

# Bundle analysis (optional)
if [ "$1" = "--analyze" ]; then
    echo "Running bundle analysis..."
    ANALYZE=true npm run build
fi

# Create production package
echo "Creating production package..."
mkdir -p dist/production
cp -r .next dist/production/
cp -r dist/lib dist/production/
cp package.json dist/production/
cp package-lock.json dist/production/
cp -r public dist/production/

# Create production start script
cat > dist/production/start.sh << 'EOF'
#!/bin/bash
export NODE_ENV=production
node .next/standalone/server.js
EOF

chmod +x dist/production/start.sh

# Create Dockerfile for production
cat > dist/production/Dockerfile << 'EOF'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build for production
RUN npm run build:prod

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set proper permissions
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
EOF

echo -e "${GREEN}✅ Production build completed successfully!${NC}"
echo -e "${YELLOW}📦 Production package created in dist/production/${NC}"
echo -e "${YELLOW}🐳 Docker image ready for deployment${NC}"

