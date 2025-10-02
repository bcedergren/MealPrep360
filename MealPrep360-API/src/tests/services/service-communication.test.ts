import { serviceDiscovery } from '@/lib/services/discovery';
import { resilientClient } from '@/lib/services/resilience';
import { serviceAuth } from '@/lib/services/auth';
import { serviceConfig } from '@/lib/services/config';
import { monitoring } from '@/lib/services/monitoring';

describe('Service Communication Tests', () => {
  beforeAll(async () => {
    // Initialize services for testing
    await serviceConfig.initializeServices();
  });

  afterAll(() => {
    // Cleanup
    serviceDiscovery.stopHealthChecks();
    monitoring.shutdown();
  });

  describe('Service Discovery', () => {
    test('should register all services', async () => {
      const services = serviceDiscovery.getAllServices();
      expect(Object.keys(services)).toHaveLength(6);
      
      const expectedServices = [
        'recipe-service',
        'mealplan-service',
        'shopping-service',
        'social-service',
        'blog-service',
        'websocket-service'
      ];
      
      expectedServices.forEach(serviceName => {
        expect(services[serviceName]).toBeDefined();
        expect(services[serviceName].serviceName).toBe(serviceName);
      });
    });

    test('should perform health checks', async () => {
      const serviceName = 'recipe-service';
      await serviceDiscovery.checkServiceHealth(serviceName);
      
      const service = serviceDiscovery.getService(serviceName);
      expect(service).toBeDefined();
      expect(['healthy', 'unhealthy', 'unknown']).toContain(service!.status);
      expect(service!.lastHealthCheck).toBeInstanceOf(Date);
    });

    test('should get healthy services only', () => {
      const healthyServices = serviceDiscovery.getHealthyServices();
      Object.values(healthyServices).forEach(service => {
        expect(service.status).toBe('healthy');
      });
    });
  });

  describe('Service Authentication', () => {
    test('should validate API keys correctly', () => {
      const serviceName = 'recipe-service';
      const serviceConfig = serviceAuth.getServiceConfig(serviceName);
      
      expect(serviceConfig).toBeDefined();
      expect(serviceConfig!.apiKey).toBeTruthy();
      
      // Test valid API key
      const isValid = serviceAuth.validateApiKey(serviceName, serviceConfig!.apiKey);
      expect(isValid).toBe(true);
      
      // Test invalid API key
      const isInvalid = serviceAuth.validateApiKey(serviceName, 'invalid-key');
      expect(isInvalid).toBe(false);
    });

    test('should create proper auth headers', () => {
      const serviceName = 'recipe-service';
      const headers = serviceAuth.createAuthHeaders(serviceName);
      
      expect(headers).toHaveProperty('X-API-Key');
      expect(headers).toHaveProperty('X-Service-Name', serviceName);
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });

    test('should enforce rate limiting', () => {
      const serviceName = 'recipe-service';
      const clientId = 'test-client';
      
      // Should allow initial requests
      let rateLimitResult = serviceAuth.checkRateLimit(serviceName, clientId);
      expect(rateLimitResult.allowed).toBe(true);
      
      // Simulate many requests to trigger rate limit
      const serviceConfig = serviceAuth.getServiceConfig(serviceName);
      const maxRequests = serviceConfig!.rateLimit!.maxRequests;
      
      for (let i = 0; i < maxRequests; i++) {
        serviceAuth.checkRateLimit(serviceName, clientId);
      }
      
      // Should be rate limited now
      rateLimitResult = serviceAuth.checkRateLimit(serviceName, clientId);
      expect(rateLimitResult.allowed).toBe(false);
      expect(rateLimitResult.resetTime).toBeDefined();
    });
  });

  describe('Resilient Service Client', () => {
    test('should handle successful service requests', async () => {
      const serviceName = 'recipe-service';
      
      // Mock a successful response
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: 'test' }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const result = await resilientClient.makeResilientRequest(
        serviceName,
        '/test',
        { method: 'GET' }
      );

      expect(result).toEqual({ success: true, data: 'test' });
    });

    test('should retry failed requests', async () => {
      const serviceName = 'recipe-service';
      let attempts = 0;
      
      // Mock failing requests
      jest.spyOn(global, 'fetch').mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return {
          ok: true,
          json: async () => ({ success: true, attempt: attempts }),
          status: 200,
          statusText: 'OK'
        } as Response;
      });

      const result = await resilientClient.makeResilientRequest(
        serviceName,
        '/test',
        { method: 'GET' },
        { maxAttempts: 3 }
      );

      expect(attempts).toBe(3);
      expect(result).toEqual({ success: true, attempt: 3 });
    });

    test('should use fallback on service failure', async () => {
      const serviceName = 'recipe-service';
      
      // Mock service failure
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Service unavailable'));

      const fallbackData = { fallback: true, message: 'Service temporarily unavailable' };
      
      const result = await resilientClient.makeResilientRequest(
        serviceName,
        '/test',
        { method: 'GET' },
        { maxAttempts: 1 },
        { 
          enabled: true, 
          fallbackResponse: fallbackData 
        }
      );

      expect(result).toEqual(fallbackData);
    });

    test('should track circuit breaker metrics', async () => {
      const serviceName = 'test-circuit-breaker';
      
      // Simulate failures to trigger circuit breaker
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Service down'));

      try {
        for (let i = 0; i < 6; i++) {
          await resilientClient.makeResilientRequest(
            serviceName,
            '/test',
            { method: 'GET' },
            { maxAttempts: 1 },
            { enabled: false }
          );
        }
      } catch (error) {
        // Expected to fail
      }

      const metrics = resilientClient.getCircuitBreakerMetrics(serviceName);
      expect(metrics).toBeDefined();
      expect(metrics!.failures).toBeGreaterThan(0);
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(metrics!.state);
    });
  });

  describe('Service Configuration', () => {
    test('should provide valid service configurations', () => {
      const configs = serviceConfig.getAllServiceConfigs();
      expect(configs).toHaveLength(6);
      
      configs.forEach(config => {
        expect(config.name).toBeTruthy();
        expect(config.url).toBeTruthy();
        expect(config.healthEndpoint).toBeTruthy();
        expect(config.metadata).toBeDefined();
        expect(config.metadata.capabilities).toBeInstanceOf(Array);
        expect(config.metadata.maxConcurrentRequests).toBeGreaterThan(0);
        expect(config.metadata.timeoutMs).toBeGreaterThan(0);
      });
    });

    test('should validate service configuration', () => {
      const validation = serviceConfig.validateServiceConfiguration();
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');
      
      if (!validation.valid) {
        console.warn('Service configuration issues:', validation.issues);
      }
    });

    test('should provide service status', () => {
      const status = serviceConfig.getServiceStatus();
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('totalServices');
      expect(status).toHaveProperty('enabledServices');
      expect(status).toHaveProperty('healthyServices');
      expect(status).toHaveProperty('services');
      expect(status.services).toBeInstanceOf(Array);
      expect(status.totalServices).toBeGreaterThan(0);
    });

    test('should update service URLs', () => {
      const serviceName = 'recipe-service';
      const newUrl = 'https://new-recipe-service.example.com';
      
      const originalConfig = serviceConfig.getServiceConfig(serviceName);
      const originalUrl = originalConfig!.url;
      
      serviceConfig.updateServiceUrl(serviceName, newUrl);
      
      const updatedConfig = serviceConfig.getServiceConfig(serviceName);
      expect(updatedConfig!.url).toBe(newUrl);
      
      // Restore original URL
      serviceConfig.updateServiceUrl(serviceName, originalUrl);
    });
  });

  describe('Monitoring Integration', () => {
    test('should trace service calls', async () => {
      const result = await monitoring.traceServiceCall(
        'test-service',
        'test-operation',
        async (context) => {
          expect(context.traceId).toBeTruthy();
          expect(context.spanId).toBeTruthy();
          return { success: true };
        }
      );

      expect(result).toEqual({ success: true });
    });

    test('should provide system health status', () => {
      const health = monitoring.getSystemHealth();
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('metrics');
      expect(health).toHaveProperty('circuitBreakers');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
    });
  });

  describe('End-to-End Service Communication', () => {
    test('should handle complete service workflow', async () => {
      // This test simulates a complete workflow across multiple services
      const userId = 'test-user-123';
      const mockRecipeData = {
        id: 'recipe-123',
        title: 'Test Recipe',
        ingredients: ['ingredient1', 'ingredient2']
      };

      // Mock service responses
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRecipeData,
          status: 200,
          statusText: 'OK'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ mealPlanId: 'plan-123', recipeIds: ['recipe-123'] }),
          status: 200,
          statusText: 'OK'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ shoppingListId: 'list-123', items: ['ingredient1', 'ingredient2'] }),
          status: 200,
          statusText: 'OK'
        } as Response);

      // Step 1: Get recipe from recipe service
      const recipe = await resilientClient.makeResilientRequest(
        'recipe-service',
        `/recipes/${mockRecipeData.id}`,
        { method: 'GET' }
      );

      expect(recipe).toEqual(mockRecipeData);

      // Step 2: Create meal plan with meal plan service
      const mealPlan = await resilientClient.makeResilientRequest(
        'mealplan-service',
        '/meal-plans',
        {
          method: 'POST',
          body: JSON.stringify({
            userId,
            recipeIds: [recipe.id],
            startDate: new Date().toISOString()
          })
        }
      );

      expect(mealPlan.mealPlanId).toBeTruthy();

      // Step 3: Generate shopping list with shopping service
      const shoppingList = await resilientClient.makeResilientRequest(
        'shopping-service',
        '/shopping-lists',
        {
          method: 'POST',
          body: JSON.stringify({
            userId,
            mealPlanId: mealPlan.mealPlanId
          })
        }
      );

      expect(shoppingList.shoppingListId).toBeTruthy();
      expect(shoppingList.items).toContain('ingredient1');
      expect(shoppingList.items).toContain('ingredient2');
    });
  });
});

// Test utilities
export const ServiceTestUtils = {
  async waitForServiceHealth(serviceName: string, timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const service = serviceDiscovery.getService(serviceName);
      if (service && service.status === 'healthy') {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  },

  generateMockApiKey(): string {
    return 'test-api-key-' + Math.random().toString(36).substr(2, 9);
  },

  createMockServiceResponse(data: any, status: number = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => data,
      text: async () => JSON.stringify(data)
    } as Response;
  }
};