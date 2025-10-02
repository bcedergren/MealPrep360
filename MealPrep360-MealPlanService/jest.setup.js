// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Global test setup
beforeAll(() => {
	// Set test environment variables
	process.env.NODE_ENV = 'test';
	process.env.MONGODB_URI = 'mongodb://localhost:27017/mealplan-test';
	process.env.NEXTAUTH_SECRET = 'test-secret';
	process.env.CLERK_SECRET_KEY = 'test-clerk-secret';
});

// Mock next/router
jest.mock('next/router', () => ({
	useRouter() {
		return {
			route: '/',
			pathname: '',
			query: {},
			asPath: '',
			push: jest.fn(),
			replace: jest.fn(),
		};
	},
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
			back: jest.fn(),
		};
	},
	usePathname() {
		return '';
	},
	useSearchParams() {
		return new URLSearchParams();
	},
}));

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
	useAuth: () => ({
		isLoaded: true,
		isSignedIn: true,
		userId: 'test-user-id',
		sessionId: 'test-session-id',
		signOut: jest.fn(),
	}),
	useUser: () => ({
		isLoaded: true,
		isSignedIn: true,
		user: {
			id: 'test-user-id',
			emailAddresses: [{ emailAddress: 'test@example.com' }],
			firstName: 'Test',
			lastName: 'User',
		},
	}),
	SignIn: ({ children }) => children || 'SignIn',
	SignUp: ({ children }) => children || 'SignUp',
	UserButton: () => 'UserButton',
	ClerkProvider: ({ children }) => children,
	auth: () => ({
		userId: 'test-user-id',
		sessionId: 'test-session-id',
	}),
}));

// Mock MongoDB
jest.mock('mongodb', () => ({
	MongoClient: {
		connect: jest.fn(),
		close: jest.fn(),
	},
	ObjectId: jest
		.fn()
		.mockImplementation((id) => ({ toString: () => id || 'test-id' })),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
	__esModule: true,
	default: ({ src, alt, ...props }) => (
		<img
			src={src}
			alt={alt}
			{...props}
		/>
	),
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
	__esModule: true,
	default: ({ children, href, ...props }) => (
		<a
			href={href}
			{...props}
		>
			{children}
		</a>
	),
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
	createMockMealPlan: () => ({
		id: 'test-mealplan-id',
		userId: 'test-user-id',
		name: 'Test Meal Plan',
		description: 'A test meal plan',
		meals: [
			{
				day: 'Monday',
				breakfast: { recipeId: 'recipe-1', recipeName: 'Breakfast Recipe' },
				lunch: { recipeId: 'recipe-2', recipeName: 'Lunch Recipe' },
				dinner: { recipeId: 'recipe-3', recipeName: 'Dinner Recipe' },
			},
		],
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
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

// Cleanup after each test
afterEach(() => {
	jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
	jest.restoreAllMocks();
});
