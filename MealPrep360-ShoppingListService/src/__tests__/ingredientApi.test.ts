import { createMocks } from 'node-mocks-http';
import handler from '../../api/ingredients';
import bulkHandler from '../../api/ingredients/bulk';
import { connectToDatabase } from '../utils/database';
import { IngredientReference } from '../models/IngredientReference';
import mongoose from 'mongoose';

describe('Ingredient API', () => {
	beforeAll(async () => {
		await connectToDatabase();
	});

	afterAll(async () => {
		await mongoose.connection.close();
	});

	beforeEach(async () => {
		await IngredientReference.deleteMany({});
	});

	describe('GET /api/ingredients', () => {
		beforeEach(async () => {
			// Create test ingredients
			const ingredients = [
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
			];
			await IngredientReference.insertMany(ingredients);
		});

		it('should list all ingredients', async () => {
			const { req, res } = createMocks({
				method: 'GET',
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(200);
			const data = JSON.parse(res._getData());
			expect(data.length).toBe(2);
			expect(data[0].name).toBe('chicken breast');
			expect(data[1].name).toBe('olive oil');
		});

		it('should search ingredients by query', async () => {
			const { req, res } = createMocks({
				method: 'GET',
				query: { query: 'chicken' },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(200);
			const data = JSON.parse(res._getData());
			expect(data.length).toBe(1);
			expect(data[0].name).toBe('chicken breast');
		});

		it('should filter ingredients by category', async () => {
			const { req, res } = createMocks({
				method: 'GET',
				query: { category: 'Pantry' },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(200);
			const data = JSON.parse(res._getData());
			expect(data.length).toBe(1);
			expect(data[0].name).toBe('olive oil');
		});

		it('should limit results', async () => {
			// Add more ingredients
			const moreIngredients = Array(10)
				.fill(0)
				.map((_, i) => ({
					name: `test ingredient ${i}`,
					displayName: `Test Ingredient ${i}`,
					category: 'Other',
					alternateNames: [],
					defaultUnit: 'piece',
					defaultAmount: 1,
					isCommonPantryItem: false,
				}));
			await IngredientReference.insertMany(moreIngredients);

			const { req, res } = createMocks({
				method: 'GET',
				query: { limit: '5' },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(200);
			const data = JSON.parse(res._getData());
			expect(data.length).toBe(5);
		});
	});

	describe('POST /api/ingredients', () => {
		it('should create a new ingredient', async () => {
			const { req, res } = createMocks({
				method: 'POST',
				body: {
					name: 'chicken breast',
					displayName: 'Chicken Breast',
					category: 'Meat',
					alternateNames: ['chicken breasts'],
					defaultUnit: 'piece',
					defaultAmount: 2,
					isCommonPantryItem: false,
				},
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(201);
			const data = JSON.parse(res._getData());
			expect(data.name).toBe('chicken breast');

			// Verify in database
			const ingredient = await IngredientReference.findOne({
				name: 'chicken breast',
			});
			expect(ingredient).toBeTruthy();
		});

		it('should prevent duplicate ingredients', async () => {
			// Create first ingredient
			await IngredientReference.create({
				name: 'chicken breast',
				displayName: 'Chicken Breast',
				category: 'Meat',
				alternateNames: ['chicken breasts'],
				defaultUnit: 'piece',
				defaultAmount: 2,
				isCommonPantryItem: false,
			});

			// Try to create duplicate
			const { req, res } = createMocks({
				method: 'POST',
				body: {
					name: 'chicken breast',
					displayName: 'Chicken Breast',
					category: 'Meat',
					alternateNames: ['chicken breasts'],
					defaultUnit: 'piece',
					defaultAmount: 2,
					isCommonPantryItem: false,
				},
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(409);
			const data = JSON.parse(res._getData());
			expect(data.error).toBe('Ingredient already exists');
		});

		it('should validate input data', async () => {
			const { req, res } = createMocks({
				method: 'POST',
				body: {
					name: '', // Invalid: empty name
					category: 'InvalidCategory', // Invalid category
					defaultAmount: -1, // Invalid: negative amount
				},
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(400);
			const data = JSON.parse(res._getData());
			expect(data.error).toBe('Invalid ingredient data');
			expect(data.details).toBeTruthy();
		});
	});

	describe('PUT /api/ingredients', () => {
		let ingredientId: string;

		beforeEach(async () => {
			// Create test ingredient
			const ingredient = await IngredientReference.create({
				name: 'chicken breast',
				displayName: 'Chicken Breast',
				category: 'Meat',
				alternateNames: ['chicken breasts'],
				defaultUnit: 'piece',
				defaultAmount: 2,
				isCommonPantryItem: false,
			});
			ingredientId = ingredient._id.toString();
		});

		it('should update an existing ingredient', async () => {
			const { req, res } = createMocks({
				method: 'PUT',
				query: { id: ingredientId },
				body: {
					name: 'chicken breast',
					displayName: 'Chicken Breast Updated',
					category: 'Meat',
					alternateNames: ['chicken breasts', 'boneless chicken'],
					defaultUnit: 'piece',
					defaultAmount: 3,
					isCommonPantryItem: true,
				},
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(200);
			const data = JSON.parse(res._getData());
			expect(data.displayName).toBe('Chicken Breast Updated');
			expect(data.defaultAmount).toBe(3);
			expect(data.isCommonPantryItem).toBe(true);

			// Verify in database
			const ingredient = await IngredientReference.findById(ingredientId);
			expect(ingredient?.displayName).toBe('Chicken Breast Updated');
		});

		it('should return 404 for non-existent ingredient', async () => {
			const { req, res } = createMocks({
				method: 'PUT',
				query: { id: new mongoose.Types.ObjectId().toString() },
				body: {
					name: 'chicken breast',
					displayName: 'Chicken Breast Updated',
					category: 'Meat',
					alternateNames: [],
					defaultUnit: 'piece',
					defaultAmount: 3,
					isCommonPantryItem: true,
				},
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(404);
		});
	});

	describe('DELETE /api/ingredients', () => {
		let ingredientId: string;

		beforeEach(async () => {
			// Create test ingredient
			const ingredient = await IngredientReference.create({
				name: 'chicken breast',
				displayName: 'Chicken Breast',
				category: 'Meat',
				alternateNames: ['chicken breasts'],
				defaultUnit: 'piece',
				defaultAmount: 2,
				isCommonPantryItem: false,
			});
			ingredientId = ingredient._id.toString();
		});

		it('should delete an existing ingredient', async () => {
			const { req, res } = createMocks({
				method: 'DELETE',
				query: { id: ingredientId },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(200);

			// Verify deletion
			const ingredient = await IngredientReference.findById(ingredientId);
			expect(ingredient).toBeNull();
		});

		it('should return 404 for non-existent ingredient', async () => {
			const { req, res } = createMocks({
				method: 'DELETE',
				query: { id: new mongoose.Types.ObjectId().toString() },
			});

			await handler(req, res);

			expect(res._getStatusCode()).toBe(404);
		});
	});

	describe('POST /api/ingredients/bulk', () => {
		it('should create multiple ingredients', async () => {
			const { req, res } = createMocks({
				method: 'POST',
				body: {
					operation: 'create',
					ingredients: [
						{
							name: 'chicken breast',
							displayName: 'Chicken Breast',
							category: 'Meat',
							alternateNames: ['chicken breasts'],
							defaultUnit: 'piece',
							defaultAmount: 2,
							isCommonPantryItem: false,
						},
						{
							name: 'olive oil',
							displayName: 'Olive Oil',
							category: 'Pantry',
							alternateNames: ['evoo'],
							defaultUnit: 'tbsp',
							defaultAmount: 1,
							isCommonPantryItem: true,
						},
					],
				},
			});

			await bulkHandler(req, res);

			expect(res._getStatusCode()).toBe(200);
			const data = JSON.parse(res._getData());
			expect(data.results.successful).toBe(2);
			expect(data.results.failed).toBe(0);

			// Verify in database
			const ingredients = await IngredientReference.find().sort({ name: 1 });
			expect(ingredients.length).toBe(2);
			expect(ingredients[0].name).toBe('chicken breast');
			expect(ingredients[1].name).toBe('olive oil');
		});

		it('should handle partial failures in bulk operations', async () => {
			// Create one ingredient first
			await IngredientReference.create({
				name: 'chicken breast',
				displayName: 'Chicken Breast',
				category: 'Meat',
				alternateNames: ['chicken breasts'],
				defaultUnit: 'piece',
				defaultAmount: 2,
				isCommonPantryItem: false,
			});

			const { req, res } = createMocks({
				method: 'POST',
				body: {
					operation: 'create',
					ingredients: [
						{
							name: 'chicken breast', // Should fail (duplicate)
							displayName: 'Chicken Breast',
							category: 'Meat',
							alternateNames: ['chicken breasts'],
							defaultUnit: 'piece',
							defaultAmount: 2,
							isCommonPantryItem: false,
						},
						{
							name: 'olive oil', // Should succeed
							displayName: 'Olive Oil',
							category: 'Pantry',
							alternateNames: ['evoo'],
							defaultUnit: 'tbsp',
							defaultAmount: 1,
							isCommonPantryItem: true,
						},
					],
				},
			});

			await bulkHandler(req, res);

			expect(res._getStatusCode()).toBe(200);
			const data = JSON.parse(res._getData());
			expect(data.results.successful).toBe(1);
			expect(data.results.failed).toBe(1);
			expect(data.results.details.failed[0].name).toBe('chicken breast');
			expect(data.results.details.successful).toContain('olive oil');
		});

		it('should validate all ingredients in bulk operation', async () => {
			const { req, res } = createMocks({
				method: 'POST',
				body: {
					operation: 'create',
					ingredients: [
						{
							name: '', // Invalid
							displayName: 'Invalid Ingredient',
							category: 'InvalidCategory', // Invalid
							alternateNames: [],
							defaultUnit: 'invalid', // Invalid
							defaultAmount: -1, // Invalid
							isCommonPantryItem: false,
						},
					],
				},
			});

			await bulkHandler(req, res);

			expect(res._getStatusCode()).toBe(400);
			const data = JSON.parse(res._getData());
			expect(data.error).toBe('Invalid request data');
			expect(data.details).toBeTruthy();
		});
	});
});
