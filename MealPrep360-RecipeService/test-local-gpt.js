#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🧪 Testing Custom GPT Configuration Locally...\n');

console.log('📋 Environment Variables:');
console.log(
	`- OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`
);
console.log(
	`- OPENAI_GPT_ID: ${process.env.OPENAI_GPT_ID ? 'Set' : 'Not set'}`
);
console.log(`- OPENAI_MODEL: ${process.env.OPENAI_MODEL ? 'Set' : 'Not set'}`);

console.log('\n🔧 Configuration:');
const model =
	process.env.OPENAI_MODEL ||
	process.env.OPENAI_GPT_ID ||
	'gpt-4-turbo-preview';
console.log(`- OpenAI Model: ${model}`);
console.log(
	`- OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`
);

// Test OpenAI API call with custom GPT
async function testOpenAICall() {
	console.log('\n🚀 Testing OpenAI API call with custom GPT...');

	if (!process.env.OPENAI_API_KEY) {
		console.log('❌ OpenAI API key not configured');
		return;
	}

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{
						role: 'system',
						content: 'You are a helpful assistant.',
					},
					{
						role: 'user',
						content: 'Say "Hello, I am using the custom GPT!"',
					},
				],
				max_tokens: 50,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.log(`❌ OpenAI API error (${response.status}): ${errorText}`);
			return;
		}

		const data = await response.json();
		console.log('✅ OpenAI API response:', {
			model: data.model,
			content: data.choices?.[0]?.message?.content,
			usage: data.usage,
		});

		if (data.model && data.model.includes('g-')) {
			console.log('🎉 SUCCESS! Custom GPT is being used!');
		} else {
			console.log('⚠️ Using standard GPT model, not custom GPT');
		}
	} catch (error) {
		console.error('❌ Error testing OpenAI API:', error.message);
	}
}

// Run the test
testOpenAICall().catch(console.error);
