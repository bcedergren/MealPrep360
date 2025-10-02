// Simple test to verify the cleanIngredientName function works
function cleanIngredientName(name) {
	// Remove common prefixes like "N/A", "N/A ", etc.
	let cleaned = name.replace(/^N\/A\s*/i, '');

	// Remove extra whitespace
	cleaned = cleaned.trim();

	// Remove "to taste" ingredients
	if (cleaned.toLowerCase().includes('to taste')) {
		return '';
	}

	// Remove units from ingredient names (e.g., "tablespoon olive oil" -> "olive oil")
	const unitPatterns = [
		/\b(tablespoon|tbsp|teaspoon|tsp|cup|cups|ounce|oz|pound|lb|gram|g|kilogram|kg|milliliter|ml|liter|l|piece|pieces|whole|pinch|cloves?|medium|large|small)\b\s*/gi,
	];

	for (const pattern of unitPatterns) {
		cleaned = cleaned.replace(pattern, '');
	}

	// Clean up extra whitespace
	cleaned = cleaned.replace(/\s+/g, ' ').trim();

	// Normalize common variations
	const nameVariations = {
		'garlic cloves': 'garlic',
		'garlic clove': 'garlic',
		'cloves garlic': 'garlic',
		'clove garlic': 'garlic',
		onions: 'onion',
		tomatoes: 'tomato',
		carrots: 'carrot',
		potatoes: 'potato',
		'bell peppers': 'bell pepper',
		'bell pepper': 'bell pepper',
		'red bell pepper': 'bell pepper',
		'green bell pepper': 'bell pepper',
		'yellow bell pepper': 'bell pepper',
		'large red bell pepper': 'bell pepper',
		'medium carrots': 'carrot',
		'large carrots': 'carrot',
		'small carrots': 'carrot',
		'chicken breasts': 'chicken breast',
		'boneless chicken breast': 'chicken breast',
		'boneless chicken breasts': 'chicken breast',
		'skinless chicken breast': 'chicken breast',
		'skinless chicken breasts': 'chicken breast',
		'boneless, skinless chicken breast': 'chicken breast',
		'boneless, skinless chicken breasts': 'chicken breast',
		'chicken broth': 'chicken broth',
		'chicken stock': 'chicken broth',
		'beef broth': 'beef broth',
		'beef stock': 'beef broth',
		'vegetable broth': 'vegetable broth',
		'vegetable stock': 'vegetable broth',
		shrimp: 'shrimp',
		prawns: 'shrimp',
		quinoa: 'quinoa',
		'olive oil': 'olive oil',
		'vegetable oil': 'vegetable oil',
		'canola oil': 'canola oil',
	};

	const lowerCleaned = cleaned.toLowerCase();
	for (const [variation, standard] of Object.entries(nameVariations)) {
		if (lowerCleaned === variation.toLowerCase()) {
			return standard;
		}
	}

	return cleaned;
}

// Test cases
const testCases = [
	'tablespoon olive oil',
	'medium carrots',
	'large carrots',
	'garlic cloves',
	'cloves garlic',
	'large red bell pepper',
	'red bell pepper',
	'to taste Pepper',
	'chicken breast',
	'boneless chicken breast',
];

console.log('🧪 Testing cleanIngredientName function...');
console.log('=' * 50);

testCases.forEach((testCase) => {
	const result = cleanIngredientName(testCase);
	console.log(`"${testCase}" -> "${result}"`);
});

console.log('\n✅ Test completed!');
