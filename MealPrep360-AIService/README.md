# MealPrep360 AI Service

Python FastAPI microservice for all AI operations including recipe generation, blog content creation, and intelligent suggestions.

## 🚀 Features

- ✅ **Type-Safe AI** - Pydantic models ensure correct response formats
- ✅ **Automatic Cost Tracking** - Monitor spend per endpoint
- ✅ **Intelligent Caching** - Redis-backed caching to reduce API calls
- ✅ **Rate Limiting** - Prevent API throttling
- ✅ **Structured Outputs** - Use Instructor for guaranteed valid responses
- ✅ **Async/Await** - High-performance async operations
- ✅ **Comprehensive Logging** - Loguru for beautiful logs
- ✅ **Health Checks** - Production-ready monitoring
- ✅ **Docker Support** - Easy deployment

## 📋 Prerequisites

- Python 3.11+
- Redis (for caching)
- OpenAI API key

## 🛠️ Installation

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Run the service
uvicorn app.main:app --reload
```

### Docker

```bash
# Build image
docker build -t mealprep360-ai:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  --env-file .env \
  --name mealprep360-ai \
  mealprep360-ai:latest
```

### Docker Compose

```bash
docker-compose up -d
```

## 📡 API Endpoints

### Recipe Generation

```bash
# Generate a single recipe
POST /api/recipes/generate
{
  "season": "fall",
  "servings": 6,
  "dietary_restrictions": ["vegetarian"]
}

# Batch generate recipes
POST /api/recipes/batch-generate?season=winter&count=5
```

### Blog Content

```bash
POST /api/blog/generate
{
  "topic": "Meal Prep Tips for Busy Families",
  "keywords": ["meal prep", "family dinner"],
  "length": 1200
}
```

### Recipe Suggestions

```bash
POST /api/suggestions/generate
{
  "query": "quick chicken dinner",
  "max_results": 5
}
```

### Image Generation

```bash
POST /api/images/generate
{
  "recipe_title": "Butternut Squash Soup",
  "size": "1024x1024"
}
```

### Metrics

```bash
# Get cost and usage metrics
GET /metrics
```

## 🔌 Integration with TypeScript Services

### Example: Call from Next.js API Route

```typescript
// MealPrep360-API/src/app/api/recipes/generate/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  
  // Call Python AI service
  const response = await fetch('http://ai-service:8000/api/recipes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  const data = await response.json()
  return Response.json(data)
}
```

### Example: Call from Recipe Service

```typescript
// MealPrep360-RecipeService/src/services/aiService.ts
async function generateRecipe(season: string) {
  const response = await fetch('http://ai-service:8000/api/recipes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ season, servings: 4 })
  })
  
  return await response.json()
}
```

## 📊 Cost Tracking

The service automatically tracks:
- Total requests per endpoint
- Total cost in USD
- Token usage
- Average cost per request
- Breakdown by model and endpoint

View metrics at: `http://localhost:8000/metrics`

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/test_recipes.py -v
```

## 📝 Project Structure

```
MealPrep360-AIService/
├── app/
│   ├── main.py              # FastAPI app
│   ├── core/
│   │   ├── config.py        # Settings
│   │   └── monitoring.py    # Metrics
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── routers/
│   │   ├── recipes.py       # Recipe endpoints
│   │   ├── blog.py          # Blog endpoints
│   │   ├── suggestions.py   # Suggestion endpoints
│   │   └── images.py        # Image endpoints
│   └── services/
│       ├── openai_service.py    # OpenAI client
│       ├── prompt_manager.py    # Prompt templates
│       ├── cost_tracker.py      # Cost tracking
│       └── cache_service.py     # Redis caching
├── prompts/              # Prompt templates
├── tests/                # Test suite
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 🔧 Configuration

All configuration is in `.env` or `app/core/config.py`:

- `OPENAI_MODEL`: Default model (gpt-4o recommended)
- `OPENAI_TEMPERATURE`: Creativity level (0.7 default)
- `CACHE_TTL`: Cache duration in seconds
- `RATE_LIMIT_REQUESTS`: Max requests per window
- `COST_ALERT_THRESHOLD`: Alert if daily cost exceeds this

## 🚀 Deployment

### AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker build -t mealprep360-ai:latest .
docker tag mealprep360-ai:latest $ECR_REGISTRY/mealprep360/ai-service:latest
docker push $ECR_REGISTRY/mealprep360/ai-service:latest

# Update ECS service
aws ecs update-service --cluster mealprep360-cluster --service ai-service --force-new-deployment
```

### Docker Compose (Production)

```yaml
services:
  ai-service:
    image: mealprep360-ai:latest
    environment:
      - ENVIRONMENT=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    ports:
      - "8000:8000"
    restart: unless-stopped
```

## 📈 Performance

- **Response Time**: < 3s for recipe generation
- **Cost**: ~$0.02 per recipe (GPT-4o)
- **Cache Hit Rate**: ~60% (with proper caching)
- **Throughput**: 100+ requests/minute

## 🐛 Troubleshooting

### Service won't start

```bash
# Check environment variables
python -c "from app.core.config import settings; print(settings)"

# Check Redis connection
redis-cli ping
```

### High costs

```bash
# Check metrics
curl http://localhost:8000/metrics

# Review prompt efficiency
# Consider using GPT-4o-mini for simple tasks
```

## 📚 Further Reading

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Instructor Documentation](https://python.useinstructor.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Pydantic Models](https://docs.pydantic.dev/)

## 🤝 Contributing

This service is part of the MealPrep360 monorepo. See main README for contribution guidelines.

## 📄 License

Proprietary - MealPrep360

