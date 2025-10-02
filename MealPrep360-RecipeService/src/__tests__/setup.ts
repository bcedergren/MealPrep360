import { jest } from '@jest/globals';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-api-key';
process.env.SPOONACULAR_API_KEY = 'test-spoonacular-api-key';
process.env.RATE_LIMIT_DELAY_MS = '0';

// Mock console methods to keep test output clean
global.console = {
	...console,
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Reset all mocks before each test
beforeEach(() => {
	jest.clearAllMocks();
});
