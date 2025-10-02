// Import required testing utilities
require('dotenv').config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
	// Set test environment variables
	process.env.NODE_ENV = 'test';
	process.env.MONGODB_URI = 'mongodb://localhost:27017/mealprep360-test';
	process.env.NEXTAUTH_SECRET = 'test-secret';
	process.env.CLERK_SECRET_KEY = 'test-clerk-secret';
	process.env.OPENAI_API_KEY = 'test-openai-key';
	process.env.STRIPE_SECRET_KEY = 'test-stripe-key';
	
	// Service URLs
	process.env.RECIPE_SERVICE_URL = 'http://localhost:3002';
	process.env.MEALPLAN_SERVICE_URL = 'http://localhost:3003';
	process.env.SHOPPING_SERVICE_URL = 'https://shopping.mealprep360.com';
	process.env.SOCIAL_SERVICE_URL = 'http://localhost:3005';
	process.env.BLOG_SERVICE_URL = 'http://localhost:3006';
	process.env.WEBSOCKET_SERVICE_URL = 'http://localhost:3007';
	
	// Service API Keys
	process.env.RECIPE_SERVICE_API_KEY = 'test-recipe-api-key';
	process.env.MEALPLAN_SERVICE_API_KEY = 'test-mealplan-api-key';
	process.env.SHOPPING_SERVICE_API_KEY = 'test-shopping-api-key';
	process.env.SOCIAL_SERVICE_API_KEY = 'test-social-api-key';
	process.env.BLOG_SERVICE_API_KEY = 'test-blog-api-key';
	process.env.WEBSOCKET_SERVICE_API_KEY = 'test-websocket-api-key';
	
	// Service Enablement
	process.env.RECIPE_SERVICE_ENABLED = 'true';
	process.env.MEALPLAN_SERVICE_ENABLED = 'true';
	process.env.SHOPPING_SERVICE_ENABLED = 'true';
	process.env.SOCIAL_SERVICE_ENABLED = 'true';
	process.env.BLOG_SERVICE_ENABLED = 'true';
	process.env.WEBSOCKET_SERVICE_ENABLED = 'true';
});

// Global mocks
jest.mock('mongoose', () => ({
	connect: jest.fn(),
	disconnect: jest.fn(),
	connection: {
		readyState: 1,
		close: jest.fn(),
	},
	model: jest.fn(),
	Schema: jest.fn(),
}));

jest.mock('@clerk/nextjs', () => ({
	auth: jest.fn(),
	currentUser: jest.fn(),
	ClerkProvider: ({ children }) => children,
	SignIn: () => 'SignIn',
	SignUp: () => 'SignUp',
	UserButton: () => 'UserButton',
}));

jest.mock('openai', () => ({
	OpenAI: jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn(),
			},
		},
		images: {
			generate: jest.fn(),
		},
	})),
}));

jest.mock('stripe', () => ({
	Stripe: jest.fn().mockImplementation(() => ({
		checkout: {
			sessions: {
				create: jest.fn(),
				retrieve: jest.fn(),
			},
		},
		subscriptions: {
			create: jest.fn(),
			retrieve: jest.fn(),
			update: jest.fn(),
			cancel: jest.fn(),
		},
		customers: {
			create: jest.fn(),
			retrieve: jest.fn(),
		},
	})),
}));

jest.mock('nodemailer', () => ({
	createTransport: jest.fn(() => ({
		sendMail: jest.fn(),
	})),
}));

jest.mock('resend', () => ({
	Resend: jest.fn().mockImplementation(() => ({
		emails: {
			send: jest.fn(),
		},
	})),
}));

// Global test utilities
global.testUtils = {
	createMockUser: () => ({
		id: 'test-user-id',
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		createdAt: new Date(),
		updatedAt: new Date(),
	}),
	createMockRecipe: () => ({
		id: 'test-recipe-id',
		title: 'Test Recipe',
		description: 'A test recipe',
		ingredients: [{ name: 'Test Ingredient', amount: '1', unit: 'cup' }],
		instructions: ['Test instruction'],
		prepTime: 15,
		cookTime: 30,
		servings: 4,
		tags: ['test'],
		userId: 'test-user-id',
		createdAt: new Date(),
		updatedAt: new Date(),
	}),
	createMockMealPlan: () => ({
		id: 'test-mealplan-id',
		userId: 'test-user-id',
		name: 'Test Meal Plan',
		meals: [],
		createdAt: new Date(),
		updatedAt: new Date(),
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
