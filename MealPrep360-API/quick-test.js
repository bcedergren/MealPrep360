#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

console.log('🔍 Testing service initialization...\n');

// Test environment variables
console.log('📋 Environment Variables:');
const requiredEnvVars = [
  'MONGODB_URI',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'JWT_SECRET',
  'RECIPE_SERVICE_API_KEY',
  'MEALPLAN_SERVICE_API_KEY',
  'SHOPPING_SERVICE_API_KEY',
  'SOCIAL_SERVICE_API_KEY',
  'BLOG_SERVICE_API_KEY',
  'WEBSOCKET_SERVICE_API_KEY'
];

let allSet = true;
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`  ✅ ${envVar}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`  ❌ ${envVar}: NOT SET`);
    allSet = false;
  }
});

if (allSet) {
  console.log('\n✅ All environment variables are configured!');
} else {
  console.log('\n❌ Some environment variables are missing. Run: npm run setup-env');
}

// Test basic Node.js functionality
console.log('\n🧪 Basic functionality test:');
try {
  const crypto = require('crypto');
  const testKey = crypto.randomBytes(16).toString('hex');
  console.log(`  ✅ Crypto module working: ${testKey}`);
} catch (error) {
  console.log(`  ❌ Crypto module failed: ${error.message}`);
}

try {
  const fs = require('fs');
  const path = require('path');
  
  // Test file system
  const testFile = path.join(process.cwd(), 'package.json');
  const exists = fs.existsSync(testFile);
  console.log(`  ✅ File system working: package.json exists = ${exists}`);
} catch (error) {
  console.log(`  ❌ File system failed: ${error.message}`);
}

console.log('\n🎉 Quick test completed!');
console.log('\nNext steps:');
console.log('1. Update .env with your MongoDB URI and Clerk credentials');
console.log('2. Run: npm run dev');
console.log('3. Visit: http://localhost:3001/api/health');