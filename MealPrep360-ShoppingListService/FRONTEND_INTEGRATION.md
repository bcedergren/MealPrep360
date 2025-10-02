# Frontend Integration Guide for Shopping List Service

When the main MealPrep360 API is returning 503 errors, you can implement a fallback mechanism to use this shopping list service directly.

## Current Issue

The main API at `https://api.mealprep360.com/api/shopping-lists/generate` is returning:

```json
{
	"error": "Shopping service unavailable",
	"message": "The external shopping list service is currently unavailable. Please try again later."
}
```

## Solution: Implement Fallback Logic

### 1. Frontend Fallback Implementation

```javascript
class ShoppingListService {
	constructor() {
		this.mainApiUrl = 'https://api.mealprep360.com/api/shopping-lists/generate';
		this.fallbackApiUrl = 'YOUR_SHOPPING_LIST_SERVICE_URL/api'; // Replace with your service URL
		this.maxRetries = 2;
	}

	async generateShoppingList(requestData, authToken, userId) {
		// Try main API first
		try {
			return await this.callMainAPI(requestData, authToken, userId);
		} catch (error) {
			console.warn('Main API failed, trying fallback service...', error);

			// Use fallback service
			return await this.callFallbackAPI(requestData, authToken, userId);
		}
	}

	async callMainAPI(requestData, authToken, userId, retryCount = 0) {
		try {
			const response = await fetch(this.mainApiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authToken}`,
					'X-User-Id': userId,
				},
				body: JSON.stringify(requestData),
				timeout: 10000, // 10 second timeout
			});

			if (!response.ok) {
				// If it's a 503 or 502, don't retry - go straight to fallback
				if (response.status === 503 || response.status === 502) {
					throw new Error(`Main API unavailable: ${response.status}`);
				}

				// For other errors, try retry logic
				if (retryCount < this.maxRetries && response.status >= 500) {
					await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
					return this.callMainAPI(
						requestData,
						authToken,
						userId,
						retryCount + 1
					);
				}

				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Main API call failed:', error);
			throw error;
		}
	}

	async callFallbackAPI(requestData, authToken, userId) {
		try {
			// First check if fallback service is healthy
			const healthCheck = await fetch(
				`${this.fallbackApiUrl.replace('/api', '/api/health')}`,
				{
					method: 'GET',
					timeout: 5000,
				}
			);

			if (!healthCheck.ok) {
				throw new Error('Fallback service is also unavailable');
			}

			const healthData = await healthCheck.json();
			if (healthData.status !== 'healthy') {
				throw new Error('Fallback service is unhealthy');
			}

			// Make the actual request
			const response = await fetch(this.fallbackApiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authToken}`,
					'X-User-Id': userId,
				},
				body: JSON.stringify(requestData),
				timeout: 15000, // Longer timeout for fallback
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					`Fallback API error: ${errorData.error || response.statusText}`
				);
			}

			const result = await response.json();

			// Log successful fallback usage for monitoring
			console.info('Successfully used fallback shopping list service');

			return {
				...result,
				source: 'fallback-service', // Mark as fallback for analytics
			};
		} catch (error) {
			console.error('Fallback API call failed:', error);
			throw new Error(
				`Both main and fallback services are unavailable: ${error.message}`
			);
		}
	}

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Usage example
const shoppingService = new ShoppingListService();

async function handleShoppingListGeneration(mealPlanData, userToken, userId) {
	try {
		const result = await shoppingService.generateShoppingList(
			mealPlanData,
			userToken,
			userId
		);

		// Handle successful result
		if (result.source === 'fallback-service') {
			// Optionally show a notice to the user
			showNotification('Using backup service for shopping list generation');
		}

		return result;
	} catch (error) {
		// Handle complete failure
		console.error('Shopping list generation failed:', error);
		throw new Error(
			'Shopping list service is currently unavailable. Please try again later.'
		);
	}
}
```

### 2. Request Format

Your fallback service expects the same request format as the main API:

```javascript
const requestData = {
	userId: 'user_2whIFTiFeBzgxVOEN8BynUuvP82',
	mealPlanId: '687faef09e8db7d8c5373b40',
	// Optional fields:
	pantryExclusions: ['salt', 'pepper'],
	recipeIds: ['recipe1', 'recipe2'], // Alternative to mealPlanId
};
```

### 3. Health Monitoring

Implement periodic health checks to decide when to use fallback:

```javascript
class ServiceHealthMonitor {
	constructor() {
		this.mainApiHealth = 'unknown';
		this.fallbackApiHealth = 'unknown';
		this.lastHealthCheck = null;
		this.healthCheckInterval = 60000; // 1 minute
	}

	async checkHealth() {
		const promises = [this.checkMainAPIHealth(), this.checkFallbackAPIHealth()];

		await Promise.allSettled(promises);
		this.lastHealthCheck = Date.now();
	}

	async checkMainAPIHealth() {
		try {
			const response = await fetch('https://api.mealprep360.com/health', {
				method: 'GET',
				timeout: 5000,
			});
			this.mainApiHealth = response.ok ? 'healthy' : 'unhealthy';
		} catch (error) {
			this.mainApiHealth = 'unhealthy';
		}
	}

	async checkFallbackAPIHealth() {
		try {
			const response = await fetch('YOUR_FALLBACK_URL/api/health', {
				method: 'GET',
				timeout: 5000,
			});
			const data = await response.json();
			this.fallbackApiHealth = data.status || 'unknown';
		} catch (error) {
			this.fallbackApiHealth = 'unhealthy';
		}
	}

	shouldUseFallback() {
		return (
			this.mainApiHealth === 'unhealthy' && this.fallbackApiHealth === 'healthy'
		);
	}

	startMonitoring() {
		this.checkHealth(); // Initial check
		setInterval(() => this.checkHealth(), this.healthCheckInterval);
	}
}
```

### 4. User Experience Improvements

```javascript
// Show appropriate loading messages
function showLoadingState(usingFallback = false) {
	const message = usingFallback
		? 'Generating shopping list using backup service...'
		: 'Generating shopping list...';

	showLoadingMessage(message);
}

// Handle graceful degradation
function handleServiceDegradation(error) {
	if (error.message.includes('unavailable')) {
		showUserNotification({
			type: 'warning',
			title: 'Service Temporarily Unavailable',
			message:
				"We're experiencing technical difficulties. Please try again in a few minutes.",
			action: {
				text: 'Try Again',
				handler: () => retryShoppingListGeneration(),
			},
		});
	}
}
```

## Service URLs

- **Health Check**: `YOUR_SERVICE_URL/api/health`
- **Status Page**: `YOUR_SERVICE_URL/api/status`
- **Shopping List API**: `YOUR_SERVICE_URL/api`
- **Alternative Endpoint**: `YOUR_SERVICE_URL/api/shopping-lists/generate`

## Monitoring and Analytics

Track fallback usage for monitoring:

```javascript
// Analytics tracking
function trackFallbackUsage(source, success, error = null) {
	analytics.track('shopping_list_service_usage', {
		source: source, // 'main' or 'fallback'
		success: success,
		error: error,
		timestamp: new Date().toISOString(),
	});
}
```

## Error Handling

The fallback service returns errors in this format:

```json
{
	"error": "Shopping service unavailable",
	"message": "The shopping list service is currently unavailable. Please try again later.",
	"retryAfter": 30
}
```

Use the `retryAfter` field to implement appropriate retry delays.

## Production Considerations

1. **Load Balancing**: Consider using multiple fallback service instances
2. **Circuit Breaker**: Implement circuit breaker pattern to avoid cascading failures
3. **Caching**: Cache shopping lists locally when possible
4. **Monitoring**: Set up alerts for when fallback services are being used frequently
5. **Rate Limiting**: Implement rate limiting to protect your fallback service

## Testing

You can test the fallback service using the status page at `/api/status` or by calling the health endpoint directly.
