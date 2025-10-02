# Service Communication Setup Guide

## Overview
This guide ensures that all services in the MealPrep360 ecosystem can communicate correctly with each other and their APIs without errors.

## Current Status
✅ **Service Discovery**: All services are properly registered  
✅ **Authentication**: API key generation and validation working  
✅ **Monitoring**: Health checks and distributed tracing operational  
❌ **Environment Configuration**: Missing API keys and environment variables  
❌ **Service Connectivity**: Services not running or not accessible  

## Issues Identified

### 1. Missing Environment Variables
All services are missing their API keys in the environment configuration.

### 2. Service URLs Not Configured
Service URLs are using default localhost addresses, but services may not be running.

### 3. Service Health Checks Failing
Services are not responding to health checks due to connection refused errors.

## Solution

### Step 1: Environment Configuration

Create a `.env` file in the `MealPrep360-API` directory with the following content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mealprep360
MONGODB_DB=mealprep360

# API Configuration
NODE_ENV=development
PORT=3001
API_KEY=your-api-key-here

# External API Configuration
USE_EXTERNAL_API_ONLY=false

# Service URLs (Development)
RECIPE_SERVICE_URL=http://localhost:3002
MEALPLAN_SERVICE_URL=http://localhost:3003
SHOPPING_SERVICE_URL=https://shopping.mealprep360.com
SOCIAL_SERVICE_URL=http://localhost:3005
BLOG_SERVICE_URL=http://localhost:3006
WEBSOCKET_SERVICE_URL=http://localhost:3007

# Service API Keys (Generated)
RECIPE_SERVICE_API_KEY=90d28755b1af82d70b40900b606e696b9be4cafc2e563e31d9ddf4952f578d66
MEALPLAN_SERVICE_API_KEY=54ab078e926b958d1c6a1b4631dd2252613d6476e6fc7cb06a1234be2bd2c7b6
SHOPPING_SERVICE_API_KEY=9109c1d5ffccc9332d94458cab403e7cb850f7a07a07ebdc2b04f15e302bf37f
SOCIAL_SERVICE_API_KEY=75f27583d69c37175ad510d3b1b4d77a5493ec3a8bc99812702c395a0f810920
BLOG_SERVICE_API_KEY=d52ef0ac4acd3509e0d97361f5ba90645b4125895bbe0e90ec35dad496539a2f
WEBSOCKET_SERVICE_API_KEY=f85b4aaf91b8d77a8bdf2c71dfe51f2ba3ecbdc6edee6bd2a96477207b2be9b7

# Service Enablement Flags
RECIPE_SERVICE_ENABLED=true
MEALPLAN_SERVICE_ENABLED=true
SHOPPING_SERVICE_ENABLED=true
SOCIAL_SERVICE_ENABLED=true
BLOG_SERVICE_ENABLED=true
WEBSOCKET_SERVICE_ENABLED=true

# Authentication
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
DEBUG_MODE=false
```

### Step 2: Service Startup Order

Start services in the following order to ensure proper communication:

1. **Database Services** (MongoDB, Redis if used)
2. **Core Services**:
   - Recipe Service (Port 3002)
   - Meal Plan Service (Port 3003)
   - Shopping List Service (External)
3. **Support Services**:
   - Social Media Service (Port 3005)
   - Blog Service (Port 3006)
   - WebSocket Service (Port 3007)
4. **API Gateway** (Port 3001)

### Step 3: Service Health Verification

Run the comprehensive test to verify all services are communicating:

```bash
cd MealPrep360-API
npm run test-services-comprehensive
```

### Step 4: Individual Service Testing

Test each service individually:

```bash
# Test Recipe Service
curl -H "X-API-Key: 90d28755b1af82d70b40900b606e696b9be4cafc2e563e31d9ddf4952f578d66" \
     http://localhost:3002/health

# Test Meal Plan Service
curl -H "X-API-Key: 54ab078e926b958d1c6a1b4631dd2252613d6476e6fc7cb06a1234be2bd2c7b6" \
     http://localhost:3003/health

# Test Shopping Service
curl -H "X-API-Key: 9109c1d5ffccc9332d94458cab403e7cb850f7a07a07ebdc2b04f15e302bf37f" \
     https://shopping.mealprep360.com/health
```

## Service Communication Patterns

### 1. API Gateway Pattern
- All external requests go through the API Gateway (Port 3001)
- Internal service-to-service communication uses direct HTTP calls
- Authentication handled via API keys

### 2. Service Discovery
- Services register themselves with the discovery service
- Health checks performed every 30 seconds
- Circuit breaker pattern for failed services

### 3. Authentication Flow
```
Client Request → API Gateway → Service Discovery → Target Service
                ↓
            API Key Validation
                ↓
            Rate Limiting Check
                ↓
            Service Call
```

### 4. Error Handling
- Retry logic with exponential backoff
- Circuit breaker for failing services
- Fallback responses for critical services
- Comprehensive logging and monitoring

## Monitoring and Observability

### Health Check Endpoints
- `/api/health` - Overall system health
- `/api/admin/services/health` - Individual service health
- Service-specific health endpoints

### Metrics Collected
- Request count per service
- Response times (avg, p95, p99)
- Error rates
- Circuit breaker states
- Service availability

### Logging
- Structured logging with trace IDs
- Service communication logs
- Error tracking and alerting

## Troubleshooting

### Common Issues

1. **Connection Refused Errors**
   - Ensure services are running on correct ports
   - Check firewall settings
   - Verify service URLs in configuration

2. **Authentication Failures**
   - Verify API keys match between services
   - Check environment variable loading
   - Ensure API key format is correct

3. **Service Discovery Issues**
   - Restart the API Gateway after service changes
   - Check service registration logs
   - Verify service URLs are accessible

4. **Health Check Failures**
   - Check if services are responding to health endpoints
   - Verify network connectivity
   - Check service logs for errors

### Debug Commands

```bash
# Check service status
npm run test-services-comprehensive

# Setup services with generated keys
npm run setup-services

# Test individual service communication
npm run test-services
```

## Next Steps

1. **Create the .env file** with the provided configuration
2. **Start all services** in the recommended order
3. **Run health checks** to verify connectivity
4. **Monitor service communication** using the provided tools
5. **Set up production environment** with proper URLs and security

## Production Considerations

- Use HTTPS for all service communication
- Implement proper secret management
- Set up load balancing for high availability
- Configure proper monitoring and alerting
- Implement backup and disaster recovery procedures

---

**Note**: This setup ensures that all services can communicate correctly with each other and their APIs without errors. The generated API keys are secure and should be kept confidential.
