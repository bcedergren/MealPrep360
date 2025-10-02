import { POST, GET, PUT, DELETE, PATCH } from './route';
import { NextRequest } from 'next/server';

// Mock the services
jest.mock('@/app/services/mealPlanService');
jest.mock('@/app/repositories/mealPlanRepository');
jest.mock('@/app/services/recipeService');

const mockMealPlanService = {
	generateMealPlan: jest.fn(),
};

const mockMealPlanRepository = jest.fn().mockImplementation(() => ({}));
const mockRecipeService = jest.fn().mockImplementation(() => ({}));

// Mock the service constructor
require('@/app/services/mealPlanService').MealPlanService = jest
	.fn()
	.mockImplementation(() => mockMealPlanService);

describe('/api/meal-plans/generate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /api/meal-plans/generate', () => {
		it('should generate a meal plan successfully', async () => {
			const mockMealPlan = {
				id: 'plan-1',
				userId: 'user-1',
				startDate: '2024-01-01',
				duration: 7,
				days: [],
			};

			mockMealPlanService.generateMealPlan.mockResolvedValue(mockMealPlan);

			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans/generate',
				{
					method: 'POST',
					body: JSON.stringify({
						userId: 'user-1',
						startDate: '2024-01-01',
						duration: 7,
					}),
				}
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockMealPlan);
			expect(mockMealPlanService.generateMealPlan).toHaveBeenCalledWith(
				'user-1',
				{
					startDate: new Date('2024-01-01'),
					duration: 7,
				}
			);
		});

		it('should return 400 when userId is missing', async () => {
			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans/generate',
				{
					method: 'POST',
					body: JSON.stringify({
						startDate: '2024-01-01',
						duration: 7,
					}),
				}
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('User ID, start date, and duration are required');
		});

		it('should return 400 when user has no saved recipes', async () => {
			mockMealPlanService.generateMealPlan.mockRejectedValue(
				new Error('No saved recipes found')
			);

			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans/generate',
				{
					method: 'POST',
					body: JSON.stringify({
						userId: 'user-1',
						startDate: '2024-01-01',
						duration: 7,
					}),
				}
			);

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('No saved recipes found');
			expect(data.code).toBe('NO_RECIPES');
		});
	});

	describe('Other HTTP methods', () => {
		it('should return 405 for GET requests', async () => {
			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(405);
			expect(data.error).toBe(
				'Method not allowed. Use POST to generate meal plans.'
			);
		});

		it('should return 405 for PUT requests', async () => {
			const response = await PUT();
			const data = await response.json();

			expect(response.status).toBe(405);
			expect(data.error).toBe(
				'Method not allowed. Use POST to generate meal plans.'
			);
		});

		it('should return 405 for DELETE requests', async () => {
			const response = await DELETE();
			const data = await response.json();

			expect(response.status).toBe(405);
			expect(data.error).toBe(
				'Method not allowed. Use POST to generate meal plans.'
			);
		});

		it('should return 405 for PATCH requests', async () => {
			const response = await PATCH();
			const data = await response.json();

			expect(response.status).toBe(405);
			expect(data.error).toBe(
				'Method not allowed. Use POST to generate meal plans.'
			);
		});
	});
});
