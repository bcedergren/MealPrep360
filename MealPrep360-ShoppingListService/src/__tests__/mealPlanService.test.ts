import { MealPlanService } from '../services/mealPlanService';
import { MealPlanModel } from '../models/MealPlan';

jest.mock('../models/MealPlan');

describe('MealPlanService', () => {
	const service = new MealPlanService();
	const mockMealPlan = {
		_id: '1',
		userId: 'user1',
		items: [{ recipeId: 'r1', servings: 2 }],
		createdAt: new Date(),
		updatedAt: new Date(),
		toObject: function () {
			return this;
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('getMealPlan returns a meal plan', async () => {
		(MealPlanModel.findOne as any).mockResolvedValueOnce(mockMealPlan);
		const mealPlan = await service.getMealPlan('1', 'user1');
		expect(mealPlan?.userId).toBe('user1');
		expect(mealPlan?.items[0].recipeId).toBe('r1');
	});

	it('getMealPlan returns null if not found', async () => {
		(MealPlanModel.findOne as any).mockResolvedValueOnce(null);
		const mealPlan = await service.getMealPlan('2', 'user2');
		expect(mealPlan).toBeNull();
	});

	it('getMealPlan throws on error', async () => {
		(MealPlanModel.findOne as any).mockRejectedValueOnce(new Error('fail'));
		await expect(service.getMealPlan('1', 'user1')).rejects.toThrow('fail');
	});
});
