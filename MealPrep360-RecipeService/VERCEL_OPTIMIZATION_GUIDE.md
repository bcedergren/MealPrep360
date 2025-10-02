# Vercel + MongoDB + Redis Optimization Guide

# MealPrep360 Recipe Service - Current Stack Enhancement

## 🎯 **Strategy Overview**

Instead of moving away from Vercel, we'll implement a **hybrid architecture** that maximizes your current investments while solving the background worker problem.

### **Current Architecture (What You Have)**

```
Frontend → Vercel API → MongoDB + Redis
                ↓
        Background Jobs (STUCK)
```

### **Optimized Architecture (What We'll Build)**

```
Frontend → Vercel API → MongoDB + Redis
                ↓            ↓
        Vercel Cron    +    External Worker
        (Lightweight)       (Heavy Processing)
```

## 🚀 **Solution 1: Vercel Cron + Serverless Functions**

### **Benefits**

- ✅ **No infrastructure changes needed**
- ✅ **Uses existing Vercel/MongoDB/Redis**
- ✅ **Free cron jobs (up to 100/month)**
- ✅ **Automatic scaling**
- ✅ **Simple deployment**

### **Limitations**

- ⚠️ **10-second function limit**
- ⚠️ **Limited to 3-5 recipes per run**
- ⚠️ **30-second minimum cron interval**

## 🔄 **Solution 2: Vercel + External Worker (Recommended)**

### **Architecture**

```
Vercel API (Job Creation) → Redis Queue
                              ↓
External Worker (Railway/Render) → MongoDB
```

### **Implementation**

#### **1. Keep Vercel for API**

Your existing Vercel setup stays exactly the same for:

- Job creation endpoints
- Health checks
- Status endpoints
- Frontend serving

#### **2. Deploy Worker to Railway**

```typescript
// worker-service/index.ts
import express from 'express';
import { recipeGenerationWorker } from './workers/recipeWorker';
import { queueService } from './services/queueService';

const app = express();
const PORT = process.env.PORT || 3001;

// Health check for Railway
app.get('/health', (req, res) => {
	res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Manual trigger endpoint
app.post('/process', async (req, res) => {
	try {
		const result = await recipeGenerationWorker.processNextJob();
		res.json(result);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Start the worker
async function startWorker() {
	console.log('🚀 Starting MealPrep360 Recipe Worker...');

	// Continuous processing loop
	while (true) {
		try {
			await recipeGenerationWorker.processNextJob();
			await new Promise((resolve) => setTimeout(resolve, 5000)); // 5-second intervals
		} catch (error) {
			console.error('Worker error:', error);
			await new Promise((resolve) => setTimeout(resolve, 10000)); // 10-second backoff
		}
	}
}

app.listen(PORT, () => {
	console.log(`Worker service running on port ${PORT}`);
	startWorker(); // Start background processing
});
```

#### **3. Railway Deployment**

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"

[env]
NODE_ENV = "production"
```

### **Cost Analysis**

```
Current Vercel Cost: $20/month (Pro plan)
+ Railway Worker: $5/month (Starter)
= Total: $25/month (vs $50+ for full container service)
```

### **Why This is Perfect for You:**

#### **1. Minimal Changes**

- Keep 95% of your existing code
- No migration of APIs or database
- Same deployment process for frontend

#### **2. Cost Effective**

```
Vercel Pro: $20/month (your APIs)
Railway: $5/month (background worker)
MongoDB Atlas: $9/month (existing)
Redis Cloud: $5/month (existing)
Total: $39/month (vs $60+ for full container)
```

#### **3. Best of Both Worlds**

- **Vercel**: Fast API responses, great DX, edge caching
- **Railway**: Reliable background processing, no timeouts
- **Shared**: MongoDB and Redis work with both

## 🎉 **Final Architecture**

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend      │───▶│ Vercel API   │───▶│ MongoDB     │
│   (Next.js)     │    │ (Fast APIs)  │    │ (Recipes)   │
└─────────────────┘    └──────┬───────┘    └─────────────┘
                              │                     ▲
                              ▼                     │
                       ┌──────────────┐             │
                       │ Redis Queue  │             │
                       │ (Job Queue)  │             │
                       └──────┬───────┘             │
                              │                     │
                              ▼                     │
                       ┌──────────────┐             │
                       │ Railway      │─────────────┘
                       │ Worker       │
                       │ (Processing) │
                       └──────────────┘
```

**This gives you:**

- ✅ **Keep your existing Vercel setup**
- ✅ **Reliable background processing**
- ✅ **Cost-effective scaling**
- ✅ **Simple deployment**
- ✅ **Best performance for users**

Would you like me to help you implement the Railway worker setup, or would you prefer to try the Vercel Cron approach first?
