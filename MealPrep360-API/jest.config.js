// Jest configuration for TypeScript support
const config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	extensionsToTreatAsEsm: ['.ts'],
	globals: {
		'ts-jest': {
			useESM: true
		}
	},
	testMatch: [
		'<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
		'<rootDir>/src/tests/**/*.test.{js,jsx,ts,tsx}',
		'<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
	],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest', {
			useESM: true
		}],
	},
	transformIgnorePatterns: [
		'node_modules/(?!(.*\\.mjs$))'
	],
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/app/**/layout.tsx',
		'!src/app/**/loading.tsx',
		'!src/app/**/not-found.tsx',
		'!src/app/**/error.tsx',
		'!src/app/globals.css',
		'!src/middleware.ts',
		'!src/lib/swagger.ts',
	],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},
	testTimeout: 30000,
	projects: [
		{
			displayName: 'unit',
			testMatch: ['<rootDir>/src/tests/unit/**/*.test.{js,ts}'],
			testEnvironment: 'node',
		},
		{
			displayName: 'integration',
			testMatch: ['<rootDir>/src/tests/integration/**/*.test.{js,ts}'],
			testEnvironment: 'node',
		},
		{
			displayName: 'e2e',
			testMatch: ['<rootDir>/src/tests/e2e/**/*.test.{js,ts}'],
			testEnvironment: 'node',
		},
		{
			displayName: 'api',
			testMatch: ['<rootDir>/src/tests/api/**/*.test.{js,ts}'],
			testEnvironment: 'node',
		},
		{
			displayName: 'performance',
			testMatch: ['<rootDir>/src/tests/performance/**/*.test.{js,ts}'],
			testEnvironment: 'node',
		},
	],
};

module.exports = config;
