/// <reference types="jest" />
import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Mock the auth function
jest.mock('@clerk/nextjs/server', () => ({
	auth: jest.fn(),
}));

// Mock the MongoDB connection and Recipe model
jest.mock('@/lib/mongodb/connection', () => jest.fn());
jest.mock('@/lib/mongodb/schemas', () => ({
	Recipe: {
		create: jest.fn(),
		find: jest.fn(),
		countDocuments: jest.fn(),
	},
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/recipes', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /api/recipes', () => {
		it('should create a recipe successfully', async () => {
			// Mock authenticated user
			mockAuth.mockResolvedValue({ userId: 'test-user-id' });

			// Mock Recipe.create
			const mockRecipe = {
				_id: 'test-recipe-id',
				title: 'Test Recipe',
				description: 'A test recipe',
				ingredients: 'Test ingredients',
				instructions: 'Test instructions',
				prepTime: 15,
				cookTime: 30,
				servings: 4,
				clerkId: 'test-user-id',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const { Recipe } = require('@/lib/mongodb/schemas');
			Recipe.create.mockResolvedValue(mockRecipe);

			// Create request with valid recipe data
			const requestBody = {
				title: 'Test Recipe',
				description: 'A test recipe',
				ingredients: ['ingredient 1', 'ingredient 2'],
				instructions: ['step 1', 'step 2'],
				prepTime: 15,
				cookTime: 30,
				servings: 4,
				difficulty: 'easy',
				cuisine: 'Test Cuisine',
				tags: ['test', 'recipe'],
				isPublic: false,
			};

			const request = new NextRequest('http://localhost:3001/api/recipes', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data._id).toBe('test-recipe-id');
			expect(data.title).toBe('Test Recipe');
			expect(Recipe.create).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Test Recipe',
					clerkId: 'test-user-id',
					ingredients: 'ingredient 1\ningredient 2',
					instructions: 'step 1\nstep 2',
				})
			);
		});

		it('should return 401 for unauthenticated users', async () => {
			// Mock unauthenticated user
			mockAuth.mockResolvedValue({ userId: null });

			const requestBody = {
				title: 'Test Recipe',
				ingredients: ['ingredient 1'],
				instructions: ['step 1'],
			};

			const request = new NextRequest('http://localhost:3001/api/recipes', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Unauthorized');
		});

		it('should return 400 for missing required fields', async () => {
			// Mock authenticated user
			mockAuth.mockResolvedValue({ userId: 'test-user-id' });

			const requestBody = {
				title: 'Test Recipe',
				// Missing ingredients and instructions
			};

			const request = new NextRequest('http://localhost:3001/api/recipes', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('Missing required fields');
		});

		it('should handle array ingredients correctly', async () => {
			mockAuth.mockResolvedValue({ userId: 'test-user-id' });

			const mockRecipe = {
				_id: 'test-recipe-id',
				title: 'Test Recipe',
				ingredients: 'ingredient 1\ningredient 2',
				instructions: 'step 1\nstep 2',
				clerkId: 'test-user-id',
			};

			const { Recipe } = require('@/lib/mongodb/schemas');
			Recipe.create.mockResolvedValue(mockRecipe);

			const requestBody = {
				title: 'Test Recipe',
				ingredients: ['ingredient 1', 'ingredient 2'],
				instructions: ['step 1', 'step 2'],
			};

			const request = new NextRequest('http://localhost:3001/api/recipes', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await POST(request);

			expect(response.status).toBe(200);
			expect(Recipe.create).toHaveBeenCalledWith(
				expect.objectContaining({
					ingredients: 'ingredient 1\ningredient 2',
					instructions: 'step 1\nstep 2',
				})
			);
		});

		it('should handle string ingredients correctly', async () => {
			mockAuth.mockResolvedValue({ userId: 'test-user-id' });

			const mockRecipe = {
				_id: 'test-recipe-id',
				title: 'Test Recipe',
				ingredients: 'ingredient 1\ningredient 2',
				instructions: 'step 1\nstep 2',
				clerkId: 'test-user-id',
			};

			const { Recipe } = require('@/lib/mongodb/schemas');
			Recipe.create.mockResolvedValue(mockRecipe);

			const requestBody = {
				title: 'Test Recipe',
				ingredients: 'ingredient 1\ningredient 2',
				instructions: 'step 1\nstep 2',
			};

			const request = new NextRequest('http://localhost:3001/api/recipes', {
				method: 'POST',
				body: JSON.stringify(requestBody),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const response = await POST(request);

			expect(response.status).toBe(200);
			expect(Recipe.create).toHaveBeenCalledWith(
				expect.objectContaining({
					ingredients: 'ingredient 1\ningredient 2',
					instructions: 'step 1\nstep 2',
				})
			);
		});
	});

	describe('GET /api/recipes', () => {
		it('should return paginated recipes', async () => {
			mockAuth.mockResolvedValue({ userId: 'test-user-id' });

			const mockRecipes = [
				{ _id: '1', title: 'Recipe 1', clerkId: 'test-user-id' },
				{ _id: '2', title: 'Recipe 2', clerkId: 'test-user-id' },
			];

			const { Recipe } = require('@/lib/mongodb/schemas');
			Recipe.find.mockReturnValue({
				sort: jest.fn().mockReturnValue({
					skip: jest.fn().mockReturnValue({
						limit: jest.fn().mockResolvedValue(mockRecipes),
					}),
				}),
			});
			Recipe.countDocuments.mockResolvedValue(2);

			const request = new NextRequest(
				'http://localhost:3001/api/recipes?page=1&limit=10'
			);

			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.recipes).toHaveLength(2);
			expect(data.pagination).toHaveProperty('page');
			expect(data.pagination).toHaveProperty('limit');
			expect(data.pagination).toHaveProperty('total');
		});

		it('should return 401 for unauthenticated users', async () => {
			mockAuth.mockResolvedValue({ userId: null });

			const request = new NextRequest('http://localhost:3001/api/recipes');

			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Unauthorized');
		});

		it('should handle search queries', async () => {
			mockAuth.mockResolvedValue({ userId: 'test-user-id' });

			const mockRecipes = [
				{ _id: '1', title: 'Chicken Recipe', clerkId: 'test-user-id' },
			];

			const { Recipe } = require('@/lib/mongodb/schemas');
			Recipe.find.mockReturnValue({
				sort: jest.fn().mockReturnValue({
					skip: jest.fn().mockReturnValue({
						limit: jest.fn().mockResolvedValue(mockRecipes),
					}),
				}),
			});
			Recipe.countDocuments.mockResolvedValue(1);

			const request = new NextRequest(
				'http://localhost:3001/api/recipes?search=chicken'
			);

			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(Recipe.find).toHaveBeenCalledWith(
				expect.objectContaining({
					$and: expect.arrayContaining([
						expect.objectContaining({
							$or: expect.any(Array),
						}),
					]),
				})
			);
		});
	});
});
