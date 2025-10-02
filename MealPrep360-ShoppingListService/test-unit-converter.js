console.log('Testing unit converter...');

try {
    const { normalizeIngredients } = require('./dist/services/unitConverter');
    console.log('✅ Unit converter imported successfully');
    
    const testIngredients = [
        { name: 'salt', amount: 1, unit: 'tsp', category: 'Pantry' }
    ];
    
    console.log('Testing normalizeIngredients...');
    const result = normalizeIngredients(testIngredients);
    console.log('✅ normalizeIngredients worked:', result);
    
} catch (error) {
    console.error('❌ Error testing unit converter:', error.message);
    console.error('Stack:', error.stack);
} 