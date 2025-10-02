export interface RecipeClassification {
	regions: string[];
	cuisineTypes: string[];
	climateZones: string[];
	culturalTags: string[];
}

interface IngredientClassifier {
	regions: string[];
	cuisineTypes: string[];
	climateZones: string[];
	culturalTags: string[];
}

// Ingredient-based classification mappings
const INGREDIENT_CLASSIFIERS: Record<string, IngredientClassifier> = {
	// Asian ingredients
	'soy sauce': {
		regions: ['Asia'],
		cuisineTypes: ['Asian', 'Chinese'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},
	rice: {
		regions: ['Asia', 'Global'],
		cuisineTypes: ['Asian'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	'sesame oil': {
		regions: ['Asia'],
		cuisineTypes: ['Asian'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},
	ginger: {
		regions: ['Asia', 'Global'],
		cuisineTypes: ['Asian'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},
	miso: {
		regions: ['Asia'],
		cuisineTypes: ['Japanese'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},
	'coconut milk': {
		regions: ['Asia', 'Oceania'],
		cuisineTypes: ['Thai', 'Indian'],
		climateZones: ['tropical'],
		culturalTags: ['eastern'],
	},

	// Mediterranean ingredients
	'olive oil': {
		regions: ['Europe', 'Mediterranean'],
		cuisineTypes: ['Mediterranean', 'Italian'],
		climateZones: ['temperate'],
		culturalTags: ['western'],
	},
	tomatoes: {
		regions: ['Global'],
		cuisineTypes: ['Mediterranean', 'Italian'],
		climateZones: ['temperate'],
		culturalTags: ['universal'],
	},
	basil: {
		regions: ['Europe', 'Mediterranean'],
		cuisineTypes: ['Mediterranean', 'Italian'],
		climateZones: ['temperate'],
		culturalTags: ['western'],
	},
	oregano: {
		regions: ['Europe', 'Mediterranean'],
		cuisineTypes: ['Mediterranean', 'Greek'],
		climateZones: ['temperate'],
		culturalTags: ['western'],
	},
	'feta cheese': {
		regions: ['Europe', 'Mediterranean'],
		cuisineTypes: ['Greek', 'Mediterranean'],
		climateZones: ['temperate'],
		culturalTags: ['western'],
	},
	olives: {
		regions: ['Europe', 'Mediterranean'],
		cuisineTypes: ['Mediterranean'],
		climateZones: ['temperate'],
		culturalTags: ['western'],
	},

	// Latin American ingredients
	'black beans': {
		regions: ['North America', 'South America'],
		cuisineTypes: ['Mexican', 'Latin'],
		climateZones: ['universal'],
		culturalTags: ['latin'],
	},
	cilantro: {
		regions: ['North America', 'South America', 'Asia'],
		cuisineTypes: ['Mexican', 'Latin', 'Asian'],
		climateZones: ['universal'],
		culturalTags: ['latin'],
	},
	cumin: {
		regions: ['North America', 'South America', 'Middle East'],
		cuisineTypes: ['Mexican', 'Latin', 'Indian'],
		climateZones: ['universal'],
		culturalTags: ['latin'],
	},
	jalapeños: {
		regions: ['North America', 'South America'],
		cuisineTypes: ['Mexican', 'Latin'],
		climateZones: ['temperate'],
		culturalTags: ['latin'],
	},
	lime: {
		regions: ['Global'],
		cuisineTypes: ['Mexican', 'Latin', 'Asian'],
		climateZones: ['tropical', 'temperate'],
		culturalTags: ['universal'],
	},

	// North American ingredients
	'cheddar cheese': {
		regions: ['North America'],
		cuisineTypes: ['American'],
		climateZones: ['universal'],
		culturalTags: ['western'],
	},
	'ground beef': {
		regions: ['Global'],
		cuisineTypes: ['American'],
		climateZones: ['universal'],
		culturalTags: ['western'],
	},
	bacon: {
		regions: ['North America', 'Europe'],
		cuisineTypes: ['American'],
		climateZones: ['universal'],
		culturalTags: ['western'],
	},
	corn: {
		regions: ['North America', 'South America'],
		cuisineTypes: ['American', 'Mexican'],
		climateZones: ['temperate'],
		culturalTags: ['universal'],
	},

	// European ingredients
	cream: {
		regions: ['Europe'],
		cuisineTypes: ['French', 'European'],
		climateZones: ['temperate'],
		culturalTags: ['western'],
	},
	butter: {
		regions: ['Europe', 'Global'],
		cuisineTypes: ['French', 'European'],
		climateZones: ['universal'],
		culturalTags: ['western'],
	},
	potatoes: {
		regions: ['Europe', 'Global'],
		cuisineTypes: ['European'],
		climateZones: ['temperate'],
		culturalTags: ['universal'],
	},
	cabbage: {
		regions: ['Europe'],
		cuisineTypes: ['German', 'Eastern European'],
		climateZones: ['temperate'],
		culturalTags: ['western'],
	},

	// Indian ingredients
	'curry powder': {
		regions: ['Asia'],
		cuisineTypes: ['Indian'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},
	turmeric: {
		regions: ['Asia'],
		cuisineTypes: ['Indian'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},
	'garam masala': {
		regions: ['Asia'],
		cuisineTypes: ['Indian'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},
	chickpeas: {
		regions: ['Asia', 'Mediterranean'],
		cuisineTypes: ['Indian', 'Mediterranean'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},

	// Universal ingredients (good for all regions)
	chicken: {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	onion: {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	garlic: {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	salt: {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	pepper: {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
};

// Cooking method classifiers
const COOKING_METHOD_CLASSIFIERS: Record<string, IngredientClassifier> = {
	'slow cooker': {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	'crock pot': {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	casserole: {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	bake: {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	roast: {
		regions: ['Global'],
		cuisineTypes: ['Universal'],
		climateZones: ['universal'],
		culturalTags: ['universal'],
	},
	'stir-fry': {
		regions: ['Asia'],
		cuisineTypes: ['Asian'],
		climateZones: ['universal'],
		culturalTags: ['eastern'],
	},
	sauté: {
		regions: ['Europe'],
		cuisineTypes: ['French'],
		climateZones: ['universal'],
		culturalTags: ['western'],
	},
};

/**
 * Automatically classify a recipe based on its ingredients and cooking methods
 */
export function classifyRecipe(
	ingredients: string[],
	cookingInstructions: string[],
	title: string = '',
	description: string = ''
): RecipeClassification {
	const classification: RecipeClassification = {
		regions: [],
		cuisineTypes: [],
		climateZones: [],
		culturalTags: [],
	};

	// Combine all text for analysis
	const allText = [...ingredients, ...cookingInstructions, title, description]
		.join(' ')
		.toLowerCase();

	// Track classification scores to determine primary tags
	const regionScores: Record<string, number> = {};
	const cuisineScores: Record<string, number> = {};
	const climateScores: Record<string, number> = {};
	const culturalScores: Record<string, number> = {};

	// Analyze ingredients
	for (const [ingredient, classifier] of Object.entries(
		INGREDIENT_CLASSIFIERS
	)) {
		if (allText.includes(ingredient.toLowerCase())) {
			// Add to scores
			classifier.regions.forEach((region) => {
				regionScores[region] = (regionScores[region] || 0) + 1;
			});
			classifier.cuisineTypes.forEach((cuisine) => {
				cuisineScores[cuisine] = (cuisineScores[cuisine] || 0) + 1;
			});
			classifier.climateZones.forEach((zone) => {
				climateScores[zone] = (climateScores[zone] || 0) + 1;
			});
			classifier.culturalTags.forEach((tag) => {
				culturalScores[tag] = (culturalScores[tag] || 0) + 1;
			});
		}
	}

	// Analyze cooking methods
	for (const [method, classifier] of Object.entries(
		COOKING_METHOD_CLASSIFIERS
	)) {
		if (allText.includes(method.toLowerCase())) {
			classifier.regions.forEach((region) => {
				regionScores[region] = (regionScores[region] || 0) + 0.5;
			});
			classifier.cuisineTypes.forEach((cuisine) => {
				cuisineScores[cuisine] = (cuisineScores[cuisine] || 0) + 0.5;
			});
			classifier.climateZones.forEach((zone) => {
				climateScores[zone] = (climateScores[zone] || 0) + 0.5;
			});
			classifier.culturalTags.forEach((tag) => {
				culturalScores[tag] = (culturalScores[tag] || 0) + 0.5;
			});
		}
	}

	// Convert scores to classifications (take top scoring items)
	classification.regions = Object.entries(regionScores)
		.filter(([_, score]) => score > 0)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 3)
		.map(([region]) => region);

	classification.cuisineTypes = Object.entries(cuisineScores)
		.filter(([_, score]) => score > 0)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 3)
		.map(([cuisine]) => cuisine);

	classification.climateZones = Object.entries(climateScores)
		.filter(([_, score]) => score > 0)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 2)
		.map(([zone]) => zone);

	classification.culturalTags = Object.entries(culturalScores)
		.filter(([_, score]) => score > 0)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 2)
		.map(([tag]) => tag);

	// Default to universal if no specific classification
	if (classification.regions.length === 0) {
		classification.regions = ['Global'];
	}
	if (classification.cuisineTypes.length === 0) {
		classification.cuisineTypes = ['Universal'];
	}
	if (classification.climateZones.length === 0) {
		classification.climateZones = ['universal'];
	}
	if (classification.culturalTags.length === 0) {
		classification.culturalTags = ['universal'];
	}

	return classification;
}

/**
 * Get available filter options for frontend
 */
export function getAvailableFilterOptions() {
	return {
		regions: [
			'North America',
			'South America',
			'Europe',
			'Asia',
			'Africa',
			'Oceania',
			'Mediterranean',
			'Middle East',
			'Global',
		],
		cuisineTypes: [
			'American',
			'Mexican',
			'Italian',
			'French',
			'Chinese',
			'Japanese',
			'Thai',
			'Indian',
			'Mediterranean',
			'Greek',
			'German',
			'Eastern European',
			'Latin',
			'Universal',
		],
		climateZones: ['tropical', 'temperate', 'continental', 'universal'],
		culturalTags: ['western', 'eastern', 'latin', 'universal'],
	};
}
