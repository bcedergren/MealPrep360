# Production Environment Configuration

## Overview
This document provides comprehensive production environment configurations for all MealPrep360 services.

## 🔧 API Gateway (MealPrep360-API)

### Production Environment Variables (.env.production)

```env
# Production Environment Configuration for MealPrep360-API
# ========================================================

# Environment
NODE_ENV=production
PORT=3001

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mealprep360_prod
MONGODB_DB=mealprep360_prod

# Redis Configuration
REDIS_URL=redis://username:password@redis-cluster.com:6379

# Clerk Authentication (Production Keys)
CLERK_SECRET_KEY=sk_live_your_production_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_publishable_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# External API Keys (Production)
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key_here
SPOONACULAR_API_KEY=your_spoonacular_api_key_here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Service URLs (Production)
RECIPE_SERVICE_URL=https://recipe.mealprep360.com
MEALPLAN_SERVICE_URL=https://mealplan.mealprep360.com
SHOPPING_SERVICE_URL=https://shopping.mealprep360.com
SOCIAL_SERVICE_URL=https://social.mealprep360.com
BLOG_SERVICE_URL=https://blog.mealprep360.com
WEBSOCKET_SERVICE_URL=https://ws.mealprep360.com

# Service API Keys (Generated for Production)
RECIPE_SERVICE_API_KEY=prod_recipe_api_key_here
MEALPLAN_SERVICE_API_KEY=prod_mealplan_api_key_here
SHOPPING_SERVICE_API_KEY=prod_shopping_api_key_here
SOCIAL_SERVICE_API_KEY=prod_social_api_key_here
BLOG_SERVICE_API_KEY=prod_blog_api_key_here
WEBSOCKET_SERVICE_API_KEY=prod_websocket_api_key_here

# Service Enablement
RECIPE_SERVICE_ENABLED=true
MEALPLAN_SERVICE_ENABLED=true
SHOPPING_SERVICE_ENABLED=true
SOCIAL_SERVICE_ENABLED=true
BLOG_SERVICE_ENABLED=true
WEBSOCKET_SERVICE_ENABLED=true

# External API Mode
USE_EXTERNAL_API_ONLY=false

# Security
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT=1000
CORS_ORIGIN=https://mealprep360.com,https://admin.mealprep360.com

# Monitoring & Logging
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here
NEW_RELIC_LICENSE_KEY=your_newrelic_key_here

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key_here
FROM_EMAIL=noreply@mealprep360.com

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=mealprep360-prod

# Performance
CACHE_TTL=3600
MAX_REQUEST_SIZE=10mb
```

## 🌐 Frontend (MealPrep360)

### Production Environment Variables (.env.production)

```env
# Production Environment Configuration for MealPrep360 Frontend
# =============================================================

# Environment
NODE_ENV=production
NEXT_PUBLIC_NODE_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=https://api.mealprep360.com
NEXT_PUBLIC_WS_URL=wss://ws.mealprep360.com

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_publishable_key_here
CLERK_SECRET_KEY=sk_live_your_production_secret_key_here

# External Services
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_ENABLE_DEBUG=false

# CDN Configuration
NEXT_PUBLIC_CDN_URL=https://cdn.mealprep360.com
NEXT_PUBLIC_IMAGE_CDN_URL=https://images.mealprep360.com
```

## 👨‍💼 Admin Panel (MealPrep360-Admin)

### Production Environment Variables (.env.production)

```env
# Production Environment Configuration for MealPrep360-Admin
# ==========================================================

# Environment
NODE_ENV=production
NEXT_PUBLIC_NODE_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=https://api.mealprep360.com

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_publishable_key_here
CLERK_SECRET_KEY=sk_live_your_production_secret_key_here

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAIL=admin@mealprep360.com
NEXT_PUBLIC_SUPPORT_EMAIL=support@mealprep360.com

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## 📱 Mobile App (MealPrep360Mobile)

### Production Environment Variables (.env.production)

```env
# Production Environment Configuration for MealPrep360Mobile
# ==========================================================

# Environment
NODE_ENV=production
EXPO_PUBLIC_NODE_ENV=production

# API Configuration
EXPO_PUBLIC_API_URL=https://api.mealprep360.com
EXPO_PUBLIC_WS_URL=wss://ws.mealprep360.com

# Clerk Authentication (Production Keys)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_publishable_key_here

# External Services
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
EXPO_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# App Configuration
EXPO_PUBLIC_APP_NAME=MealPrep360
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_APP_BUILD=1

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ERROR_REPORTING=true
EXPO_PUBLIC_ENABLE_DEBUG=false
```

## 🔧 Microservices

### Recipe Service (.env.production)

```env
NODE_ENV=production
PORT=3002
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mealprep360_prod
API_KEY=prod_recipe_api_key_here
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key_here
SPOONACULAR_API_KEY=your_spoonacular_api_key_here
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here
```

### Meal Plan Service (.env.production)

```env
NODE_ENV=production
PORT=3003
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mealprep360_prod
API_KEY=prod_mealplan_api_key_here
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key_here
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here
```

### Shopping List Service (.env.production)

```env
NODE_ENV=production
PORT=3004
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mealprep360_prod
API_KEY=prod_shopping_api_key_here
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here
```

### Social Media Service (.env.production)

```env
NODE_ENV=production
PORT=3005
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mealprep360_prod
API_KEY=prod_social_api_key_here
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here
```

### Blog Service (.env.production)

```env
NODE_ENV=production
PORT=3006
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mealprep360_prod
API_KEY=prod_blog_api_key_here
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key_here
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here
```

### WebSocket Server (.env.production)

```env
NODE_ENV=production
PORT=3007
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mealprep360_prod
API_KEY=prod_websocket_api_key_here
REDIS_URL=redis://username:password@redis-cluster.com:6379
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here
```

## 🔐 Security Checklist

### Required Security Measures

- [ ] **HTTPS Everywhere**: All services use HTTPS in production
- [ ] **API Keys**: All API keys are properly secured and rotated
- [ ] **Database Security**: MongoDB Atlas with proper access controls
- [ ] **CORS Configuration**: Properly configured for production domains
- [ ] **Rate Limiting**: Implemented on all API endpoints
- [ ] **Input Validation**: All inputs are validated and sanitized
- [ ] **Error Handling**: No sensitive data exposed in error messages
- [ ] **Logging**: Comprehensive logging without sensitive data
- [ ] **Monitoring**: Real-time monitoring and alerting
- [ ] **Backup Strategy**: Automated backups with recovery testing

## 📊 Monitoring & Observability

### Required Monitoring Tools

- [ ] **Application Performance**: New Relic or DataDog
- [ ] **Error Tracking**: Sentry
- [ ] **Logging**: Centralized logging with ELK stack
- [ ] **Uptime Monitoring**: Pingdom or UptimeRobot
- [ ] **Database Monitoring**: MongoDB Atlas monitoring
- [ ] **Infrastructure Monitoring**: Cloud provider monitoring

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] DNS records configured
- [ ] CDN configured
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented

### Post-Deployment

- [ ] Health checks passing
- [ ] All services responding
- [ ] SSL certificates valid
- [ ] Performance metrics normal
- [ ] Error rates within acceptable limits
- [ ] User authentication working
- [ ] Payment processing working
- [ ] Email notifications working

## 📞 Support & Maintenance

### Production Support

- **24/7 Monitoring**: Automated alerting for critical issues
- **Incident Response**: Defined escalation procedures
- **Performance Optimization**: Regular performance reviews
- **Security Updates**: Regular security patches and updates
- **Backup Verification**: Regular backup restoration testing

