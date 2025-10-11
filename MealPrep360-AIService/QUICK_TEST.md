# Quick Test Guide for Python AI Service

## 🚀 Step-by-Step Testing

### Step 1: Add Your OpenAI API Key

Open `MealPrep360-AIService/.env` and replace:
```
OPENAI_API_KEY=placeholder-key-will-be-set-by-user
```

With your actual key:
```
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### Step 2: Start the Service

```powershell
cd MealPrep360-AIService
docker-compose up -d
```

### Step 3: Check Health

```powershell
# Wait 5 seconds for startup
Start-Sleep -Seconds 5

# Test health endpoint
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "mealprep360-ai",
  "version": "1.0.0"
}
```

### Step 4: View API Documentation

Open in your browser:
```
http://localhost:8000/docs
```

You'll see interactive API documentation with all endpoints!

### Step 5: Test Recipe Generation

```powershell
# Using PowerShell
$body = @{
    season = "fall"
    servings = 6
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/recipes/generate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Or use curl:
```bash
curl -X POST http://localhost:8000/api/recipes/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"season\": \"fall\", \"servings\": 6}"
```

### Step 6: Check Costs

```powershell
curl http://localhost:8000/metrics
```

You'll see:
```json
{
  "total_requests": 1,
  "total_cost": 0.0185,
  "total_tokens": 1247,
  "average_cost_per_request": 0.0185,
  "by_endpoint": {
    "recipe_generation": {
      "requests": 1,
      "cost": 0.0185,
      "tokens": 1247
    }
  }
}
```

### Step 7: View Logs

```powershell
docker logs mealprep360-ai-service
```

### Step 8: Stop Service

```powershell
cd MealPrep360-AIService
docker-compose down
```

---

## 🧪 Additional Tests

### Test Blog Generation

```powershell
$body = @{
    topic = "Meal Prep Tips for Busy Families"
    keywords = @("meal prep", "freezer meals", "family dinner")
    length = 1000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/blog/generate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Test Recipe Suggestions

```powershell
$body = @{
    query = "quick chicken dinner ideas"
    max_results = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/suggestions/generate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Test Image Generation

```powershell
$body = @{
    recipe_title = "Butternut Squash Soup"
    size = "1024x1024"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/images/generate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---

## 🐛 Troubleshooting

### Service won't start
```powershell
# Check Docker is running
docker ps

# View service logs
docker logs mealprep360-ai-service

# Check port 8000 isn't in use
netstat -ano | findstr :8000
```

### "OPENAI_API_KEY is not configured" error
```powershell
# Check .env file
Get-Content MealPrep360-AIService\.env | Select-String "OPENAI_API_KEY"

# Make sure it's not the placeholder value
```

### Redis connection failed
```powershell
# Check if Redis is running
docker ps | findstr redis

# Restart Redis
docker-compose restart redis
```

---

## ✅ Success Criteria

If all these work, you're good to go:
- ✅ Health endpoint returns "healthy"
- ✅ Recipe generation returns valid JSON with recipe
- ✅ Metrics endpoint shows cost tracking
- ✅ Logs show successful requests
- ✅ API docs load at /docs

---

**Ready? Let's test it!** 🚀

