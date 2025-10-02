# MealPrep360 API

This is the API service for MealPrep360, a comprehensive meal planning and recipe management platform. The API is built with Next.js and provides endpoints for recipe management, meal planning, shopping lists, user management, and more.

## 🚀 Features

- **Recipe Management**: Create, search, and manage recipes with AI-powered suggestions
- **Meal Planning**: Generate optimized meal plans with dietary preferences
- **Shopping Lists**: Automatically generate shopping lists from meal plans
- **User Authentication**: Secure authentication via Clerk
- **Social Features**: Follow users, share recipes, and collaborate on meal prep
- **Blog System**: Content management for blog posts and categories
- **Subscription Management**: Stripe integration for premium features
- **Push Notifications**: Real-time notifications for users
- **Multi-language Support**: Internationalization support
- **AI Integration**: OpenAI integration for recipe suggestions and content generation

## 📋 Prerequisites

- Node.js 18+
- MongoDB database
- Clerk account for authentication
- Stripe account for payments
- OpenAI API key (optional, for AI features)

## 🛠️ Setup

1. **Clone the repository:**

```bash
git clone <repository-url>
cd MealPrep360-API
```

2. **Install dependencies:**

```bash
npm install
```

3. **Environment Configuration:**
   Copy the `.env.example` file to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

4. **Start the development server:**

```bash
npm run dev
```

The API will be available at `https://api.mealprep360.com`

## 🆕 Multi-Clerk Authentication

MealPrep360 API supports authentication from multiple Clerk instances. This is essential for production deployments and allows the API to accept tokens from different frontend environments.

**Environment variables for each instance:**

```
CLERK_SECRET_KEY_EARWIG=sk_...
CLERK_PUBLISHABLE_KEY_EARWIG=pk_...
CLERK_SECRET_KEY_MAIN=sk_...
CLERK_PUBLISHABLE_KEY_MAIN=pk_...
CLERK_DOMAIN_MAIN=your-main-instance.clerk.accounts.dev
CLERK_SECRET_KEY=sk_...           # Fallback/local
CLERK_PUBLISHABLE_KEY=pk_...      # Fallback/local
CLERK_DOMAIN=fallback.clerk.accounts.dev
```

See `MULTI_CLERK_SOLUTION.md` and `QUICK_SETUP_GUIDE.md` for more details.

**Test your setup:**

```bash
curl -X GET https://api.mealprep360.com/api/test-auth \
  -H "Authorization: Bearer <YOUR_CLERK_TOKEN>"
```

A successful response will include `"authMethod": "multi-clerk"`.

## 📝 API Documentation

Interactive Swagger/OpenAPI docs are available at:

- **Development:** http://localhost:3001/docs
- **Production:** https://api.mealprep360.com/docs

This documentation provides live testing, request/response schemas, and authentication integration. See `API_DOCUMENTATION.md` for more info.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── ai/                 # AI-powered features
│   │   ├── blog/               # Blog management
│   │   ├── meal-plans/         # Meal planning endpoints
│   │   ├── recipes/            # Recipe management
│   │   ├── shopping-lists/     # Shopping list management
│   │   ├── social/             # Social features
│   │   ├── subscription/       # Stripe integration
│   │   ├── user/               # User management
│   │   └── webhooks/           # Webhook handlers
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── lib/                        # Utility libraries
│   ├── mongodb/                # Database connection and schemas
│   ├── i18n/                   # Internationalization
│   ├── constants/              # Application constants
│   ├── cache.ts                # Caching utilities
│   ├── conversions.ts          # Unit conversion utilities
│   ├── ingredients.ts          # Ingredient parsing and categorization
│   ├── openai.ts               # OpenAI integration
│   └── utils.ts                # General utilities
├── types/                      # TypeScript type definitions
└── middleware.ts               # Next.js middleware
```

## 🔌 API Endpoints

### Authentication

All endpoints require authentication via Clerk. Include the authorization token in request headers:

```
Authorization: Bearer <clerk_session_token>
```

### Core Endpoints

#### User Preferences

- **GET /api/user/preferences** - Get user dietary preferences and cooking settings
- **POST /api/user/preferences** - Update user dietary preferences

#### Meal Planning

- **GET /api/skipped-days** - Get skipped meal plan days for a date range

#### Recipes

##### `GET /api/recipes` - List recipes with filtering and pagination

**Query Parameters:**

- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 15) - Number of recipes per page
- `search` (string) - Search term for recipe title/description
- `tags` (string) - Comma-separated list of tags to filter by
- `sortBy` (string, default: 'createdAt') - Field to sort by
- `sortOrder` (string, default: 'desc') - Sort order (asc/desc)
- `prepTime` (string, default: 'all') - Filter by prep time (quick/medium/long/all)

**Response:**

```json
{
	"recipes": [
		{
			"_id": "recipe_id",
			"title": "Chicken Stir Fry",
			"description": "Quick and healthy chicken stir fry with fresh vegetables",
			"ingredients": [
				"2 chicken breasts",
				"1 cup broccoli",
				"2 tbsp soy sauce"
			],
			"instructions": [
				"Cut chicken into bite-sized pieces",
				"Chop broccoli into florets",
				"Prepare sauce mixture"
			],
			"cookingInstructions": [
				"Heat oil in pan",
				"Cook chicken until golden",
				"Add vegetables and sauce"
			],
			"prepTime": 15,
			"cookTime": 20,
			"servings": 4,
			"difficulty": "easy",
			"cuisine": "Asian",
			"mealType": "dinner",
			"category": "Main Course",
			"tags": ["quick", "healthy", "protein"],
			"imageUrl": "https://example.com/image.jpg",
			"isPublic": false,
			"allergenInfo": ["SOY"],
			"dietaryInfo": ["GLUTEN_FREE"],
			"nutrition": {
				"calories": 320,
				"protein": 35,
				"carbs": 12,
				"fat": 15,
				"fiber": 4,
				"sugar": 8,
				"sodium": 680
			},
			"createdAt": "2024-01-01T00:00:00.000Z",
			"updatedAt": "2024-01-01T00:00:00.000Z"
		}
	],
	"pagination": {
		"total": 25,
		"page": 1,
		"limit": 15,
		"totalPages": 2
	}
}
```

##### `POST /api/recipes` - Create a new recipe

**Required Fields:** `title`, `ingredients`, `instructions`

**Fields with Defaults:**

- `mealType` (string) - Defaults to "dinner" (options: "breakfast", "lunch", "dinner", "snacks")
- `isPublic` (boolean) - Defaults to false
- `createdAt` (Date) - Auto-set to current timestamp
- `updatedAt` (Date) - Auto-set to current timestamp
- `clerkId` (string) - Auto-set from authenticated user

**Optional Fields:**

- `description` (string) - Recipe description
- `prepTime` (number) - Preparation time in minutes
- `cookTime` (number) - Cooking time in minutes
- `servings` (number) - Number of servings
- `difficulty` (string) - "easy", "medium", or "hard"
- `cuisine` (string) - Cuisine type (e.g., "Asian", "Italian")
- `category` (string) - Recipe category (e.g., "Main Course", "Appetizer")
- `tags` (array) - Array of tag strings
- `imageUrl` (string) - URL to recipe image
- `summary` (string) - Brief recipe summary
- `season` (string) - Seasonal information
- `originalLanguage` (string) - Original language code
- `defrostInstructions` (string) - Instructions for defrosting
- `freezerPrep` (string) - Freezer preparation instructions
- `containerSuggestions` (string) - Storage container recommendations
- `cookingInstructions` (array) - Step-by-step cooking instructions
- `servingInstructions` (array) - Serving recommendations
- `storageTime` (string) - Storage duration information
- `prepInstructions` (array) - Preparation steps before cooking
- `allergenInfo` (array) - Allergen information (GLUTEN, DAIRY, NUTS, EGGS, SOY, FISH, SHELLFISH)
- `dietaryInfo` (array) - Dietary information (VEGETARIAN, VEGAN, GLUTEN_FREE, DAIRY_FREE, NUT_FREE)
- `nutrition` (object) - Nutritional information with calories, protein, carbs, fat, fiber, sugar, sodium

**Request Body:**

```json
{
	"title": "Chicken Stir Fry",
	"description": "Quick and healthy chicken stir fry with fresh vegetables",
	"ingredients": ["2 chicken breasts", "1 cup broccoli", "2 tbsp soy sauce"],
	"instructions": [
		"Cut chicken into bite-sized pieces",
		"Chop broccoli into florets",
		"Prepare sauce mixture"
	],
	"prepTime": 15,
	"cookTime": 20,
	"servings": 4,
	"difficulty": "easy",
	"cuisine": "Asian",
	"tags": ["quick", "healthy", "protein"],
	"imageUrl": "https://example.com/image.jpg",
	"isPublic": false,
	"mealType": "dinner",
	"category": "Main Course",
	"summary": "A delicious and nutritious stir fry perfect for weeknight dinners",
	"season": "all-season",
	"originalLanguage": "en",
	"defrostInstructions": "If using frozen chicken, thaw completely before cooking",
	"freezerPrep": "Can be prepped and frozen for up to 3 months",
	"containerSuggestions": "Store in airtight glass containers",
	"cookingInstructions": [
		"Heat oil in pan",
		"Cook chicken until golden",
		"Add vegetables and sauce"
	],
	"servingInstructions": [
		"Serve immediately over rice",
		"Garnish with green onions",
		"Add chili flakes if desired"
	],
	"storageTime": "3-4 days in refrigerator",
	"prepInstructions": [
		"Marinate chicken for 30 minutes",
		"Prep all vegetables before cooking"
	],
	"allergenInfo": ["SOY"],
	"dietaryInfo": ["GLUTEN_FREE"],
	"nutrition": {
		"calories": 320,
		"protein": 35,
		"carbs": 12,
		"fat": 15,
		"fiber": 4,
		"sugar": 8,
		"sodium": 680
	}
}
```

**Response:**

```json
{
	"_id": "recipe_id",
	"title": "Chicken Stir Fry",
	"description": "Quick and healthy chicken stir fry with fresh vegetables",
	"ingredients": "2 chicken breasts\n1 cup broccoli\n2 tbsp soy sauce",
	"instructions": "Cut chicken into bite-sized pieces\nChop broccoli into florets\nPrepare sauce mixture",
	"prepTime": 15,
	"cookTime": 20,
	"servings": 4,
	"difficulty": "easy",
	"cuisine": "Asian",
	"tags": ["quick", "healthy", "protein"],
	"imageUrl": "https://example.com/image.jpg",
	"isPublic": false,
	"mealType": "dinner",
	"category": "Main Course",
	"summary": "A delicious and nutritious stir fry perfect for weeknight dinners",
	"season": "all-season",
	"originalLanguage": "en",
	"defrostInstructions": "If using frozen chicken, thaw completely before cooking",
	"freezerPrep": "Can be prepped and frozen for up to 3 months",
	"containerSuggestions": "Store in airtight glass containers",
	"cookingInstructions": "Heat oil in pan\nCook chicken until golden\nAdd vegetables and sauce",
	"servingInstructions": "Serve immediately over rice\nGarnish with green onions\nAdd chili flakes if desired",
	"storageTime": "3-4 days in refrigerator",
	"prepInstructions": "Marinate chicken for 30 minutes\nPrep all vegetables before cooking",
	"allergenInfo": ["SOY"],
	"dietaryInfo": ["GLUTEN_FREE"],
	"nutrition": {
		"calories": 320,
		"protein": 35,
		"carbs": 12,
		"fat": 15,
		"fiber": 4,
		"sugar": 8,
		"sodium": 680
	},
	"clerkId": "user_clerk_id",
	"createdAt": "2024-01-01T00:00:00.000Z",
	"updatedAt": "2024-01-01T00:00:00.000Z"
}
```

##### `POST /api/recipes/[id]/saved` - Save/unsave a recipe

**Request Body:**

```json
{
	"action": "save"
}
```

**Response:**

```json
{
	"message": "Recipe saved successfully",
	"saved": true,
	"usage": {
		"current": 5,
		"limit": "unlimited",
		"remaining": "unlimited"
	}
}
```

#### Meal Plans

##### `GET /api/meal-plans` - List user's meal plans

**Query Parameters:**

- `startDate` (string, ISO date) - Filter by start date
- `endDate` (string, ISO date) - Filter by end date

**Response:**

```json
[
	{
		"_id": "meal_plan_id",
		"id": "meal_plan_id",
		"startDate": "2024-01-01T00:00:00.000Z",
		"endDate": "2024-01-07T00:00:00.000Z",
		"userId": "user_id",
		"days": [
			{
				"date": "2024-01-01T00:00:00.000Z",
				"recipeId": "recipe_id",
				"recipe": {
					"id": "recipe_id",
					"title": "Chicken Stir Fry",
					"servings": 4,
					"prepTime": 15,
					"imageUrl": "https://example.com/image.jpg"
				},
				"servings": 4,
				"status": "planned",
				"mealType": "dinner",
				"dayIndex": 0
			}
		],
		"createdAt": "2024-01-01T00:00:00.000Z",
		"updatedAt": "2024-01-01T00:00:00.000Z"
	}
]
```

##### `POST /api/meal-plans` - Create a new meal plan

**Request Body:**

```json
{
	"date": "2024-01-01",
	"recipeId": "recipe_id",
	"servings": 4
}
```

**Response:**

```json
{
	"_id": "meal_plan_id",
	"userId": "user_id",
	"date": "2024-01-01T00:00:00.000Z",
	"recipeId": "recipe_id",
	"servings": 4,
	"status": "planned",
	"createdAt": "2024-01-01T00:00:00.000Z",
	"updatedAt": "2024-01-01T00:00:00.000Z"
}
```

##### `PATCH /api/meal-plans/[mealPlanId]/days/[dayIndex]` - Update meal plan day

**Request Body:**

```json
{
	"recipeId": "recipe_id",
	"status": "completed"
}
```

**Response:**

```json
{
	"message": "Meal plan updated successfully",
	"mealPlan": {
		"id": "meal_plan_id",
		"dayIndex": 0,
		"status": "completed"
	}
}
```

##### `GET /api/skipped-days` - Get skipped meal plan days for a date range

**Query Parameters:**

- `startDate` (string, ISO date, required) - Start date for the range (e.g., "2024-01-01")
- `endDate` (string, ISO date, required) - End date for the range (e.g., "2024-01-31")

**Response:**

```json
[
	{
		"date": "2024-01-15T00:00:00.000Z",
		"status": "skipped"
	},
	{
		"date": "2024-01-22T00:00:00.000Z",
		"status": "skipped"
	}
]
```

**Error Responses:**

```json
{
	"error": "startDate and endDate are required"
}
```

#### Shopping Lists

##### `GET /api/shopping-lists` - List shopping lists

**Response:**

```json
[
	{
		"_id": "shopping_list_id",
		"userId": "user_id",
		"name": "Shopping List 1/1/2024",
		"status": "ACTIVE",
		"items": [
			{
				"id": "item_id",
				"name": "Chicken breast",
				"quantity": 2,
				"unit": "lb",
				"category": "Meat & Poultry",
				"status": "PENDING",
				"normalizedQuantity": 0.9,
				"normalizedUnit": "kg"
			}
		],
		"createdAt": "2024-01-01T00:00:00.000Z",
		"updatedAt": "2024-01-01T00:00:00.000Z"
	}
]
```

##### `POST /api/shopping-lists/generate` - Generate from meal plans

**Request Body:**

```json
{
	"mealPlanId": "meal_plan_id",
	"startDate": "2024-01-01",
	"endDate": "2024-01-07"
}
```

**Response:**

```json
{
	"_id": "shopping_list_id",
	"userId": "user_id",
	"name": "Shopping List 1/1/2024",
	"status": "ACTIVE",
	"items": [
		{
			"id": "item_id",
			"name": "Chicken breast",
			"quantity": 2,
			"unit": "lb",
			"category": "Meat & Poultry",
			"status": "PENDING",
			"normalizedQuantity": 0.9,
			"normalizedUnit": "kg"
		}
	],
	"createdAt": "2024-01-01T00:00:00.000Z",
	"updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### User Management

##### `GET /api/user` - Get user profile

**Response:**

```json
{
	"id": "user_id",
	"name": "John Doe",
	"email": "john@example.com",
	"image": "https://example.com/avatar.jpg"
}
```

##### `GET /api/user/preferences` - Get user dietary preferences and cooking settings

**Response:**

```json
{
	"settings": {
		"theme": {
			"mode": "light",
			"contrast": false,
			"animations": true
		},
		"display": {
			"recipeLayout": "grid",
			"fontSize": "medium",
			"imageQuality": "high"
		},
		"language": {
			"preferred": "en",
			"measurementSystem": "metric"
		},
		"notifications": {
			"email": true,
			"push": true,
			"mealPlanReminders": true,
			"shoppingListReminders": true,
			"quietHours": {
				"enabled": false,
				"start": "22:00",
				"end": "08:00"
			}
		},
		"privacy": {
			"profileVisibility": "public",
			"shareRecipes": true,
			"showCookingHistory": true
		},
		"security": {
			"twoFactorAuth": false
		},
		"mealPlanning": {
			"weeklyPlanningEnabled": true,
			"shoppingListEnabled": true,
			"nutritionTrackingEnabled": false,
			"defaultDuration": "7",
			"defaultServings": 4
		},
		"integrations": {
			"calendar": "none",
			"shoppingList": "none"
		},
		"preferences": {
			"dietaryPreferences": ["vegetarian", "gluten-free"],
			"allergies": ["nuts"],
			"cookingSkill": "intermediate",
			"cookingTime": "30-60",
			"cuisines": ["italian", "asian"],
			"kidFriendly": true,
			"quickMeals": true,
			"healthy": true
		},
		"onboarding": {
			"tutorialCompleted": true
		}
	}
}
```

**Error Responses:**

```json
{
	"error": "User not found"
}
```

##### `POST /api/user/preferences` - Update user dietary preferences

**Request Body:**

```json
{
	"preferences": ["vegetarian", "gluten-free", "low-sodium"]
}
```

**Response:**

```json
{
	"preferences": ["vegetarian", "gluten-free", "low-sodium"]
}
```

**Error Responses:**

```json
{
	"error": "Invalid preferences format"
}
```

##### `GET /api/user/settings` - Get user settings

**Response:**

```json
{
	"theme": {
		"mode": "light",
		"contrast": false,
		"animations": true
	},
	"display": {
		"recipeLayout": "grid",
		"fontSize": "medium",
		"imageQuality": "high"
	},
	"language": {
		"preferred": "en",
		"measurementSystem": "metric"
	},
	"notifications": {
		"email": true,
		"push": true,
		"mealPlanReminders": true,
		"shoppingListReminders": true,
		"quietHours": {
			"enabled": false,
			"start": "22:00",
			"end": "08:00"
		}
	},
	"privacy": {
		"profileVisibility": "public",
		"shareRecipes": true,
		"showCookingHistory": true
	},
	"security": {
		"twoFactorAuth": false
	},
	"mealPlanning": {
		"weeklyPlanningEnabled": true,
		"shoppingListEnabled": true,
		"nutritionTrackingEnabled": false,
		"defaultDuration": "7",
		"defaultServings": 4
	},
	"integrations": {
		"calendar": "none",
		"shoppingList": "none"
	},
	"preferences": {
		"dietaryPreferences": ["vegetarian"],
		"allergies": ["nuts"],
		"cookingSkill": "intermediate",
		"cookingTime": "30-60",
		"cuisines": ["italian", "asian"],
		"kidFriendly": true,
		"quickMeals": true,
		"healthy": true
	},
	"onboarding": {
		"tutorialCompleted": true
	}
}
```

##### `PUT /api/user/settings` - Update user settings

**Request Body:**

```json
{
	"theme": {
		"mode": "dark"
	},
	"preferences": {
		"dietaryPreferences": ["vegan"]
	}
}
```

**Response:**

```json
{
	"theme": {
		"mode": "dark",
		"contrast": false,
		"animations": true
	},
	"preferences": {
		"dietaryPreferences": ["vegan"],
		"allergies": ["nuts"],
		"cookingSkill": "intermediate",
		"cookingTime": "30-60",
		"cuisines": ["italian", "asian"],
		"kidFriendly": true,
		"quickMeals": true,
		"healthy": true
	}
}
```

#### AI Features

##### `POST /api/ai` - Generate AI content

**Request Body:**

```json
{
	"type": "recipe",
	"query": "healthy chicken dinner for 4 people"
}
```

**Response:**

```json
{
	"recipes": [
		{
			"title": "Grilled Chicken with Vegetables",
			"description": "Healthy grilled chicken with seasonal vegetables",
			"ingredients": [
				"4 chicken breasts",
				"2 cups mixed vegetables",
				"2 tbsp olive oil"
			],
			"instructions": [
				"Season chicken with salt and pepper",
				"Prepare vegetables by washing and chopping",
				"Preheat grill to medium-high heat"
			],
			"cookingInstructions": [
				"Grill chicken for 6-8 minutes per side",
				"Add vegetables to grill for last 5 minutes",
				"Let rest for 2 minutes before serving"
			],
			"prepTime": 15,
			"cookTime": 20,
			"servings": 4
		}
	],
	"usage": {
		"remaining": 8,
		"limit": 10,
		"percentage": 20
	}
}
```

##### `POST /api/ai/suggestions` - Get AI recipe suggestions

**Request Body:**

```json
{
	"query": "quick pasta dinner"
}
```

**Response:**

```json
{
	"aiSuggestions": "Based on your query, here are some quick pasta dinner ideas...",
	"recipes": [
		{
			"title": "Spaghetti Aglio e Olio",
			"description": "Simple Italian pasta with garlic and olive oil",
			"prepTime": 10,
			"cookTime": 15,
			"servings": 4
		}
	]
}
```

#### Blog

##### `GET /api/blog/posts` - List blog posts

**Query Parameters:**

- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Posts per page
- `category` (string) - Filter by category
- `tags` (string) - Comma-separated tags

**Response:**

```json
{
	"posts": [
		{
			"_id": "post_id",
			"title": "10 Quick Meal Prep Ideas",
			"content": "Here are some great meal prep ideas...",
			"excerpt": "Quick meal prep ideas for busy weekdays",
			"slug": "10-quick-meal-prep-ideas",
			"author": {
				"name": "John Doe",
				"image": "https://example.com/avatar.jpg"
			},
			"category": "meal-prep",
			"tags": ["meal-prep", "quick", "healthy"],
			"featuredImage": "https://example.com/featured.jpg",
			"published": true,
			"publishedAt": "2024-01-01T00:00:00.000Z",
			"createdAt": "2024-01-01T00:00:00.000Z",
			"updatedAt": "2024-01-01T00:00:00.000Z"
		}
	],
	"pagination": {
		"total": 50,
		"page": 1,
		"limit": 10,
		"totalPages": 5
	}
}
```

#### Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**

```json
{
	"error": "Unauthorized"
}
```

**404 Not Found:**

```json
{
	"error": "Resource not found"
}
```

**400 Bad Request:**

```json
{
	"error": "Missing required fields",
	"details": "Title, ingredients, and instructions are required"
}
```

**500 Internal Server Error:**

```json
{
	"error": "Internal server error",
	"details": "Database connection failed"
}
```

**403 Usage Limit Exceeded:**

```json
{
	"error": "Usage limit exceeded",
	"type": "USAGE_LIMIT_EXCEEDED",
	"feature": "aiRecipes"
}
```

## 🆕 Recently Added Endpoints

- `GET /api/user/preferences` – Get user dietary preferences and settings
- `POST /api/user/preferences` – Update user dietary preferences
- `GET /api/skipped-days` – Get skipped meal plan days
- `POST /api/ai` – Generate AI content
- `POST /api/ai/suggestions` – Get AI recipe suggestions
- `POST /api/generate-image` – Generate recipe images
- `POST /api/generate-blog` – Generate blog content
- `GET /api/auth/token` – Get auth token status
- `POST /api/security/2fa` – Two-factor authentication
- `POST /api/webhooks/clerk` – Clerk webhooks
- `GET /api/subscription` – Get subscription info
- `GET /api/admin/analytics` – Admin analytics
- `POST /api/integrations/calendar` – Calendar integration
- `POST /api/integrations/shopping-list` – Shopping list integration
- `POST /api/newsletter/subscribe` – Newsletter signup
- `POST /api/language` – Language settings
- `POST /api/feedback` – User feedback

## 🏗️ Recent Updates

- Created missing utility modules (`i18n/language`, `conversions`, `shoppingList`, `constants/tags`)
- Fixed Stripe API version compatibility
- Resolved TypeScript declaration and import path issues
- Added missing package dependencies
- Updated database connection handling for reliability
- Migrated business logic from Admin project to centralize all backend operations

## 🧪 Development

### Build the Project

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## 🧪 Testing & Debugging

- Run all tests: `npm test`
- Lint: `npm run lint`
- Type check: `npm run type-check`
- **Test authentication:** Use `/api/test-auth` as shown above to verify Clerk token acceptance and debug multi-Clerk setup.

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

### Docker

```bash
docker build -t mealprep360-api .
docker run -p 3000:3000 mealprep360-api
```

### Environment Setup for Production

Ensure all environment variables are properly configured in your deployment platform.

## 🔧 Database Schema

The application uses MongoDB with Mongoose ODM. Key collections include:

- `users` - User profiles and authentication data
- `recipes` - Recipe information and metadata
- `mealplans` - Meal planning data
- `shoppinglists` - Shopping list items and status
- `userrecipes` - User-recipe relationships (saved, created)
- `blogposts` - Blog content and metadata

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🏷️ Subscription Plan Features

| Plan         | Saved Recipes | Meal Plans | AI Recipes | Freezer Inventory | Social | Support        |
| ------------ | ------------- | ---------- | ---------- | ----------------- | ------ | -------------- |
| Free         | 5             | 1 Week     | 0          | No                | No     | Email          |
| Starter      | Unlimited     | 2 Weeks    | 3          | 10 Items          | No     | Email          |
| Plus         | Unlimited     | 4 Weeks    | 15         | Unlimited         | Yes    | Priority Email |
| Family       | Unlimited     | Unlimited  | Unlimited  | Unlimited         | Yes    | Phone & Email  |
| Professional | Unlimited     | Unlimited  | Unlimited  | Unlimited         | Yes    | Dedicated Mgr  |

_See `src/types/subscription.ts` for a full list of features per plan._
