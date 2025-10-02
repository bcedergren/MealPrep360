# Shopping List Service

A microservice that generates normalized shopping lists from meal plans by aggregating and normalizing ingredients across multiple recipes. The service integrates with MongoDB for data persistence and recipe management.

## Features

- MongoDB integration for recipe and shopping list storage
- Fetches recipe data from MongoDB database
- **Smart ingredient normalization** with intelligent unit conversion
- **Automatic ingredient name cleaning** (removes N/A prefixes, standardizes variations)
- **Default quantity assignment** for generic ingredients (e.g., "1 g shrimp" → "500 g shrimp")
- **Intelligent ingredient combination** across recipes with similar naming
- **Category-based default amounts** for realistic shopping quantities
- Groups ingredients by categories
- Supports pantry exclusions
- Saves shopping lists with user association
- Retrieves user's shopping list history
- Input validation using Zod
- API key authentication
- Comprehensive test coverage

## Smart Ingredient Processing

The service now includes advanced ingredient processing to address common issues:

### 🧹 **Name Cleaning**

- Removes "N/A" prefixes from ingredient names
- Normalizes common variations (e.g., "garlic cloves" → "garlic", "onions" → "onion")
- Standardizes chicken breast variations ("boneless chicken breast" → "chicken breast")

### 📏 **Default Quantity Assignment**

When ingredients have generic amounts like "1 g", the service assigns realistic quantities:

- **Seafood**: 400-500g (shrimp: 500g, fish: 400g)
- **Grains**: 250g (quinoa, rice, pasta)
- **Meat**: 500g (chicken, beef, pork)
- **Produce**: 200g (vegetables)
- **Dairy**: 250g
- **Spices**: 50g

### 🔗 **Intelligent Combination**

- Combines similar ingredients across recipes (e.g., "chicken breast" + "boneless chicken breast")
- Merges duplicate items with proper quantity aggregation
- Maintains category consistency during combination

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- MongoDB instance
- Docker (optional)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in Vercel:
   - `MONGODB_URI`: Your MongoDB connection string
   - `API_KEY`: A secure API key for authentication
   - `NODE_ENV`: Set to "production"

## Development

Start the development server:

```bash
npm run dev
```

## Testing

Run the test suite:

```bash
npm test
```

Run specific test scripts:

```bash
# Test the improvements
node test-improvements.js

# Debug shopping list issues
node debug-shopping-list.js

# Simple integration test
node simple-test.js
```

## Building

Build the TypeScript code:

```bash
npm run build
```

## Docker

Build and run with Docker:

```bash
docker build -t shopping-list-service .
docker run -p 3001:3001 shopping-list-service
```

## API Endpoints

### Authentication

All API endpoints (except health check) require an API key to be passed in the `X-API-Key` header:

```http
X-API-Key: your-secure-api-key-here
```

### Generate Shopping List

```http
POST /api/shopping-list
X-API-Key: your-secure-api-key-here
Content-Type: application/json

{
  "userId": "user123",
  "recipeIds": ["recipe1", "recipe2"],
  "pantryExclusions": ["salt", "olive oil"]
}
```

Response:

```json
{
	"message": "Shopping list created successfully",
	"shoppingList": {
		"userId": "user123",
		"recipeIds": ["recipe1", "recipe2"],
		"items": [
			{
				"name": "chicken breast",
				"amount": 3,
				"unit": "piece",
				"category": "Meat",
				"normalizedAmount": 3,
				"normalizedUnit": "piece"
			},
			{
				"name": "shrimp",
				"amount": 500,
				"unit": "g",
				"category": "Seafood",
				"normalizedAmount": 500,
				"normalizedUnit": "g"
			}
		],
		"createdAt": "2024-02-20T12:00:00.000Z"
	}
}
```

### Get User's Shopping Lists

```http
GET /api/shopping-list/:userId
X-API-Key: your-secure-api-key-here
```

Response:

```json
{
	"lists": [
		{
			"userId": "user123",
			"items": [
				{
					"name": "chicken breast",
					"amount": 3,
					"unit": "piece",
					"category": "Meat",
					"normalizedAmount": 3,
					"normalizedUnit": "piece"
				}
			],
			"createdAt": "2024-02-20T12:00:00.000Z",
			"updatedAt": "2024-02-20T12:00:00.000Z"
		}
	]
}
```

### Health Check

```http
GET /health
```

Response:

```json
{
	"status": "healthy",
	"timestamp": "2024-02-20T12:00:00.000Z",
	"services": {
		"database": {
			"status": "connected",
			"message": "MongoDB is connected",
			"readyState": 1
		},
		"server": {
			"status": "running",
			"uptime": 3600,
			"memory": {
				"rss": 123456789,
				"heapTotal": 987654321,
				"heapUsed": 123456789,
				"external": 12345678
			},
			"nodeEnv": "production"
		}
	}
}
```

## Data Models

### Recipe

```typescript
{
	_id: string;
	title: string;
	ingredients: {
		name: string;
		amount: number;
		unit: Unit;
		category: Category;
	}
	[];
}
```

### Shopping List

```typescript
{
  _id: string;
  userId: string;
  recipeIds: string[];
  items: {
    name: string;
    amount: number;
    unit: Unit;
    category: Category;
    normalizedAmount: number;
    normalizedUnit: Unit;
  }[];
  createdAt: Date;
}
```

### Units

```typescript
type Unit =
	| 'g'
	| 'kg'
	| 'oz'
	| 'lb'
	| 'ml'
	| 'l'
	| 'cup'
	| 'tbsp'
	| 'tsp'
	| 'piece'
	| 'whole'
	| 'pinch';
```

### Categories

```typescript
type Category =
	| 'Produce'
	| 'Dairy'
	| 'Meat'
	| 'Seafood'
	| 'Pantry'
	| 'Spices'
	| 'Bakery'
	| 'Frozen'
	| 'Other';
```

## Example Improvements

### Before (Issues Fixed)

```json
{
	"items": [
		{ "name": "N/A onion", "amount": 1, "unit": "piece" },
		{ "name": "shrimp", "amount": 3, "unit": "g" },
		{ "name": "quinoa", "amount": 3, "unit": "g" },
		{ "name": "garlic cloves", "amount": 5, "unit": "piece" },
		{ "name": "onion", "amount": 1, "unit": "piece" }
	]
}
```

### After (Improved)

```json
{
	"items": [
		{ "name": "onion", "amount": 2, "unit": "piece" },
		{ "name": "shrimp", "amount": 500, "unit": "g" },
		{ "name": "quinoa", "amount": 250, "unit": "g" },
		{ "name": "garlic", "amount": 5, "unit": "piece" }
	]
}
```

## Error Handling

The service returns appropriate HTTP status codes and error messages:

- 400: Invalid request data
- 401: Invalid or missing API key
- 404: Recipes not found
- 500: Internal server error
- 503: Service unhealthy (database disconnected)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
