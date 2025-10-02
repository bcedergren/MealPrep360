// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
		query: {},
		pathname: '/',
		asPath: '/',
		route: '/',
		isReady: true,
	}),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
		refresh: jest.fn(),
	}),
	usePathname: () => '/',
	useSearchParams: () => new URLSearchParams(),
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

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
	useQuery: () => ({
		data: null,
		isLoading: false,
		isError: false,
		error: null,
	}),
	useMutation: () => ({
		mutate: jest.fn(),
		isLoading: false,
		isError: false,
		error: null,
	}),
	QueryClient: jest.fn(),
	QueryClientProvider: ({ children }) => children,
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }) => <div {...props}>{children}</div>,
		button: ({ children, ...props }) => <button {...props}>{children}</button>,
		span: ({ children, ...props }) => <span {...props}>{children}</span>,
		p: ({ children, ...props }) => <p {...props}>{children}</p>,
		h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
		h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
		h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
		img: ({ children, ...props }) => <img {...props}>{children}</img>,
		section: ({ children, ...props }) => (
			<section {...props}>{children}</section>
		),
	},
	AnimatePresence: ({ children }) => children,
}));

// Mock React Hot Toast
jest.mock('react-hot-toast', () => ({
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		loading: jest.fn(),
		dismiss: jest.fn(),
	},
	Toaster: () => 'Toaster',
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
	ChevronDown: () => 'ChevronDown',
	ChevronUp: () => 'ChevronUp',
	Plus: () => 'Plus',
	Minus: () => 'Minus',
	X: () => 'X',
	Check: () => 'Check',
	Search: () => 'Search',
	Menu: () => 'Menu',
	Home: () => 'Home',
	User: () => 'User',
	Settings: () => 'Settings',
	Calendar: () => 'Calendar',
	Clock: () => 'Clock',
	Heart: () => 'Heart',
	Star: () => 'Star',
	Share: () => 'Share',
	Download: () => 'Download',
	Upload: () => 'Upload',
	Edit: () => 'Edit',
	Trash: () => 'Trash',
	Save: () => 'Save',
	Filter: () => 'Filter',
	SortAsc: () => 'SortAsc',
	SortDesc: () => 'SortDesc',
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
		emailAddresses: [{ emailAddress: 'test@example.com' }],
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
	renderWithProviders: (ui, options = {}) => {
		// This would wrap components with necessary providers
		// Implementation depends on your specific provider setup
		return render(ui, options);
	},
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

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Cleanup after each test
afterEach(() => {
	jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
	jest.restoreAllMocks();
});
