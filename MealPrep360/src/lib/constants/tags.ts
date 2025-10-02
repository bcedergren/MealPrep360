// Tags to exclude as they are too common or not meaningful for filtering
export const EXCLUDED_TAGS = new Set([
	'all',
	'All',
	'Make Ahead',
	'Easy Storage',
	'Easy Cooking',
	'Easy Storage',
	'Easy defrost',
	'easy defrost',
	'easy storage',
	'easy cleanup',
	'easy cooking',
	'easy meal prep',
	'easy dinner',
	'easy-cook',
	'make ahead',
]);

// Tag standardization mappings
export const TAG_MAPPINGS: { [key: string]: string } = {
	// Meal types
	'main course': 'Main Dish',
	'main dish': 'Main Dish',
	dinner: 'Main Dish',
	lunch: 'Main Dish',
	breakfast: 'Breakfast',
	snack: 'Snack',
	appetizer: 'Appetizer',
	antipasto: 'Appetizer',
	antipasti: 'Appetizer',
	"hor d'oeuvre": 'Appetizer',
	starter: 'Appetizer',
	'side dish': 'Side Dish',

	// Dietary preferences
	vegan: 'Vegan',
	vegetarian: 'Vegetarian',
	pescatarian: 'Pescatarian',
	'gluten-free': 'Gluten-Free',

	// Cooking methods
	'crock pot': 'Slow Cooker',
	'batch prep': 'Batch Cooking',
	'batch cooking': 'Batch Cooking',

	// Seasons
	spring: 'Spring',
	'all-season': 'All Seasons',
	'all season': 'All Seasons',
	'all seasons': 'All Seasons',

	// Categories
	seafood: 'Seafood',
	'seafood pasta': 'Seafood',
	pasta: 'Pasta',
	soup: 'Soup',
	risotto: 'Risotto',
	salad: 'Salad',
	vegetable: 'Vegetables',
	healthy: 'Healthy',
	'comfort food': 'Comfort Food',
	shrimp: 'Seafood',
	asparagus: 'Vegetables',
	artichoke: 'Vegetables',
};
