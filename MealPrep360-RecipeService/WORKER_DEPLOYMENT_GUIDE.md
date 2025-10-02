# MealPrep360 Recipe Service - Worker Deployment Guide

## 🔍 Problem Summary

The recipe service has two components:

1. **API Endpoints** - Deployed on Vercel (✅ Working)
2. **Background Workers** - Need to be deployed separately (❌ Not Running)

Jobs are being created successfully but remain in "pending" status because the background workers that process them are not running.

## 📋 Background Workers

The service has two workers that need to run continuously:

1. **RecipeGenerationWorker** - Processes recipe generation jobs
2. **ImageGenerationWorker** - Processes image generation jobs

## 🚀 Deployment Options

### Option 1: Railway (Recommended for Quick Setup)

1. **Create a Railway account** at https://railway.app

2. **Deploy the workers:**

   ```bash
   # Clone the repository
   git clone <your-repo-url>
   cd MealPrep360-RecipeService

   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Create new project
   railway init
   ```

3. **Configure environment variables in Railway dashboard:**

   - Copy all variables from your `.env` file
   - Ensure these are set:
     - `MONGODB_URI`
     - `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD`
     - `OPENAI_API_KEY`
     - `NODE_ENV=production`

4. **Create a Procfile in the root directory:**

   ```procfile
   worker: npm run build && npm run worker:all:prod
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

### Option 2: Render

1. **Create account** at https://render.com

2. **Create a new Background Worker service**

3. **Connect your GitHub repository**

4. **Configure:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run worker:all:prod`
   - Add all environment variables

### Option 3: VPS with PM2

1. **Set up a VPS** (DigitalOcean, Linode, AWS EC2, etc.)

2. **Install Node.js and PM2:**

   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   npm install -g pm2
   ```

3. **Clone and setup the project:**

   ```bash
   git clone <your-repo-url>
   cd MealPrep360-RecipeService
   npm install
   npm run build
   ```

4. **Create PM2 ecosystem file** (`ecosystem.config.js`):

   ```javascript
   module.exports = {
   	apps: [
   		{
   			name: 'recipe-workers',
   			script: 'dist/workers/startAll.js',
   			instances: 1,
   			autorestart: true,
   			watch: false,
   			max_memory_restart: '1G',
   			env: {
   				NODE_ENV: 'production',
   				// Add all your environment variables here
   			},
   		},
   	],
   };
   ```

5. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option 4: Docker Container

1. **Create a Dockerfile:**

   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   CMD ["npm", "run", "worker:all:prod"]
   ```

2. **Deploy to any container service** (Google Cloud Run, AWS ECS, etc.)

## 🔧 Configuration Requirements

### Environment Variables Required:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Redis
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_USER=your_redis_username
REDIS_PASSWORD=your_redis_password

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Service Configuration
NODE_ENV=production
API_KEY=your_api_key
```

### Worker Commands:

- `npm run worker:all:prod` - Run both workers (recommended)
- `npm run recipe-worker:prod` - Run only recipe generation worker
- `npm run worker:prod` - Run only image generation worker

## 📊 Monitoring

After deployment, verify workers are running:

1. **Run the diagnostic script:**

   ```bash
   node check-production-status.js
   ```

2. **Check specific queues:**

   ```bash
   node check-redis-queue.js
   node check-jobs.js
   ```

3. **Monitor logs** from your deployment platform

## 🚨 Troubleshooting

### Workers not processing jobs:

1. Check Redis connection
2. Verify environment variables
3. Check worker logs for errors
4. Ensure MongoDB is accessible

### High memory usage:

- Workers process in batches to manage memory
- Consider running workers on separate instances
- Monitor with PM2 or deployment platform metrics

### Jobs failing:

1. Check OpenAI API key and limits
2. Verify MongoDB write permissions
3. Check worker error logs

## 🔄 Scaling

If you need to handle more load:

1. Run multiple worker instances (not recommended for recipe generation to avoid duplicates)
2. Increase batch sizes in worker configuration
3. Use separate workers for recipe and image generation

## 📝 Notes

- Workers must run continuously (not as serverless functions)
- They poll Redis queue every 5 seconds
- Failed jobs are retried up to 3 times
- Workers handle graceful shutdown on SIGTERM/SIGINT
