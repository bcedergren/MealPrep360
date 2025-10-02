#!/usr/bin/env node

import { serviceConfig } from '../lib/services/config';
import { serviceAuth } from '../lib/services/auth';
import { serviceDiscovery } from '../lib/services/discovery';
import { monitoring } from '../lib/services/monitoring';
import crypto from 'crypto';

interface ServiceSetupResult {
  serviceName: string;
  configured: boolean;
  apiKeyGenerated: boolean;
  url: string;
  issues: string[];
  recommendations: string[];
}

class ServiceCommunicationSetup {
  private results: ServiceSetupResult[] = [];

  async setupAllServices(): Promise<void> {
    console.log('🔧 Setting up Service Communication...\n');

    try {
      // Generate missing API keys
      await this.generateMissingApiKeys();
      
      // Validate service configurations
      await this.validateServiceConfigurations();
      
      // Test service connectivity
      await this.testServiceConnectivity();
      
      // Initialize monitoring
      await this.initializeMonitoring();
      
      // Display results
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }

  private async generateMissingApiKeys(): Promise<void> {
    console.log('🔑 Generating missing API keys...');
    
    const services = serviceAuth.getAllServices();
    
    for (const service of services) {
      const envKey = `${service.serviceName.toUpperCase().replace('-', '_')}_API_KEY`;
      const currentKey = process.env[envKey];
      
      if (!currentKey) {
        const newKey = this.generateSecureApiKey();
        console.log(`  Generated API key for ${service.serviceName}: ${newKey}`);
        console.log(`  Add to your .env file: ${envKey}=${newKey}`);
        
        // Update the service with the new key
        service.apiKey = newKey;
      }
    }
    
    console.log('✅ API key generation completed\n');
  }

  private generateSecureApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async validateServiceConfigurations(): Promise<void> {
    console.log('⚙️  Validating service configurations...');
    
    const validation = serviceConfig.validateServiceConfiguration();
    
    if (!validation.valid) {
      console.log('❌ Configuration validation failed:');
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (validation.recommendations.length > 0) {
      console.log('⚠️  Recommendations:');
      validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    console.log('✅ Configuration validation completed\n');
  }

  private async testServiceConnectivity(): Promise<void> {
    console.log('🌐 Testing service connectivity...');
    
    const services = serviceConfig.getAllServiceConfigs();
    
    for (const service of services) {
      const result: ServiceSetupResult = {
        serviceName: service.name,
        configured: true,
        apiKeyGenerated: false,
        url: service.url,
        issues: [],
        recommendations: []
      };

      // Check if service is configured
      if (!service.url || !service.apiKey) {
        result.configured = false;
        result.issues.push('Missing URL or API key');
      }

      // Check if service is enabled
      if (!service.enabled) {
        result.issues.push('Service is disabled');
        result.recommendations.push('Enable service if needed');
      }

      // Test connectivity if configured
      if (result.configured && service.enabled) {
        try {
          const isHealthy = await serviceConfig.isServiceHealthy(service.name);
          if (!isHealthy) {
            result.issues.push('Service is not responding to health checks');
            result.recommendations.push('Check if service is running and accessible');
          }
        } catch (error) {
          result.issues.push(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
          result.recommendations.push('Verify service URL and network connectivity');
        }
      }

      this.results.push(result);
    }
    
    console.log('✅ Connectivity testing completed\n');
  }

  private async initializeMonitoring(): Promise<void> {
    console.log('📊 Initializing monitoring system...');
    
    try {
      monitoring.initialize();
      console.log('✅ Monitoring system initialized\n');
    } catch (error) {
      console.log('⚠️  Monitoring initialization failed:', error);
    }
  }

  private displayResults(): void {
    console.log('📋 Service Communication Setup Results');
    console.log('=====================================\n');

    const totalServices = this.results.length;
    const configuredServices = this.results.filter(r => r.configured).length;
    const healthyServices = this.results.filter(r => r.configured && r.issues.length === 0).length;

    console.log(`Total Services: ${totalServices}`);
    console.log(`Configured: ${configuredServices}`);
    console.log(`Healthy: ${healthyServices}`);
    console.log(`Success Rate: ${Math.round((healthyServices / totalServices) * 100)}%\n`);

    // Display individual service results
    this.results.forEach(result => {
      const status = result.configured && result.issues.length === 0 ? '✅' : '❌';
      console.log(`${status} ${result.serviceName}`);
      console.log(`   URL: ${result.url}`);
      
      if (result.issues.length > 0) {
        console.log('   Issues:');
        result.issues.forEach(issue => console.log(`     - ${issue}`));
      }
      
      if (result.recommendations.length > 0) {
        console.log('   Recommendations:');
        result.recommendations.forEach(rec => console.log(`     - ${rec}`));
      }
      
      console.log('');
    });

    // Display environment setup instructions
    console.log('🔧 Environment Setup Instructions');
    console.log('=================================\n');
    
    console.log('1. Create a .env file in the MealPrep360-API directory');
    console.log('2. Add the following environment variables:\n');
    
    const services = serviceAuth.getAllServices();
    services.forEach(service => {
      const envKey = `${service.serviceName.toUpperCase().replace('-', '_')}_API_KEY`;
      console.log(`${envKey}=${service.apiKey}`);
    });
    
    console.log('\n3. Add service URLs (update as needed):');
    console.log('RECIPE_SERVICE_URL=http://localhost:3002');
    console.log('MEALPLAN_SERVICE_URL=http://localhost:3003');
    console.log('SHOPPING_SERVICE_URL=https://shopping.mealprep360.com');
    console.log('SOCIAL_SERVICE_URL=http://localhost:3005');
    console.log('BLOG_SERVICE_URL=http://localhost:3006');
    console.log('WEBSOCKET_SERVICE_URL=http://localhost:3007');
    
    console.log('\n4. Set service enablement flags:');
    console.log('RECIPE_SERVICE_ENABLED=true');
    console.log('MEALPLAN_SERVICE_ENABLED=true');
    console.log('SHOPPING_SERVICE_ENABLED=true');
    console.log('SOCIAL_SERVICE_ENABLED=true');
    console.log('BLOG_SERVICE_ENABLED=true');
    console.log('WEBSOCKET_SERVICE_ENABLED=true');
    
    console.log('\n5. Restart the API service after updating environment variables');
    
    if (healthyServices < totalServices) {
      console.log('\n⚠️  Some services need attention before they can communicate properly.');
      process.exit(1);
    } else {
      console.log('\n🎉 All services are properly configured for communication!');
    }
  }
}

// CLI execution
if (require.main === module) {
  const setup = new ServiceCommunicationSetup();
  setup.setupAllServices().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export default ServiceCommunicationSetup;
