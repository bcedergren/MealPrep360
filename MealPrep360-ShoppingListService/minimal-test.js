console.log('Starting minimal test...');

try {
    // Test basic require
    console.log('Requiring shopping list service...');
    const { generateShoppingList } = require('./dist/services/shoppingListService');
    console.log('✅ Shopping list service imported successfully');
    
    // Test with minimal data
    const testRecipes = [
        {
            _id: 'test1',
            title: 'Test Recipe',
            ingredients: [
                { name: 'salt', amount: 1, unit: 'tsp', category: 'Pantry' }
            ]
        }
    ];
    
    const testMealPlan = [
        { recipeId: 'test1', servings: 1 }
    ];
    
    console.log('Calling generateShoppingList...');
    generateShoppingList(testRecipes, testMealPlan)
        .then(result => {
            console.log('✅ Shopping list generated successfully');
            console.log('Result:', result);
        })
        .catch(error => {
            console.error('❌ Error generating shopping list:', error.message);
            console.error('Stack:', error.stack);
        });
        
} catch (error) {
    console.error('❌ Error in minimal test:', error.message);
    console.error('Stack:', error.stack);
}
