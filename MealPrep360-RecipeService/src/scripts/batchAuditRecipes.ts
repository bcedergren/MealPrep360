import 'dotenv/config';
import { MealPrep360Service } from '../services/mealPrep360Service.js';
import fs from 'fs';

const recipes = JSON.parse(fs.readFileSync('./data/recipes.json', 'utf-8'));
const mealPrepService = MealPrep360Service.getInstance();

async function batchAudit() {
	for (const recipe of recipes) {
		const auditResult = await mealPrepService.auditRecipe(recipe);
		if (!auditResult.isValid && auditResult.fixedRecipe) {
			console.log('Fixed recipe:', auditResult.fixedRecipe.title);
			// Optionally write back to file or DB
		} else if (!auditResult.isValid) {
			console.warn('Could not fix:', recipe.title, auditResult.missingFields);
		} else {
			console.log('Valid recipe:', recipe.title);
		}
	}
}

batchAudit();
