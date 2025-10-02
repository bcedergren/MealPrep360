import { connectToDatabase } from '../src/utils/database';
import { Recipe } from '../src/models/Recipe';
import { normalizeIngredient } from '../src/services/ingredientService';
import { normalizeIngredientCategory } from '../src/services/ingredientNormalizationService';

async function migrateRecipeIngredients() {
	try {
		await connectToDatabase();
		console.log('Connected to database');

		// Get all recipes
		const recipes = await Recipe.find({});
		console.log(`Found ${recipes.length} recipes to process`);

		let totalIngredients = 0;
		let normalizedIngredients = 0;

		// Process each recipe
		for (const recipe of recipes) {
			console.log(`\nProcessing recipe: ${recipe.title}`);
			const updatedIngredients = [];

			for (const ingredient of recipe.ingredients) {
				totalIngredients++;
				console.log(`  Processing ingredient: ${ingredient.name}`);

				try {
					// Try to normalize the ingredient
					const normalized = await normalizeIngredient(ingredient.name);

					if (normalized) {
						// Use normalized data
						console.log(`  ✓ Found normalized ingredient: ${normalized.name}`);
						updatedIngredients.push({
							...ingredient,
							name: normalized.name,
							category: normalized.category,
							// Only use default unit/amount if none specified
							unit: ingredient.unit || normalized.defaultUnit,
							amount: ingredient.amount || normalized.defaultAmount,
						});
						normalizedIngredients++;
					} else {
						// Create new ingredient reference with inferred category
						const category = await normalizeIngredientCategory(ingredient.name);
						const newNormalized = await normalizeIngredient(
							ingredient.name,
							category
						);

						if (newNormalized) {
							console.log(
								`  + Created new normalized ingredient: ${newNormalized.name}`
							);
							updatedIngredients.push({
								...ingredient,
								name: newNormalized.name,
								category: newNormalized.category,
								unit: ingredient.unit || newNormalized.defaultUnit,
								amount: ingredient.amount || newNormalized.defaultAmount,
							});
							normalizedIngredients++;
						} else {
							// Keep original if normalization fails
							console.log(
								`  ! Could not normalize ingredient: ${ingredient.name}`
							);
							updatedIngredients.push(ingredient);
						}
					}
				} catch (error) {
					console.error(
						`  Error processing ingredient ${ingredient.name}:`,
						error
					);
					updatedIngredients.push(ingredient);
				}
			}

			// Update recipe with normalized ingredients
			try {
				recipe.ingredients = updatedIngredients;
				await recipe.save();
				console.log(`✓ Updated recipe: ${recipe.title}`);
			} catch (error) {
				console.error(`Error saving recipe ${recipe.title}:`, error);
			}
		}

		console.log('\nMigration complete!');
		console.log(`Processed ${totalIngredients} ingredients`);
		console.log(`Successfully normalized ${normalizedIngredients} ingredients`);
		console.log(
			`Failed to normalize ${totalIngredients - normalizedIngredients} ingredients`
		);

		process.exit(0);
	} catch (error) {
		console.error('Error during migration:', error);
		process.exit(1);
	}
}

migrateRecipeIngredients();
