# Production Build Guide

## Overview
This guide provides step-by-step instructions for building and optimizing all MealPrep360 services for production deployment.

## 🏗️ Build Optimizations

### 1. Next.js Applications (API, Frontend, Admin)

#### Build Configuration

```javascript
// next.config.js - Production Optimizations
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Performance optimizations
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@clerk/nextjs', 'react-icons'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    domains: ['images.mealprep360.com', 'cdn.mealprep360.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),
};

module.exports = nextConfig;
```

#### Build Commands

```bash
# Production build with optimizations
npm run build:prod

# Build with bundle analysis
ANALYZE=true npm run build:prod

# Build with type checking
npm run build:prod:check
```

### 2. React Native Mobile App

#### Build Configuration

```javascript
// metro.config.js - Production Optimizations
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Production optimizations
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Bundle splitting
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
```

#### Build Commands

```bash
# Production builds
npm run build:android:prod
npm run build:ios:prod
npm run build:all:prod

# Build with optimizations
EXPO_PUBLIC_NODE_ENV=production npm run build:all
```

### 3. Microservices

#### Docker Production Builds

```dockerfile
# Dockerfile.prod - Production Optimized
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
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Set proper permissions
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
```

## 🚀 Production Build Scripts

### 1. Master Build Script

```bash
#!/bin/bash
# build-all-prod.sh - Build all services for production

set -e

echo "🏗️  Building MealPrep360 for Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to build service
build_service() {
    local service_name=$1
    local service_path=$2
    local build_command=$3
    
    echo -e "${YELLOW}Building $service_name...${NC}"
    cd "$service_path"
    
    if eval "$build_command"; then
        echo -e "${GREEN}✅ $service_name built successfully${NC}"
    else
        echo -e "${RED}❌ $service_name build failed${NC}"
        exit 1
    fi
    
    cd - > /dev/null
}

# Build all services
echo "Starting production builds..."

# API Gateway
build_service "API Gateway" "MealPrep360-API" "npm run build:prod"

# Frontend
build_service "Frontend" "MealPrep360" "npm run build:prod"

# Admin Panel
build_service "Admin Panel" "MealPrep360-Admin" "npm run build:prod"

# Microservices
build_service "Recipe Service" "MealPrep360-RecipeService" "npm run build:prod"
build_service "Meal Plan Service" "MealPrep360-MealPlanService" "npm run build:prod"
build_service "Shopping Service" "MealPrep360-ShoppingListService" "npm run build:prod"
build_service "Social Service" "MealPrep360-SocialMediaService" "npm run build:prod"
build_service "Blog Service" "MealPrep360-BlogService" "npm run build:prod"

# Mobile App
build_service "Mobile App" "MealPrep360Mobile" "npm run build:all:prod"

echo -e "${GREEN}🎉 All services built successfully for production!${NC}"
```

### 2. Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build:
      context: ./MealPrep360-API
      dockerfile: Dockerfile.prod
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Recipe Service
  recipe-service:
    build:
      context: ./MealPrep360-RecipeService
      dockerfile: Dockerfile.prod
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
    restart: unless-stopped

  # Meal Plan Service
  mealplan-service:
    build:
      context: ./MealPrep360-MealPlanService
      dockerfile: Dockerfile.prod
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
    restart: unless-stopped

  # Shopping Service
  shopping-service:
    build:
      context: ./MealPrep360-ShoppingListService
      dockerfile: Dockerfile.prod
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
    restart: unless-stopped

  # Social Service
  social-service:
    build:
      context: ./MealPrep360-SocialMediaService
      dockerfile: Dockerfile.prod
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
    restart: unless-stopped

  # Blog Service
  blog-service:
    build:
      context: ./MealPrep360-BlogService
      dockerfile: Dockerfile.prod
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
    restart: unless-stopped

  # WebSocket Server
  websocket-server:
    build:
      context: ./MealPrep360-WebsocketServer
      dockerfile: Dockerfile.prod
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  # Database
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=mealprep360_prod
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api-gateway
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

## 📦 Package.json Scripts

### Add to each service's package.json:

```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production next build",
    "build:prod:check": "npm run type-check && npm run build:prod",
    "start:prod": "NODE_ENV=production next start",
    "docker:build": "docker build -f Dockerfile.prod -t mealprep360-service .",
    "docker:run": "docker run -p 3000:3000 --env-file .env.production mealprep360-service",
    "analyze": "ANALYZE=true npm run build:prod",
    "type-check": "tsc --noEmit",
    "lint:prod": "eslint . --ext .ts,.tsx --max-warnings 0",
    "test:prod": "jest --ci --coverage --watchAll=false"
  }
}
```

## 🔍 Production Validation

### Pre-deployment Checklist

- [ ] All builds complete without errors
- [ ] TypeScript compilation successful
- [ ] All tests passing
- [ ] Linting passes with no warnings
- [ ] Bundle size within acceptable limits
- [ ] Environment variables configured
- [ ] Security headers implemented
- [ ] Performance optimizations applied
- [ ] Error handling comprehensive
- [ ] Logging configured
- [ ] Health checks implemented

### Performance Benchmarks

- **API Response Time**: < 200ms for 95th percentile
- **Bundle Size**: < 1MB for main bundles
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🚀 Deployment Commands

```bash
# Build all services
./build-all-prod.sh

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Deploy to Vercel (Frontend/API)
vercel --prod

# Deploy to Railway (Microservices)
railway up --environment production

# Deploy Mobile App
eas build --platform all --profile production
```

## 📊 Monitoring Setup

### Health Check Endpoints

All services should implement:

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  });
});
```

### Performance Monitoring

```typescript
// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Send to monitoring service
    if (duration > 1000) {
      console.warn(`Slow request: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});
```

This production build guide ensures all services are optimized, secure, and ready for production deployment.

