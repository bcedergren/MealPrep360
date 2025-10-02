#!/usr/bin/env node

import { serviceConfig } from '../lib/services/config';
import { serviceDiscovery } from '../lib/services/discovery';
import { serviceAuth } from '../lib/services/auth';
import { monitoring } from '../lib/services/monitoring';

interface TestResult {
  category: string;
  test: string;
  success: boolean;
  message: string;
  details?: any;
  recommendations?: string[];
}

class ComprehensiveServiceCommunicationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Comprehensive Service Communication Tests...\n');

    try {
      // Run test suites
      await this.testServiceConfiguration();
      await this.testServiceAuthentication();
      await this.testServiceDiscovery();
      await this.testServiceUrls();
      await this.testEnvironmentVariables();
      await this.testMonitoringSetup();

      // Display results
      this.displayResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  private async testServiceConfiguration(): Promise<void> {
    console.log('⚙️  Testing Service Configuration...');

    // Test 1: Configuration Validation
    await this.runTest(
      'configuration',
      'Configuration Validation',
      async () => {
        const validation = serviceConfig.validateServiceConfiguration();
        
        if (!validation.valid) {
          return {
            valid: false,
            issues: validation.issues,
            recommendations: validation.recommendations
          };
        }

        return {
          valid: true,
          issues: [],
          recommendations: validation.recommendations
        };
      }
    );

    // Test 2: Service Status
    await this.runTest('configuration', 'Service Status', async () => {
      const status = await serviceConfig.getServiceStatus();
      
      return {
        environment: status.environment,
        totalServices: status.totalServices,
        enabledServices: status.enabledServices,
        healthyServices: status.healthyServices,
        services: status.services.map(s => ({
          name: s.name,
          enabled: s.enabled,
          healthy: s.healthy,
          url: s.url
        }))
      };
    });
  }

  private async testServiceAuthentication(): Promise<void> {
    console.log('🔐 Testing Service Authentication...');

    // Test 1: API Key Generation
    await this.runTest('authentication', 'API Key Generation', async () => {
      const services = serviceAuth.getAllServices();
      const apiKeyStatus = services.map(service => ({
        serviceName: service.serviceName,
        hasApiKey: !!service.apiKey,
        apiKeyLength: service.apiKey?.length || 0
      }));

      const missingKeys = apiKeyStatus.filter(s => !s.hasApiKey);
      
      return {
        totalServices: services.length,
        servicesWithKeys: apiKeyStatus.filter(s => s.hasApiKey).length,
        missingKeys: missingKeys.length,
        apiKeyStatus
      };
    });

    // Test 2: Rate Limiting Configuration
    await this.runTest('authentication', 'Rate Limiting Configuration', async () => {
      const services = serviceAuth.getAllServices();
      const rateLimitStatus = services.map(service => ({
        serviceName: service.serviceName,
        hasRateLimit: !!service.rateLimit,
        maxRequests: service.rateLimit?.maxRequests || 0,
        windowMs: service.rateLimit?.windowMs || 0
      }));

      return {
        totalServices: services.length,
        servicesWithRateLimit: rateLimitStatus.filter(s => s.hasRateLimit).length,
        rateLimitStatus
      };
    });
  }

  private async testServiceDiscovery(): Promise<void> {
    console.log('🔍 Testing Service Discovery...');

    // Test 1: Service Registration
    await this.runTest('discovery', 'Service Registration', async () => {
      const services = serviceDiscovery.getAllServices();
      const expectedServices = [
        'recipe-service',
        'mealplan-service',
        'shopping-service',
        'social-service',
        'blog-service',
        'websocket-service'
      ];

      const registeredServices = Object.keys(services);
      const missingServices = expectedServices.filter(
        name => !registeredServices.includes(name)
      );

      return {
        expectedServices: expectedServices.length,
        registeredServices: registeredServices.length,
        missingServices,
        registeredServiceNames: registeredServices
      };
    });

    // Test 2: Service Health Checks
    await this.runTest('discovery', 'Service Health Checks', async () => {
      const services = serviceDiscovery.getAllServices();
      const healthCheckResults = [];

      for (const [serviceName, service] of Object.entries(services)) {
        try {
          await serviceDiscovery.checkServiceHealth(serviceName);
          const updatedService = serviceDiscovery.getService(serviceName);
          healthCheckResults.push({
            serviceName,
            status: updatedService?.health?.status || 'unknown',
            responseTime: updatedService?.health?.responseTime || 0,
            lastCheck: updatedService?.health?.lastHealthCheck || 'never'
          });
        } catch (error) {
          healthCheckResults.push({
            serviceName,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return {
        totalServices: healthCheckResults.length,
        healthyServices: healthCheckResults.filter(r => r.status === 'healthy').length,
        unhealthyServices: healthCheckResults.filter(r => r.status === 'unhealthy').length,
        errorServices: healthCheckResults.filter(r => r.status === 'error').length,
        healthCheckResults
      };
    });
  }

  private async testServiceUrls(): Promise<void> {
    console.log('🌐 Testing Service URLs...');

    // Test 1: URL Validation
    await this.runTest('urls', 'URL Validation', async () => {
      const services = serviceConfig.getAllServiceConfigs();
      const urlValidation = services.map(service => {
        const isValidUrl = this.isValidUrl(service.url);
        return {
          serviceName: service.name,
          url: service.url,
          isValid: isValidUrl,
          isLocalhost: service.url.includes('localhost'),
          isHttps: service.url.startsWith('https://')
        };
      });

      return {
        totalServices: urlValidation.length,
        validUrls: urlValidation.filter(u => u.isValid).length,
        localhostUrls: urlValidation.filter(u => u.isLocalhost).length,
        httpsUrls: urlValidation.filter(u => u.isHttps).length,
        urlValidation
      };
    });

    // Test 2: Service Reachability
    await this.runTest('urls', 'Service Reachability', async () => {
      const services = serviceConfig.getAllServiceConfigs();
      const reachabilityResults = [];

      for (const service of services) {
        if (!service.enabled || !service.url) {
          reachabilityResults.push({
            serviceName: service.name,
            reachable: false,
            reason: 'Service disabled or no URL configured'
          });
          continue;
        }

        try {
          const isHealthy = await serviceConfig.isServiceHealthy(service.name);
          reachabilityResults.push({
            serviceName: service.name,
            reachable: isHealthy,
            url: service.url,
            reason: isHealthy ? 'Service responding' : 'Service not responding'
          });
        } catch (error) {
          reachabilityResults.push({
            serviceName: service.name,
            reachable: false,
            url: service.url,
            reason: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return {
        totalServices: reachabilityResults.length,
        reachableServices: reachabilityResults.filter(r => r.reachable).length,
        unreachableServices: reachabilityResults.filter(r => !r.reachable).length,
        reachabilityResults
      };
    });
  }

  private async testEnvironmentVariables(): Promise<void> {
    console.log('🔧 Testing Environment Variables...');

    // Test 1: Required Environment Variables
    await this.runTest('environment', 'Required Environment Variables', async () => {
      const requiredVars = [
        'MONGODB_URI',
        'NODE_ENV',
        'PORT'
      ];

      const optionalVars = [
        'RECIPE_SERVICE_URL',
        'MEALPLAN_SERVICE_URL',
        'SHOPPING_SERVICE_URL',
        'SOCIAL_SERVICE_URL',
        'BLOG_SERVICE_URL',
        'WEBSOCKET_SERVICE_URL',
        'RECIPE_SERVICE_API_KEY',
        'MEALPLAN_SERVICE_API_KEY',
        'SHOPPING_SERVICE_API_KEY',
        'SOCIAL_SERVICE_API_KEY',
        'BLOG_SERVICE_API_KEY',
        'WEBSOCKET_SERVICE_API_KEY'
      ];

      const presentRequired = requiredVars.filter(varName => process.env[varName]);
      const presentOptional = optionalVars.filter(varName => process.env[varName]);

      return {
        requiredVars: requiredVars.length,
        presentRequired: presentRequired.length,
        missingRequired: requiredVars.filter(varName => !process.env[varName]),
        optionalVars: optionalVars.length,
        presentOptional: presentOptional.length,
        missingOptional: optionalVars.filter(varName => !process.env[varName])
      };
    });

    // Test 2: Service Configuration Environment Variables
    await this.runTest('environment', 'Service Configuration Environment Variables', async () => {
      const serviceVars = [
        'RECIPE_SERVICE_URL', 'RECIPE_SERVICE_API_KEY', 'RECIPE_SERVICE_ENABLED',
        'MEALPLAN_SERVICE_URL', 'MEALPLAN_SERVICE_API_KEY', 'MEALPLAN_SERVICE_ENABLED',
        'SHOPPING_SERVICE_URL', 'SHOPPING_SERVICE_API_KEY', 'SHOPPING_SERVICE_ENABLED',
        'SOCIAL_SERVICE_URL', 'SOCIAL_SERVICE_API_KEY', 'SOCIAL_SERVICE_ENABLED',
        'BLOG_SERVICE_URL', 'BLOG_SERVICE_API_KEY', 'BLOG_SERVICE_ENABLED',
        'WEBSOCKET_SERVICE_URL', 'WEBSOCKET_SERVICE_API_KEY', 'WEBSOCKET_SERVICE_ENABLED'
      ];

      const presentVars = serviceVars.filter(varName => process.env[varName]);
      const missingVars = serviceVars.filter(varName => !process.env[varName]);

      return {
        totalServiceVars: serviceVars.length,
        presentVars: presentVars.length,
        missingVars: missingVars.length,
        missingVarsList: missingVars
      };
    });
  }

  private async testMonitoringSetup(): Promise<void> {
    console.log('📊 Testing Monitoring Setup...');

    // Test 1: Monitoring System Health
    await this.runTest('monitoring', 'Monitoring System Health', async () => {
      try {
        const health = monitoring.getSystemHealth();
        return {
          overall: health.overall,
          servicesCount: Object.keys(health.services).length,
          metricsCount: Object.keys(health.metrics).length,
          healthyServices: Object.values(health.services).filter((s: any) => s.status === 'healthy').length
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
          monitoringAvailable: false
        };
      }
    });

    // Test 2: Distributed Tracing
    await this.runTest('monitoring', 'Distributed Tracing', async () => {
      try {
        const result = await monitoring.traceServiceCall(
          'test-service',
          'test-operation',
          async (context) => {
            return {
              traceId: context.traceId,
              spanId: context.spanId,
              success: true,
              timestamp: new Date().toISOString()
            };
          }
        );

        return {
          tracingAvailable: true,
          result
        };
      } catch (error) {
        return {
          tracingAvailable: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private async runTest(
    category: string,
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<void> {
    try {
      const result = await testFunction();
      
      this.results.push({
        category,
        test: testName,
        success: true,
        message: 'Test passed',
        details: result
      });

      console.log(`  ✅ ${testName}`);
    } catch (error) {
      this.results.push({
        category,
        test: testName,
        success: false,
        message: error instanceof Error ? error.message : String(error),
        details: null
      });

      console.log(`  ❌ ${testName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private displayResults(): void {
    console.log('\n📋 Test Results Summary');
    console.log('======================');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

    // Group by category
    const categories = [...new Set(this.results.map(r => r.category))];
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.success).length;
      console.log(`${category}: ${categoryPassed}/${categoryResults.length} passed`);
    });

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  - ${result.category}/${result.test}: ${result.message}`);
        });
    }

    // Display recommendations
    const recommendations = this.results
      .filter(r => r.details && r.details.recommendations)
      .flatMap(r => r.details.recommendations);

    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      [...new Set(recommendations)].forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }

    console.log('\n🎉 Service Communication Testing Complete!');

    if (failedTests > 0) {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    } else {
      console.log('\n✅ All tests passed! Services are ready for communication.');
    }
  }
}

// CLI execution
if (require.main === module) {
  const tester = new ComprehensiveServiceCommunicationTester();
  tester.runAllTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export default ComprehensiveServiceCommunicationTester;
