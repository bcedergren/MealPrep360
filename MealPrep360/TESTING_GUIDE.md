# Testing Guide for MealPrep360 Frontend

## Overview

This guide covers the testing framework and practices implemented for the MealPrep360 frontend project. The frontend is built with Next.js, React, and Material-UI.

## Testing Framework

### Setup

The project uses Jest with React Testing Library for comprehensive testing:

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities focused on user interactions
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Additional DOM matchers

### Configuration

- **Jest Config**: `jest.config.js` with Next.js integration
- **Setup File**: `jest.setup.js` with mocks and global configurations
- **Coverage**: Minimum 70% coverage thresholds

## Test Categories

### 1. Unit Tests (`*.unit.test.tsx`)

**Purpose**: Test individual components and functions in isolation.

**Test Coverage**:

- UI components (`src/app/components/ui/`)
- Utility functions (`src/lib/`)
- Custom hooks (`src/hooks/`)
- Context providers (`src/contexts/`)

**Example**:

```typescript
// src/app/components/ui/button.unit.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
	it('should render button with children', () => {
		render(<Button>Click me</Button>);
		expect(screen.getByRole('button')).toHaveTextContent('Click me');
	});
});
```

### 2. Integration Tests (`*.integration.test.tsx`)

**Purpose**: Test component integration with hooks, contexts, and API calls.

**Test Coverage**:

- Page components with multiple dependencies
- Component interaction with contexts
- API integration with components
- Form submission workflows

**Example**:

```typescript
// src/app/page.integration.test.tsx
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
	it('should handle newsletter subscription', async () => {
		// Test implementation
	});
});
```

### 3. E2E Tests (`*.e2e.test.tsx`)

**Purpose**: Test complete user workflows across multiple components.

**Test Coverage**:

- Complete user journeys
- Authentication flows
- Recipe creation and management
- Meal planning workflows

## Available Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only e2e tests
npm run test:e2e
```

## Test Structure

### Directory Structure

```
src/
├── app/
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── button.unit.test.tsx
│   ├── page.tsx
│   └── page.integration.test.tsx
├── hooks/
│   ├── use-subscription.ts
│   └── use-subscription.unit.test.ts
├── lib/
│   ├── utils.ts
│   └── utils.unit.test.ts
└── types/
    └── jest.d.ts
```

### Test File Naming

- **Unit Tests**: `*.unit.test.tsx`
- **Integration Tests**: `*.integration.test.tsx`
- **E2E Tests**: `*.e2e.test.tsx`

## Mock Configuration

### Global Mocks (jest.setup.js)

- **Next.js**: Router, Navigation, Image, Link components
- **Clerk Authentication**: useAuth, useUser, auth components
- **React Query**: useQuery, useMutation hooks
- **Material-UI**: All components with simplified implementations
- **Framer Motion**: Motion components
- **Lucide React**: Icon components

### Component Mocking Strategy

```typescript
// Mock Material-UI components
jest.mock('@mui/material', () => ({
	Button: ({ children, onClick, ...props }: any) => (
		<button
			onClick={onClick}
			{...props}
		>
			{children}
		</button>
	),
	// ... other components
}));
```

## Writing Tests

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button Component', () => {
	it('should handle click events', async () => {
		const user = userEvent.setup();
		const handleClick = jest.fn();

		render(<Button onClick={handleClick}>Click me</Button>);

		await user.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});
});
```

### Integration Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeForm from './recipe-form';

// Mock API calls
global.fetch = jest.fn();

describe('Recipe Form', () => {
	it('should submit recipe data', async () => {
		const user = userEvent.setup();

		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ id: '123' }),
		});

		render(<RecipeForm />);

		await user.type(screen.getByLabelText(/title/i), 'Test Recipe');
		await user.click(screen.getByRole('button', { name: /submit/i }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/recipes'),
				expect.objectContaining({
					method: 'POST',
					body: expect.stringContaining('Test Recipe'),
				})
			);
		});
	});
});
```

## Testing Patterns

### 1. Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useSubscription } from './use-subscription';

describe('useSubscription', () => {
	it('should upgrade plan', async () => {
		const { result } = renderHook(() => useSubscription());

		await act(async () => {
			result.current.upgradePlan('PLUS');
		});

		expect(result.current.currentPlan).toBe('PLUS');
	});
});
```

### 2. Testing Context Providers

```typescript
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from './language-context';
import TestComponent from './test-component';

const renderWithProvider = (ui: React.ReactElement) => {
	return render(<LanguageProvider>{ui}</LanguageProvider>);
};

describe('Language Context', () => {
	it('should provide translations', () => {
		renderWithProvider(<TestComponent />);
		expect(screen.getByText(/welcome/i)).toBeInTheDocument();
	});
});
```

### 3. Testing Async Operations

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import AsyncComponent from './async-component';

describe('Async Component', () => {
	it('should handle loading states', async () => {
		render(<AsyncComponent />);

		// Check loading state
		expect(screen.getByText(/loading/i)).toBeInTheDocument();

		// Wait for data to load
		await waitFor(() => {
			expect(screen.getByText(/data loaded/i)).toBeInTheDocument();
		});
	});
});
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Coverage Reports

Generated in `coverage/` directory:

- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- JSON format: `coverage/coverage-final.json`

## Best Practices

### 1. User-Centric Testing

- Test from the user's perspective
- Use accessible queries (getByRole, getByLabelText)
- Focus on user interactions, not implementation details

### 2. Effective Mocking

```typescript
// Good: Mock at the module level
jest.mock('@/hooks/use-subscription');

// Bad: Mock implementation details
jest.spyOn(component, 'privateMethod');
```

### 3. Async Testing

```typescript
// Good: Use waitFor for async operations
await waitFor(() => {
	expect(screen.getByText('Success')).toBeInTheDocument();
});

// Bad: Use arbitrary timeouts
setTimeout(() => {
	expect(screen.getByText('Success')).toBeInTheDocument();
}, 1000);
```

### 4. Test Organization

```typescript
describe('Component Name', () => {
	describe('when user is authenticated', () => {
		beforeEach(() => {
			// Setup authenticated state
		});

		it('should show user dashboard', () => {
			// Test implementation
		});
	});

	describe('when user is not authenticated', () => {
		beforeEach(() => {
			// Setup unauthenticated state
		});

		it('should redirect to login', () => {
			// Test implementation
		});
	});
});
```

## Common Testing Scenarios

### 1. Authentication Testing

```typescript
// Mock authenticated user
jest.mock('@clerk/nextjs', () => ({
	useUser: () => ({
		isSignedIn: true,
		user: { id: 'test-user' },
	}),
}));
```

### 2. Form Testing

```typescript
const user = userEvent.setup();

// Fill form
await user.type(screen.getByLabelText(/email/i), 'test@example.com');
await user.type(screen.getByLabelText(/password/i), 'password123');

// Submit form
await user.click(screen.getByRole('button', { name: /submit/i }));
```

### 3. API Testing

```typescript
// Mock successful API response
(global.fetch as jest.Mock).mockResolvedValueOnce({
	ok: true,
	json: async () => ({ success: true }),
});

// Mock API error
(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
```

### 4. Navigation Testing

```typescript
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
}));

// Test navigation
await user.click(screen.getByText(/go to dashboard/i));
expect(mockPush).toHaveBeenCalledWith('/dashboard');
```

## Troubleshooting

### Common Issues

1. **Component Not Rendering**: Check if all required props are provided
2. **Mock Not Working**: Ensure mocks are defined before imports
3. **Async Test Failures**: Use waitFor for async operations
4. **Material-UI Errors**: Ensure all MUI components are mocked

### Debug Tips

- Use `screen.debug()` to see rendered HTML
- Add `data-testid` attributes for hard-to-query elements
- Use `--verbose` flag for detailed test output
- Check browser console for React warnings

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Frontend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Next Steps

1. **Visual Testing**: Add Storybook for component documentation
2. **E2E Testing**: Add Playwright for full browser testing
3. **Performance Testing**: Add React performance testing
4. **Accessibility Testing**: Add automated a11y testing
5. **Snapshot Testing**: Add component snapshot tests

This testing framework ensures the MealPrep360 frontend is reliable, maintainable, and provides a great user experience.
