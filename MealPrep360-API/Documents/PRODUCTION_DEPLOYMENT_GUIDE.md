# Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying MealPrep360 to production environments.

## 🚀 Deployment Architecture

### Production Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                        Production Environment                │
├─────────────────────────────────────────────────────────────┤
│  Load Balancer (CloudFlare)                                 │
│  ├── SSL Termination                                        │
│  ├── DDoS Protection                                        │
│  └── CDN Distribution                                       │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                          │
│  ├── Frontend (Vercel) - mealprep360.com                   │
│  ├── API Gateway (Vercel) - api.mealprep360.com            │
│  ├── Admin Panel (Vercel) - admin.mealprep360.com          │
│  └── Microservices (Railway/Render)                        │
│      ├── Recipe Service - recipe.mealprep360.com           │
│      ├── Meal Plan Service - mealplan.mealprep360.com      │
│      ├── Shopping Service - shopping.mealprep360.com       │
│      ├── Social Service - social.mealprep360.com           │
│      ├── Blog Service - blog.mealprep360.com               │
│      └── WebSocket Server - ws.mealprep360.com             │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── MongoDB Atlas (Primary Database)                      │
│  ├── Redis (Caching & Sessions)                            │
│  └── AWS S3 (File Storage)                                 │
├─────────────────────────────────────────────────────────────┤
│  Monitoring & Observability                                 │
│  ├── Sentry (Error Tracking)                               │
│  ├── New Relic (Performance Monitoring)                    │
│  ├── DataDog (Infrastructure Monitoring)                   │
│  └── UptimeRobot (Uptime Monitoring)                       │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

- [ ] **Domain Names**: All domains registered and configured
- [ ] **SSL Certificates**: SSL certificates obtained and configured
- [ ] **DNS Records**: All DNS records configured
- [ ] **Environment Variables**: All production environment variables set
- [ ] **API Keys**: All external API keys obtained and configured
- [ ] **Database**: MongoDB Atlas cluster created and configured
- [ ] **Cache**: Redis instance created and configured
- [ ] **Storage**: AWS S3 bucket created and configured
- [ ] **Monitoring**: Monitoring services configured
- [ ] **Backup**: Backup strategy implemented

### 2. Security Configuration

- [ ] **Authentication**: Clerk production configuration
- [ ] **Authorization**: Role-based access control implemented
- [ ] **API Security**: Rate limiting and input validation
- [ ] **CORS**: Cross-origin resource sharing configured
- [ ] **Headers**: Security headers implemented
- [ ] **Encryption**: Data encryption at rest and in transit
- [ ] **Secrets**: All secrets properly managed
- [ ] **Access Control**: Database and service access controls
- [ ] **Monitoring**: Security monitoring configured
- [ ] **Incident Response**: Security incident procedures

### 3. Performance Optimization

- [ ] **Build Optimization**: Production builds optimized
- [ ] **Bundle Size**: Bundle sizes within acceptable limits
- [ ] **Caching**: Caching strategies implemented
- [ ] **CDN**: Content delivery network configured
- [ ] **Compression**: Gzip/Brotli compression enabled
- [ ] **Images**: Image optimization implemented
- [ ] **Database**: Database indexes optimized
- [ ] **Queries**: Database queries optimized
- [ ] **Monitoring**: Performance monitoring configured
- [ ] **Testing**: Load testing completed

## 🛠️ Deployment Steps

### Step 1: Infrastructure Setup

#### 1.1 Domain Configuration

```bash
# Domain setup checklist
- mealprep360.com (Frontend)
- api.mealprep360.com (API Gateway)
- admin.mealprep360.com (Admin Panel)
- recipe.mealprep360.com (Recipe Service)
- mealplan.mealprep360.com (Meal Plan Service)
- shopping.mealprep360.com (Shopping Service)
- social.mealprep360.com (Social Service)
- blog.mealprep360.com (Blog Service)
- ws.mealprep360.com (WebSocket Server)
```

#### 1.2 SSL Certificate Setup

```bash
# Using Let's Encrypt with Certbot
certbot certonly --manual --preferred-challenges dns -d mealprep360.com
certbot certonly --manual --preferred-challenges dns -d api.mealprep360.com
certbot certonly --manual --preferred-challenges dns -d admin.mealprep360.com
# ... repeat for all domains
```

#### 1.3 Database Setup

```bash
# MongoDB Atlas Setup
# 1. Create cluster in MongoDB Atlas
# 2. Configure network access (IP whitelist)
# 3. Create database user
# 4. Configure connection string
# 5. Enable encryption at rest
# 6. Set up backup strategy
```

### Step 2: Service Deployment

#### 2.1 Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy frontend
cd MealPrep360
vercel --prod

# Configure environment variables in Vercel dashboard
# - NEXT_PUBLIC_API_URL=https://api.mealprep360.com
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### 2.2 API Gateway Deployment (Vercel)

```bash
# Deploy API Gateway
cd MealPrep360-API
vercel --prod

# Configure environment variables in Vercel dashboard
# - MONGODB_URI=mongodb+srv://...
# - CLERK_SECRET_KEY=sk_live_...
# - OPENAI_API_KEY=sk-...
# - STRIPE_SECRET_KEY=sk_live_...
```

#### 2.3 Admin Panel Deployment (Vercel)

```bash
# Deploy Admin Panel
cd MealPrep360-Admin
vercel --prod

# Configure environment variables
# - NEXT_PUBLIC_API_URL=https://api.mealprep360.com
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

#### 2.4 Microservices Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy each service
cd MealPrep360-RecipeService
railway up --environment production

cd MealPrep360-MealPlanService
railway up --environment production

cd MealPrep360-ShoppingListService
railway up --environment production

cd MealPrep360-SocialMediaService
railway up --environment production

cd MealPrep360-BlogService
railway up --environment production

cd MealPrep360-WebsocketServer
railway up --environment production
```

### Step 3: Mobile App Deployment

#### 3.1 EAS Build Configuration

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
cd MealPrep360Mobile
eas build:configure

# Build for production
eas build --platform all --profile production
```

#### 3.2 App Store Deployment

```bash
# iOS App Store
eas submit --platform ios --profile production

# Google Play Store
eas submit --platform android --profile production
```

### Step 4: Monitoring Setup

#### 4.1 Sentry Configuration

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.user) {
      delete event.user.email;
    }
    return event;
  },
});
```

#### 4.2 New Relic Configuration

```typescript
// newrelic.config.ts
export const config = {
  app_name: ['MealPrep360'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: {
    enabled: true,
  },
  logging: {
    level: 'info',
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
    ],
  },
};
```

## 🔧 Deployment Scripts

### Master Deployment Script

```bash
#!/bin/bash
# deploy-all-prod.sh - Deploy all services to production

set -e

echo "🚀 Deploying MealPrep360 to Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to deploy service
deploy_service() {
    local service_name=$1
    local service_path=$2
    local deploy_command=$3
    
    echo -e "${YELLOW}Deploying $service_name...${NC}"
    cd "$service_path"
    
    if eval "$deploy_command"; then
        echo -e "${GREEN}✅ $service_name deployed successfully${NC}"
    else
        echo -e "${RED}❌ $service_name deployment failed${NC}"
        exit 1
    fi
    
    cd - > /dev/null
}

# Pre-deployment checks
echo "Running pre-deployment checks..."

# Check if all environment variables are set
if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}❌ MONGODB_URI not set${NC}"
    exit 1
fi

if [ -z "$CLERK_SECRET_KEY" ]; then
    echo -e "${RED}❌ CLERK_SECRET_KEY not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

# Deploy all services
echo "Starting production deployment..."

# Frontend
deploy_service "Frontend" "MealPrep360" "vercel --prod"

# API Gateway
deploy_service "API Gateway" "MealPrep360-API" "vercel --prod"

# Admin Panel
deploy_service "Admin Panel" "MealPrep360-Admin" "vercel --prod"

# Microservices
deploy_service "Recipe Service" "MealPrep360-RecipeService" "railway up --environment production"
deploy_service "Meal Plan Service" "MealPrep360-MealPlanService" "railway up --environment production"
deploy_service "Shopping Service" "MealPrep360-ShoppingListService" "railway up --environment production"
deploy_service "Social Service" "MealPrep360-SocialMediaService" "railway up --environment production"
deploy_service "Blog Service" "MealPrep360-BlogService" "railway up --environment production"
deploy_service "WebSocket Server" "MealPrep360-WebsocketServer" "railway up --environment production"

# Mobile App
deploy_service "Mobile App" "MealPrep360Mobile" "eas build --platform all --profile production"

echo -e "${GREEN}🎉 All services deployed successfully to production!${NC}"

# Post-deployment health checks
echo "Running post-deployment health checks..."

# Check API Gateway
if curl -f https://api.mealprep360.com/api/health; then
    echo -e "${GREEN}✅ API Gateway health check passed${NC}"
else
    echo -e "${RED}❌ API Gateway health check failed${NC}"
fi

# Check Frontend
if curl -f https://mealprep360.com; then
    echo -e "${GREEN}✅ Frontend health check passed${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
```

### Health Check Script

```bash
#!/bin/bash
# health-check-prod.sh - Check health of all production services

set -e

echo "🔍 Checking production service health..."

# Service URLs
SERVICES=(
    "https://mealprep360.com"
    "https://api.mealprep360.com/api/health"
    "https://admin.mealprep360.com"
    "https://recipe.mealprep360.com/health"
    "https://mealplan.mealprep360.com/health"
    "https://shopping.mealprep360.com/health"
    "https://social.mealprep360.com/health"
    "https://blog.mealprep360.com/health"
    "https://ws.mealprep360.com/health"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check each service
for service in "${SERVICES[@]}"; do
    echo -n "Checking $service... "
    
    if curl -f -s "$service" > /dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
done

echo "Health check completed!"
```

## 📊 Post-Deployment Monitoring

### 1. Performance Monitoring

```typescript
// performance-monitor.ts
export class PerformanceMonitor {
  static trackPageLoad(page: string, loadTime: number) {
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_load_time', {
        page_name: page,
        load_time: loadTime,
      });
    }
  }
  
  static trackAPIResponse(endpoint: string, responseTime: number) {
    // Send to monitoring service
    console.log(`API ${endpoint} responded in ${responseTime}ms`);
  }
}
```

### 2. Error Monitoring

```typescript
// error-monitor.ts
import * as Sentry from '@sentry/nextjs';

export class ErrorMonitor {
  static captureError(error: Error, context?: any) {
    Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
      },
      extra: context,
    });
  }
  
  static captureMessage(message: string, level: 'info' | 'warning' | 'error') {
    Sentry.captureMessage(message, level);
  }
}
```

### 3. Uptime Monitoring

```bash
# UptimeRobot API monitoring
# Set up monitors for:
# - https://mealprep360.com
# - https://api.mealprep360.com/api/health
# - https://admin.mealprep360.com
# - All microservice health endpoints
```

## 🔄 Rollback Procedures

### Emergency Rollback Script

```bash
#!/bin/bash
# rollback-prod.sh - Emergency rollback script

set -e

echo "🚨 Emergency rollback initiated..."

# Rollback Vercel deployments
vercel rollback --prod

# Rollback Railway deployments
railway rollback --environment production

echo "✅ Rollback completed!"
```

## 📈 Scaling Procedures

### Auto-scaling Configuration

```yaml
# railway.toml - Auto-scaling configuration
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[scaling]
minInstances = 1
maxInstances = 10
targetCPU = 70
targetMemory = 80
```

This comprehensive deployment guide ensures MealPrep360 is properly deployed to production with monitoring, security, and scalability in place.

