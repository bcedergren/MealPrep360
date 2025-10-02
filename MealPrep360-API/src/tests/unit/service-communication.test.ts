import { serviceConfig } from '../../lib/services/config';
import { serviceAuth } from '../../lib/services/auth';
import { serviceDiscovery } from '../../lib/services/discovery';
import { monitoring } from '../../lib/services/monitoring';

describe('Service Communication Unit Tests', () => {
  beforeEach(() => {
    // Reset service configurations before each test
    jest.clearAllMocks();
  });

  describe('Service Configuration', () => {
    test('should initialize service configurations correctly', () => {
      const services = serviceConfig.getAllServiceConfigs();
      expect(services).toHaveLength(6);
      
      const expectedServices = [
        'recipe-service',
        'mealplan-service', 
        'shopping-service',
        'social-service',
        'blog-service',
        'websocket-service'
      ];
      
      expectedServices.forEach(serviceName => {
        const service = services.find(s => s.name === serviceName);
        expect(service).toBeDefined();
        expect(service?.url).toBeDefined();
        expect(service?.apiKey).toBeDefined();
      });
    });

    test('should validate service configuration correctly', () => {
      const validation = serviceConfig.validateServiceConfiguration();
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');
    });

    test('should get service status correctly', async () => {
      const status = await serviceConfig.getServiceStatus();
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('totalServices');
      expect(status).toHaveProperty('enabledServices');
      expect(status).toHaveProperty('healthyServices');
      expect(status).toHaveProperty('services');
      expect(Array.isArray(status.services)).toBe(true);
    });
  });

  describe('Service Authentication', () => {
    test('should generate API keys for all services', () => {
      const services = serviceAuth.getAllServices();
      expect(services).toHaveLength(6);
      
      services.forEach(service => {
        expect(service.apiKey).toBeDefined();
        expect(service.apiKey).toMatch(/^[a-f0-9]{64}$/); // 64 character hex string
      });
    });

    test('should validate API keys correctly', () => {
      const services = serviceAuth.getAllServices();
      
      services.forEach(service => {
        const isValid = serviceAuth.validateApiKey(service.serviceName, service.apiKey);
        expect(isValid).toBe(true);
        
        const isInvalid = serviceAuth.validateApiKey(service.serviceName, 'invalid-key');
        expect(isInvalid).toBe(false);
      });
    });

    test('should handle rate limiting correctly', () => {
      const serviceName = 'recipe-service';
      const clientId = 'test-client';
      
      // Should allow requests within rate limit
      for (let i = 0; i < 10; i++) {
        const result = serviceAuth.checkRateLimit(serviceName, clientId);
        expect(result.allowed).toBe(true);
      }
    });

    test('should create auth headers correctly', () => {
      const serviceName = 'recipe-service';
      const headers = serviceAuth.createAuthHeaders(serviceName);
      
      expect(headers).toHaveProperty('X-API-Key');
      expect(headers).toHaveProperty('X-Service-Name');
      expect(headers).toHaveProperty('Content-Type');
      expect(headers['X-Service-Name']).toBe(serviceName);
    });
  });

  describe('Service Discovery', () => {
    test('should register services correctly', () => {
      const serviceName = 'test-service';
      const config = {
        name: serviceName,
        endpoint: {
          url: 'http://localhost:3000',
          version: '1.0.0',
          capabilities: ['test']
        }
      };

      serviceDiscovery.registerService(serviceName, config);
      const registeredService = serviceDiscovery.getService(serviceName);
      
      expect(registeredService).toBeDefined();
      expect(registeredService?.name).toBe(serviceName);
    });

    test('should list all services correctly', () => {
      const services = serviceDiscovery.listServices();
      expect(Array.isArray(services)).toBe(true);
    });

    test('should get healthy services correctly', () => {
      const healthyServices = serviceDiscovery.getHealthyServices();
      expect(typeof healthyServices).toBe('object');
    });
  });

  describe('Monitoring System', () => {
    test('should get system health correctly', () => {
      const health = monitoring.getSystemHealth();
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('metrics');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
    });

    test('should trace service calls correctly', async () => {
      const result = await monitoring.traceServiceCall(
        'test-service',
        'test-operation',
        async (context) => {
          expect(context).toHaveProperty('traceId');
          expect(context).toHaveProperty('spanId');
          return { success: true };
        }
      );

      expect(result).toHaveProperty('success', true);
    });
  });
});
