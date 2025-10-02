import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	testEnvironment: 'jest-environment-jsdom',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	testMatch: [
		'<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
		'<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
	],
	collectCoverage: true,
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/**/*.stories.{js,jsx,ts,tsx}',
		'!src/**/*.test.{js,jsx,ts,tsx}',
		'!src/**/index.{js,jsx,ts,tsx}',
		'!src/app/**/layout.tsx',
		'!src/app/**/loading.tsx',
		'!src/app/**/not-found.tsx',
		'!src/app/**/error.tsx',
		'!src/app/globals.css',
		'!src/app/favicon.ico',
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
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	globals: {
		'ts-jest': {
			useESM: true,
		},
	},
	preset: 'ts-jest/presets/default-esm',
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
	},
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
