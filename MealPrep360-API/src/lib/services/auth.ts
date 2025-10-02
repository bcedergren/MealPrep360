import crypto from 'crypto';

export interface ServiceAuthConfig {
  serviceName: string;
  apiKey: string;
  allowedOrigins?: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export class ServiceAuthManager {
  private static instance: ServiceAuthManager;
  private services: Map<string, ServiceAuthConfig> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): ServiceAuthManager {
    if (!ServiceAuthManager.instance) {
      ServiceAuthManager.instance = new ServiceAuthManager();
    }
    return ServiceAuthManager.instance;
  }

  private initializeServices() {
    const services = [
      {
        serviceName: 'recipe-service',
        apiKey: process.env.RECIPE_SERVICE_API_KEY || this.generateApiKey(),
        rateLimit: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
      },
      {
        serviceName: 'mealplan-service',
        apiKey: process.env.MEALPLAN_SERVICE_API_KEY || this.generateApiKey(),
        rateLimit: { maxRequests: 50, windowMs: 60000 },
      },
      {
        serviceName: 'shopping-service',
        apiKey: process.env.SHOPPING_SERVICE_API_KEY || this.generateApiKey(),
        rateLimit: { maxRequests: 200, windowMs: 60000 },
      },
      {
        serviceName: 'social-service',
        apiKey: process.env.SOCIAL_SERVICE_API_KEY || this.generateApiKey(),
        rateLimit: { maxRequests: 500, windowMs: 60000 },
      },
      {
        serviceName: 'blog-service',
        apiKey: process.env.BLOG_SERVICE_API_KEY || this.generateApiKey(),
        rateLimit: { maxRequests: 100, windowMs: 60000 },
      },
      {
        serviceName: 'websocket-service',
        apiKey: process.env.WEBSOCKET_SERVICE_API_KEY || this.generateApiKey(),
        rateLimit: { maxRequests: 1000, windowMs: 60000 },
      },
    ];

    services.forEach(service => {
      this.services.set(service.serviceName, service);
    });
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateApiKey(serviceName: string, providedKey: string): boolean {
    const service = this.services.get(serviceName);
    if (!service) {
      return false;
    }

    return service.apiKey === providedKey;
  }

  checkRateLimit(serviceName: string, clientId: string): { allowed: boolean; resetTime?: number } {
    const service = this.services.get(serviceName);
    if (!service || !service.rateLimit) {
      return { allowed: true };
    }

    const key = `${serviceName}:${clientId}`;
    const now = Date.now();
    const rateLimit = service.rateLimit;

    let requestData = this.requestCounts.get(key);
    
    if (!requestData || now >= requestData.resetTime) {
      requestData = {
        count: 1,
        resetTime: now + rateLimit.windowMs,
      };
      this.requestCounts.set(key, requestData);
      return { allowed: true };
    }

    if (requestData.count >= rateLimit.maxRequests) {
      return { allowed: false, resetTime: requestData.resetTime };
    }

    requestData.count++;
    return { allowed: true };
  }

  getServiceConfig(serviceName: string): ServiceAuthConfig | undefined {
    return this.services.get(serviceName);
  }

  getAllServices(): ServiceAuthConfig[] {
    return Array.from(this.services.values());
  }

  createAuthHeaders(serviceName: string): Record<string, string> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    return {
      'X-API-Key': service.apiKey,
      'X-Service-Name': serviceName,
      'Content-Type': 'application/json',
    };
  }
}

export const serviceAuth = ServiceAuthManager.getInstance();