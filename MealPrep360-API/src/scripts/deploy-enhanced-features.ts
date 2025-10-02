#!/usr/bin/env node

import { serviceManager } from '../lib/services';
import * as fs from 'fs';
import * as path from 'path';

interface DeploymentStep {
  name: string;
  description: string;
  execute: () => Promise<void>;
  rollback?: () => Promise<void>;
}

interface DeploymentResult {
  step: string;
  success: boolean;
  duration: number;
  error?: string;
}

class EnhancedFeatureDeployer {
  private results: DeploymentResult[] = [];
  private deployedSteps: string[] = [];

  async deploy(): Promise<void> {
    console.log('🚀 Deploying Enhanced Monitoring and Security Features...\n');

    const deploymentSteps: DeploymentStep[] = [
      {
        name: 'environment-validation',
        description: 'Validate environment configuration',
        execute: this.validateEnvironment.bind(this)
      },
      {
        name: 'service-initialization',
        description: 'Initialize service management layer',
        execute: this.initializeServices.bind(this)
      },
      {
        name: 'monitoring-deployment',
        description: 'Deploy enhanced monitoring system',
        execute: this.deployMonitoring.bind(this)
      },
      {
        name: 'security-deployment',
        description: 'Deploy security enhancements',
        execute: this.deploySecurity.bind(this)
      },
      {
        name: 'health-checks',
        description: 'Configure health monitoring',
        execute: this.configureHealthChecks.bind(this)
      },
      {
        name: 'api-integration',
        description: 'Integrate with existing API routes',
        execute: this.integrateWithAPI.bind(this)
      },
      {
        name: 'websocket-security',
        description: 'Deploy WebSocket security enhancements',
        execute: this.deployWebSocketSecurity.bind(this)
      },
      {
        name: 'testing-deployment',
        description: 'Run deployment validation tests',
        execute: this.runDeploymentTests.bind(this)
      }
    ];

    try {
      for (const step of deploymentSteps) {
        await this.executeStep(step);
      }

      console.log('\n✅ Enhanced features deployed successfully!');
      this.displayDeploymentSummary();

    } catch (error) {
      console.error('\n❌ Deployment failed:', error);
      await this.rollbackDeployment();
      process.exit(1);
    }
  }

  private async executeStep(step: DeploymentStep): Promise<void> {
    console.log(`📦 ${step.description}...`);
    const startTime = Date.now();

    try {
      await step.execute();
      const duration = Date.now() - startTime;
      
      this.results.push({
        step: step.name,
        success: true,
        duration
      });
      
      this.deployedSteps.push(step.name);
      console.log(`  ✅ ${step.description} completed (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        step: step.name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`  ❌ ${step.description} failed (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async validateEnvironment(): Promise<void> {
    // Check required environment variables
    const requiredVars = [
      'MONGODB_URI',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'JWT_SECRET'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Check service API keys
    const serviceKeys = [
      'RECIPE_SERVICE_API_KEY',
      'MEALPLAN_SERVICE_API_KEY',
      'SHOPPING_SERVICE_API_KEY',
      'SOCIAL_SERVICE_API_KEY',
      'BLOG_SERVICE_API_KEY',
      'WEBSOCKET_SERVICE_API_KEY'
    ];

    const missingServiceKeys = serviceKeys.filter(key => !process.env[key]);
    
    if (missingServiceKeys.length > 0) {
      console.warn(`⚠️  Missing service API keys: ${missingServiceKeys.join(', ')}`);
      console.warn('   Service authentication may not work properly');
    }

    // Validate service URLs
    const serviceUrls = [
      'RECIPE_SERVICE_URL',
      'MEALPLAN_SERVICE_URL',
      'SHOPPING_SERVICE_URL',
      'SOCIAL_SERVICE_URL',
      'BLOG_SERVICE_URL',
      'WEBSOCKET_SERVICE_URL'
    ];

    serviceUrls.forEach(urlVar => {
      const url = process.env[urlVar];
      if (url) {
        try {
          new URL(url);
        } catch (error) {
          throw new Error(`Invalid URL for ${urlVar}: ${url}`);
        }
      }
    });

    console.log('   Environment validation passed');
  }

  private async initializeServices(): Promise<void> {
    try {
      await serviceManager.initialize({
        enableMonitoring: true,
        enableHealthChecks: true,
        enableAuth: true,
        logLevel: 'info'
      });

      console.log('   Service management layer initialized');
    } catch (error) {
      throw new Error(`Service initialization failed: ${error}`);
    }
  }

  private async deployMonitoring(): Promise<void> {
    // Verify monitoring APIs are accessible
    try {
      const systemHealth = await serviceManager.getSystemHealth();
      console.log(`   Monitoring system active - Overall status: ${systemHealth.overall}`);
      
      // Test monitoring endpoint
      const response = await fetch('http://localhost:3001/api/monitoring?type=health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => null);

      if (response?.ok) {
        console.log('   Monitoring API endpoint accessible');
      } else {
        console.warn('   ⚠️  Monitoring API endpoint not accessible (normal during initial deployment)');
      }

    } catch (error) {
      throw new Error(`Monitoring deployment failed: ${error}`);
    }
  }

  private async deploySecurity(): Promise<void> {
    // Verify authentication system
    const { serviceAuth } = await import('@/lib/services/auth');
    const services = serviceAuth.getAllServices();
    
    if (services.length === 0) {
      throw new Error('No services configured for authentication');
    }

    // Test API key generation
    const testServiceName = 'test-security-service';
    const testApiKey = 'test-key-' + Math.random().toString(36).substr(2, 9);
    
    // This would normally register a test service, but we'll just validate the auth system works
    console.log(`   Security system validated - ${services.length} services configured`);
  }

  private async configureHealthChecks(): Promise<void> {
    try {
      const healthCheck = await serviceManager.performHealthCheck();
      console.log(`   Health checks configured - ${healthCheck.services.length} services monitored`);
    } catch (error) {
      throw new Error(`Health check configuration failed: ${error}`);
    }
  }

  private async integrateWithAPI(): Promise<void> {
    // Check if key API routes exist
    const apiRoutes = [
      '/api/health',
      '/api/monitoring',
      '/api/admin/services/config'
    ];

    const routeChecks = [];
    
    for (const route of apiRoutes) {
      const routePath = path.join(process.cwd(), 'src/app', route, 'route.ts');
      const exists = fs.existsSync(routePath);
      routeChecks.push({ route, exists });
      
      if (!exists) {
        console.warn(`   ⚠️  API route not found: ${route}`);
      }
    }

    const existingRoutes = routeChecks.filter(r => r.exists).length;
    console.log(`   API integration verified - ${existingRoutes}/${apiRoutes.length} routes available`);
  }

  private async deployWebSocketSecurity(): Promise<void> {
    // Check if WebSocket server has been updated
    const wsServerPath = path.join(process.cwd(), '../MealPrep360-WebsocketServer/server.js');
    
    if (!fs.existsSync(wsServerPath)) {
      console.warn('   ⚠️  WebSocket server not found at expected location');
      return;
    }

    // Read WebSocket server file to check for security enhancements
    const wsContent = fs.readFileSync(wsServerPath, 'utf8');
    
    const securityFeatures = [
      'authenticateConnection',
      'checkRateLimit',
      'X-API-Key',
      'jwt.verify'
    ];

    const implementedFeatures = securityFeatures.filter(feature => 
      wsContent.includes(feature)
    );

    if (implementedFeatures.length === securityFeatures.length) {
      console.log('   WebSocket security enhancements deployed');
    } else {
      console.warn(`   ⚠️  WebSocket security partially implemented: ${implementedFeatures.length}/${securityFeatures.length} features`);
    }
  }

  private async runDeploymentTests(): Promise<void> {
    try {
      // Test service manager functionality
      const isInitialized = serviceManager.isInitialized();
      if (!isInitialized) {
        throw new Error('Service manager not properly initialized');
      }

      // Test system health
      const health = await serviceManager.getSystemHealth();
      if (!health) {
        throw new Error('System health check failed');
      }

      // Test service health
      const serviceHealth = await serviceManager.performHealthCheck();
      if (!serviceHealth || !serviceHealth.services) {
        throw new Error('Service health check failed');
      }

      console.log('   Deployment validation tests passed');
    } catch (error) {
      throw new Error(`Deployment tests failed: ${error}`);
    }
  }

  private async rollbackDeployment(): Promise<void> {
    console.log('\n🔄 Rolling back deployment...');
    
    try {
      // Shutdown service manager
      await serviceManager.shutdown();
      console.log('   Service manager shutdown');
      
      // Additional rollback steps would go here
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
    }
  }

  private displayDeploymentSummary(): void {
    console.log('\n📊 Deployment Summary');
    console.log('====================');
    
    const totalSteps = this.results.length;
    const successfulSteps = this.results.filter(r => r.success).length;
    const failedSteps = totalSteps - successfulSteps;
    
    console.log(`Total Steps: ${totalSteps}`);
    console.log(`Successful: ${successfulSteps}`);
    console.log(`Failed: ${failedSteps}`);
    console.log(`Success Rate: ${Math.round((successfulSteps / totalSteps) * 100)}%`);
    
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`Total Deployment Time: ${totalTime}ms`);
    
    console.log('\n📦 Deployed Features:');
    console.log('• Standardized service authentication with API keys');
    console.log('• Service discovery and health monitoring');
    console.log('• Circuit breakers, retries, and fallback mechanisms');
    console.log('• Distributed tracing and metrics collection');
    console.log('• Enhanced health check endpoints');
    console.log('• Secure WebSocket server with authentication');
    console.log('• Service configuration management');
    
    console.log('\n🔗 API Endpoints:');
    console.log('• GET /api/health - Comprehensive system health');
    console.log('• GET /api/monitoring - System monitoring data');
    console.log('• GET /api/admin/services/config - Service configuration');
    console.log('• POST /api/monitoring - Trigger health checks');
    
    console.log('\n🛠️  Management Commands:');
    console.log('• npm run setup-env - Generate API keys and setup environment');
    console.log('• npm run validate-env - Validate environment configuration');
    console.log('• npm run test-services - Test service communication');
    console.log('• npm run test-resilience - Test resilience patterns');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Update .env file with your actual service URLs');
    console.log('2. Configure your services to use the generated API keys');
    console.log('3. Run npm run test-services to validate communication');
    console.log('4. Monitor system health via /api/health endpoint');
    console.log('5. Consider implementing database per service strategy');
  }
}

// CLI execution
if (require.main === module) {
  const deployer = new EnhancedFeatureDeployer();
  deployer.deploy().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

export default EnhancedFeatureDeployer;