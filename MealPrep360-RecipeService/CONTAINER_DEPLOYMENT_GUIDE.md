# MealPrep360 Recipe Service - Container Deployment Guide

## 🚀 Why Containers?

Moving from Vercel + separate worker hosting to containers provides:

- **Unified Deployment**: Single container for API + workers
- **Better Resource Management**: Guaranteed CPU/memory for background workers
- **Easier Scaling**: Scale components independently
- **Cost Efficiency**: Potentially 50-70% cost reduction
- **Simplified Operations**: One deployment pipeline

## 📦 Container Options

### Option 1: Google Cloud Run (Recommended)

**Best for**: Production workloads, auto-scaling, pay-per-use

```bash
# 1. Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/mealprep360-recipe-service

# 2. Deploy to Cloud Run
gcloud run deploy mealprep360-recipe-service \
  --image gcr.io/YOUR_PROJECT_ID/mealprep360-recipe-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production
```

**Estimated Cost**: $15-40/month

### Option 2: AWS ECS with Fargate

**Best for**: Enterprise workloads, AWS ecosystem integration

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name mealprep360-recipe-service

# 2. Build and push
docker build -t mealprep360-recipe-service .
docker tag mealprep360-recipe-service:latest $ECR_URI:latest
docker push $ECR_URI:latest

# 3. Deploy with ECS (use AWS Console or Terraform)
```

**Estimated Cost**: $20-60/month

### Option 3: Railway (Easiest Setup)

**Best for**: Quick deployment, developer-friendly

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up
```

**Estimated Cost**: $5-25/month

### Option 4: DigitalOcean App Platform

**Best for**: Simple, predictable pricing

1. Connect GitHub repository
2. Select Docker deployment
3. Configure environment variables
4. Deploy

**Estimated Cost**: $12-48/month

## 🛠️ Local Development

### Quick Start with Docker Compose

```bash
# 1. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 2. Start services
docker-compose up --build

# 3. Test the API
curl http://localhost:3000/api/health
```

### Development with Local Dependencies

```bash
# Start local Redis and MongoDB
docker-compose --profile local up -d redis-local mongodb-local

# Run application locally
npm run dev
```

## 🔧 Configuration

### Required Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://your-mongodb-connection

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_USER=your-redis-username
REDIS_PASSWORD=your-redis-password

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_GPT_ID=your-custom-gpt-id

# Service Configuration
NODE_ENV=production
API_KEY=your-api-key
PORT=3000

# Rate Limiting (optimized values)
RATE_LIMIT_DELAY_MS=8000
MAX_RECIPE_FAILURES=15
```

### Container-Specific Settings

```env
# For better container performance
NODE_OPTIONS=--max-old-space-size=2048

# Health check endpoint
HEALTH_CHECK_PATH=/api/health

# Worker configuration
IS_WORKER=false  # Set to true for worker-only containers
```

## 🏗️ Architecture Options

### Option A: Single Container (Recommended)

```
┌─────────────────────┐
│   Single Container  │
│  ┌─────────────────┐│
│  │   Express API   ││
│  └─────────────────┘│
│  ┌─────────────────┐│
│  │ Background      ││
│  │ Workers         ││
│  └─────────────────┘│
└─────────────────────┘
```

**Pros**: Simple deployment, shared resources
**Cons**: Less granular scaling

### Option B: Separate Containers

```
┌─────────────────┐    ┌─────────────────┐
│   API Container │    │ Worker Container│
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Express API  │ │    │ │Background   │ │
│ └─────────────┘ │    │ │Workers      │ │
└─────────────────┘    │ └─────────────┘ │
                       └─────────────────┘
```

**Pros**: Independent scaling, better resource allocation
**Cons**: More complex deployment

## 📊 Performance Optimization

### Container Resources

```yaml
# Recommended resource allocation
resources:
  requests:
    memory: '1Gi'
    cpu: '500m'
  limits:
    memory: '2Gi'
    cpu: '1000m'
```

### Health Checks

The container includes built-in health checks:

- **Endpoint**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3

### Scaling Configuration

```yaml
# Auto-scaling based on CPU/Memory
autoscaling:
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

## 🔍 Monitoring

### Built-in Metrics

The container exposes metrics at `/api/health`:

- Database connection status
- Redis queue lengths
- Worker status
- Memory usage
- Request rates

### Logging

Structured JSON logs for container environments:

```javascript
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Recipe generation completed",
  "traceId": "abc-123",
  "duration": 1500,
  "recipesGenerated": 5
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Container fails to start**

   ```bash
   # Check logs
   docker logs container-name

   # Verify environment variables
   docker exec -it container-name env
   ```

2. **Workers not processing jobs**

   ```bash
   # Check Redis connection
   docker exec -it container-name node -e "
   const Redis = require('ioredis');
   const redis = new Redis(process.env.REDIS_URL);
   redis.ping().then(console.log).catch(console.error);
   "
   ```

3. **High memory usage**
   - Increase container memory limits
   - Check for memory leaks in logs
   - Consider separating API and workers

### Debug Commands

```bash
# Enter container shell
docker exec -it container-name sh

# Check worker processes
docker exec -it container-name ps aux

# Test API endpoints
docker exec -it container-name curl localhost:3000/api/health
```

## 📈 Migration from Current Setup

### Step 1: Test Locally

```bash
# Build and test container
docker build -t mealprep360-local .
docker run -p 3000:3000 --env-file .env.local mealprep360-local

# Test functionality
curl http://localhost:3000/api/health
```

### Step 2: Deploy to Staging

1. Choose container platform
2. Set up CI/CD pipeline
3. Deploy with staging environment variables
4. Run integration tests

### Step 3: Production Migration

1. Deploy container service
2. Update DNS to point to new service
3. Monitor performance and logs
4. Gradually shift traffic
5. Decommission Vercel deployment

## 💰 Cost Comparison

| Service            | Current (Vercel + Workers) | Container Service |
| ------------------ | -------------------------- | ----------------- |
| Vercel Pro         | $20/month                  | $0                |
| Worker Hosting     | $15-30/month               | $0                |
| Container Platform | $0                         | $15-40/month      |
| **Total**          | **$35-50/month**           | **$15-40/month**  |

**Potential Savings**: 30-50% cost reduction

## ✅ Next Steps

1. **Test locally** with Docker Compose
2. **Choose container platform** based on your needs
3. **Set up CI/CD pipeline** for automated deployments
4. **Monitor and optimize** performance after migration

The containerized setup will provide better reliability, easier scaling, and lower costs compared to your current split architecture.
