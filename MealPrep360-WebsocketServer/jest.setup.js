// Mock WebSocket for testing
global.WebSocket = class MockWebSocket {
	constructor(url) {
		this.url = url;
		this.readyState = 1; // OPEN
		this.onopen = null;
		this.onclose = null;
		this.onmessage = null;
		this.onerror = null;
	}

	send(data) {
		// Mock send implementation
	}

	close() {
		this.readyState = 3; // CLOSED
		if (this.onclose) this.onclose();
	}
};

// Mock ws library
jest.mock('ws', () => {
	return {
		WebSocketServer: jest.fn().mockImplementation(() => ({
			on: jest.fn(),
			close: jest.fn(),
			clients: new Set(),
		})),
		WebSocket: {
			CONNECTING: 0,
			OPEN: 1,
			CLOSING: 2,
			CLOSED: 3,
		},
	};
});

// Global test utilities
global.testUtils = {
	createMockWebSocket: () => ({
		send: jest.fn(),
		close: jest.fn(),
		on: jest.fn(),
		readyState: 1,
		url: 'ws://localhost:8080',
	}),
	createMockServer: () => ({
		on: jest.fn(),
		close: jest.fn(),
		clients: new Set(),
	}),
};

// Cleanup after each test
afterEach(() => {
	jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
	jest.restoreAllMocks();
});
