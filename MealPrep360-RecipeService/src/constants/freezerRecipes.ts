export const FREEZER_UNSAFE_INGREDIENTS = [
	// Vegetables
	'lettuce',
	'cucumber',
	'radish',
	'celery',
	'watercress',
	'sprouts',
	'fresh herbs',
	'raw potato',
	'raw tomato',

	// Dairy
	'sour cream',
	'yogurt',
	'whipped cream',
	'cream cheese',
	'cottage cheese',
	'ricotta cheese',
	'milk',
	'heavy cream',
	'light cream',
	'half and half',

	// Sauces and Dressings
	'mayonnaise',
	'hollandaise sauce',
	'béarnaise sauce',
	'cream sauce',
	'alfredo sauce',
	'caesar dressing',
	'ranch dressing',
	'vinaigrette',

	// Other
	'gelatin',
	'meringue',
	'custard',
	'pudding',
	'raw egg',
	'cooked rice',
	'cooked pasta',
	'cooked noodles',
	'cooked potatoes',
	'cooked grains',
];

export const FREEZER_SAFE_ALTERNATIVES = {
	lettuce: 'frozen spinach or kale',
	cucumber: 'frozen zucchini',
	'sour cream': 'frozen sour cream (add after thawing)',
	yogurt: 'frozen yogurt (add after thawing)',
	'whipped cream': 'frozen whipped cream (add after thawing)',
	'cream cheese': 'frozen cream cheese (thaw before using)',
	mayonnaise: 'frozen mayonnaise (add after thawing)',
	'raw egg': 'frozen egg substitute',
	'cooked rice': 'uncooked rice (cook after thawing)',
	'cooked pasta': 'uncooked pasta (cook after thawing)',
};

export const FREEZER_CONTAINER_SUGGESTIONS = [
	'1-gallon freezer bags',
	'2-quart freezer bags',
	'1-quart freezer bags',
	'freezer-safe plastic containers',
	'aluminum foil containers',
	'vacuum-sealed bags',
	'glass containers with freezer-safe lids',
	'disposable aluminum pans',
	'freezer-safe meal prep containers',
];

export const FREEZER_STORAGE_TIMES = {
	meat: 90, // days
	poultry: 90,
	fish: 60,
	vegetables: 180,
	fruits: 180,
	soups: 90,
	stews: 90,
	casseroles: 90,
	breads: 90,
	desserts: 60,
};

export const FREEZER_PREP_RULES = [
	'NO COOKING during prep, only assembly',
	'All ingredients must be raw or pre-cooked',
	'Include clear storage and defrosting instructions',
	'Ensure the recipe is suitable for batch preparation',
	'Include specific container recommendations',
	'Provide detailed defrosting and cooking instructions',
	'All ingredients must freeze well',
	'Label containers with contents and date',
	'Cool all ingredients before freezing',
	'Remove excess air from containers',
];

export const FREEZER_DEFROST_METHODS = [
	'Refrigerator thawing (overnight)',
	'Cold water thawing (2-3 hours)',
	'Microwave defrosting (follow package instructions)',
	'Cooking from frozen (adjust cooking time)',
];

export const FREEZER_COOKING_TIPS = [
	'Add 50% more cooking time when cooking from frozen',
	'Stir occasionally during cooking',
	'Check internal temperature before serving',
	'Add fresh herbs and garnishes after cooking',
	'Adjust seasonings after cooking',
];

export const REQUIRED_RECIPE_FIELDS = [
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
	'allergenInfo',
	'dietaryInfo',
];

export const ARRAY_RECIPE_FIELDS = [
	'ingredients',
	'prepInstructions',
	'tags',
	'containerSuggestions',
	'defrostInstructions',
	'cookingInstructions',
	'servingInstructions',
	'allergenInfo',
	'dietaryInfo',
];
