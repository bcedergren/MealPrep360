# Recipe Generation System - 100% Working Guide

## Overview

The MealPrep360 Recipe Service has a comprehensive recipe generation system that ensures recipes are generated reliably. This guide will help you verify and maintain the system.

## System Components

### 1. API Endpoints

- `POST /api/generate` - Start recipe generation for a season
- `GET /api/jobs/:jobId` - Check job status
- `GET /api/recipes/health` - Check recipe generation health
- `POST /api/recipes/force-generate` - Force recipe generation
- `GET /api/recipes/jobs/:jobId/detailed` - Get detailed job status

### 2. Workers

- **Recipe Generation Worker** - Processes recipe generation jobs
- **Image Generation Worker** - Processes image generation jobs
- **Combined Worker** - Runs both workers simultaneously

### 3. Queue System

- **Redis Queue** - Manages job processing
- **Job Database** - Stores job status and progress
- **Recipe Database** - Stores generated recipes

## Starting the System

### Option 1: Start Individual Workers

```bash
# Start recipe generation worker only
npm run recipe-worker

# Start image generation worker only
npm run worker

# Start both workers (recommended)
npm run worker:all
```

### Option 2: Production Workers

```bash
# Build the project first
npm run build

# Start production workers
npm run recipe-worker:prod
npm run worker:prod
npm run worker:all:prod
```

## Verifying Recipe Generation is Working

### 1. Check System Health

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/recipes/health
```

Expected response:

```json
{
	"status": "success",
	"health": {
		"status": "healthy",
		"metrics": {
			"totalRecipes": 150,
			"recentRecipes": 30,
			"failedJobs": 0,
			"pendingJobs": 0,
			"processingJobs": 0,
			"completedJobs": 5,
			"queueSize": 0,
			"successRate": 100
		},
		"issues": []
	}
}
```

### 2. Start Recipe Generation

```bash
curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_API_KEY" \
  -d '{"season": "winter"}' \
  http://localhost:3000/api/generate
```

Expected response:

```json
{
	"status": "accepted",
	"message": "Recipe generation started",
	"job": {
		"id": "job-uuid",
		"status": "pending",
		"progress": 0,
		"total": 30,
		"season": "winter",
		"createdAt": "2024-01-01T00:00:00.000Z"
	}
}
```

### 3. Monitor Job Progress

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  http://localhost:3000/api/jobs/JOB_ID_HERE
```

### 4. Check Detailed Status

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  http://localhost:3000/api/recipes/jobs/JOB_ID_HERE/detailed
```

## Troubleshooting

### Issue 1: No Recipes Being Generated

**Symptoms:**

- Jobs stuck in "pending" status
- Queue size increasing
- No recent recipes in database

**Solutions:**

1. Check if recipe generation worker is running:

   ```bash
   ps aux | grep recipe-worker
   ```

2. Start the recipe generation worker:

   ```bash
   npm run recipe-worker
   ```

3. Check Redis connection:

   ```bash
   redis-cli ping
   ```

4. Check MongoDB connection:
   ```bash
   # Verify environment variables are set
   echo $MONGODB_URI
   ```

### Issue 2: Jobs Failing

**Symptoms:**

- Jobs in "failed" status
- High failure rate in health check

**Solutions:**

1. Check job error details:

   ```bash
   curl -H "x-api-key: YOUR_API_KEY" \
     http://localhost:3000/api/recipes/jobs/JOB_ID_HERE/detailed
   ```

2. Verify OpenAI API key:

   ```bash
   echo $OPENAI_API_KEY
   ```

3. Check Spoonacular API key (if using):

   ```bash
   echo $SPOONACULAR_API_KEY
   ```

4. Retry failed jobs:
   ```bash
   curl -X POST -H "x-api-key: YOUR_API_KEY" \
     http://localhost:3000/api/jobs/JOB_ID_HERE/retry
   ```

### Issue 3: Slow Generation

**Symptoms:**

- Long generation times
- Jobs stuck in "processing"

**Solutions:**

1. Check worker logs for rate limiting
2. Verify OpenAI API quotas
3. Check system resources (CPU, memory)
4. Consider running multiple workers

### Issue 4: Queue Backlog

**Symptoms:**

- Large queue size in health check
- Jobs waiting for processing

**Solutions:**

1. Start additional workers:

   ```bash
   # Run multiple instances
   npm run worker:all &
   npm run worker:all &
   ```

2. Check worker performance
3. Monitor system resources

## Monitoring and Maintenance

### Daily Checks

1. **Health Check:**

   ```bash
   curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/recipes/health
   ```

2. **Recipe Count:**

   ```bash
   curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/recipes
   ```

3. **Job Status:**
   ```bash
   curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/jobs
   ```

### Weekly Maintenance

1. **Clean up old jobs:**

   - Remove completed jobs older than 30 days
   - Archive failed jobs for analysis

2. **Monitor API usage:**

   - Check OpenAI API quotas
   - Monitor Spoonacular API usage

3. **System optimization:**
   - Review worker performance
   - Optimize database queries
   - Update dependencies

## Environment Variables

Ensure these environment variables are set:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/mealprep360
OPENAI_API_KEY=your_openai_api_key
API_KEY=your_api_key

# Redis (for queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=your_redis_password

# Optional
SPOONACULAR_API_KEY=your_spoonacular_key
NODE_ENV=production
LOG_LEVEL=info
```

## Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Start Services

```bash
# Start API server
npm start

# Start workers (in separate processes)
npm run worker:all:prod
```

### 3. Use Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start services with PM2
pm2 start dist/index.js --name "recipe-api"
pm2 start dist/workers/startAll.js --name "recipe-workers"

# Monitor
pm2 status
pm2 logs
```

## Health Check Automation

Create a monitoring script:

```bash
#!/bin/bash
# monitor-recipe-generation.sh

HEALTH_URL="http://localhost:3000/api/recipes/health"
API_KEY="your_api_key"

response=$(curl -s -H "x-api-key: $API_KEY" $HEALTH_URL)
status=$(echo $response | jq -r '.health.status')

if [ "$status" != "healthy" ]; then
    echo "Recipe generation health check failed: $status"
    echo "Response: $response"
    # Send alert or restart workers
    exit 1
fi

echo "Recipe generation is healthy"
```

## Success Criteria

Recipe generation is considered 100% working when:

1. ✅ Health check returns "healthy" status
2. ✅ Jobs complete successfully within expected time
3. ✅ Success rate > 95%
4. ✅ Queue size < 5 jobs
5. ✅ Recent recipe generation activity
6. ✅ No failed jobs in the last 24 hours
7. ✅ Workers are running and responsive
8. ✅ Database connections are stable
9. ✅ API endpoints respond correctly
10. ✅ Generated recipes meet quality standards

## Emergency Procedures

### If System is Down

1. **Check all services:**

   ```bash
   pm2 status
   systemctl status redis
   systemctl status mongod
   ```

2. **Restart workers:**

   ```bash
   pm2 restart recipe-workers
   ```

3. **Force recipe generation:**

   ```bash
   curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_API_KEY" \
     -d '{"season": "current"}' \
     http://localhost:3000/api/recipes/force-generate
   ```

4. **Check logs:**
   ```bash
   pm2 logs recipe-workers
   tail -f /var/log/recipe-service.log
   ```

### If Database is Corrupted

1. **Backup current data**
2. **Restore from backup**
3. **Reindex database**
4. **Verify data integrity**

## Support

If you encounter issues not covered in this guide:

1. Check the application logs
2. Review the health check endpoint
3. Verify all environment variables
4. Test individual components
5. Contact the development team

---

**Last Updated:** January 2024
**Version:** 1.0.0
