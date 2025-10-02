# MealPrep360 Meal Plan Service

A service for generating and managing meal plans based on user's saved recipes.

## Features

- Generate meal plans based on user's saved recipes
- Save and retrieve meal plans
- Manage user's recipe collection
- Simple JSON API responses

## API Endpoints

### Health Check

```
GET /
```

Returns service status and version information.

**Headers Required:**

- `Authorization: Bearer {API_TOKEN}`

**Response:**

```json
{
  "status": "healthy" | "unhealthy",
  "timestamp": "string",
  "services": {
    "database": {
      "status": "unknown" | "connected" | "error",
      "error": "string | null",
      "collections": {
        "mealPlans": {
          "count": "number | null"
        }
      }
    }
  }
}
```

**Error Responses:**

```json
{
	"error": "Missing or invalid authorization header"
}
```

```json
{
	"error": "Invalid API token"
}
```

### Meal Plans

```
GET /api/meal-plans?startDate={startDate}&endDate={endDate}
```

Retrieves meal plans within the specified date range.

**Query Parameters:**

- `startDate`: Start date in ISO format (required)
- `endDate`: End date in ISO format (required)

**Response:**

```json
[
	{
		"id": "string",
		"userId": "string",
		"startDate": "string",
		"endDate": "string",
		"days": [
			{
				"recipeId": "string | null",
				"status": "planned" | "completed" | "skipped"
			}
		],
		"createdAt": "string",
		"updatedAt": "string"
	}
]
```

```
POST /api/meal-plans
```

Generates a new meal plan based on user preferences. The system will use recipes from the user's saved recipes in the `userrecipes` collection. If no saved recipes are found, it will fall back to default recipes.

**Request Body:**

```json
{
	"userId": "string",
	"startDate": "date",
	"duration": "number",
	"skippedDays": [true, false, false, true, false] // true = skip, false = not skipped
}
```

**Response:**

```json
{
	"id": "string",
	"userId": "string",
	"startDate": "string",
	"endDate": "string",
	"days": [
		{
			"recipeId": "string | null", // null for skipped days
			"status": "planned" | "completed" | "skipped" // "skipped" for skipped days
		}
	],
	"createdAt": "string",
	"updatedAt": "string"
}
```

**Note:** When generating a meal plan:

- Days marked as skipped in `skippedDays` will have `recipeId: null` and `status: "skipped"`
- Non-skipped days will have a recipe assigned and `status: "planned"`
- The skipped status is preserved even when generating a new meal plan
- Recipes are selected from the user's saved recipes in the database
- If no saved recipes are found, default recipes are used as fallback

```
POST /api/meal-plans/generate
```

Dedicated endpoint for meal plan generation. This endpoint provides the same functionality as `POST /api/meal-plans` but is specifically designed for meal plan generation operations.

**Request Body:**

```json
{
	"userId": "string",
	"startDate": "date",
	"duration": "number"
}
```

**Response:**

```json
{
	"id": "string",
	"userId": "string",
	"startDate": "string",
	"endDate": "string",
	"days": [
		{
			"recipeId": "string | null",
			"status": "planned" | "completed" | "skipped"
		}
	],
	"createdAt": "string",
	"updatedAt": "string"
}
```

**Error Responses:**

```json
{
	"error": "User ID, start date, and duration are required"
}
```

```json
{
	"error": "Failed to generate meal plan"
}
```

**HTTP Methods Supported:**

- `POST`: Generate meal plan
- All other methods return `405 Method Not Allowed`

## Update a Specific Day in a Meal Plan

```
PATCH /api/meal-plans/{mealPlanId}/days/{dayIndex}
```

Updates a specific day in a meal plan. Use this endpoint to set the status and/or recipe for a given day.

**Request Body:**

```json
{
  "recipeId": "string | null", // Recipe ID to assign, or null for skipped days
  "status": "planned" | "completed" | "skipped" // New status for the day
}
```

**Response:**

```json
{
  "id": "string",
  "userId": "string",
  "startDate": "string",
  "endDate": "string",
  "days": [
    {
      "recipeId": "string | null",
      "status": "planned" | "completed" | "skipped"
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Error Responses:**

```json
{
	"error": "Status is required"
}
```

```json
{
	"error": "Meal plan not found"
}
```

```json
{
	"error": "Invalid day index"
}
```

```
POST /api/meal-plans/{mealPlanId}/days/{dayIndex}/skip
```

Skips a specific day in a meal plan. This endpoint internally uses the PATCH operation to update the meal plan.

**Request Body:**

```json
{
	"userId": "string"
}
```

**Response:**

```json
{
	"id": "string",
	"userId": "string",
	"startDate": "string",
	"endDate": "string",
	"days": [
		{
			"recipeId": null,
			"status": "skipped"
		}
	],
	"createdAt": "string",
	"updatedAt": "string"
}
```

**Error Responses:**

```json
{
	"error": "Meal plan not found"
}
```

```json
{
	"error": "Invalid day index"
}
```

```
POST /api/meal-plans/{mealPlanId}/days/{dayIndex}/unskip
```

Unskips a specific day in a meal plan by assigning a new random recipe and setting the status to "planned". The system intelligently selects recipes using the following logic:

1. **Prioritizes unused recipes**: First tries to select from recipes not already used in the current meal plan
2. **Fallback behavior**: If all recipes are already used, selects randomly from all available recipes
3. **Random selection**: Uses random selection to ensure variety in meal planning

This endpoint internally uses the PATCH operation to update the meal plan.

**Request Body:**

```json
{
	"userId": "string"
}
```

**Notes:**

- The `dayIndex` parameter must be a valid non-negative integer
- The `userId` must be provided and cannot be empty

**Response:**

```json
{
	"id": "string",
	"userId": "string",
	"startDate": "string",
	"endDate": "string",
	"days": [
		{
			"recipeId": "string",
			"status": "planned"
		}
	],
	"createdAt": "string",
	"updatedAt": "string"
}
```

**Error Responses:**

```json
{
	"error": "User ID is required"
}
```

```json
{
	"error": "Meal plan not found"
}
```

```json
{
	"error": "Invalid day index"
}
```

```json
{
	"error": "No saved recipes found",
	"message": "Please add some recipes to your collection before unskipping a meal.",
	"code": "NO_RECIPES"
}
```

```
POST /api/meal-plans/skip-date
```

Skips a specific date in an existing meal plan. Requires that a meal plan already exists for the specified date.

**Request Body:**

```json
{
	"userId": "string",
	"date": "string" // ISO date string
}
```

**Response:**

```json
{
	"id": "string",
	"userId": "string",
	"startDate": "string",
	"endDate": "string",
	"days": [
		{
			"recipeId": null,
			"status": "skipped"
		}
	],
	"createdAt": "string",
	"updatedAt": "string"
}
```

**Error Responses:**

```json
{
	"error": "User ID and date are required"
}
```

```json
{
	"error": "No meal plan found",
	"message": "Please generate a meal plan for this date before skipping it."
}
```

```json
{
	"error": "Failed to skip date"
}
```

```
DELETE /api/meal-plans?id={mealPlanId}
```

Deletes a meal plan.

**Query Parameters:**

- `id`: Meal plan ID (required)

**Response:**

```json
{
	"message": "Meal plan deleted successfully"
}
```

**Error Responses:**

```json
{
	"error": "Meal plan ID is required"
}
```

```json
{
	"error": "Failed to delete meal plan"
}
```

## Data Structures

### MealPlan

```typescript
interface MealPlan {
	id: string;
	userId: string;
	startDate: string;
	endDate: string;
	days: {
		recipeId: string | null;
		status: 'planned' | 'completed' | 'skipped';
	}[];
	createdAt: string;
	updatedAt: string;
}
```

### MealPlanPreferences

```typescript
interface MealPlanPreferences {
	startDate: Date;
	duration: number;
	skippedDays?: boolean[]; // true = skip, false/undefined = not skipped
}
```

## Recent Improvements

### Enhanced Input Validation

- Added comprehensive validation for `dayIndex` parameters to prevent NaN errors
- Enhanced error handling consistency across all meal plan operations
- Added proper validation for negative day indices

### Improved Error Handling

- Added missing "Invalid day index" error handling to unskip functionality
- Enhanced error messages with clear, actionable feedback
- Consistent error response structure across all endpoints

### Smart Recipe Selection

- Unskip functionality now intelligently prioritizes unused recipes
- Graceful fallback behavior when all recipes are already used
- Random selection ensures variety in meal planning

### Meal Plan Generation Enhancements

- **New Dedicated Endpoint**: Added `POST /api/meal-plans/generate` for meal plan generation
- **User Recipe Integration**: Meal plans now use recipes from the user's `userrecipes` collection
- **Database-Driven Recipes**: System queries `userrecipes` collection for user-specific saved recipes
- **Fallback Mechanism**: Graceful fallback to default recipes when no user recipes are found
- **Enhanced Logging**: Detailed logging for debugging recipe selection and meal plan generation
- **Method Restrictions**: Proper 405 responses for unsupported HTTP methods on generate endpoint

### Recipe Service Improvements

- **Flexible User ID Handling**: Supports both ObjectId and string user IDs
- **Database Collection Integration**: Properly queries `userrecipes` and `recipes` collections
- **Error Resilience**: Handles missing user documents and empty recipe collections
- **Performance Optimization**: Efficient recipe retrieval with proper indexing support

## Database Operations

The service uses MongoDB for data storage and follows these operation patterns:

- **POST (Create)**: Uses `insertOne` for new documents
- **PATCH (Update)**: Uses `updateOne` with `$set` for modifying existing documents
- **GET (Read)**: Uses `find` and `findOne` for retrieving documents
- **DELETE**: Uses `deleteOne` for removing documents

## Database Collections

The service uses the following MongoDB collections:

- `mealplans`: Stores generated meal plans
- `recipes`: Stores the actual recipe data
- `userrecipes`: Stores user's saved recipe references

### Recipe Data Structure

The system uses two main recipe-related data structures:

#### Recipe Document (recipes collection)

```typescript
interface Recipe {
	_id: ObjectId;
	userId: string;
	title: string;
	description: string;
	ingredients: string[];
	prepInstructions: string[];
	prepTime: number;
	cookTime: number;
	servings: number;
	tags: string[];
	storageTime: number;
	containerSuggestions: string[];
	defrostInstructions: string[];
	cookingInstructions: string[];
	servingInstructions: string[];
	season: string;
	embedding: number[];
	images: Record<string, any>;
	isPublic: boolean;
	allergenInfo: string[];
	dietaryInfo: string[];
	hasImage: boolean;
	isPlaceholder: boolean;
	createdAt: Date;
	updatedAt: Date;
	__v: number;
}
```

#### User Saved Recipes (userrecipes collection)

```typescript
interface SavedRecipe {
	_id: ObjectId;
	userId: ObjectId;
	savedRecipes: Array<{
		_id: ObjectId;
		recipeId: string;
		savedAt: Date;
	}>;
	createdAt: Date;
	updatedAt: Date;
	__v: number;
}
```

### How Recipe Selection Works

1. **User Recipe Lookup**: When generating a meal plan, the system queries the `userrecipes` collection for the specified user ID
2. **Recipe ID Extraction**: Extracts recipe IDs from the user's `savedRecipes` array
3. **Recipe Retrieval**: Fetches the actual recipe documents from the `recipes` collection using the recipe IDs
4. **Fallback Mechanism**: If no saved recipes are found, the system uses default recipes
5. **Smart Selection**: Recipes are selected randomly while avoiding repetition and ensuring variety

### Default Recipes

The system includes 5 default recipes that are used when a user has no saved recipes:

- Baked Salmon with Roasted Vegetables
- Vegetable Stir Fry with Tofu
- Chicken and Rice Bowl
- Mediterranean Pasta
- Quinoa Buddha Bowl

These recipes provide a good variety of dietary preferences and meal types.

## Testing and Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- --testPathPattern=mealPlanService
```

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Generate API tokens
node scripts/generate-tokens.js

# Add test recipes (requires MongoDB connection)
npm run add-test-recipes-service
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
API_TOKEN=your_api_token
NEXT_PUBLIC_API_TOKEN=your_public_api_token
```

### Testing Meal Plan Generation

You can test the meal plan generation functionality using:

1. **Browser Testing**: Access `http://localhost:3000/test-user-recipes.html` for interactive testing
2. **API Testing**: Use the endpoints documented above with tools like Postman or curl
3. **Unit Tests**: Run the comprehensive test suite for all functionality

### Database Setup

Ensure your MongoDB database has the following collections:

- `mealplans`: For storing generated meal plans
- `recipes`: For storing recipe documents
- `userrecipes`: For storing user's saved recipe references

```

```
