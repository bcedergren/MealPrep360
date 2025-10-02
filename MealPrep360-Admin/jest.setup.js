import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
	useRouter: () => ({
		route: '/',
		pathname: '/',
		query: {},
		asPath: '/',
		push: jest.fn(),
		replace: jest.fn(),
		reload: jest.fn(),
		back: jest.fn(),
		prefetch: jest.fn(),
		beforePopState: jest.fn(),
		events: {
			on: jest.fn(),
			off: jest.fn(),
			emit: jest.fn(),
		},
	}),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		refresh: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
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
		getToken: jest.fn(() => Promise.resolve('test-token')),
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
	SignedIn: ({ children }) => children,
	SignedOut: () => null,
	RedirectToSignIn: () => null,
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.location
if (!window.location) {
	Object.defineProperty(window, 'location', {
		value: {
			href: 'http://localhost:3001',
			origin: 'http://localhost:3001',
			protocol: 'http:',
			host: 'localhost:3001',
			hostname: 'localhost',
			port: '3001',
			pathname: '/',
			search: '',
			hash: '',
			assign: jest.fn(),
			replace: jest.fn(),
			reload: jest.fn(),
		},
		writable: true,
	});
}

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	warn: jest.fn(),
	error: jest.fn(),
};
