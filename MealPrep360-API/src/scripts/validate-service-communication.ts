#!/usr/bin/env node

import { serviceConfig } from '../lib/services/config';
import { serviceDiscovery } from '../lib/services/discovery';
import { serviceAuth } from '../lib/services/auth';
import { monitoring } from '../lib/services/monitoring';

interface ValidationResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  recommendations?: string[];
}

class ServiceCommunicationValidator {
  private results: ValidationResult[] = [];

  async validateAll(): Promise<void> {
    console.log('🔍 Validating Service Communication Setup...\n');

    try {
      await this.validateEnvironmentVariables();
      await this.validateServiceConfiguration();
      await this.validateServiceAuthentication();
      await this.validateServiceDiscovery();
      await this.validateServiceConnectivity();
      await this.validateMonitoring();

      this.displayResults();
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  }

  private async validateEnvironmentVariables(): Promise<void> {
    console.log('🔧 Validating Environment Variables...');

    const requiredVars = [
      'MONGODB_URI',
      'NODE_ENV',
      'PORT'
    ];

    const serviceVars = [
      'RECIPE_SERVICE_URL', 'RECIPE_SERVICE_API_KEY', 'RECIPE_SERVICE_ENABLED',
      'MEALPLAN_SERVICE_URL', 'MEALPLAN_SERVICE_API_KEY', 'MEALPLAN_SERVICE_ENABLED',
      'SHOPPING_SERVICE_URL', 'SHOPPING_SERVICE_API_KEY', 'SHOPPING_SERVICE_ENABLED',
      'SOCIAL_SERVICE_URL', 'SOCIAL_SERVICE_API_KEY', 'SOCIAL_SERVICE_ENABLED',
      'BLOG_SERVICE_URL', 'BLOG_SERVICE_API_KEY', 'BLOG_SERVICE_ENABLED',
      'WEBSOCKET_SERVICE_URL', 'WEBSOCKET_SERVICE_API_KEY', 'WEBSOCKET_SERVICE_ENABLED'
    ];

    // Check required variables
    const missingRequired = requiredVars.filter(varName => !process.env[varName]);
    if (missingRequired.length > 0) {
      this.addResult('environment', 'fail', 
        `Missing required environment variables: ${missingRequired.join(', ')}`,
        { missingRequired },
        ['Set all required environment variables in your .env file']
      );
    } else {
      this.addResult('environment', 'pass', 'All required environment variables are set');
    }

    // Check service variables
    const missingServiceVars = serviceVars.filter(varName => !process.env[varName]);
    if (missingServiceVars.length > 0) {
      this.addResult('environment', 'warning',
        `Missing service environment variables: ${missingServiceVars.length} variables`,
        { missingServiceVars },
        ['Set service-specific environment variables for proper communication']
      );
    } else {
      this.addResult('environment', 'pass', 'All service environment variables are set');
    }
  }

  private async validateServiceConfiguration(): Promise<void> {
    console.log('⚙️  Validating Service Configuration...');

    try {
      const validation = serviceConfig.validateServiceConfiguration();
      
      if (!validation.valid) {
        this.addResult('configuration', 'fail',
          `Service configuration validation failed: ${validation.issues.length} issues`,
          { issues: validation.issues },
          validation.recommendations
        );
      } else {
        this.addResult('configuration', 'pass', 'Service configuration is valid');
      }

      if (validation.recommendations.length > 0) {
        this.addResult('configuration', 'warning',
          `Configuration has ${validation.recommendations.length} recommendations`,
          { recommendations: validation.recommendations },
          validation.recommendations
        );
      }
    } catch (error) {
      this.addResult('configuration', 'fail',
        'Failed to validate service configuration',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateServiceAuthentication(): Promise<void> {
    console.log('🔐 Validating Service Authentication...');

    try {
      const services = serviceAuth.getAllServices();
      const authStatus = services.map(service => ({
        serviceName: service.serviceName,
        hasApiKey: !!service.apiKey,
        hasRateLimit: !!service.rateLimit
      }));

      const servicesWithoutKeys = authStatus.filter(s => !s.hasApiKey);
      
      if (servicesWithoutKeys.length > 0) {
        this.addResult('authentication', 'fail',
          `${servicesWithoutKeys.length} services missing API keys`,
          { servicesWithoutKeys },
          ['Generate API keys for all services']
        );
      } else {
        this.addResult('authentication', 'pass', 'All services have API keys configured');
      }

      const servicesWithoutRateLimit = authStatus.filter(s => !s.hasRateLimit);
      if (servicesWithoutRateLimit.length > 0) {
        this.addResult('authentication', 'warning',
          `${servicesWithoutRateLimit.length} services missing rate limiting`,
          { servicesWithoutRateLimit },
          ['Configure rate limiting for better service protection']
        );
      }
    } catch (error) {
      this.addResult('authentication', 'fail',
        'Failed to validate service authentication',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateServiceDiscovery(): Promise<void> {
    console.log('🔍 Validating Service Discovery...');

    try {
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
      const missingServices = expectedServices.filter(name => !registeredServices.includes(name));

      if (missingServices.length > 0) {
        this.addResult('discovery', 'fail',
          `Missing services in discovery: ${missingServices.join(', ')}`,
          { missingServices, registeredServices },
          ['Ensure all services are properly registered with service discovery']
        );
      } else {
        this.addResult('discovery', 'pass', 'All expected services are registered');
      }
    } catch (error) {
      this.addResult('discovery', 'fail',
        'Failed to validate service discovery',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateServiceConnectivity(): Promise<void> {
    console.log('🌐 Validating Service Connectivity...');

    try {
      const services = serviceConfig.getAllServiceConfigs();
      const connectivityResults = [];

      for (const service of services) {
        if (!service.enabled) {
          connectivityResults.push({
            serviceName: service.name,
            status: 'disabled',
            message: 'Service is disabled'
          });
          continue;
        }

        if (!service.url || !service.apiKey) {
          connectivityResults.push({
            serviceName: service.name,
            status: 'not_configured',
            message: 'Service URL or API key not configured'
          });
          continue;
        }

        try {
          const isHealthy = await serviceConfig.isServiceHealthy(service.name);
          connectivityResults.push({
            serviceName: service.name,
            status: isHealthy ? 'healthy' : 'unhealthy',
            message: isHealthy ? 'Service is responding' : 'Service not responding',
            url: service.url
          });
        } catch (error) {
          connectivityResults.push({
            serviceName: service.name,
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
            url: service.url
          });
        }
      }

      const healthyServices = connectivityResults.filter(r => r.status === 'healthy').length;
      const totalEnabledServices = connectivityResults.filter(r => r.status !== 'disabled').length;

      if (healthyServices === totalEnabledServices && totalEnabledServices > 0) {
        this.addResult('connectivity', 'pass', 'All enabled services are healthy');
      } else if (healthyServices > 0) {
        this.addResult('connectivity', 'warning',
          `${healthyServices}/${totalEnabledServices} services are healthy`,
          { connectivityResults },
          ['Check service status and network connectivity']
        );
      } else {
        this.addResult('connectivity', 'fail',
          'No services are responding to health checks',
          { connectivityResults },
          ['Start services and verify network connectivity']
        );
      }
    } catch (error) {
      this.addResult('connectivity', 'fail',
        'Failed to validate service connectivity',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateMonitoring(): Promise<void> {
    console.log('📊 Validating Monitoring Setup...');

    try {
      const health = monitoring.getSystemHealth();
      
      this.addResult('monitoring', 'pass',
        `Monitoring system is operational (${health.overall} overall health)`,
        {
          overall: health.overall,
          servicesCount: Object.keys(health.services).length,
          metricsCount: Object.keys(health.metrics).length
        }
      );
    } catch (error) {
      this.addResult('monitoring', 'fail',
        'Monitoring system is not operational',
        { error: error instanceof Error ? error.message : String(error) },
        ['Check monitoring configuration and restart if needed']
      );
    }
  }

  private addResult(
    category: string,
    status: 'pass' | 'fail' | 'warning',
    message: string,
    details?: any,
    recommendations?: string[]
  ): void {
    this.results.push({
      category,
      status,
      message,
      details,
      recommendations
    });
  }

  private displayResults(): void {
    console.log('\n📋 Service Communication Validation Results');
    console.log('==========================================\n');

    const totalResults = this.results.length;
    const passedResults = this.results.filter(r => r.status === 'pass').length;
    const failedResults = this.results.filter(r => r.status === 'fail').length;
    const warningResults = this.results.filter(r => r.status === 'warning').length;

    console.log(`Total Validations: ${totalResults}`);
    console.log(`✅ Passed: ${passedResults}`);
    console.log(`⚠️  Warnings: ${warningResults}`);
    console.log(`❌ Failed: ${failedResults}\n`);

    // Group by category
    const categories = [...new Set(this.results.map(r => r.category))];
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'pass').length;
      const categoryFailed = categoryResults.filter(r => r.status === 'fail').length;
      const categoryWarnings = categoryResults.filter(r => r.status === 'warning').length;

      console.log(`${category.toUpperCase()}:`);
      categoryResults.forEach(result => {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`  ${icon} ${result.message}`);
        
        if (result.recommendations && result.recommendations.length > 0) {
          result.recommendations.forEach(rec => {
            console.log(`    💡 ${rec}`);
          });
        }
      });
      console.log('');
    });

    // Overall status
    if (failedResults > 0) {
      console.log('❌ Service communication validation FAILED');
      console.log('Please address the failed validations before proceeding.\n');
    } else if (warningResults > 0) {
      console.log('⚠️  Service communication validation PASSED with warnings');
      console.log('Consider addressing the warnings for optimal performance.\n');
    } else {
      console.log('✅ Service communication validation PASSED');
      console.log('All services are properly configured for communication!\n');
    }

    // Next steps
    if (failedResults > 0) {
      console.log('🔧 Next Steps:');
      console.log('1. Create a .env file with the required environment variables');
      console.log('2. Start all required services');
      console.log('3. Run this validation again to verify the setup');
      console.log('4. Use "npm run setup-services" to generate missing API keys');
    }
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ServiceCommunicationValidator();
  validator.validateAll().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export default ServiceCommunicationValidator;
