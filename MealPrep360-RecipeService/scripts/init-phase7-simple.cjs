#!/usr/bin/env node

console.log('🚀 Initializing Phase 7 services...');

// Simple validation that Phase 7 services are compiled
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'dist/services/categorization/recipeCategorizationService.js',
  'dist/services/recommendation/hybridRecommendationService.js',
  'dist/services/search/recipeSearchService.js',
  'dist/api/categorization.js',
  'dist/api/recommendations.js',
  'dist/api/search.js'
];

console.log('📋 Checking Phase 7 service files...');

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All Phase 7 services are compiled and ready!');
  console.log('\n📦 Phase 7 Features Available:');
  console.log('• AI-Powered Recipe Categorization');
  console.log('• Hybrid Recommendation Engine');
  console.log('• Advanced Recipe Search');
  console.log('• Enhanced Recipe API Endpoints');
  console.log('\n🚀 Phase 7 is ready for deployment!');
  process.exit(0);
} else {
  console.log('\n❌ Some Phase 7 services are missing. Please run "npm run build" first.');
  process.exit(1);
}



