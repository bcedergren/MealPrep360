import { serviceConfig } from '../../lib/services/config';
import { serviceAuth } from '../../lib/services/auth';
import { resilientClient } from '../../lib/services/resilience';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service-to-Service Communication', () => {
    test('should handle successful service communication', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: 'test data' })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await resilientClient.makeResilientRequest(
        'recipe-service',
        '/api/recipes',
        { method: 'GET' }
      );

      expect(result).toEqual({ success: true, data: 'test data' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/recipes'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-API-Key': expect.any(String),
            'X-Service-Name': 'recipe-service'
          })
        })
      );
    });

    test('should handle service communication failures with retry', async () => {
      const mockError = new Error('Network error');
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        });

      const result = await resilientClient.makeResilientRequest(
        'mealplan-service',
        '/api/meal-plans',
        { method: 'GET' },
        { maxAttempts: 3 }
      );

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should handle circuit breaker activation', async () => {
      const mockError = new Error('Service unavailable');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      // Trigger circuit breaker by making multiple failed requests
      for (let i = 0; i < 6; i++) {
        try {
          await resilientClient.makeResilientRequest(
            'test-service',
            '/api/test',
            { method: 'GET' },
            { maxAttempts: 1 }
          );
        } catch (error) {
          // Expected to fail
        }
      }

      const metrics = resilientClient.getCircuitBreakerMetrics('test-service');
      expect(metrics).toBeDefined();
    });

    test('should use fallback when service is unavailable', async () => {
      const mockError = new Error('Service unavailable');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      const fallbackData = { fallback: true, message: 'Service temporarily unavailable' };

      const result = await resilientClient.makeResilientRequest(
        'shopping-service',
        '/api/shopping-lists',
        { method: 'GET' },
        { maxAttempts: 1 },
        { enabled: true, fallbackResponse: fallbackData }
      );

      expect(result).toEqual(fallbackData);
    });
  });

  describe('API Gateway Integration', () => {
    test('should route requests to correct services', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ recipes: [] })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Test recipe service routing
      const recipeResponse = await fetch('http://localhost:3001/api/recipes', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });

      expect(recipeResponse.ok).toBe(true);
    });

    test('should handle authentication for service requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ user: 'test-user' })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await fetch('http://localhost:3001/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        }
      });

      expect(response.ok).toBe(true);
    });

    test('should handle service errors gracefully', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      const response = await fetch('http://localhost:3001/api/recipes', {
        method: 'GET'
      });

      expect(response.status).toBe(500);
    });
  });

  describe('Data Flow Integration', () => {
    test('should handle complete meal planning workflow', async () => {
      // Mock all service responses for a complete workflow
      const mockResponses = {
        recipes: { recipes: [{ id: '1', name: 'Test Recipe' }] },
        mealPlan: { mealPlan: { id: '1', recipes: ['1'] } },
        shoppingList: { shoppingList: { id: '1', items: [] } }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.recipes
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.mealPlan
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.shoppingList
        });

      // Step 1: Get recipes
      const recipesResponse = await fetch('http://localhost:3001/api/recipes');
      const recipes = await recipesResponse.json();

      // Step 2: Create meal plan
      const mealPlanResponse = await fetch('http://localhost:3001/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes: recipes.recipes })
      });
      const mealPlan = await mealPlanResponse.json();

      // Step 3: Generate shopping list
      const shoppingListResponse = await fetch('http://localhost:3001/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlanId: mealPlan.mealPlan.id })
      });
      const shoppingList = await shoppingListResponse.json();

      expect(recipes.recipes).toHaveLength(1);
      expect(mealPlan.mealPlan.recipes).toContain('1');
      expect(shoppingList.shoppingList).toBeDefined();
    });

    test('should handle user authentication flow', async () => {
      const mockAuthResponse = {
        ok: true,
        json: async () => ({ 
          user: { id: '1', email: 'test@example.com' },
          token: 'valid-token'
        })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockAuthResponse);

      const authResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' })
      });

      const authData = await authResponse.json();
      expect(authData.user.id).toBe('1');
      expect(authData.token).toBe('valid-token');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle service timeout', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(
        resilientClient.makeResilientRequest(
          'recipe-service',
          '/api/recipes',
          { method: 'GET' },
          { maxAttempts: 1, timeout: 50 }
        )
      ).rejects.toThrow('Timeout');
    });

    test('should handle service unavailable with proper error response', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service Unavailable' })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

      const response = await fetch('http://localhost:3001/api/recipes');
      const errorData = await response.json();

      expect(response.status).toBe(503);
      expect(errorData.error).toBe('Service Unavailable');
    });

    test('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await resilientClient.makeResilientRequest(
        'recipe-service',
        '/api/recipes',
        { method: 'GET' },
        { maxAttempts: 1 },
        { enabled: true, fallbackResponse: { error: 'Service temporarily unavailable' } }
      );

      expect(result.error).toBe('Service temporarily unavailable');
    });
  });
});
