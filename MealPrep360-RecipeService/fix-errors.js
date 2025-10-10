const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'src/api/recommendations.ts',
  'src/api/search.ts',
  'src/services/categorization/recipeCategorizationService.ts',
  'src/services/recommendation/hybridRecommendationService.ts',
  'src/services/search/recipeSearchService.ts',
  'src/scripts/initializePhase7Services.ts'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix error handling patterns
    content = content.replace(
      /this\.logger\.error\([^,]+,\s*error\);/g,
      'this.logger.error($1, error instanceof Error ? error : new Error(String(error)));'
    );
    
    content = content.replace(
      /this\.logger\.warn\([^,]+,\s*error\);/g,
      'this.logger.warn($1, error instanceof Error ? error : new Error(String(error)));'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Error handling fixes applied!');



