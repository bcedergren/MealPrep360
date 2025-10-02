# MealPrep360 Recipe Service

A microservice for managing and generating meal prep recipes, with a focus on freezer-friendly meals.

## Features

- **High-Quality Recipe Generation**: AI-powered recipe generation focused on batch-cooking methods (crock pot, slow cooker, casserole recipes)
- **Location-Aware Cooking**: Recipes adapted to your geographic location with regional ingredients and seasonal appropriateness
- **Recipe Management**: Full CRUD operations for recipe management
- **Recipe Validation and Cleanup**: Automatic filtering of inappropriate tags and season names from recipe titles
- **Freezer-Friendly Meal Planning**: Specialized in meal prep and freezer-friendly recipes
- **Integration with MealPrep360 Platform**: Seamless integration with the main platform

## Prerequisites

- Node.js (v18 or later)
- MongoDB
- Redis
- OpenAI API key
- Spoonacular API key (optional, for recipe images)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the `.env.example` file located in the repository root to `.env` and replace the placeholder values:

   ```
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/mealprep360

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_USER=default
   REDIS_PASSWORD=your_redis_password
   # For production, use REDIS_URL and REDIS_TOKEN instead:
   # REDIS_URL=your_redis_url
   # REDIS_TOKEN=your_redis_token

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_IMAGE_MODEL=dall-e-3
   OPENAI_IMAGE_SIZE=1024x1024
   OPENAI_IMAGE_QUALITY=standard
   OPENAI_IMAGE_STYLE=natural

   # Spoonacular (optional)
   SPOONACULAR_API_KEY=your_spoonacular_api_key

   # API Security
   API_KEY=your_api_key_here

   # Worker Configuration
   WORKER_CONCURRENCY=1
   WORKER_POLL_INTERVAL=5000
   WORKER_MAX_ATTEMPTS=3
   WORKER_JOB_TIMEOUT=300000
   # Delay between recipe generation requests in milliseconds
   RATE_LIMIT_DELAY_MS=3000

   # Logging
   LOG_LEVEL=info
   ```

3. Build the project (required after cloning because `dist/` is not tracked):

   ```bash
   npm run build
   ```

4. Start the service:
   ```bash
   npm start
   ```

## Development

After completing the setup, start the API with hot reloading:

```bash
npm run dev
```

Run the job worker in another terminal using the `worker` script, which runs `src/workers/start.ts` with `ts-node`. See [Running the Background Worker](#running-the-background-worker) for details.

```bash
npm run worker
```

## Testing

Run the test suite:

```bash
npm test
```

## Architecture

The service consists of the following components:

- `RecipeGenerator`: Service for generating recipes using OpenAI's GPT-4
- `Job` and `Recipe` models: MongoDB schemas for storing job and recipe data
- `HealthService`: Service for monitoring system health and metrics
- Configuration management using environment variables

## API Documentation

Base URL: `http://localhost:3000` (for local development)
Base URL: https://recipes.mealprep360.com/

### Authentication

All endpoints require an API key header:

```
x-api-key: YOUR_API_KEY
```

---

## API Endpoints

### GET `/`

Returns the API status and version information.

**Returns:**

```json
{
	"status": "ok",
	"message": "MealPrep360 Recipe Service API",
	"version": "1.0.0"
}
```

---

### GET `/api/health`

Checks the health status of the service, including database connection and metrics.

**Returns:**

```json
{
    "status": "healthy" | "degraded" | "unhealthy",
    "metrics": {
        "connectionSuccessRate": 100,
        "querySuccessRate": 100,
        "averageResponseTime": 0,
        "errorRate": 0,
        "lastUpdate": "2024-03-14T00:00:00.000Z"
    }
}
```

---

### GET `/api/performance`

Gets detailed performance metrics for the service, including database and system metrics.

**Returns:**

```json
{
	"status": "success",
	"metrics": {
		"database": {
			"connectionSuccessRate": 100,
			"querySuccessRate": 100,
			"averageResponseTime": 0,
			"errorRate": 0,
			"lastUpdate": "2024-03-14T00:00:00.000Z",
			"pool": {
				"size": 10,
				"available": 8,
				"pending": 0,
				"timestamp": "2024-03-14T00:00:00.000Z"
			}
		},
		"system": {
			"uptime": 3600,
			"memory": {
				"rss": 123456789,
				"heapTotal": 987654321,
				"heapUsed": 123456789,
				"external": 12345678
			},
			"cpu": {
				"user": 123456,
				"system": 12345
			}
		}
	}
}
```

---

## Recipe Generation Endpoints

### POST `/api/generate`

Starts a recipe generation job for a specific season. This endpoint generates high-quality batch-cooking recipes (crock pot, slow cooker, casserole style) that are automatically tagged with regional and cuisine classifications for frontend filtering.

**Authentication:**

```
x-api-key: YOUR_API_KEY
```

**Request body:**

```json
{
	"season": "spring" // Required. Valid values: "spring", "summer", "fall", "winter"
}
```

**Returns:**

```json
{
	"status": "accepted",
	"message": "Recipe generation started",
	"job": {
		"id": "...",
		"status": "processing",
		"progress": 0,
		"total": 30,
		"season": "spring",
		"createdAt": "..."
	}
}
```

**Error Responses:**

1. Missing API Key (401):

```json
{
	"status": "error",
	"message": "Invalid or missing API key"
}
```

2. Missing Season (400):

```json
{
	"status": "error",
	"message": "Season is required"
}
```

3. Server Error (500):

```json
{
	"status": "error",
	"message": "Error message details"
}
```

**Usage Example:**

```bash
curl -X POST https://recipes.mealprep360.com/api/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"season": "spring"}'
```

---

### POST `/api/generate-images`

Generates images for a recipe using either Spoonacular (if available) or DALL-E. This endpoint is called automatically during recipe generation but can also be used independently to regenerate images for existing recipes.

**Authentication:**

```
x-api-key: YOUR_API_KEY
```

**Request body:**

```json
{
	"recipeId": "recipe_id_here" // Required. MongoDB ObjectId of the recipe
}
```

**Returns:**

```json
{
	"status": "success",
	"message": "Recipe image generated successfully",
	"data": {
		"images": {
			"main": "base64_image_data",
			"thumbnail": "base64_image_data",
			"additional": []
		}
	}
}
```

**Error Responses:**

1. Missing API Key (401):

```json
{
	"status": "error",
	"message": "Invalid or missing API key"
}
```

2. Missing Recipe ID (400):

```json
{
	"status": "error",
	"message": "Recipe ID is required"
}
```

3. Recipe Not Found (404):

```json
{
	"status": "error",
	"message": "Recipe not found"
}
```

4. Server Error (500):

```json
{
	"status": "error",
	"message": "Error message details"
}
```

**Usage Example:**

```bash
curl -X POST https://recipes.mealprep360.com/api/generate-images \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"recipeId": "recipe_id_here"}'
```

**Notes:**

- Images are generated in the following order:
  1. First attempts to fetch from Spoonacular (if API key is available)
  2. Falls back to DALL-E if Spoonacular fails or is not configured
- Generated images are stored as base64 strings in the recipe document
- The endpoint supports both main and thumbnail images
- Additional images can be generated for different aspects of the recipe

---

### GET `/api/generate/status/:jobId`

Checks the status of a recipe generation job. Use this endpoint to monitor the progress of your recipe generation request.

**Authentication:**

```
x-api-key: YOUR_API_KEY
```

**Returns:**

```json
{
    "status": "success",
    "job": {
        "id": "...",
        "type": "recipe-generation",
        "status": "processing" | "completed" | "failed",
        "progress": 0,
        "total": 30,
        "data": { "season": "spring" },
        "error": null,
        "attempts": 0,
        "createdAt": "...",
        "updatedAt": "..."
    }
}
```

**Error Responses:**

1. Job Not Found (404):

```json
{
	"status": "error",
	"message": "Job not found"
}
```

2. Server Error (500):

```json
{
	"status": "error",
	"message": "Error message details"
}
```

**Usage Example:**

```bash
curl -X GET https://admin.mealprep360.com/api/generate/status/YOUR_JOB_ID \
  -H "x-api-key: YOUR_API_KEY"
```

**Note:** The recipe generation process typically takes several minutes to complete. You should poll the status endpoint periodically to check the progress.

---

## Auto-Tagging and Regional Classification

The service automatically classifies all generated recipes with regional, cuisine, climate, and cultural tags to enable intelligent frontend filtering based on user preferences and location.

### Automatic Classification Features

- **Regional Tags**: Recipes are tagged with applicable regions (North America, Europe, Asia, etc.)
- **Cuisine Classification**: Automatic detection of cuisine types (Mediterranean, Asian, American, etc.)
- **Climate Zone Mapping**: Recipes tagged for temperate, tropical, or universal climates
- **Cultural Categories**: Classification as western, eastern, latin, or universal cooking styles
- **Ingredient-Based Analysis**: Tags determined by analyzing ingredients and cooking methods

### How Auto-Tagging Works

The system analyzes each generated recipe's:

1. **Ingredients**: Soy sauce → Asian cuisine, Olive oil → Mediterranean
2. **Cooking Methods**: Stir-fry → Asian, Casserole → Universal
3. **Recipe Title**: Analyzed for cultural indicators
4. **Description**: Additional context for classification

### Available Classification Tags

**Regional Tags:**

- North America, South America, Europe, Asia, Africa, Oceania
- Mediterranean, Middle East, Global

**Cuisine Types:**

- American, Mexican, Italian, French, Chinese, Japanese, Thai, Indian
- Mediterranean, Greek, German, Eastern European, Latin, Universal

**Climate Zones:**

- tropical, temperate, continental, universal

**Cultural Tags:**

- western, eastern, latin, universal

### Recipe Quality Standards

All generated recipes maintain consistent high quality:

- **Batch-Cooking Focus**: Specialized for crock pot, slow cooker, and casserole-style cooking
- **Meal Prep Optimized**: Perfect for batch preparation and freezer storage
- **Clean Naming**: Recipe titles automatically cleaned to remove seasonal references and batch-prep terminology
- **Tag Filtering**: Inappropriate tags like "batch-prep", "freezer-ready", and "meal-prepping" are automatically removed
- **Automatic Classification**: Every recipe gets regional and cuisine tags for filtering

### Frontend Integration

Frontend applications can filter recipes by:

```javascript
// Example API call to get recipes filtered by user's location
const recipes = await fetch(
	'/api/recipes?regions=North America&cuisineTypes=American'
);

// Or filter by multiple criteria
const asianRecipes = await fetch(
	'/api/recipes?regions=Asia&cuisineTypes=Chinese,Japanese,Thai'
);
```

### Usage for Different Regions

**For North American Users:**

- Recipes tagged with "North America", "American" cuisine
- Comfort food styles with familiar ingredients
- Universal batch-cooking methods

**For European Users:**

- Recipes tagged with "Europe", "Mediterranean"
- Traditional European ingredients and methods
- Regional specialties from various European countries

**For Asian Users:**

- Recipes tagged with "Asia" and specific Asian cuisine types
- Rice, noodles, and traditional Asian ingredients
- Adapted for local taste preferences

---

## Job Management Endpoints

### GET `/api/jobs/:jobId`

Gets detailed information about a specific job.

### GET `/api/jobs`

Gets a list of recent jobs.

**Query params:** `limit` (default: 10)

---

### POST `/api/jobs/:jobId/retry`

Retries a failed job and attempts to regenerate recipes.

**Returns:**

```json
{
    "status": "accepted",
    "message": "Job retry started",
    "job": { ... }
}
```

---

## Recipe Management Endpoints

### GET `/api/recipes`

Gets a list of all recipes.

### GET `/api/recipes/:id`

Gets detailed information about a specific recipe.

### POST `/api/recipes`

Creates a new recipe.

### PUT `/api/recipes/:id`

Updates an existing recipe.

### DELETE `/api/recipes/:id`

Deletes a recipe.

## Recipe Validation

### POST `/api/recipes/validate`

Validates and updates all recipes in the database.

**Returns:**

```json
{
	"status": "success",
	"message": "Recipes validation completed",
	"results": [
		{
			"recipeId": "...",
			"valid": true,
			"errors": []
		},
		{
			"recipeId": "...",
			"valid": false,
			"errors": ["Error message 1", "Error message 2"]
		}
	]
}
```

**Error Responses:**

1. Server Error (500):

```json
{
	"status": "error",
	"message": "Error message details"
}
```

## Error Handling

The service includes comprehensive error handling and returns appropriate HTTP status codes:

- `200`: Success
- `202`: Accepted (for async operations)
- `400`: Bad Request
- `401`: Unauthorized (invalid or missing API key)
- `404`: Not Found
- `500`: Internal Server Error

Each response includes a `status` field indicating success or error, and error responses include a `message` field with details about what went wrong.

## Testing the Deployed Service

Once deployed, you can test the service at [https://recipes.mealprep360.com/](https://recipes.mealprep360.com/).

### Health Check

Visit the health endpoint to verify the service is running:

```
https://recipes.mealprep360.com/api/health
```

### Performance Check

Check the service performance metrics:

```
https://recipes.mealprep360.com/api/performance
```

### Recipe Generation

To generate recipes, send a POST request to the generate endpoint:

```bash
curl -X POST https://recipes.mealprep360.com/api/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"season": "spring"}'
```

Generated recipes will automatically include regional and cuisine tags for frontend filtering.

## Running the Background Worker

To process recipe generation jobs, you need to run a background worker. Here's how to set it up:

1. Ensure Redis is running and accessible
2. Set up the required environment variables in your `.env` file:
   ```
   MONGODB_URI
   REDIS_HOST
   REDIS_PORT
   REDIS_USER
   REDIS_PASSWORD
   API_KEY
   OPENAI_API_KEY
   ```
3. Start the worker using `npm run worker` to execute `src/workers/start.ts` with `ts-node`:
   ```bash
   npm run worker
   ```

The worker will connect to Redis and begin processing jobs from the queue. Monitor the logs to ensure jobs are being processed correctly.

Note: The worker should be run separately from your API service.

## Environment Variables

```env
# API Configuration
API_KEY=your-api-key

# Database
MONGODB_URI=your-mongodb-uri

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_USER=your-redis-user
REDIS_PASSWORD=your-redis-password

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_IMAGE_MODEL=dall-e-3
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=standard
OPENAI_IMAGE_STYLE=natural
OPENAI_IMAGE_THUMBNAIL_SIZE=512x512

# Spoonacular
SPOONACULAR_API_KEY=your-spoonacular-api-key
QUEUE_NAME=your-queue-name
PLACEHOLDER_IMAGE_URL=https://example.com/placeholder.png
RATE_LIMIT_DELAY_MS=3000
```

- `OPENAI_IMAGE_THUMBNAIL_SIZE` sets the dimensions for generated thumbnails.
- `QUEUE_NAME` is the Redis queue used by the worker.
- `PLACEHOLDER_IMAGE_URL` provides a fallback image when generation fails.

## Job System

The service uses a job-based system for handling long-running operations:

1. **Job Creation**: Jobs are created with a unique ID and initial status
2. **Job Queue**: Jobs are added to a Redis-based queue for processing
3. **Job Processing**: Workers pick up jobs from the queue and process them
4. **Progress Tracking**: Job progress is updated in real-time
5. **Error Handling**: Failed jobs can be retried up to 3 times
6. **Job Status**: Jobs can be in one of these states:
   - `pending`: Job is created and waiting to be processed
   - `processing`: Job is currently being processed
   - `completed`: Job has finished successfully
   - `failed`: Job has failed and can be retried

## Image Generation

The service uses a sophisticated image generation system:

1. **Caching**: Images are cached to avoid redundant generation
2. **Multiple Sources**: Tries Spoonacular API first, falls back to DALL-E
3. **Rate Limiting**: Respects API rate limits for both services
4. **Batch Processing**: Processes images in batches to optimize performance
5. **Error Handling**: Gracefully handles failures and retries
6. **Image Types**: Generates multiple images per recipe:
   - Main image
   - Thumbnail
   - Additional images

## Production

1. Build the application:

```bash
npm run build
```

2. Start the server:

```bash
npm start
```

3. Start the worker using the production script, which runs `dist/workers/start.js`:

```bash
npm run worker:prod
```

## License

MIT

## Recipe Processing

### POST /api/recipes/process

Processes and updates all recipes in the database.

- This endpoint triggers the recipe validation and update script
- It will:
  - Clean and validate recipe data
  - Process and optimize images
  - Generate allergen and dietary information
  - Condense and clean instructions
  - Remove specified tags
  - Update recipe metadata
- Returns a summary of processed recipes

## Script Usage

The recipe processing script can be run in two ways:

1. Via API endpoint:

```bash
curl -X POST http://localhost:3000/api/recipes/process
```

2. Directly via command line:

```bash
npx tsx src/scripts/validateAndUpdateRecipes.ts
```

The script will:

- Process all recipes in the database
- Clean and validate recipe data
- Optimize images
- Generate allergen and dietary information
- Condense instructions
- Remove specified tags
- Update recipe metadata
- Log all changes and any errors
