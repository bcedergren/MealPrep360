# Testing Guide for MealPrep360 Admin

## Overview

This guide covers the testing framework and practices implemented for the MealPrep360 Admin project after the Phase 6 migration to centralized API endpoints.

## Testing Framework

### Setup

The project uses Jest with React Testing Library for comprehensive testing:

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Additional matchers

### Configuration

- **Jest Config**: `jest.config.js` with Next.js integration
- **Setup File**: `jest.setup.js` with mocks and global configurations
- **Coverage**: Minimum 80% coverage thresholds

## Test Categories

### 1. Integration Tests (`src/__tests__/integration.test.tsx`)

**Purpose**: Verify components work correctly with the API client and overall system integration.

**Test Coverage**:

- API client integration
- Component integration with user interactions
- Error handling (network errors, server errors)
- Data flow (recipes, blog posts, users)
- Workflow integration (recipe generation, CRUD operations)
- Performance (concurrent API calls, timeouts)

**Key Features**:

- Mock API client responses
- Component rendering and interaction testing
- Async operation handling
- Error boundary testing

### 2. End-to-End Workflow Tests (`src/__tests__/e2e-workflows.test.tsx`)

**Purpose**: Test complete user workflows from start to finish.

**Test Coverage**:

- **Recipe Management Workflow**: Fetch → Update → Generate Image → Delete
- **Blog Management Workflow**: Fetch → Create → Update → Delete
- **User Management Workflow**: Fetch → Set Admin Roles
- **Recipe Generation Workflow**: Generate → Monitor → Retry → Delete Jobs
- **Error Recovery**: Network failures, API errors, timeout handling
- **Performance**: Concurrent operations, bulk operations

**Key Features**:

- Complete workflow simulation
- Status monitoring and polling
- Error recovery scenarios
- Performance testing

## Running Tests

### Available Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration
```

### Test Execution

```bash
# Standard test run
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

## Mock Configuration

### Global Mocks (jest.setup.js)

- **Next.js Router**: `useRouter`, `usePathname`, `useSearchParams`
- **Clerk Authentication**: `useAuth`, `useUser`, `auth`
- **Environment Variables**: `NEXT_PUBLIC_API_URL`
- **Fetch API**: Global fetch mock
- **Window Location**: Navigation mocking

### Component Mocks

- **Next.js Image**: Simplified image component
- **Material-UI DataGrid**: Simplified grid component
- **API Client**: Comprehensive API method mocking

## Test Patterns

### 1. API Client Testing

```typescript
// Mock API responses
const mockClient = new ClientAdminApiClient();
(mockClient.getStats as jest.Mock).mockResolvedValue(mockData);

// Test API calls
const result = await mockClient.getStats();
expect(result).toEqual(mockData);
```

### 2. Component Integration Testing

```typescript
// Render component
render(<TestComponent />);

// Test interactions
const button = screen.getByText('Click Me');
await user.click(button);

// Assert results
expect(mockHandler).toHaveBeenCalledTimes(1);
```

### 3. Workflow Testing

```typescript
// Test complete workflow
const workflow = async () => {
	const data = await apiClient.fetchData();
	const updated = await apiClient.updateData(data);
	return await apiClient.processData(updated);
};

const result = await workflow();
expect(result.success).toBe(true);
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Reports

Generated in `coverage/` directory:

- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- JSON format: `coverage/coverage-final.json`

## Best Practices

### 1. Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and independent

### 2. Mocking Strategy

- Mock external dependencies
- Use realistic mock data
- Mock at the appropriate level (API client vs fetch)
- Clean up mocks between tests

### 3. Async Testing

```typescript
// Proper async testing
it('should handle async operations', async () => {
	const promise = asyncOperation();
	await expect(promise).resolves.toEqual(expectedResult);
});

// Wait for elements
await waitFor(() => {
	expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### 4. Error Testing

```typescript
// Test error conditions
it('should handle errors gracefully', async () => {
	mockApi.mockRejectedValue(new Error('API Error'));
	await expect(operation()).rejects.toThrow('API Error');
});
```

## Troubleshooting

### Common Issues

1. **Module Resolution**: Ensure proper module mapping in Jest config
2. **Async Operations**: Use `await` and `waitFor` for async operations
3. **Mock Cleanup**: Clear mocks between tests with `jest.clearAllMocks()`
4. **Environment Variables**: Mock environment variables in setup file

### Debug Tips

- Use `screen.debug()` to inspect rendered components
- Add `console.log` statements in tests for debugging
- Use `--verbose` flag for detailed test output
- Check coverage reports to identify untested code

## Migration Validation

The tests validate that the Phase 6 migration was successful:

1. **API Routes Removed**: No local API routes in Admin project
2. **Centralized API Client**: All components use the API client
3. **Functionality Preserved**: All features work with centralized API
4. **Error Handling**: Proper error handling throughout the application

## Future Enhancements

1. **Visual Regression Testing**: Add screenshot testing
2. **Performance Testing**: Add performance benchmarks
3. **Accessibility Testing**: Add a11y testing
4. **Cross-browser Testing**: Add browser compatibility tests

## Test Results

Current test status:

- **Test Suites**: 2 passed, 2 total
- **Tests**: 20 passed, 20 total
- **Coverage**: Meeting minimum thresholds
- **Integration**: All workflows validated

The testing framework ensures that the Admin project functions correctly as a pure frontend consuming the centralized API service.
