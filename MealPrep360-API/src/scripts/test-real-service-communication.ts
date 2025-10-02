#!/usr/bin/env node

import { serviceConfig } from '../lib/services/config';
import { serviceDiscovery } from '../lib/services/discovery';
import { serviceAuth } from '../lib/services/auth';

interface ServiceTestResult {
  serviceName: string;
  url: string;
  status: 'running' | 'not_running' | 'error';
  response?: any;
  error?: string;
  communicationWorking: boolean;
}

class RealServiceCommunicationTester {
  private results: ServiceTestResult[] = [];

  async testAllServices(): Promise<void> {
    console.log('🔍 Testing Real Service Communication...\n');

    try {
      // Test each service individually
      await this.testService('API Gateway', 'http://localhost:3001', '/api/health');
      await this.testService('Recipe Service', 'http://localhost:3002', '/health');
      await this.testService('Meal Plan Service', 'http://localhost:3003', '/health');
      await this.testService('Shopping Service', 'https://shopping.mealprep360.com', '/health');
      await this.testService('Social Service', 'http://localhost:3005', '/api/health');
      await this.testService('Blog Service', 'http://localhost:3006', '/api/health');
      await this.testService('WebSocket Service', 'http://localhost:3007', '/health');

      // Test inter-service communication
      await this.testInterServiceCommunication();

      this.displayResults();
    } catch (error) {
      console.error('❌ Testing failed:', error);
    }
  }

  private async testService(name: string, baseUrl: string, healthEndpoint: string): Promise<void> {
    console.log(`Testing ${name} at ${baseUrl}${healthEndpoint}...`);

    const result: ServiceTestResult = {
      serviceName: name,
      url: baseUrl,
      status: 'not_running',
      communicationWorking: false
    };

    try {
      const response = await fetch(`${baseUrl}${healthEndpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        result.status = 'running';
        result.response = await response.json().catch(() => ({ status: 'ok' }));
        result.communicationWorking = true;
        console.log(`  ✅ ${name} is running and responding`);
      } else {
        result.status = 'error';
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        console.log(`  ❌ ${name} returned error: ${response.status}`);
      }
    } catch (error) {
      result.status = 'error';
      result.error = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ ${name} is not accessible: ${result.error}`);
    }

    this.results.push(result);
  }

  private async testInterServiceCommunication(): Promise<void> {
    console.log('\n🔄 Testing Inter-Service Communication...');

    // Test API Gateway to Recipe Service communication
    await this.testServiceToServiceCommunication(
      'API Gateway',
      'Recipe Service',
      'http://localhost:3001',
      'http://localhost:3002'
    );

    // Test API Gateway to Meal Plan Service communication
    await this.testServiceToServiceCommunication(
      'API Gateway',
      'Meal Plan Service',
      'http://localhost:3001',
      'http://localhost:3003'
    );

    // Test API Gateway to Shopping Service communication
    await this.testServiceToServiceCommunication(
      'API Gateway',
      'Shopping Service',
      'http://localhost:3001',
      'https://shopping.mealprep360.com'
    );
  }

  private async testServiceToServiceCommunication(
    fromService: string,
    toService: string,
    fromUrl: string,
    toUrl: string
  ): Promise<void> {
    console.log(`  Testing ${fromService} → ${toService}...`);

    try {
      // Test if the source service can reach the target service
      const response = await fetch(`${fromUrl}/api/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          targetService: toService,
          targetUrl: toUrl,
          testEndpoint: '/health'
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`    ✅ ${fromService} can communicate with ${toService}`);
      } else {
        console.log(`    ❌ ${fromService} cannot communicate with ${toService}: ${response.status}`);
      }
    } catch (error) {
      console.log(`    ❌ ${fromService} → ${toService} communication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private displayResults(): void {
    console.log('\n📋 Real Service Communication Results');
    console.log('=====================================\n');

    const runningServices = this.results.filter(r => r.status === 'running').length;
    const totalServices = this.results.length;
    const workingCommunication = this.results.filter(r => r.communicationWorking).length;

    console.log(`Total Services Tested: ${totalServices}`);
    console.log(`Services Running: ${runningServices}`);
    console.log(`Services with Working Communication: ${workingCommunication}`);
    console.log(`Communication Success Rate: ${Math.round((workingCommunication / totalServices) * 100)}%\n`);

    // Display individual service results
    this.results.forEach(result => {
      const statusIcon = result.status === 'running' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
      const commIcon = result.communicationWorking ? '🔄' : '🚫';
      
      console.log(`${statusIcon} ${result.serviceName}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Communication: ${result.communicationWorking ? 'Working' : 'Not Working'}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.response) {
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
      }
      
      console.log('');
    });

    // Overall assessment
    if (workingCommunication === totalServices) {
      console.log('🎉 All services are running and communicating properly!');
    } else if (workingCommunication > 0) {
      console.log('⚠️  Some services are working, but not all services can communicate properly.');
      console.log('   This indicates partial service communication issues.');
    } else {
      console.log('❌ No services are running or communicating properly.');
      console.log('   This indicates a complete service communication failure.');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    const notRunningServices = this.results.filter(r => r.status !== 'running');
    if (notRunningServices.length > 0) {
      console.log('1. Start the following services:');
      notRunningServices.forEach(service => {
        console.log(`   - ${service.serviceName} (${service.url})`);
      });
    }

    const notCommunicatingServices = this.results.filter(r => !r.communicationWorking);
    if (notCommunicatingServices.length > 0) {
      console.log('2. Fix communication issues for:');
      notCommunicatingServices.forEach(service => {
        console.log(`   - ${service.serviceName}: ${service.error || 'Unknown error'}`);
      });
    }

    if (workingCommunication === totalServices) {
      console.log('✅ All services are properly configured and communicating!');
    }
  }
}

// CLI execution
if (require.main === module) {
  const tester = new RealServiceCommunicationTester();
  tester.testAllServices().catch((error) => {
    console.error('Testing failed:', error);
    process.exit(1);
  });
}

export default RealServiceCommunicationTester;
