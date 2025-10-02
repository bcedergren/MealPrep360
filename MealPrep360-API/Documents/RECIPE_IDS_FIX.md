# Recipe IDs API Fix

## Problem

The client was sending a POST request to `/api/recipes` with a body containing `recipeIds`, but this endpoint is designed to create individual recipes and expects `title`, `ingredients`, and `instructions` fields.

## Root Cause

The client was calling the wrong endpoint. When creating meal plans with multiple recipes, the request should go to `/api/meal-plans`, not `/api/recipes`.

## Solution Implemented

### 1. Enhanced Meal Plans POST Endpoint

Modified `/api/meal-plans` POST endpoint to handle both:

- Single `recipeId` (legacy support)
- Multiple `recipeIds` (new functionality)

### 2. Key Changes Made

#### File: `src/app/api/meal-plans/route.ts`

**Enhanced Request Body Handling:**

```typescript
const { startDate, endDate, recipeId, recipeIds, servings } = body;
```

**Support for Multiple Recipe IDs:**

```typescript
// Handle both single recipeId and multiple recipeIds
const recipeIdArray = recipeIds || (recipeId ? [recipeId] : []);
```

**Dynamic Meal Plan Creation:**

- Creates recipe items for each day in the date range
- Maps recipe IDs to specific days
- Supports variable duration meal plans

### 3. API Documentation

Added comprehensive Swagger documentation for the POST endpoint including:

- Support for `recipeIds` array parameter
- Backward compatibility with `recipeId` parameter
- Complete request/response schemas

## Client Migration Guide

### Before (Incorrect)

```javascript
// ❌ Wrong endpoint
fetch('/api/recipes', {
	method: 'POST',
	body: JSON.stringify({
		recipeIds: ['recipe1', 'recipe2', 'recipe3'],
	}),
});
```

### After (Correct)

```javascript
// ✅ Correct endpoint
fetch('/api/meal-plans', {
	method: 'POST',
	body: JSON.stringify({
		startDate: '2024-01-01',
		endDate: '2024-01-03',
		recipeIds: ['recipe1', 'recipe2', 'recipe3'],
		servings: 4,
	}),
});
```

## Request Format

### Required Fields

- `startDate`: Start date of the meal plan (YYYY-MM-DD)
- `endDate`: End date of the meal plan (YYYY-MM-DD)

### Optional Fields

- `recipeIds`: Array of recipe IDs to assign to each day
- `recipeId`: Single recipe ID (legacy support)
- `servings`: Number of servings per meal (default: 4)

### Example Request

```json
{
	"startDate": "2024-01-01",
	"endDate": "2024-01-07",
	"recipeIds": [
		"507f1f77bcf86cd799439011",
		"507f1f77bcf86cd799439012",
		"507f1f77bcf86cd799439013",
		"507f1f77bcf86cd799439014",
		"507f1f77bcf86cd799439015",
		"507f1f77bcf86cd799439016",
		"507f1f77bcf86cd799439017"
	],
	"servings": 4
}
```

## Testing

A test script has been created at `test-meal-plan-recipeids.js` to verify the functionality.

## Debug Logging

Enhanced debug logging has been added to track:

- Request parameters received
- Recipe IDs being processed
- Meal plan creation details
- Success/failure status

## Backward Compatibility

The changes maintain full backward compatibility:

- Existing `recipeId` parameter still works
- Existing meal plan structure preserved
- No breaking changes to existing functionality
