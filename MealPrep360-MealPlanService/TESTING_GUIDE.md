# Testing Guide for MealPrep360-MealPlanService

## Overview

This guide covers the testing framework and practices implemented for the MealPrep360-MealPlanService project. This service handles meal plan generation, management, and recipe integration.

## Testing Framework

### Setup

The project uses Jest with React Testing Library for comprehensive testing:

- **Jest**: Test runner and assertion library with ES modules support
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Additional DOM matchers

### Configuration

- **Jest Config**: `jest.config.js` with Next.js and ES modules integration
- **Setup File**: `jest.setup.js` with mocks and global configurations
- **Coverage**: Minimum 70% coverage thresholds
- **TypeScript**: Full TypeScript support with ts-jest

## Test Categories

### 1. Unit Tests (`*.unit.test.ts`)

**Purpose**: Test individual functions, services, and components in isolation.

**Test Coverage**:

- API route handlers (`src/app/api/`)
- Service classes (`src/app/services/`)
- Repository classes (`src/app/repositories/`)
- Utility functions (`src/app/lib/`)

**Example**:

```typescript
// src/app/api/health/route.unit.test.ts
import { GET } from './route';

describe('/api/health', () => {
	it('should return healthy status', async () => {
		const response = await GET();
		expect(response.status).toBe(200);
	});
});
```

### 2. Integration Tests (`*.integration.test.ts`)

**Purpose**: Test API endpoints with service integration and database interactions.

**Test Coverage**:

- Complete API request/response cycles
- Service integration with repositories
- Database operations (mocked)
- Error handling scenarios

**Example**:

```typescript
// src/app/api/meal-plans/route.integration.test.ts
import { POST } from './route';

describe('POST /api/meal-plans', () => {
	it('should create meal plan successfully', async () => {
		// Test implementation
	});
});
```

### 3. E2E Tests (`*.e2e.test.ts`)

**Purpose**: Test complete user workflows and system integration.

**Test Coverage**:

- Full meal plan generation workflow
- Recipe integration scenarios
- User authentication flows
- Cross-service communication

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
│   ├── api/
│   │   ├── health/
│   │   │   ├── route.ts
│   │   │   └── route.unit.test.ts
│   │   └── meal-plans/
│   │       ├── route.ts
│   │       └── route.integration.test.ts
│   ├── services/
│   │   ├── mealPlanService.ts
│   │   └── mealPlanService.unit.test.ts
│   ├── repositories/
│   │   ├── mealPlanRepository.ts
│   │   └── mealPlanRepository.unit.test.ts
│   └── __tests__/
│       └── page.test.tsx
```

### Test File Naming

- **Unit Tests**: `*.unit.test.ts`
- **Integration Tests**: `*.integration.test.ts`
- **E2E Tests**: `*.e2e.test.ts`

## Mock Configuration

### Global Mocks (jest.setup.js)

- **Next.js**: Router, Navigation, Image, Link components
- **Clerk Authentication**: useAuth, useUser, auth components
- **MongoDB**: MongoClient, ObjectId, collections
- **External APIs**: Recipe service, notification service

### Service Mocking Strategy

```typescript
// Mock service dependencies
jest.mock('@/app/services/mealPlanService');
jest.mock('@/app/repositories/mealPlanRepository');

const mockMealPlanService = {
	generateMealPlan: jest.fn(),
	getMealPlansByDateRange: jest.fn(),
	deleteMealPlan: jest.fn(),
};
```

## Writing Tests

### Testing Meal Plan Generation

The meal plan generation functionality includes several key components that should be tested:

#### 1. Recipe Service Testing

```typescript
import { RecipeService } from './recipeService';

describe('RecipeService.getUserSavedRecipes', () => {
	let service: RecipeService;

	beforeEach(() => {
		service = new RecipeService();
	});

	it('should retrieve user saved recipes from database', async () => {
		const userId = '68376d8d1d7239d019114200';
		const recipes = await service.getUserSavedRecipes(userId);

		expect(recipes).toBeDefined();
		expect(Array.isArray(recipes)).toBe(true);
		expect(recipes.length).toBeGreaterThan(0);
	});

	it('should handle users with no saved recipes', async () => {
		const userId = 'non-existent-user';
		const recipes = await service.getUserSavedRecipes(userId);

		expect(recipes).toEqual([]);
	});

	it('should handle both ObjectId and string user IDs', async () => {
		const objectIdUser = '68376d8d1d7239d019114200';
		const stringUser = 'test-user-string';

		const objectIdRecipes = await service.getUserSavedRecipes(objectIdUser);
		const stringRecipes = await service.getUserSavedRecipes(stringUser);

		expect(objectIdRecipes).toBeDefined();
		expect(stringRecipes).toBeDefined();
	});
});
```

#### 2. Meal Plan Generation Endpoint Testing

```typescript
import { POST } from './route';

describe('POST /api/meal-plans/generate', () => {
	it('should generate meal plan with user recipes', async () => {
		const request = new NextRequest(
			'http://localhost:3000/api/meal-plans/generate',
			{
				method: 'POST',
				body: JSON.stringify({
					userId: '68376d8d1d7239d019114200',
					startDate: '2024-01-01T00:00:00.000Z',
					duration: 7,
				}),
			}
		);

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('id');
		expect(data).toHaveProperty('days');
		expect(data.days).toHaveLength(7);
	});

	it('should fall back to default recipes when no user recipes found', async () => {
		const request = new NextRequest(
			'http://localhost:3000/api/meal-plans/generate',
			{
				method: 'POST',
				body: JSON.stringify({
					userId: 'user-with-no-recipes',
					startDate: '2024-01-01T00:00:00.000Z',
					duration: 7,
				}),
			}
		);

		const response = await POST(request);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.days).toHaveLength(7);
		// Should have recipes assigned (from defaults)
		expect(data.days.some((day) => day.recipeId)).toBe(true);
	});

	it('should return 405 for unsupported HTTP methods', async () => {
		const request = new NextRequest(
			'http://localhost:3000/api/meal-plans/generate',
			{
				method: 'GET',
			}
		);

		const response = await GET(request);
		expect(response.status).toBe(405);
	});
});
```

#### 3. Integration Testing with Database

````typescript
describe('Meal Plan Generation Integration', () => {
	it('should use recipes from userrecipes collection', async () => {
		// Setup: Ensure user has saved recipes in database
		const userId = '68376d8d1d7239d019114200';

		// Test: Generate meal plan
		const mealPlan = await mealPlanService.generateMealPlan(userId, {
			startDate: new Date(),
			duration: 7,
		});

		// Verify: Meal plan uses user's saved recipes
		expect(mealPlan.days).toHaveLength(7);
		expect(mealPlan.days.some((day) => day.recipeId)).toBe(true);

		// Verify: Recipes are from user's collection
		const userRecipes = await recipeService.getUserSavedRecipes(userId);
		const usedRecipeIds = mealPlan.days
			.filter((day) => day.recipeId)
			.map((day) => day.recipeId);

		expect(
			usedRecipeIds.every((id) =>
				userRecipes.some((recipe) => recipe._id.toString() === id)
			)
		).toBe(true);
	});

	it('should fall back to default recipes when user has no saved recipes', async () => {
		// Setup: User with no saved recipes
		const userId = 'user-with-no-recipes';

		// Mock: Recipe service returns empty array
		jest.spyOn(recipeService, 'getUserSavedRecipes').mockResolvedValue([]);

		// Test: Generate meal plan
		const mealPlan = await mealPlanService.generateMealPlan(userId, {
			startDate: new Date(),
			duration: 7,
		});

		// Verify: Meal plan is generated with default recipes
		expect(mealPlan.days).toHaveLength(7);
		expect(mealPlan.days.some(day => day.recipeId)).toBe(true);

		// Verify: Uses default recipe IDs
		const defaultRecipeIds = ['default-dinner-1', 'default-dinner-2', 'default-dinner-3', 'default-dinner-4', 'default-dinner-5'];
		const usedRecipeIds = mealPlan.days
			.filter(day => day.recipeId)
			.map(day => day.recipeId);

		expect(usedRecipeIds.every(id => defaultRecipeIds.includes(id))).toBe(true);
	});
});

### API Route Testing

```typescript
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('/api/meal-plans', () => {
	it('should handle POST request', async () => {
		const request = new NextRequest('http://localhost:3000/api/meal-plans', {
			method: 'POST',
			body: JSON.stringify({
				userId: 'user-1',
				startDate: '2024-01-01',
				duration: 7,
			}),
		});

		const response = await POST(request);
		expect(response.status).toBe(200);
	});
});
````

### Service Testing

```typescript
import { MealPlanService } from './mealPlanService';

describe('MealPlanService', () => {
	let service: MealPlanService;
	let mockRepository: jest.Mocked<MealPlanRepository>;

	beforeEach(() => {
		mockRepository = {
			create: jest.fn(),
			findByDateRange: jest.fn(),
			delete: jest.fn(),
		} as any;

		service = new MealPlanService(mockRepository);
	});

	it('should generate meal plan', async () => {
		const result = await service.generateMealPlan('user-1', {
			startDate: new Date('2024-01-01'),
			duration: 7,
		});

		expect(result).toBeDefined();
		expect(mockRepository.create).toHaveBeenCalled();
	});
});
```

### Database Testing

```typescript
// Mock MongoDB operations
const mockCollection = {
	insertOne: jest.fn(),
	find: jest.fn(),
	findOne: jest.fn(),
	updateOne: jest.fn(),
	deleteOne: jest.fn(),
	countDocuments: jest.fn(),
};

const mockDb = {
	collection: jest.fn().mockReturnValue(mockCollection),
	command: jest.fn(),
};

const mockClient = {
	db: jest.fn().mockReturnValue(mockDb),
	close: jest.fn(),
};

jest.mock('@/app/lib/mongodb', () => ({
	getMongoClient: jest.fn().mockResolvedValue(mockClient),
}));
```

## Testing Patterns

### 1. Testing Authentication

```typescript
// Mock authenticated request
jest.mock('next/headers', () => ({
	headers: () => ({
		get: jest.fn().mockReturnValue('Bearer valid-token'),
	}),
}));
```

### 2. Testing Date Handling

```typescript
// Mock date functions
const mockDate = new Date('2024-01-01T12:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
```

### 3. Testing Error Scenarios

```typescript
it('should handle database errors', async () => {
	mockRepository.findByDateRange.mockRejectedValue(
		new Error('Database connection failed')
	);

	const request = new NextRequest(
		'http://localhost:3000/api/meal-plans?startDate=2024-01-01&endDate=2024-01-07'
	);

	const response = await GET(request);
	expect(response.status).toBe(500);
});
```

### 4. Testing Business Logic

```typescript
it('should validate meal plan generation requirements', async () => {
	// Test with no recipes
	mockRecipeService.getUserRecipes.mockResolvedValue([]);

	await expect(
		service.generateMealPlan('user-1', {
			startDate: new Date('2024-01-01'),
			duration: 7,
		})
	).rejects.toThrow('No saved recipes found');
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

### 1. Test Structure

```typescript
describe('Service/Component Name', () => {
	describe('method/feature name', () => {
		describe('when condition', () => {
			it('should expected behavior', () => {
				// Test implementation
			});
		});
	});
});
```

### 2. Mock Management

```typescript
// Good: Clear, specific mocks
const mockMealPlanService = {
	generateMealPlan: jest.fn(),
	getMealPlansByDateRange: jest.fn(),
};

// Bad: Overly complex mocks
jest.mock('./service', () => ({
	default: jest.fn().mockImplementation(() => ({
		method1: jest.fn(),
		method2: jest.fn(),
		// ... many methods
	})),
}));
```

### 3. Async Testing

```typescript
// Good: Proper async/await usage
it('should handle async operations', async () => {
	const result = await service.asyncMethod();
	expect(result).toBeDefined();
});

// Bad: Missing await
it('should handle async operations', () => {
	const result = service.asyncMethod();
	expect(result).toBeDefined(); // This will fail
});
```

### 4. Test Data Management

```typescript
// Good: Use test utilities
const testUser = testUtils.createMockUser();
const testMealPlan = testUtils.createMockMealPlan();

// Bad: Inline test data
const testUser = {
	id: 'user-1',
	email: 'test@example.com',
	// ... many properties
};
```

## Common Testing Scenarios

### 1. API Endpoint Testing

```typescript
describe('API Endpoint', () => {
	it('should validate request parameters', async () => {
		const request = new NextRequest('http://localhost:3000/api/endpoint');
		const response = await GET(request);
		expect(response.status).toBe(400);
	});

	it('should handle authentication', async () => {
		// Test with invalid token
		// Test with valid token
	});

	it('should handle service errors', async () => {
		// Mock service to throw error
		// Verify error response
	});
});
```

### 2. Service Layer Testing

```typescript
describe('MealPlanService', () => {
	it('should generate meal plan with valid data', async () => {
		// Setup mocks
		// Call service method
		// Verify result
		// Verify dependencies called correctly
	});

	it('should handle edge cases', async () => {
		// Test with empty data
		// Test with invalid data
		// Test with boundary conditions
	});
});
```

### 3. Database Integration Testing

```typescript
describe('Repository', () => {
	it('should save meal plan to database', async () => {
		const mealPlan = testUtils.createMockMealPlan();

		mockCollection.insertOne.mockResolvedValue({
			insertedId: 'new-id',
		});

		const result = await repository.create(mealPlan);

		expect(result).toBeDefined();
		expect(mockCollection.insertOne).toHaveBeenCalledWith(mealPlan);
	});
});
```

## Troubleshooting

### Common Issues

1. **ES Modules Errors**: Ensure `type: "module"` in package.json and proper Jest configuration
2. **Mock Not Working**: Check mock placement and import order
3. **Async Test Failures**: Use proper async/await patterns
4. **TypeScript Errors**: Verify type definitions and mock typing

### Debug Tips

- Use `console.log` in tests for debugging
- Add `--verbose` flag for detailed output
- Use `--detectOpenHandles` to find hanging processes
- Check Jest configuration for module resolution issues

## CI/CD Integration

### GitHub Actions Example

```yaml
name: MealPlanService Tests
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

## Performance Testing

### Load Testing

```typescript
describe('Performance Tests', () => {
	it('should handle multiple concurrent requests', async () => {
		const promises = Array.from({ length: 100 }, () =>
			service.generateMealPlan('user-1', { startDate: new Date(), duration: 7 })
		);

		const results = await Promise.all(promises);
		expect(results).toHaveLength(100);
	});
});
```

## Next Steps

1. **Add Snapshot Testing**: For component rendering consistency
2. **Add Visual Testing**: For UI component verification
3. **Add Contract Testing**: For API contract validation
4. **Add Performance Benchmarks**: For service performance monitoring
5. **Add Security Testing**: For authentication and authorization

This testing framework ensures the MealPlanService is reliable, maintainable, and provides consistent meal planning functionality.
