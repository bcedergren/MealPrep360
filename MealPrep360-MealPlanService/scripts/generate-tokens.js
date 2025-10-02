import crypto from 'crypto';

// Generate a secure random token
const generateToken = () => {
	return crypto.randomBytes(32).toString('hex');
};

// Generate tokens
const apiToken = generateToken();
const publicApiToken = generateToken();

console.log('Generated API Tokens:');
console.log('-------------------');
console.log('API_TOKEN=' + apiToken);
console.log('NEXT_PUBLIC_API_TOKEN=' + publicApiToken);
console.log('\nAdd these to your .env.local file');
