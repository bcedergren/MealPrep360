export const REQUIRED_FIELDS = [
	'title',
	'description',
	'ingredients',
	'prepInstructions',
	'prepTime',
	'cookTime',
	'servings',
	'tags',
	'storageTime',
	'containerSuggestions',
	'defrostInstructions',
	'cookingInstructions',
	'servingInstructions',
	'season',
];

export const ARRAY_FIELDS = [
	'ingredients',
	'prepInstructions',
	'tags',
	'containerSuggestions',
	'defrostInstructions',
	'cookingInstructions',
	'servingInstructions',
];

export const NUMERIC_FIELDS = [
	'prepTime',
	'cookTime',
	'servings',
	'storageTime',
];

export const MIN_RECIPES_REQUIRED = 5;
export const MAX_RECIPE_FAILURES = 15;
