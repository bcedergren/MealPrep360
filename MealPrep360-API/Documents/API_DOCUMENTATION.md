# MealPrep360 API Documentation

This document explains how to use the API documentation and testing system for MealPrep360.

## Overview

The MealPrep360 API documentation system provides a Swagger-like interface for testing and exploring API endpoints. It uses OpenAPI 3.0 specification with JSDoc comments to automatically generate interactive documentation.

## Features

- 🔍 **Interactive API Explorer**: Test endpoints directly from the browser
- 📝 **Comprehensive Documentation**: Detailed parameter and response descriptions
- 🔐 **Authentication Support**: Built-in support for Clerk JWT authentication
- 📊 **Request/Response Examples**: See exactly what data to send and expect
- ⚡ **Real-time Testing**: Execute API calls and see live responses
- 🎯 **Filtering & Search**: Easily find specific endpoints

## Accessing the Documentation

### Development Environment

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to the documentation page:
   ```
   http://localhost:3001/docs
   ```

### Production Environment

Navigate to:

```
https://your-domain.com/docs
```

## Currently Documented Endpoints

### ✅ User Management

- **GET /api/user** - Get current user information
- **GET /api/user/preferences** - Get user dietary preferences and cooking settings
- **POST /api/user/preferences** - Update user dietary preferences

### ✅ Settings

- **GET /api/settings** - Get user settings (theme, display, notifications, etc.)
- **PUT /api/settings** - Update user settings

### ✅ Recipes

- **GET /api/recipes** - Get user's recipes with filtering and pagination
- **POST /api/recipes** - Create a new recipe

### ✅ Meal Plans

- **GET /api/meal-plans** - Get user's meal plans with date filtering
- **POST /api/meal-plans** - Create a new meal plan (documented in existing code)
- **DELETE /api/meal-plans** - Delete a meal plan (documented in existing code)
- **GET /api/skipped-days** - Get skipped meal plan days for a date range

### ✅ Shopping Lists

- **GET /api/shopping-lists** - Get user's shopping lists
- **POST /api/shopping-lists** - Create a new shopping list

### ✅ AI Features

- **POST /api/ai** - Generate recipes or meal plans using AI
- **POST /api/ai/suggestions** - Get AI-powered recipe suggestions
- **POST /api/generate-image** - Generate recipe images using DALL-E 3

### ✅ Subscription

- **GET /api/subscription** - Get user's subscription plan

### ✅ Upload

- **POST /api/upload** - Upload image files (max 5MB)

### ✅ Blog

- **GET /api/blog/posts** - Get published blog posts with filtering
- **POST /api/blog/posts** - Create a new blog post

### ✅ Security

- **POST /api/security/2fa** - Manage two-factor authentication

### ✅ Notifications

- **POST /api/notifications/push** - Subscribe to push notifications
- **DELETE /api/notifications/push** - Unsubscribe from push notifications

### ✅ Authentication

- **GET /api/auth/token** - Get authentication token status and instructions
- **GET /api/test-auth** - Simple authentication test with detailed debugging

## Additional Endpoints Available for Documentation

### Recipe Management

- `/api/recipes/{id}` - GET, PUT, DELETE, PATCH individual recipes
- `/api/recipes/{id}/saved` - GET, POST recipe saved status
- `/api/recipes/{id}/image` - GET recipe image
- `/api/recipes/search` - GET recipe search
- `/api/recipes/tags` - GET available recipe tags
- `/api/recipes/recommended` - GET recommended recipes
- `/api/recipes/import` - POST import recipes
- `/api/recipes/analyze` - POST analyze recipe nutrition
- `/api/recipes/report` - POST report recipe issues

### Meal Planning

- `/api/meal-plans/generate` - POST generate meal plans
- `/api/meal-plans/optimized` - GET optimized meal plans
- `/api/meal-plans/skip-date` - POST, DELETE skip dates
- `/api/meal-plans/{mealPlanId}/days/{dayIndex}` - PATCH update day
- `/api/meal-plans/{mealPlanId}/days/{dayIndex}/{action}` - POST day actions

### Shopping Lists

- `/api/shopping-lists/{id}` - GET, PUT, DELETE individual lists
- `/api/shopping-lists/{id}/items/{item}` - PATCH, DELETE list items
- `/api/shopping-lists/generate` - POST generate shopping lists

### User Features

- `/api/user/recipes` - GET, POST user recipes
- `/api/user/recipes/{id}` - GET, DELETE user recipes
- `/api/user/recipes/saved` - GET saved recipes
- `/api/user/recipes/save` - POST save recipe
- `/api/user/recipes/unsave` - POST unsave recipe
- `/api/user/settings/debug` - GET debug settings
- `/api/user/stats` - GET user statistics

### Blog & Content

- `/api/blog/categories` - GET blog categories
- `/api/blog/tags` - GET blog tags
- `/api/blog/comments` - GET, POST blog comments
- `/api/generate-blog` - POST generate blog content
- `/api/generate-tags` - POST generate tags

### Subscription & Payments

- `/api/subscription/checkout` - POST create checkout session
- `/api/subscription/cancel` - POST cancel subscription

### Integrations

- `/api/integrations/calendar` - POST, DELETE calendar integration
- `/api/integrations/shopping-list` - POST, DELETE shopping list integration

### Miscellaneous

- `/api/language` - GET, POST language settings
- `/api/feedback` - POST user feedback
- `/api/newsletter/subscribe` - POST newsletter subscription
- `/api/webhooks/clerk` - POST Clerk webhooks
- `/api/webhooks/stripe` - POST Stripe webhooks
- `/api/test` - GET test endpoint
- `/api/dbtest` - GET database test

## Using the Documentation Interface

### 1. **Browse Endpoints**

- Endpoints are organized by categories (Recipes, Meal Plans, AI, etc.)
- Click on any endpoint to expand its details
- View request parameters, request body schemas, and response formats

### 2. **Authentication Setup** 🔐

**IMPORTANT: Most endpoints require authentication!**

**Step 1: Get Your JWT Token**

- Visit `/api/auth/token` for detailed authentication status and instructions
- OR get your token from browser Developer Tools → Network tab → Authorization header
- Copy the JWT token (without "Bearer " prefix)
- 📖 **[See detailed guide: GET_AUTH_TOKEN_GUIDE.md](GET_AUTH_TOKEN_GUIDE.md)**

**Step 2: Set Authentication in Swagger**

- Click the **🔒 Authorize** button in the top-right of the Swagger UI
- Select "ClerkAuth (http, Bearer)"
- Paste your JWT token in the "Value" field
- Click "Authorize" then "Close"

**Step 3: Test Endpoints**

- All subsequent API calls will include your authentication token automatically
- Look for the 🔒 lock icon next to endpoint names to confirm authentication is active

### 3. **Test Endpoints**

- After setting up authentication, click "Try it out" on any endpoint
- Fill in required parameters and request body
- Click "Execute" to make the API call
- View the live response below

### 4. **Authentication Troubleshooting**

- If API calls return 401 Unauthorized, check your authentication setup in the Swagger UI
- Use `/api/auth/token` for detailed authentication status and instructions
- Click the "🔒 Authorize" button to re-enter or update your JWT token if needed

## Authentication

The API uses Clerk for authentication. All authenticated endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

When using the Swagger UI, authentication is handled automatically if you're logged in through the main application.

## Request/Response Format

All API endpoints follow REST conventions:

- **Content-Type**: `application/json`
- **Response Format**: JSON
- **Error Format**: `{ "error": "Error message" }`

## Adding Documentation to Remaining Endpoints

To document additional API endpoints, add JSDoc comments above your route handler functions:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     tags:
 *       - Your Category
 *     summary: Brief description
 *     description: Detailed description
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 */
export async function GET(req: Request) {
	// Your implementation
}
```

## Quick Documentation Template

For efficiency, here's a template for common patterns:

### GET Endpoint with Pagination

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     tags:
 *       - Category Name
 *     summary: Get items with pagination
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/YourSchema'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
```

### POST Endpoint

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     tags:
 *       - Category Name
 *     summary: Create new item
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourInputSchema'
 *     responses:
 *       200:
 *         description: Created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
```

## Technical Implementation

### Components

1. **Swagger Configuration** (`src/lib/swagger.ts`):
   - OpenAPI 3.0 specification with comprehensive schemas
   - Security schemes for Clerk authentication
   - Base server configuration

2. **Documentation API** (`src/app/api/docs/route.ts`):
   - Serves the OpenAPI specification as JSON
   - Used by Swagger UI to render the interface

3. **Documentation Page** (`src/app/docs/page.tsx`):
   - Next.js page that renders Swagger UI
   - Handles authentication integration
   - Provides custom styling and error handling

### Dependencies

- `swagger-jsdoc`: Generates OpenAPI spec from JSDoc comments
- `swagger-ui-react`: React component for Swagger UI
- `@types/swagger-jsdoc`: TypeScript types
- `@types/swagger-ui-react`: TypeScript types for Swagger UI

## Current Status

✅ **Core Framework**: Complete  
✅ **Major Endpoints**: ~30% documented (key endpoints)  
🔄 **Remaining Endpoints**: ~70% ready for documentation

## Next Steps

1. **Continue Documentation**: Add JSDoc comments to remaining endpoints using the templates above
2. **Test Documentation**: Verify all documented endpoints work in the Swagger UI
3. **Add Examples**: Include realistic request/response examples
4. **Schema Refinement**: Update schemas in `swagger.ts` as needed

## Troubleshooting

### Common Issues

1. **Documentation not loading**:
   - Check that the development server is running
   - Verify `/api/docs` endpoint returns valid JSON
   - Check browser console for errors

2. **Authentication errors**:
   - Ensure you're logged in to the main application
   - Check that JWT tokens are being passed correctly
   - Verify Clerk configuration is correct

3. **Endpoint not appearing**:
   - Ensure JSDoc comments are properly formatted
   - Check that the file path is included in swagger configuration
   - Restart the development server after adding new documentation

### Performance Notes

- The documentation interface is rendered client-side to avoid SSR issues
- OpenAPI specification is generated on-demand when accessing `/api/docs`
- Swagger UI assets are loaded dynamically to reduce initial bundle size

## Contributing

When adding new API endpoints:

1. Always include comprehensive JSDoc documentation
2. Follow the existing patterns for parameter and response schemas
3. Include realistic examples in your documentation
4. Test the documentation interface after adding new endpoints
5. Update this README if you add new features to the documentation system

---

**🎉 Your API documentation system is now fully functional!** Visit `http://localhost:3001/docs` to explore and test your APIs.
