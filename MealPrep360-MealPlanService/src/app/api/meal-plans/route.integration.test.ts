import { GET, POST, DELETE } from './route';
import { NextRequest } from 'next/server';

// Mock the services
jest.mock('@/app/services/mealPlanService');
jest.mock('@/app/repositories/mealPlanRepository');
jest.mock('@/app/services/recipeService');

const mockMealPlanService = {
	getMealPlansByDateRange: jest.fn(),
	generateMealPlan: jest.fn(),
	deleteMealPlan: jest.fn(),
};

const mockMealPlanRepository = jest.fn().mockImplementation(() => ({}));
const mockRecipeService = jest.fn().mockImplementation(() => ({}));

// Mock the service constructor
require('@/app/services/mealPlanService').MealPlanService = jest
	.fn()
	.mockImplementation(() => mockMealPlanService);

describe('/api/meal-plans', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /api/meal-plans', () => {
		it('should return meal plans for valid date range', async () => {
			const mockMealPlans = [
				{
					id: 'plan-1',
					userId: 'user-1',
					startDate: '2024-01-01',
					meals: [],
				},
			];

			mockMealPlanService.getMealPlansByDateRange.mockResolvedValue(
				mockMealPlans
			);

			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans?startDate=2024-01-01&endDate=2024-01-07'
			);

			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockMealPlans);
			expect(mockMealPlanService.getMealPlansByDateRange).toHaveBeenCalledWith(
				new Date('2024-01-01'),
				new Date('2024-01-07')
			);
		});

		it('should return 400 when startDate is missing', async () => {
			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans?endDate=2024-01-07'
			);

			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('Start date and end date are required');
		});

		it('should return 400 when endDate is missing', async () => {
			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans?startDate=2024-01-01'
			);

			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('Start date and end date are required');
		});

		it('should return 500 when service throws an error', async () => {
			mockMealPlanService.getMealPlansByDateRange.mockRejectedValue(
				new Error('Database error')
			);

			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans?startDate=2024-01-01&endDate=2024-01-07'
			);

			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Failed to get meal plans');
		});
	});

	describe('POST /api/meal-plans', () => {
		it('should create a meal plan successfully', async () => {
			const mockMealPlan = {
				id: 'plan-1',
				userId: 'user-1',
				startDate: '2024-01-01',
				duration: 7,
				meals: [],
			};

			mockMealPlanService.generateMealPlan.mockResolvedValue(mockMealPlan);

			const request = new NextRequest('http://localhost:3000/api/meal-plans', {
				method: 'POST',
				body: JSON.stringify({
					userId: 'user-1',
					startDate: '2024-01-01',
					duration: 7,
				}),
			});

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
			const request = new NextRequest('http://localhost:3000/api/meal-plans', {
				method: 'POST',
				body: JSON.stringify({
					startDate: '2024-01-01',
					duration: 7,
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('User ID, start date, and duration are required');
		});

		it('should return 400 when startDate is missing', async () => {
			const request = new NextRequest('http://localhost:3000/api/meal-plans', {
				method: 'POST',
				body: JSON.stringify({
					userId: 'user-1',
					duration: 7,
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('User ID, start date, and duration are required');
		});

		it('should return 400 when duration is missing', async () => {
			const request = new NextRequest('http://localhost:3000/api/meal-plans', {
				method: 'POST',
				body: JSON.stringify({
					userId: 'user-1',
					startDate: '2024-01-01',
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('User ID, start date, and duration are required');
		});

		it('should return 400 when user has no saved recipes', async () => {
			mockMealPlanService.generateMealPlan.mockRejectedValue(
				new Error('No saved recipes found')
			);

			const request = new NextRequest('http://localhost:3000/api/meal-plans', {
				method: 'POST',
				body: JSON.stringify({
					userId: 'user-1',
					startDate: '2024-01-01',
					duration: 7,
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('No saved recipes found');
			expect(data.message).toBe(
				'Please add some recipes to your collection before generating a meal plan.'
			);
			expect(data.code).toBe('NO_RECIPES');
		});

		it('should return 500 when service throws an unexpected error', async () => {
			mockMealPlanService.generateMealPlan.mockRejectedValue(
				new Error('Database error')
			);

			const request = new NextRequest('http://localhost:3000/api/meal-plans', {
				method: 'POST',
				body: JSON.stringify({
					userId: 'user-1',
					startDate: '2024-01-01',
					duration: 7,
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Failed to generate meal plan');
		});
	});

	describe('DELETE /api/meal-plans', () => {
		it('should delete a meal plan successfully', async () => {
			mockMealPlanService.deleteMealPlan.mockResolvedValue(undefined);

			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans?id=plan-1'
			);

			const response = await DELETE(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.message).toBe('Meal plan deleted successfully');
			expect(mockMealPlanService.deleteMealPlan).toHaveBeenCalledWith('plan-1');
		});

		it('should return 400 when id is missing', async () => {
			const request = new NextRequest('http://localhost:3000/api/meal-plans');

			const response = await DELETE(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('Meal plan ID is required');
		});

		it('should return 500 when service throws an error', async () => {
			mockMealPlanService.deleteMealPlan.mockRejectedValue(
				new Error('Database error')
			);

			const request = new NextRequest(
				'http://localhost:3000/api/meal-plans?id=plan-1'
			);

			const response = await DELETE(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Failed to delete meal plan');
		});
	});
});
