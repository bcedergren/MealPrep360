// Simple Node.js test to verify the shopping list logic
// This tests the cleanIngredientName function logic directly

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

// Test data with the problematic ingredients
const testIngredients = [
	{ name: 'tablespoon olive oil', amount: 2, unit: 'tbsp', category: 'Pantry' },
	{ name: 'medium carrots', amount: 3, unit: 'piece', category: 'Produce' },
	{ name: 'large carrots', amount: 2, unit: 'piece', category: 'Produce' },
	{ name: 'garlic cloves', amount: 4, unit: 'piece', category: 'Produce' },
	{ name: 'cloves garlic', amount: 2, unit: 'piece', category: 'Produce' },
	{
		name: 'large red bell pepper',
		amount: 1,
		unit: 'piece',
		category: 'Produce',
	},
	{ name: 'red bell pepper', amount: 2, unit: 'piece', category: 'Produce' },
	{ name: 'to taste Pepper', amount: 1, unit: 'pinch', category: 'Spices' },
	{ name: 'chicken breast', amount: 1, unit: 'lb', category: 'Meat' },
	{ name: 'boneless chicken breast', amount: 1, unit: 'lb', category: 'Meat' },
];

console.log('🧪 Testing ingredient cleaning and merging logic...');
console.log('='.repeat(60));

// Step 1: Test individual ingredient cleaning
console.log('\n📝 Step 1: Individual ingredient cleaning');
testIngredients.forEach((ingredient, index) => {
	const cleanedName = cleanIngredientName(ingredient.name);
	console.log(`${index + 1}. "${ingredient.name}" -> "${cleanedName}"`);
});

// Step 2: Simulate the filtering and grouping logic
console.log('\n📋 Step 2: Filtering and grouping simulation');
const processedIngredients = [];

testIngredients.forEach((ingredient) => {
	const cleanedName = cleanIngredientName(ingredient.name);

	// Skip ingredients that were cleaned to empty (like "to taste" ingredients)
	if (!cleanedName) {
		console.log(`❌ Skipping: "${ingredient.name}" (cleaned to empty)`);
		return;
	}

	// Find existing similar ingredient
	const existingIndex = processedIngredients.findIndex(
		(item) => item.name === cleanedName
	);

	if (existingIndex >= 0) {
		// Merge with existing ingredient
		const existing = processedIngredients[existingIndex];
		const newAmount = existing.amount + ingredient.amount;
		console.log(
			`🔄 Merging: "${ingredient.name}" (${ingredient.amount} ${ingredient.unit}) with existing "${existing.name}" (${existing.amount} ${existing.unit}) -> ${newAmount} ${existing.unit}`
		);
		existing.amount = newAmount;
	} else {
		// Add new ingredient
		processedIngredients.push({
			name: cleanedName,
			amount: ingredient.amount,
			unit: ingredient.unit,
			category: ingredient.category,
		});
		console.log(
			`✅ Adding: "${ingredient.name}" -> "${cleanedName}" (${ingredient.amount} ${ingredient.unit})`
		);
	}
});

// Step 3: Show final results
console.log('\n🎯 Step 3: Final shopping list');
console.log('='.repeat(40));

// Group by category
const grouped = processedIngredients.reduce((acc, item) => {
	if (!acc[item.category]) {
		acc[item.category] = [];
	}
	acc[item.category].push(item);
	return acc;
}, {});

Object.entries(grouped).forEach(([category, items]) => {
	console.log(`\n${category}:`);
	items.forEach((item) => {
		console.log(`  - ${item.name}: ${item.amount} ${item.unit}`);
	});
});

console.log('\n✅ Test completed!');
