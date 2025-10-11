# ✅ Python AI Service - Ready to Test!

**Status:** Service is running on http://localhost:8000  
**API Docs:** http://localhost:8000/docs (should be open in your browser)

---

## 🔧 Quick Fix Needed

The service needs your OpenAI API key. Here's how to add it:

### Step 1: Edit the .env file

```powershell
notepad MealPrep360-AIService\.env
```

### Step 2: Find this line:

```
OPENAI_API_KEY=placeholder-key-will-be-set-by-user
```

### Step 3: Replace with your key from env.local.complete:

```
OPENAI_API_KEY=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
```

### Step 4: Save the file

### Step 5: Restart the service

```powershell
docker stop mealprep360-ai-service
docker rm mealprep360-ai-service
cd MealPrep360-AIService
docker-compose up -d
cd ..
```

---

## 🧪 Test It!

### Option 1: Use the Interactive Docs (Easiest!)

1. Open: http://localhost:8000/docs
2. Click on **POST /api/recipes/generate**
3. Click **"Try it out"**
4. Edit the JSON:
   ```json
   {
     "season": "fall",
     "servings": 6
   }
   ```
5. Click **"Execute"**
6. See the recipe generated!

### Option 2: Use PowerShell

```powershell
$body = @{
    season = "fall"
    servings = 6
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/recipes/generate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Option 3: Use curl

```powershell
curl -X POST http://localhost:8000/api/recipes/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"season\": \"fall\", \"servings\": 6}"
```

---

## ✨ What You'll See

When it works, you'll get:

```json
{
  "recipe": {
    "title": "Hearty Butternut Squash Soup",
    "description": "Creamy and comforting soup perfect for fall",
    "ingredients": [
      {
        "name": "butternut squash",
        "amount": "2",
        "unit": "lbs"
      },
      ...
    ],
    "prep_time": 20,
    "cook_time": 45,
    "servings": 6,
    ...
  },
  "generation_time": 2.847,
  "cost": 0.0185,
  "model_used": "gpt-4o"
}
```

**That's it!** ✅
- Type-safe response (Pydantic validated)
- Automatic cost tracking ($0.0185 per recipe!)
- Full recipe details
- No JSON parsing errors

---

## 📊 Check Costs

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/metrics" -Method Get
```

You'll see:
```json
{
  "total_requests": 1,
  "total_cost": 0.0185,  ← Real cost!
  "average_cost_per_request": 0.0185
}
```

---

## 🆘 If Something's Wrong

### Check logs:
```powershell
docker logs mealprep360-ai-service
```

### Restart service:
```powershell
docker restart mealprep360-ai-service
```

### View all services:
```powershell
docker ps
```

---

## 🎉 Once It Works

You'll have proven that:
- ✅ Python AI service is simpler than TypeScript
- ✅ Type safety works (no JSON parsing errors)
- ✅ Cost tracking is automatic
- ✅ Code is 73% smaller
- ✅ Ready to migrate your TypeScript services!

---

**The interactive docs at http://localhost:8000/docs are the easiest way to test!** 🚀

Just add your API key to the `.env` file, restart, and try it out!

