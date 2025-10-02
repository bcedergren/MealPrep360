const nextJest = require('next/jest');

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files
	dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	testEnvironment: 'jest-environment-jsdom',
	testMatch: [
		'<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
		'<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
	],
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/app/**/layout.tsx',
		'!src/app/**/loading.tsx',
		'!src/app/**/not-found.tsx',
		'!src/app/**/error.tsx',
		'!src/app/globals.css',
		'!src/middleware.ts',
		'!src/models/**',
		'!src/types/**',
	],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},
	testTimeout: 10000,
	projects: [
		{
			displayName: 'unit',
			testMatch: ['<rootDir>/src/**/*.unit.test.{js,jsx,ts,tsx}'],
			testEnvironment: 'jsdom',
		},
		{
			displayName: 'integration',
			testMatch: ['<rootDir>/src/**/*.integration.test.{js,jsx,ts,tsx}'],
			testEnvironment: 'jsdom',
		},
		{
			displayName: 'e2e',
			testMatch: ['<rootDir>/src/**/*.e2e.test.{js,jsx,ts,tsx}'],
			testEnvironment: 'jsdom',
		},
	],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
