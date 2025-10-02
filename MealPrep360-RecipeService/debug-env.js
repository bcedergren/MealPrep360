#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Debugging Environment Variables...\n');

console.log('📋 Raw Environment Variables:');
console.log(`OPENAI_API_KEY: "${process.env.OPENAI_API_KEY}"`);
console.log(`OPENAI_GPT_ID: "${process.env.OPENAI_GPT_ID}"`);
console.log(`OPENAI_MODEL: "${process.env.OPENAI_MODEL}"`);

console.log('\n🔧 Model Selection Logic:');
const openaiModel = process.env.OPENAI_MODEL;
const openaiGptId = process.env.OPENAI_GPT_ID;
const fallback = 'gpt-4-turbo-preview';

console.log(`OPENAI_MODEL: "${openaiModel}"`);
console.log(`OPENAI_GPT_ID: "${openaiGptId}"`);
console.log(`Fallback: "${fallback}"`);

const selectedModel = openaiModel || openaiGptId || fallback;
console.log(`\n🎯 Selected Model: "${selectedModel}"`);

console.log('\n📝 Environment File Paths:');
console.log(`- .env: ${path.resolve(process.cwd(), '.env')}`);
console.log(`- .env.local: ${path.resolve(process.cwd(), '.env.local')}`);

console.log('\n✅ Debug complete!');
