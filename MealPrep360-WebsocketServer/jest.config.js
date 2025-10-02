module.exports = {
	testEnvironment: 'node',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	testMatch: [
		'<rootDir>/**/__tests__/**/*.{js,ts}',
		'<rootDir>/**/*.{test,spec}.{js,ts}',
	],
	collectCoverageFrom: [
		'**/*.{js,ts}',
		'!**/node_modules/**',
		'!**/coverage/**',
		'!jest.config.js',
		'!jest.setup.js',
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
};
