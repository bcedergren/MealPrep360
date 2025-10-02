# MealPrep360 Postman Collection Setup Guide

## Overview

This Postman collection provides comprehensive API testing capabilities for all MealPrep360 microservices including:

- **Main API Service** - Core functionality (recipes, meal plans, shopping lists, user management)
- **Recipe Service** - Dedicated recipe management and validation
- **Meal Plan Service** - Meal planning functionality
- **Blog Service** - Blog content management
- **Social Media Service** - Social features and interactions
- **Admin Service** - Administrative functions and analytics
- **Shopping List Service** - Shopping list generation

## Import Instructions

### 1. Import the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **Upload Files**
4. Choose the `MealPrep360-Postman-Collection.json` file
5. Click **Import**

### 2. Set Environment Variables

After importing, you'll need to configure the following variables:

#### Required Variables

- `base_url` - Main API service URL (default: https://api.mealprep360.com)
- `recipe_service_url` - Recipe service URL
- `meal_plan_service_url` - Meal plan service URL
- `blog_service_url` - Blog service URL
- `social_service_url` - Social media service URL
- `admin_service_url` - Admin service URL
- `shopping_service_url` - Shopping list service URL

#### Authentication Variables

- `clerk_session_token` - Your Clerk session token for authentication
- `recipe_service_api_key` - API key for recipe service
- `user_id` - Your user ID for requests that require it

### 3. Configure Authentication

#### Option A: Collection-Level Auth (Recommended)

The collection is pre-configured with Bearer token authentication using `{{clerk_session_token}}`.

1. Right-click the collection → **Edit**
2. Go to **Authorization** tab
3. Verify **Type** is set to **Bearer Token**
4. Token field should show `{{clerk_session_token}}`

#### Option B: Request-Level Auth

Individual requests can override collection auth if needed.

## Environment Setup

### Development Environment

```json
{
	"base_url": "http://localhost:3000",
	"recipe_service_url": "http://localhost:3001",
	"meal_plan_service_url": "http://localhost:3002",
	"blog_service_url": "http://localhost:3003",
	"social_service_url": "http://localhost:3004",
	"admin_service_url": "http://localhost:3005",
	"shopping_service_url": "http://localhost:3006",
	"clerk_session_token": "your_dev_token",
	"recipe_service_api_key": "your_dev_api_key",
	"user_id": "your_dev_user_id"
}
```

### Production Environment

```json
{
	"base_url": "https://api.mealprep360.com",
	"recipe_service_url": "https://recipe-service.mealprep360.com",
	"meal_plan_service_url": "https://meal-plan-service.mealprep360.com",
	"blog_service_url": "https://blog-service.mealprep360.com",
	"social_service_url": "https://social-service.mealprep360.com",
	"admin_service_url": "https://admin.mealprep360.com",
	"shopping_service_url": "https://shopping-service.mealprep360.com",
	"clerk_session_token": "your_prod_token",
	"recipe_service_api_key": "your_prod_api_key",
	"user_id": "your_prod_user_id"
}
```

## Getting Started

### 1. Health Checks

Start by testing the health endpoints to verify service connectivity:

- Main API: `GET {{base_url}}/api/test`
- Recipe Service: `GET {{recipe_service_url}}/health`
- Meal Plan Service: `GET {{meal_plan_service_url}}/api/health`
- All other services have similar health endpoints

### 2. Authentication Test

Test authentication with: `GET {{base_url}}/api/user`

If you get a 401 error, verify your `clerk_session_token` is valid.

### 3. Basic Workflow

1. **Create a Recipe**: `POST {{base_url}}/api/recipes`
2. **Create Meal Plan**: `POST {{base_url}}/api/meal-plans`
3. **Generate Shopping List**: `POST {{base_url}}/api/shopping-lists/generate`

## Service-Specific Notes

### Recipe Service

- Requires `x-api-key` header for all requests
- Use dedicated endpoints for recipe validation and auditing
- Health and metrics endpoints available

### Admin Service

- All endpoints require admin-level authentication
- Includes recipe generation, user management, and analytics
- Service health monitoring included

### Social Media Service

- Includes feed, posts, comments, likes, and user following
- Search functionality for users and content
- Moderation and reporting features

### Shopping List Service

- Vercel serverless function implementation
- Requires `x-user-id` header or userId in body
- Supports meal plan integration

## Common Request Examples

### Create Recipe

```json
{
	"title": "Healthy Chicken Stir Fry",
	"description": "Quick and nutritious chicken stir fry",
	"ingredients": ["2 chicken breasts", "1 cup broccoli", "2 tbsp soy sauce"],
	"instructions": ["Cut chicken", "Heat oil", "Cook chicken", "Add vegetables"],
	"prepTime": 15,
	"cookTime": 20,
	"servings": 4,
	"difficulty": "easy",
	"cuisine": "Asian",
	"mealType": "dinner",
	"tags": ["quick", "healthy", "protein"]
}
```

### Create Meal Plan

```json
{
	"date": "2024-01-01",
	"recipeId": "recipe_id_here",
	"servings": 4
}
```

### Generate Shopping List

```json
{
	"mealPlanId": "meal_plan_id_here",
	"startDate": "2024-01-01",
	"endDate": "2024-01-07",
	"pantryExclusions": ["salt", "pepper", "olive oil"]
}
```

## Error Handling

Common HTTP status codes you'll encounter:

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (check request body)
- **401**: Unauthorized (check authentication)
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **500**: Internal server error

## Authentication Token Management

### Getting Clerk Session Token

1. Login to your MealPrep360 application
2. Open browser developer tools
3. Go to Network tab
4. Make any authenticated request
5. Check the Authorization header for the Bearer token
6. Copy the token (without "Bearer " prefix)

### API Key Management

- Recipe service API key should be stored securely
- Contact your admin for production API keys
- Development keys can be found in your local environment files

## Testing Workflows

### Complete Recipe Workflow

1. **Health Check**: Verify services are running
2. **Create Recipe**: Add a new recipe
3. **Save Recipe**: Save the recipe to user's collection
4. **Create Meal Plan**: Add recipe to meal plan
5. **Generate Shopping List**: Create shopping list from meal plan

### Social Features Workflow

1. **Create Post**: Share a recipe or cooking experience
2. **Like/Comment**: Interact with other users' posts
3. **Follow Users**: Build your social network
4. **Search**: Find users and content

### Admin Workflow

1. **Check Stats**: View platform analytics
2. **User Management**: Manage user accounts
3. **Recipe Generation**: Bulk generate recipes
4. **Content Moderation**: Review flagged content

## Troubleshooting

### Common Issues

1. **401 Unauthorized**

   - Check clerk_session_token is valid and not expired
   - Verify token is properly set in environment variables

2. **CORS Errors**

   - Ensure you're using the correct service URLs
   - Check if services are running and accessible

3. **Recipe Service 401**

   - Verify x-api-key header is included
   - Check API key is valid for the environment

4. **Missing Variables**
   - Ensure all environment variables are set
   - Variables should not include spaces or special characters

### Getting Help

- Check service logs for detailed error messages
- Verify environment configurations match your deployment
- Ensure all services are running and accessible
- Test health endpoints before functional endpoints

## Collection Structure

The collection is organized into folders by service:

```
MealPrep360 API Collection/
├── Main API Service/
│   ├── Authentication & Health/
│   ├── Recipes/
│   ├── Meal Plans/
│   ├── Shopping Lists/
│   ├── User Management/
│   └── AI Features/
├── Recipe Service/
├── Meal Plan Service/
├── Shopping List Service/
├── Blog Service/
├── Social Media Service/
└── Admin Service/
```

Each folder contains relevant endpoints with pre-configured headers, request bodies, and query parameters.

## Contributing

When adding new endpoints:

1. Follow the existing naming conventions
2. Include proper request/response examples
3. Set appropriate headers and authentication
4. Update this documentation

## Security Notes

- Never commit API keys or tokens to version control
- Use environment-specific tokens for testing
- Rotate authentication tokens regularly
- Keep production and development environments separate
