# Shopping List Service API Documentation

## Ingredient Management API

### List/Search Ingredients

`GET /api/ingredients`

Query parameters:

- `query` (optional): Search term for ingredient names
- `category` (optional): Filter by category
- `limit` (optional): Maximum number of results (default: 20, max: 100)

Response:

```json
[
	{
		"_id": "123",
		"name": "chicken breast",
		"displayName": "Chicken Breast",
		"category": "Meat",
		"alternateNames": ["chicken breasts", "boneless chicken breast"],
		"defaultUnit": "piece",
		"defaultAmount": 2,
		"isCommonPantryItem": false,
		"createdAt": "2024-01-01T00:00:00.000Z",
		"updatedAt": "2024-01-01T00:00:00.000Z"
	}
]
```

### Get Single Ingredient

`GET /api/ingredients?id=123`

Response:

```json
{
	"_id": "123",
	"name": "chicken breast",
	"displayName": "Chicken Breast",
	"category": "Meat",
	"alternateNames": ["chicken breasts", "boneless chicken breast"],
	"defaultUnit": "piece",
	"defaultAmount": 2,
	"isCommonPantryItem": false,
	"createdAt": "2024-01-01T00:00:00.000Z",
	"updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Create Ingredient

`POST /api/ingredients`

Request body:

```json
{
	"name": "chicken breast",
	"displayName": "Chicken Breast",
	"category": "Meat",
	"alternateNames": ["chicken breasts", "boneless chicken breast"],
	"defaultUnit": "piece",
	"defaultAmount": 2,
	"isCommonPantryItem": false
}
```

Response:

```json
{
	"_id": "123",
	"name": "chicken breast",
	"displayName": "Chicken Breast",
	"category": "Meat",
	"alternateNames": ["chicken breasts", "boneless chicken breast"],
	"defaultUnit": "piece",
	"defaultAmount": 2,
	"isCommonPantryItem": false,
	"createdAt": "2024-01-01T00:00:00.000Z",
	"updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Ingredient

`PUT /api/ingredients?id=123`

Request body: Same as create

Response: Updated ingredient object

### Delete Ingredient

`DELETE /api/ingredients?id=123`

Response:

```json
{
	"message": "Ingredient deleted successfully"
}
```

### Bulk Operations

`POST /api/ingredients/bulk`

Request body:

```json
{
	"operation": "create", // or "update" or "delete"
	"ingredients": [
		{
			"name": "chicken breast",
			"displayName": "Chicken Breast",
			"category": "Meat",
			"alternateNames": ["chicken breasts", "boneless chicken breast"],
			"defaultUnit": "piece",
			"defaultAmount": 2,
			"isCommonPantryItem": false
		}
	]
}
```

Response:

```json
{
	"operation": "create",
	"results": {
		"successful": 1,
		"failed": 0,
		"details": {
			"successful": ["chicken breast"],
			"failed": []
		}
	}
}
```

## Data Types

### Categories

- `Produce`
- `Dairy`
- `Meat`
- `Seafood`
- `Pantry`
- `Spices`
- `Bakery`
- `Frozen`
- `Other`

### Units

- `g` (grams)
- `kg` (kilograms)
- `oz` (ounces)
- `lb` (pounds)
- `ml` (milliliters)
- `l` (liters)
- `cup`
- `tbsp` (tablespoon)
- `tsp` (teaspoon)
- `piece`
- `whole`
- `pinch`

## Error Handling

All endpoints return appropriate HTTP status codes:

- 200: Success
- 201: Created (for POST requests)
- 400: Bad Request (invalid input)
- 404: Not Found
- 409: Conflict (e.g., duplicate ingredient)
- 500: Internal Server Error

Error response format:

```json
{
	"error": "Error message",
	"details": {} // Optional additional error details
}
```

## Rate Limiting

- 100 requests per minute per IP address
- 1000 requests per hour per IP address

## Authentication

Currently using API key authentication. Include the API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

## Examples

### Creating a New Ingredient

```typescript
const response = await fetch('/api/ingredients', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer YOUR_API_KEY',
	},
	body: JSON.stringify({
		name: 'chicken breast',
		displayName: 'Chicken Breast',
		category: 'Meat',
		alternateNames: ['chicken breasts', 'boneless chicken breast'],
		defaultUnit: 'piece',
		defaultAmount: 2,
		isCommonPantryItem: false,
	}),
});

const ingredient = await response.json();
```

### Searching Ingredients

```typescript
const response = await fetch(
	'/api/ingredients?query=chicken&category=Meat&limit=10',
	{
		headers: {
			Authorization: 'Bearer YOUR_API_KEY',
		},
	}
);

const ingredients = await response.json();
```

### Bulk Creating Ingredients

```typescript
const response = await fetch('/api/ingredients/bulk', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'Bearer YOUR_API_KEY',
	},
	body: JSON.stringify({
		operation: 'create',
		ingredients: [
			{
				name: 'chicken breast',
				displayName: 'Chicken Breast',
				category: 'Meat',
				alternateNames: ['chicken breasts', 'boneless chicken breast'],
				defaultUnit: 'piece',
				defaultAmount: 2,
				isCommonPantryItem: false,
			},
			{
				name: 'olive oil',
				displayName: 'Olive Oil',
				category: 'Pantry',
				alternateNames: ['extra virgin olive oil', 'evoo'],
				defaultUnit: 'tbsp',
				defaultAmount: 1,
				isCommonPantryItem: true,
			},
		],
	}),
});

const result = await response.json();
```
