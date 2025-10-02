# Shopping List & Freezer Inventory Optimizations

## Overview

This document outlines optimization strategies for the shopping list and freezer inventory features.

## 1. Shopping List Optimizations

### Current Issues

- No caching implemented
- Fetching all fields from shopping lists
- Double database queries (user lookup + shopping lists)
- No pagination for large shopping lists

### Optimization Strategy

#### a. Add Caching

```javascript
// Add to shopping list routes
import { createCacheKey, shoppingListCache } from '@/lib/cache';

// Cache shopping lists for 10 minutes
const cacheKey = createCacheKey('shopping-lists', { userId: user._id });
const cached = shoppingListCache.get(cacheKey);
if (cached) return NextResponse.json(cached);

// After fetching...
shoppingListCache.set(cacheKey, shoppingLists, 600); // 10 min TTL
```

#### b. Optimize Data Fetching

```javascript
// Only fetch necessary fields
const shoppingLists = await ShoppingList.find(
	{ userId: user._id },
	{
		name: 1,
		status: 1,
		'items.name': 1,
		'items.quantity': 1,
		'items.unit': 1,
		'items.category': 1,
		'items.status': 1,
		createdAt: 1,
		updatedAt: 1,
	}
).sort({ createdAt: -1 });
```

#### c. Add Database Indexes

```javascript
// ShoppingList indexes
{ userId: 1, createdAt: -1 } // For user's lists
{ userId: 1, status: 1 } // For filtering by status
{ 'items.category': 1 } // For category sorting
```

#### d. Cache Invalidation

- Invalidate on: create, update, delete, item status change
- Use similar pattern to meal plans

## 2. Freezer Inventory Optimizations

### Understanding Freezer Inventory

The freezer inventory is based on meal plan items with status = 'frozen'. We need to:

- Efficiently query frozen meals
- Cache frozen meal counts
- Optimize the display of frozen items

### Optimization Strategy

#### a. Create Dedicated Freezer API Endpoint

```javascript
// /api/freezer/inventory/route.ts
export async function GET() {
	const cacheKey = createCacheKey('freezer-inventory', { userId });
	const cached = freezerCache.get(cacheKey);
	if (cached) return NextResponse.json(cached);

	// Get all frozen meals efficiently
	const frozenMeals = await MealPlan.aggregate([
		{ $match: { userId: user._id } },
		{ $unwind: '$recipeItems' },
		{ $match: { 'recipeItems.status': 'frozen' } },
		{
			$lookup: {
				from: 'recipes',
				localField: 'recipeItems.recipeId',
				foreignField: '_id',
				as: 'recipe',
				pipeline: [{ $project: { title: 1, imageUrl: 1, servings: 1 } }],
			},
		},
		{ $unwind: '$recipe' },
		{
			$group: {
				_id: '$recipeItems.recipeId',
				recipe: { $first: '$recipe' },
				totalServings: { $sum: '$recipeItems.servings' },
				oldestDate: { $min: '$recipeItems.date' },
				count: { $sum: 1 },
			},
		},
	]);

	freezerCache.set(cacheKey, frozenMeals, 300); // 5 min TTL
	return NextResponse.json(frozenMeals);
}
```

#### b. Add Indexes for Freezer Queries

```javascript
// MealPlan indexes for freezer inventory
{ userId: 1, 'recipeItems.status': 1 } // For frozen items
{ 'recipeItems.status': 1, 'recipeItems.date': 1 } // For expiry tracking
```

#### c. Cache Invalidation

- Invalidate when meal status changes to/from 'frozen'
- Update cache when meals are consumed

## 3. Implementation Steps

### Phase 1: Database Indexes

Add to `optimize-database.js`:

```javascript
// ShoppingList indexes
await shoppingListCollection.createIndexes([
	{ key: { userId: 1, createdAt: -1 }, name: 'userId_createdAt' },
	{ key: { userId: 1, status: 1 }, name: 'userId_status' },
	{ key: { 'items.category': 1 }, name: 'items_category' },
]);

// MealPlan indexes for freezer
await mealPlanCollection.createIndexes([
	{
		key: { userId: 1, 'recipeItems.status': 1 },
		name: 'userId_recipeItems_status',
	},
]);
```

### Phase 2: Add Caching

1. Create cache instances in `/lib/cache.ts`:

```javascript
export const shoppingListCache = new MemoryCache(100);
export const freezerCache = new MemoryCache(50);
```

2. Implement caching in routes
3. Add cache invalidation

### Phase 3: Optimize Queries

1. Reduce fields fetched
2. Use aggregation pipelines for complex queries
3. Implement pagination where needed

## 4. Expected Performance Gains

### Shopping Lists

- **80% faster** list loading with caching
- **50% smaller** payloads with field reduction
- **Instant** category filtering with indexes

### Freezer Inventory

- **90% faster** inventory display with aggregation
- **Real-time** updates with proper caching
- **Efficient** expiry date tracking

## 5. Monitoring

Track these metrics:

- Shopping list load time
- Freezer inventory query time
- Cache hit rates
- Database query execution time
