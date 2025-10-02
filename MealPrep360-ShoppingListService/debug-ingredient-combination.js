const { generateShoppingList } = require('./dist/services/shoppingListService');

// Mock recipes with similar ingredients that should be combined
const mockRecipes = [
  {
    _id: '1',
    title: 'Chicken Recipe 1',
    ingredients: [
      { name: 'chicken breasts', amount: 2, unit: 'piece', category: 'Meat' },
      { name: 'chicken broth', amount: 1, unit: 'cup', category: 'Pantry' }
    ]
  },
  {
    _id: '2', 
    title: 'Chicken Recipe 2',
    ingredients: [
      { name: 'boneless chicken breasts', amount: 1, unit: 'piece', category: 'Meat' },
      { name: 'beef broth', amount: 0.5, unit: 'cup', category: 'Pantry' }
    ]
  }
];

const mockMealPlan = [
  { recipeId: '1', servings: 1 },
  { recipeId: '2', servings: 1 }
];

async function debugIngredientCombination() {
  try {
    console.log('Debugging ingredient combination...');
    
    // Let's also test with just one recipe to see what happens
    console.log('\n=== Testing with single recipe ===');
    const singleRecipe = [mockRecipes[0]];
    const singleMealPlan = [mockMealPlan[0]];
    
    try {
      const singleResult = await generateShoppingList(singleRecipe, singleMealPlan);
      console.log('Single recipe result:');
      singleResult.forEach((ingredient, index) => {
        console.log(`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`);
      });
    } catch (error) {
      console.error('Error with single recipe:', error);
    }
    
    console.log('\n=== Testing with both recipes ===');
    const shoppingList = await generateShoppingList(mockRecipes, mockMealPlan);
    
    console.log('\nGenerated shopping list:');
    shoppingList.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} - ${ingredient.amount} ${ingredient.unit} (${ingredient.category})`);
    });
    
    // Check if chicken ingredients were combined
    const chickenIngredients = shoppingList.filter(ingredient => 
      ingredient.name.toLowerCase().includes('chicken')
    );
    
    console.log(`\nChicken ingredients found: ${chickenIngredients.length}`);
    chickenIngredients.forEach(ingredient => {
      console.log(`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`);
    });
    
    // Check if broth ingredients were combined
    const brothIngredients = shoppingList.filter(ingredient => 
      ingredient.name.toLowerCase().includes('broth')
    );
    
    console.log(`\nBroth ingredients found: ${brothIngredients.length}`);
    brothIngredients.forEach(ingredient => {
      console.log(`- ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`);
    });
    
  } catch (error) {
    console.error('Error debugging ingredient combination:', error);
  }
}

debugIngredientCombination(); 