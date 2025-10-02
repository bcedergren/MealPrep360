# MealPrep360 API Integration

## Overview

This document outlines the complete API integration setup for MealPrep360Mobile, connecting the React Native app to the backend API at `api.mealprep360.com`.

## Architecture

### API Service Layer (`src/services/api.ts`)

A comprehensive API client with the following features:

#### Core Components
- **ApiClient Class**: Main service class handling all API communication
- **ApiClientError**: Custom error class for structured error handling
- **useApiClient Hook**: React hook providing authenticated API methods

#### Key Features
- **Authentication**: Automatic Bearer token handling via Clerk
- **Error Handling**: Structured error responses with status codes and error types
- **Network Detection**: Graceful handling of offline/online states
- **Type Safety**: Full TypeScript integration with existing Recipe interfaces

#### API Configuration
```typescript
const API_BASE_URL = 'https://api.mealprep360.com';
const API_VERSION = 'v1';
const API_URL = `${API_BASE_URL}/${API_VERSION}`;
```

### Recipe Search Integration (`src/hooks/useRecipeSearch.ts`)

Updated the existing recipe search hook to use the new API service:

#### Changes Made
1. **Import Integration**: Added API client and error handling utilities
2. **Fetch Method Updates**: Replaced manual fetch calls with API client methods
3. **Error Handling**: Enhanced error handling with network detection and fallbacks
4. **Fallback Strategy**: Automatic fallback to mock data if API fails

#### API Methods Used
- `searchRecipes()`: Main recipe search with advanced filtering
- `getRecipeSuggestions()`: Auto-complete and search suggestions

## API Endpoints

### Recipe Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recipes/search` | Search recipes with filters |
| GET | `/recipes/suggestions` | Get search suggestions |
| GET | `/recipes/{id}` | Get recipe by ID |
| GET | `/recipes/featured` | Get featured recipes |
| GET | `/recipes/popular` | Get popular recipes |
| GET | `/recipes/recommended` | Get personalized recommendations |

### User Recipe Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recipes/{id}/save` | Save recipe to user favorites |
| DELETE | `/recipes/{id}/save` | Remove from favorites |
| POST | `/recipes/{id}/rating` | Rate a recipe |
| GET | `/user/recipes/saved` | Get user's saved recipes |

### Metadata Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recipes/categories` | Get available categories |
| GET | `/recipes/cuisines` | Get cuisine types |
| GET | `/recipes/dietary-restrictions` | Get dietary restrictions |
| GET | `/health` | API health check |

## Request/Response Format

### Search Request Parameters
```typescript
{
  page: number;
  limit: number;
  query?: string;
  categories?: string; // comma-separated
  dietary?: string; // comma-separated
  cuisines?: string; // comma-separated
  mealTypes?: string; // comma-separated
  difficulty?: string; // comma-separated
  maxPrepTime?: number;
  maxCookTime?: number;
  maxTotalTime?: number;
  maxCalories?: number;
  minRating?: number;
  includeIngredients?: string; // comma-separated
  excludeIngredients?: string; // comma-separated
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
```

### Search Response Format
```typescript
{
  recipes: Recipe[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: {
    availableCategories: RecipeCategory[];
    availableCuisines: CuisineType[];
    availableDietary: DietaryRestriction[];
    timeRanges: {
      prep: TimeRange;
      cook: TimeRange;
      total: TimeRange;
    };
    calorieRange: CalorieRange;
  };
}
```

## Error Handling

### Error Types
1. **Network Errors**: Connection issues, timeouts
2. **Authentication Errors**: Invalid/expired tokens
3. **API Errors**: Server-side errors with structured responses
4. **Validation Errors**: Invalid request parameters

### Error Handling Strategy
```typescript
try {
  const data = await api.searchRecipes(filters, page, pageSize);
  // Handle success
} catch (error) {
  if (isNetworkError(error)) {
    // Show network error message
  } else if (isAuthError(error)) {
    // Handle authentication error
  } else {
    // Show generic error message
  }
  
  // Fallback to mock data if needed
  if (!append && recipes.length === 0) {
    setRecipes(mockRecipes);
  }
}
```

## Authentication

### Clerk Integration
- Uses Clerk's `useAuth` hook for token management
- Automatic token refresh and validation
- Graceful handling of unauthenticated states

### Token Usage
```typescript
const { getToken } = useAuth();
const token = await getToken();
// Token automatically included in API requests
```

## Caching Strategy

### Local Storage Caching
- Recipe search results cached for 5 minutes
- Search history stored locally
- Offline-first approach with API sync

### Cache Implementation
```typescript
const cacheData = async (recipes: Recipe[]) => {
  const cacheData = {
    recipes,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(CACHE_KEYS.RECIPES, JSON.stringify(cacheData));
};
```

## Health Monitoring (`src/hooks/useApiHealth.ts`)

### API Health Check Hook
- Automatic health monitoring
- Response time tracking
- Connection status reporting
- Error state management

### Usage
```typescript
const { status, checkHealth } = useApiHealth(true);

// Status includes:
// - isOnline: boolean
// - isHealthy: boolean
// - lastChecked: Date
// - error: string | null
// - responseTime: number | null
```

## Integration Status

### ✅ Completed
- [x] API service layer with full TypeScript support
- [x] Recipe search API integration
- [x] Error handling and fallback mechanisms
- [x] Authentication via Clerk
- [x] Health monitoring system
- [x] Local caching implementation
- [x] Network state detection

### 🚧 In Progress
- Recipe details API integration
- User interaction endpoints (save, rate)
- Recommendation engine integration

### 📋 Next Steps
1. Test API connectivity with real backend
2. Implement remaining recipe interaction endpoints
3. Add API status indicator to development builds
4. Optimize caching and offline functionality
5. Add comprehensive error logging

## Development Tools

### API Health Monitoring
A development-only component can be added to monitor API status:

```typescript
import { useApiHealth } from '../hooks/useApiHealth';

const { status } = useApiHealth();
// Shows API connectivity status, response times, and errors
```

### Testing API Integration
1. **Health Check**: Test basic connectivity
2. **Recipe Search**: Test with various filter combinations
3. **Error Scenarios**: Test network failures and authentication errors
4. **Fallback Behavior**: Verify mock data fallbacks work correctly

## Configuration

### Environment Variables
```bash
# API Configuration
API_BASE_URL=https://api.mealprep360.com
API_VERSION=v1
API_TIMEOUT=30000

# Development Settings
ENABLE_API_LOGGING=true
ENABLE_MOCK_FALLBACK=true
```

### Build Configuration
- Development builds: Enable API status indicators
- Production builds: Disable debug features
- Testing: Use mock API endpoints

## Security Considerations

### Token Management
- Tokens automatically refreshed by Clerk
- No token storage in AsyncStorage
- Secure HTTPS communication only

### Data Privacy
- User data encrypted in transit
- Local cache data not sensitive
- Compliance with data protection regulations

## Performance Optimization

### Request Optimization
- Debounced search suggestions (300ms)
- Pagination for large result sets
- Efficient filter parameter serialization

### Caching Strategy
- 5-minute cache for search results
- Infinite scroll with intelligent loading
- Background refresh on app resume

### Network Efficiency
- Compressed request/response payloads
- Conditional requests where supported
- Batch operations for multiple actions

---

## Summary

The API integration provides a robust foundation for connecting MealPrep360Mobile to the backend services. Key features include:

- **Type-safe API client** with comprehensive error handling
- **Seamless authentication** via Clerk integration
- **Intelligent fallbacks** to mock data for development
- **Performance optimizations** including caching and debouncing
- **Development tools** for API monitoring and debugging

The integration maintains backward compatibility with existing mock data while providing a clear path to full API connectivity.