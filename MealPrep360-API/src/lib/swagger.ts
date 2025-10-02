import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'MealPrep360 API',
			version: '1.0.0',
			description:
				'Comprehensive API documentation for MealPrep360 meal planning application',
			contact: {
				name: 'MealPrep360 Support',
				email: 'support@mealprep360.com',
			},
		},
		servers: [
			{
				url:
					process.env.NODE_ENV === 'production'
						? process.env.API_URL ||
						  (process.env.VERCEL_URL
								? `https://${process.env.VERCEL_URL}`
								: 'https://api.mealprep360.com')
						: 'http://localhost:3001',
				description:
					process.env.NODE_ENV === 'production'
						? 'Production server'
						: 'Development server',
			},
		],
		components: {
			securitySchemes: {
				ClerkAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Clerk JWT token for authentication',
				},
			},
			schemas: {
				Error: {
					type: 'object',
					properties: {
						error: {
							type: 'string',
							description: 'Error message',
						},
						details: {
							type: 'string',
							description: 'Additional error details',
						},
					},
					required: ['error'],
				},
				User: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
							description: 'User ID',
						},
						clerkId: {
							type: 'string',
							description: 'Clerk authentication ID',
						},
						email: {
							type: 'string',
							format: 'email',
							description: 'User email address',
						},
						firstName: {
							type: 'string',
							description: 'User first name',
						},
						lastName: {
							type: 'string',
							description: 'User last name',
						},
						preferences: {
							$ref: '#/components/schemas/UserPreferences',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
				},
				UserPreferences: {
					type: 'object',
					properties: {
						dietaryRestrictions: {
							type: 'array',
							items: {
								type: 'string',
							},
							description: 'User dietary restrictions',
						},
						allergies: {
							type: 'array',
							items: {
								type: 'string',
							},
							description: 'User allergies',
						},
						cuisinePreferences: {
							type: 'array',
							items: {
								type: 'string',
							},
							description: 'Preferred cuisines',
						},
						cookingSkillLevel: {
							type: 'string',
							enum: ['beginner', 'intermediate', 'advanced'],
							description: 'User cooking skill level',
						},
						maxPrepTime: {
							type: 'number',
							description: 'Maximum preparation time in minutes',
						},
						servingSize: {
							type: 'number',
							description: 'Preferred serving size',
						},
					},
				},
				Recipe: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
							description: 'Unique identifier for the recipe',
						},
						title: {
							type: 'string',
							description: 'Recipe title',
						},
						description: {
							type: 'string',
							description: 'Recipe description',
						},
						ingredients: {
							oneOf: [
								{
									type: 'array',
									items: {
										type: 'string',
									},
								},
								{
									type: 'string',
								},
							],
							description: 'List of ingredients',
						},
						instructions: {
							oneOf: [
								{
									type: 'array',
									items: {
										type: 'string',
									},
								},
								{
									type: 'string',
								},
							],
							description: 'Step-by-step instructions',
						},
						prepTime: {
							type: 'number',
							description: 'Preparation time in minutes',
						},
						cookTime: {
							type: 'number',
							description: 'Cooking time in minutes',
						},
						servings: {
							type: 'number',
							description: 'Number of servings',
						},
						difficulty: {
							type: 'string',
							enum: ['easy', 'medium', 'hard'],
							description: 'Recipe difficulty level',
						},
						cuisine: {
							type: 'string',
							description: 'Cuisine type',
						},
						tags: {
							type: 'array',
							items: {
								type: 'string',
							},
							description: 'Recipe tags',
						},
						imageUrl: {
							type: 'string',
							description: 'Recipe image URL',
						},
						images: {
							type: 'object',
							properties: {
								main: {
									type: 'string',
									description: 'Main image URL',
								},
							},
						},
						nutritionInfo: {
							type: 'object',
							properties: {
								calories: { type: 'number' },
								protein: { type: 'number' },
								carbs: { type: 'number' },
								fat: { type: 'number' },
								fiber: { type: 'number' },
							},
						},
						isPublic: {
							type: 'boolean',
							description: 'Whether the recipe is public',
						},
						clerkId: {
							type: 'string',
							description: 'User ID from Clerk',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
					required: ['title', 'ingredients', 'instructions'],
				},
				MealPlan: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
							description: 'Unique identifier for the meal plan',
						},
						id: {
							type: 'string',
							description: 'Meal plan ID',
						},
						startDate: {
							type: 'string',
							format: 'date',
							description: 'Meal plan start date',
						},
						endDate: {
							type: 'string',
							format: 'date',
							description: 'Meal plan end date',
						},
						userId: {
							type: 'string',
							description: 'User ID',
						},
						days: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/MealPlanDay',
							},
							description: 'Meal plan days',
						},
						recipeItems: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/MealPlanItem',
							},
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
				},
				MealPlanDay: {
					type: 'object',
					properties: {
						date: {
							type: 'string',
							format: 'date',
							description: 'Day date',
						},
						recipeId: {
							type: 'string',
							description: 'Recipe ID for this day',
						},
						recipe: {
							$ref: '#/components/schemas/Recipe',
						},
						servings: {
							type: 'number',
							description: 'Number of servings',
						},
						status: {
							type: 'string',
							enum: ['planned', 'completed', 'skipped'],
							description: 'Day status',
						},
						mealType: {
							type: 'string',
							enum: ['breakfast', 'lunch', 'dinner', 'snack'],
							description: 'Meal type',
						},
						dayIndex: {
							type: 'number',
							description: 'Day index in the meal plan',
						},
					},
				},
				MealPlanItem: {
					type: 'object',
					properties: {
						date: {
							type: 'string',
							format: 'date',
						},
						recipeId: {
							type: 'string',
						},
						userId: {
							type: 'string',
						},
						servings: {
							type: 'number',
						},
						status: {
							type: 'string',
							enum: ['planned', 'completed', 'skipped'],
						},
						mealType: {
							type: 'string',
							enum: ['breakfast', 'lunch', 'dinner', 'snack'],
						},
						dayIndex: {
							type: 'number',
						},
					},
				},
				ShoppingList: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
						},
						name: {
							type: 'string',
						},
						userId: {
							type: 'string',
						},
						items: {
							type: 'array',
							items: {
								$ref: '#/components/schemas/ShoppingListItem',
							},
						},
						status: {
							type: 'string',
							enum: ['active', 'completed', 'archived'],
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
				},
				ShoppingListItem: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
						},
						quantity: {
							type: 'string',
						},
						unit: {
							type: 'string',
						},
						category: {
							type: 'string',
						},
						checked: {
							type: 'boolean',
						},
						recipeId: {
							type: 'string',
						},
					},
				},
				BlogPost: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
						},
						title: {
							type: 'string',
						},
						content: {
							type: 'string',
						},
						excerpt: {
							type: 'string',
						},
						imageUrl: {
							type: 'string',
						},
						tags: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
						categories: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
						author: {
							type: 'string',
						},
						published: {
							type: 'boolean',
						},
						publishedAt: {
							type: 'string',
							format: 'date-time',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
				},
				Pagination: {
					type: 'object',
					properties: {
						total: {
							type: 'number',
							description: 'Total number of items',
						},
						page: {
							type: 'number',
							description: 'Current page number',
						},
						limit: {
							type: 'number',
							description: 'Items per page',
						},
						totalPages: {
							type: 'number',
							description: 'Total number of pages',
						},
					},
				},
				AIResponse: {
					type: 'object',
					properties: {
						content: {
							type: 'string',
							description: 'AI generated content',
						},
						tokens_used: {
							type: 'number',
							description: 'Tokens consumed',
						},
						model: {
							type: 'string',
							description: 'AI model used',
						},
					},
				},
				Subscription: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
						},
						userId: {
							type: 'string',
						},
						stripeCustomerId: {
							type: 'string',
						},
						stripeSubscriptionId: {
							type: 'string',
						},
						status: {
							type: 'string',
							enum: ['active', 'canceled', 'past_due', 'unpaid'],
						},
						currentPeriodStart: {
							type: 'string',
							format: 'date-time',
						},
						currentPeriodEnd: {
							type: 'string',
							format: 'date-time',
						},
						planId: {
							type: 'string',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
				},
			},
		},
		security: [
			{
				ClerkAuth: [],
			},
		],
	},
	apis: ['./src/app/api/**/*.ts'], // Path to the API files
};

export const specs = swaggerJSDoc(options);
