// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_publishable_key';
process.env.CLERK_SECRET_KEY = 'test_secret_key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.EDGE_CONFIG = 'test_edge_config';

// Mock WebSocket
global.WebSocket = class MockWebSocket {
	constructor() {}
	send() {}
	close() {}
};

// Mock fetch
global.fetch = jest.fn();

// Mock console.error to keep test output clean
console.error = jest.fn();
