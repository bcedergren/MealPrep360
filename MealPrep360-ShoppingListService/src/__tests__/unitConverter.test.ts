import { normalizeIngredients } from '../services/unitConverter';
import { Unit, Ingredient } from '../types';

describe('unitConverter', () => {
	describe('normalizeIngredients', () => {
		it('should normalize weight units and combine them', () => {
			const ingredients: Ingredient[] = [
				{ name: 'Flour', amount: 500, unit: 'g', category: 'Pantry' },
				{ name: 'Flour', amount: 0.5, unit: 'kg', category: 'Pantry' },
			];
			const result = normalizeIngredients(ingredients);
			expect(
				result[0].normalizedAmount + result[1].normalizedAmount
			).toBeCloseTo(1, 2); // 1kg
			expect(['kg', 'g']).toContain(result[0].normalizedUnit);
		});

		it('should normalize volume units and combine them', () => {
			const ingredients: Ingredient[] = [
				{ name: 'Milk', amount: 500, unit: 'ml', category: 'Dairy' },
				{ name: 'Milk', amount: 0.5, unit: 'l', category: 'Dairy' },
			];
			const result = normalizeIngredients(ingredients);
			expect(
				result[0].normalizedAmount + result[1].normalizedAmount
			).toBeCloseTo(1, 2); // 1l
			expect(['l', 'ml']).toContain(result[0].normalizedUnit);
		});

		it('should leave count-based units unchanged', () => {
			const ingredients: Ingredient[] = [
				{ name: 'Egg', amount: 2, unit: 'whole', category: 'Produce' },
				{ name: 'Pinch of Salt', amount: 1, unit: 'pinch', category: 'Spices' },
			];
			const result = normalizeIngredients(ingredients);
			expect(result[0].normalizedAmount).toBe(2);
			expect(result[0].normalizedUnit).toBe('whole');
			expect(result[1].normalizedAmount).toBe(1);
			expect(result[1].normalizedUnit).toBe('pinch');
		});
	});
});
