import mongoose from 'mongoose';
import { connectToDatabase } from '../utils/database';
import { IngredientReference } from '../models/IngredientReference';
import { normalizeIngredient, findSimilarIngredients, getIngredientsByCategory, getCommonPantryItems } from '../services/ingredientService';
import { Category } from '../types';

describe('Ingredient Reference System', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await IngredientReference.deleteMany({});
    });

    describe('normalizeIngredient', () => {
        it('should find and return existing ingredient', async () => {
            // Create test ingredient
            const testIngredient = new IngredientReference({
                name: 'tomato',
                displayName: 'Tomato',
                category: 'Produce',
                alternateNames: ['tomatoes', 'roma tomato'],
                defaultUnit: 'piece',
                defaultAmount: 1,
                isCommonPantryItem: false,
            });
            await testIngredient.save();

            // Test with exact name
            const result1 = await normalizeIngredient('tomato');
            expect(result1).toBeTruthy();
            expect(result1?.name).toBe('Tomato');
            expect(result1?.category).toBe('Produce');

            // Test with alternate name
            const result2 = await normalizeIngredient('tomatoes');
            expect(result2).toBeTruthy();
            expect(result2?.name).toBe('Tomato');
        });

        it('should create new ingredient when not found and category provided', async () => {
            const result = await normalizeIngredient('cucumber', 'Produce');
            expect(result).toBeTruthy();
            expect(result?.name).toBe('Cucumber');
            expect(result?.category).toBe('Produce');

            // Verify it was saved to database
            const saved = await IngredientReference.findOne({ name: 'cucumber' });
            expect(saved).toBeTruthy();
        });

        it('should return null when ingredient not found and no category provided', async () => {
            const result = await normalizeIngredient('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('findSimilarIngredients', () => {
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
                    name: 'chicken thigh',
                    displayName: 'Chicken Thigh',
                    category: 'Meat',
                    alternateNames: ['chicken thighs', 'boneless chicken thigh'],
                    defaultUnit: 'piece',
                    defaultAmount: 4,
                    isCommonPantryItem: false,
                },
                {
                    name: 'ground chicken',
                    displayName: 'Ground Chicken',
                    category: 'Meat',
                    alternateNames: ['minced chicken'],
                    defaultUnit: 'lb',
                    defaultAmount: 1,
                    isCommonPantryItem: false,
                },
            ];

            await IngredientReference.insertMany(ingredients);
        });

        it('should find similar ingredients by name', async () => {
            const results = await findSimilarIngredients('chicken');
            expect(results.length).toBe(3);
            expect(results.map(r => r.name)).toContain('chicken breast');
            expect(results.map(r => r.name)).toContain('chicken thigh');
            expect(results.map(r => r.name)).toContain('ground chicken');
        });

        it('should find ingredients by alternate names', async () => {
            const results = await findSimilarIngredients('boneless');
            expect(results.length).toBe(2);
            expect(results.map(r => r.name)).toContain('chicken breast');
            expect(results.map(r => r.name)).toContain('chicken thigh');
        });

        it('should limit results to 5', async () => {
            // Add more ingredients to exceed limit
            const moreIngredients = Array(6).fill(0).map((_, i) => ({
                name: `test ingredient ${i}`,
                displayName: `Test Ingredient ${i}`,
                category: 'Other' as Category,
                alternateNames: [],
                defaultUnit: 'piece',
                defaultAmount: 1,
                isCommonPantryItem: false,
            }));
            await IngredientReference.insertMany(moreIngredients);

            const results = await findSimilarIngredients('test');
            expect(results.length).toBe(5);
        });
    });

    describe('getIngredientsByCategory', () => {
        beforeEach(async () => {
            // Create test ingredients
            const ingredients = [
                {
                    name: 'apple',
                    displayName: 'Apple',
                    category: 'Produce',
                    alternateNames: [],
                    defaultUnit: 'piece',
                    defaultAmount: 1,
                    isCommonPantryItem: false,
                },
                {
                    name: 'banana',
                    displayName: 'Banana',
                    category: 'Produce',
                    alternateNames: [],
                    defaultUnit: 'piece',
                    defaultAmount: 1,
                    isCommonPantryItem: false,
                },
                {
                    name: 'milk',
                    displayName: 'Milk',
                    category: 'Dairy',
                    alternateNames: [],
                    defaultUnit: 'l',
                    defaultAmount: 1,
                    isCommonPantryItem: false,
                },
            ];

            await IngredientReference.insertMany(ingredients);
        });

        it('should return ingredients by category sorted by name', async () => {
            const produce = await getIngredientsByCategory('Produce');
            expect(produce.length).toBe(2);
            expect(produce[0].name).toBe('apple');
            expect(produce[1].name).toBe('banana');

            const dairy = await getIngredientsByCategory('Dairy');
            expect(dairy.length).toBe(1);
            expect(dairy[0].name).toBe('milk');
        });
    });

    describe('getCommonPantryItems', () => {
        beforeEach(async () => {
            // Create test ingredients
            const ingredients = [
                {
                    name: 'salt',
                    displayName: 'Salt',
                    category: 'Spices',
                    alternateNames: [],
                    defaultUnit: 'tsp',
                    defaultAmount: 1,
                    isCommonPantryItem: true,
                },
                {
                    name: 'pepper',
                    displayName: 'Black Pepper',
                    category: 'Spices',
                    alternateNames: [],
                    defaultUnit: 'tsp',
                    defaultAmount: 1,
                    isCommonPantryItem: true,
                },
                {
                    name: 'saffron',
                    displayName: 'Saffron',
                    category: 'Spices',
                    alternateNames: [],
                    defaultUnit: 'g',
                    defaultAmount: 1,
                    isCommonPantryItem: false,
                },
            ];

            await IngredientReference.insertMany(ingredients);
        });

        it('should return only common pantry items sorted by name', async () => {
            const pantryItems = await getCommonPantryItems();
            expect(pantryItems.length).toBe(2);
            expect(pantryItems[0].name).toBe('pepper');
            expect(pantryItems[1].name).toBe('salt');
            expect(pantryItems.map(item => item.isCommonPantryItem)).toEqual([true, true]);
        });
    });
});