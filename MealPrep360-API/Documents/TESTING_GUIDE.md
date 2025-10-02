# Comprehensive Testing Guide

## Overview
This guide covers all testing strategies and tools for ensuring that all functionality works as expected across the MealPrep360 ecosystem.

## Test Suite Structure

### 1. Unit Tests (`src/tests/unit/`)
- **Purpose**: Test individual components and functions in isolation
- **Coverage**: Service communication, authentication, configuration, monitoring
- **Run**: `npm run test:unit`

### 2. Integration Tests (`src/tests/integration/`)
- **Purpose**: Test service-to-service communication and data flow
- **Coverage**: API Gateway routing, service discovery, error handling, fallback mechanisms
- **Run**: `npm run test:integration`

### 3. End-to-End Tests (`src/tests/e2e/`)
- **Purpose**: Test complete user workflows and business processes
- **Coverage**: Full meal planning workflow, user onboarding, collaboration features
- **Run**: `npm run test:e2e`

### 4. API Endpoint Tests (`src/tests/api/`)
- **Purpose**: Test all API endpoints and request/response handling
- **Coverage**: Authentication, CRUD operations, validation, error handling
- **Run**: `npm run test:api`

### 5. Performance Tests (`src/tests/performance/`)
- **Purpose**: Test system performance, load handling, and scalability
- **Coverage**: Response times, concurrent requests, memory usage, database performance
- **Run**: `npm run test:performance`

## Running Tests

### Quick Commands
```bash
# Run all tests
npm run test:all

# Run comprehensive test suite
npm run test:comprehensive

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:api
npm run test:performance

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Runner Features
- **Parallel Execution**: Unit and integration tests run in parallel for speed
- **Sequential Execution**: E2E and performance tests run sequentially to avoid conflicts
- **Timeout Management**: Different timeouts for different test types
- **Comprehensive Reporting**: Detailed results with recommendations
- **Error Handling**: Graceful handling of test failures

## Test Coverage

### Service Communication Tests
- ✅ Service configuration validation
- ✅ API key generation and validation
- ✅ Service discovery and registration
- ✅ Health check monitoring
- ✅ Circuit breaker patterns
- ✅ Retry logic and fallback mechanisms
- ✅ Rate limiting and authentication

### API Endpoint Tests
- ✅ Authentication endpoints (login, register, logout)
- ✅ Recipe management (CRUD operations)
- ✅ Meal plan generation and management
- ✅ Shopping list creation and management
- ✅ User profile and preferences
- ✅ Social media features
- ✅ Admin functionality
- ✅ Error handling and validation

### Integration Tests
- ✅ Service-to-service communication
- ✅ API Gateway routing
- ✅ Data flow between services
- ✅ Error propagation and handling
- ✅ Fallback mechanisms
- ✅ Authentication flow

### End-to-End Tests
- ✅ Complete meal planning workflow
- ✅ User registration and onboarding
- ✅ Meal plan sharing and collaboration
- ✅ Error recovery scenarios
- ✅ Performance under load

### Performance Tests
- ✅ Response time testing
- ✅ Concurrent request handling
- ✅ Memory usage monitoring
- ✅ Database query performance
- ✅ Service communication efficiency
- ✅ Error recovery performance

## Test Data and Mocking

### Mock Services
All tests use mocked services to ensure:
- **Isolation**: Tests don't depend on external services
- **Reliability**: Tests run consistently regardless of external service status
- **Speed**: Tests execute quickly without network calls
- **Control**: Tests can simulate various scenarios and error conditions

### Test Data
- **User Data**: Mock users with various preferences and dietary restrictions
- **Recipe Data**: Sample recipes with ingredients and instructions
- **Meal Plans**: Generated meal plans for different scenarios
- **Shopping Lists**: Sample shopping lists with various items

## Continuous Integration

### Pre-commit Hooks
```bash
# Run tests before committing
npm run test:unit
npm run test:integration
```

### CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
- name: Run Unit Tests
  run: npm run test:unit

- name: Run Integration Tests
  run: npm run test:integration

- name: Run E2E Tests
  run: npm run test:e2e

- name: Run Performance Tests
  run: npm run test:performance
```

## Test Environment Setup

### Prerequisites
1. **Node.js**: Version 18 or higher
2. **Dependencies**: All packages installed (`npm install`)
3. **Environment**: Test environment variables configured
4. **Services**: Mock services configured (no real services needed)

### Configuration
- **Jest**: Configured for TypeScript and Next.js
- **Timeouts**: Appropriate timeouts for different test types
- **Coverage**: 70% minimum coverage threshold
- **Parallel**: Optimized for parallel execution where possible

## Debugging Tests

### Common Issues
1. **Timeout Errors**: Increase timeout for slow tests
2. **Mock Issues**: Verify mock implementations
3. **Environment Issues**: Check environment variables
4. **Service Issues**: Ensure services are properly mocked

### Debug Commands
```bash
# Run specific test file
npx jest src/tests/unit/service-communication.test.ts

# Run with verbose output
npx jest --verbose

# Run with debug information
npx jest --detectOpenHandles --forceExit

# Run single test
npx jest --testNamePattern="should authenticate user"
```

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: Each test should test one thing
4. **Mock External Dependencies**: Don't rely on external services
5. **Clean Up**: Clean up after each test

### Test Organization
1. **Group Related Tests**: Use describe blocks effectively
2. **Setup and Teardown**: Use beforeEach and afterEach appropriately
3. **Test Data**: Use consistent test data across tests
4. **Error Cases**: Test both success and failure scenarios

### Performance Considerations
1. **Parallel Execution**: Use parallel tests where possible
2. **Mock Heavy Operations**: Mock database and network calls
3. **Timeout Management**: Set appropriate timeouts
4. **Resource Cleanup**: Clean up resources after tests

## Monitoring and Reporting

### Test Results
- **Pass/Fail Status**: Clear indication of test results
- **Duration**: Execution time for each test suite
- **Coverage**: Code coverage percentage
- **Recommendations**: Suggestions for improvement

### Continuous Monitoring
- **Test Trends**: Track test performance over time
- **Failure Analysis**: Identify common failure patterns
- **Performance Metrics**: Monitor test execution times
- **Coverage Trends**: Track code coverage changes

## Troubleshooting

### Common Problems
1. **Tests Failing**: Check mock implementations and test data
2. **Slow Tests**: Optimize test setup and use parallel execution
3. **Memory Issues**: Check for memory leaks in tests
4. **Timeout Issues**: Adjust timeouts for slow operations

### Getting Help
1. **Check Logs**: Review test output for error messages
2. **Debug Mode**: Use debug mode for detailed information
3. **Isolate Issues**: Run individual tests to isolate problems
4. **Update Dependencies**: Ensure all dependencies are up to date

---

**This comprehensive testing suite ensures that all functionality works as expected across your entire MealPrep360 ecosystem.**