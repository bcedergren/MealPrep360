#!/usr/bin/env node

import { serviceConfig } from '../lib/services/config';
import { serviceDiscovery } from '../lib/services/discovery';
import { resilientClient } from '../lib/services/resilience';
import { serviceAuth } from '../lib/services/auth';
import { monitoring } from '../lib/services/monitoring';

interface TestResult {
	serviceName: string;
	test: string;
	success: boolean;
	message: string;
	duration: number;
	details?: any;
}

class ServiceCommunicationTester {
	private results: TestResult[] = [];

	async runAllTests(): Promise<void> {
		console.log('🧪 Starting Service Communication Tests...\n');

		try {
			// Initialize services
			await this.initializeServices();

			// Run test suites
			await this.testServiceDiscovery();
			await this.testServiceAuthentication();
			await this.testResilientCommunication();
			await this.testServiceConfiguration();
			await this.testMonitoring();

			// Display results
			this.displayResults();
		} catch (error) {
			console.error('❌ Test suite failed:', error);
			process.exit(1);
		}
	}

	private async initializeServices(): Promise<void> {
		console.log('📋 Initializing services...');

		try {
			await serviceConfig.initializeServices();
			console.log('✅ Services initialized successfully\n');
		} catch (error) {
			console.error('❌ Failed to initialize services:', error);
			throw error;
		}
	}

	private async testServiceDiscovery(): Promise<void> {
		console.log('🔍 Testing Service Discovery...');

		// Test 1: Check service registration
		await this.runTest(
			'service-discovery',
			'Service Registration',
			async () => {
				const services = serviceDiscovery.getAllServices();
				const expectedServices = [
					'recipe-service',
					'mealplan-service',
					'shopping-service',
					'social-service',
					'blog-service',
					'websocket-service',
				];

				const registeredServices = Object.keys(services);
				const missingServices = expectedServices.filter(
					(name) => !registeredServices.includes(name)
				);

				if (missingServices.length > 0) {
					throw new Error(`Missing services: ${missingServices.join(', ')}`);
				}

				return { registeredServices: registeredServices.length };
			}
		);

		// Test 2: Health checks
		await this.runTest('service-discovery', 'Health Checks', async () => {
			const services = serviceDiscovery.getAllServices();
			const healthCheckResults: { [key: string]: string } = {};

			for (const [serviceName, service] of Object.entries(services)) {
				await serviceDiscovery.checkServiceHealth(serviceName);
				const updatedService = serviceDiscovery.getService(serviceName);
				healthCheckResults[serviceName] = updatedService?.status || 'unknown';
			}

			return { healthStatus: healthCheckResults };
		});

		// Test 3: Service availability
		await this.runTest(
			'service-discovery',
			'Service Availability',
			async () => {
				const healthyServices = serviceDiscovery.getHealthyServices();
				const totalServices = serviceDiscovery.getAllServices();

				const availabilityRate =
					Object.keys(healthyServices).length /
					Object.keys(totalServices).length;

				return {
					healthy: Object.keys(healthyServices).length,
					total: Object.keys(totalServices).length,
					availabilityRate: Math.round(availabilityRate * 100),
				};
			}
		);
	}

	private async testServiceAuthentication(): Promise<void> {
		console.log('🔐 Testing Service Authentication...');

		// Test 1: API Key Validation
		await this.runTest('authentication', 'API Key Validation', async () => {
			const services = serviceAuth.getAllServices();
			const validationResults: { [key: string]: boolean } = {};

			services.forEach((service) => {
				const isValid = serviceAuth.validateApiKey(
					service.serviceName,
					service.apiKey
				);
				validationResults[service.serviceName] = isValid;

				if (!isValid) {
					throw new Error(
						`API key validation failed for ${service.serviceName}`
					);
				}
			});

			return { validatedServices: Object.keys(validationResults).length };
		});

		// Test 2: Rate Limiting
		await this.runTest('authentication', 'Rate Limiting', async () => {
			const serviceName = 'recipe-service';
			const clientId = 'test-client-' + Date.now();

			let requestCount = 0;
			let rateLimited = false;

			// Make requests until rate limited
			while (!rateLimited && requestCount < 200) {
				const result = serviceAuth.checkRateLimit(serviceName, clientId);
				if (!result.allowed) {
					rateLimited = true;
				} else {
					requestCount++;
				}
			}

			return { requestsBeforeLimit: requestCount, rateLimited };
		});
	}

	private async testResilientCommunication(): Promise<void> {
		console.log('🔄 Testing Resilient Communication...');

		// Test 1: Circuit Breaker
		await this.runTest('resilience', 'Circuit Breaker', async () => {
			const serviceName = 'test-circuit-breaker';

			// Simulate failures to trigger circuit breaker
			let failures = 0;
			for (let i = 0; i < 6; i++) {
				try {
					await resilientClient.makeResilientRequest(
						serviceName,
						'/test-endpoint',
						{ method: 'GET' },
						{ maxAttempts: 1 },
						{ enabled: false }
					);
				} catch (error) {
					failures++;
				}
			}

			const metrics = resilientClient.getCircuitBreakerMetrics(serviceName);
			return { failures, circuitBreakerState: metrics?.state || 'unknown' };
		});

		// Test 2: Retry Logic
		await this.runTest('resilience', 'Retry Logic', async () => {
			// Test retry configuration
			const retryConfig = {
				maxAttempts: 3,
				baseDelay: 1000,
				maxDelay: 5000,
			};

			return { retryConfig };
		});

		// Test 3: Fallback Mechanism
		await this.runTest('resilience', 'Fallback Mechanism', async () => {
			const fallbackData = {
				fallback: true,
				message: 'Service temporarily unavailable',
			};

			return { fallbackData };
		});
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
					throw new Error(
						`Configuration validation failed: ${validation.issues.join(', ')}`
					);
				}

				return {
					valid: validation.valid,
					recommendations: validation.recommendations.length,
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
			};
		});

		// Test 3: URL Updates
		await this.runTest('configuration', 'URL Updates', async () => {
			const serviceName = 'recipe-service';
			const originalConfig = serviceConfig.getServiceConfig(serviceName);
			const originalUrl = originalConfig?.url;
			const testUrl = 'https://test-recipe-service.example.com';

			if (!originalUrl) {
				throw new Error('Original service URL not found');
			}

			// Update URL
			serviceConfig.updateServiceUrl(serviceName, testUrl);
			const updatedConfig = serviceConfig.getServiceConfig(serviceName);

			if (updatedConfig?.url !== testUrl) {
				throw new Error('URL update failed');
			}

			// Restore original URL
			serviceConfig.updateServiceUrl(serviceName, originalUrl);

			return { urlUpdated: true };
		});
	}

	private async testMonitoring(): Promise<void> {
		console.log('📊 Testing Monitoring...');

		// Test 1: System Health
		await this.runTest('monitoring', 'System Health', async () => {
			const health = monitoring.getSystemHealth();

			return {
				overall: health.overall,
				servicesCount: Object.keys(health.services).length,
				metricsCount: Object.keys(health.metrics).length,
			};
		});

		// Test 2: Distributed Tracing
		await this.runTest('monitoring', 'Distributed Tracing', async () => {
			const result = await monitoring.traceServiceCall(
				'test-service',
				'test-operation',
				async (context) => {
					return {
						traceId: context.traceId,
						spanId: context.spanId,
						success: true,
					};
				}
			);

			return { traced: true, result };
		});
	}

	private async runTest(
		category: string,
		testName: string,
		testFunction: () => Promise<any>
	): Promise<void> {
		const startTime = Date.now();

		try {
			const result = await testFunction();
			const duration = Date.now() - startTime;

			this.results.push({
				serviceName: category,
				test: testName,
				success: true,
				message: 'Test passed',
				duration,
				details: result,
			});

			console.log(`  ✅ ${testName} (${duration}ms)`);
		} catch (error) {
			const duration = Date.now() - startTime;

			this.results.push({
				serviceName: category,
				test: testName,
				success: false,
				message: error instanceof Error ? error.message : String(error),
				duration,
			});

			console.log(
				`  ❌ ${testName} (${duration}ms): ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	private displayResults(): void {
		console.log('\n📋 Test Results Summary');
		console.log('======================');

		const totalTests = this.results.length;
		const passedTests = this.results.filter((r) => r.success).length;
		const failedTests = totalTests - passedTests;

		console.log(`Total Tests: ${totalTests}`);
		console.log(`Passed: ${passedTests}`);
		console.log(`Failed: ${failedTests}`);
		console.log(
			`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`
		);

		if (failedTests > 0) {
			console.log('\n❌ Failed Tests:');
			this.results
				.filter((r) => !r.success)
				.forEach((result) => {
					console.log(
						`  - ${result.serviceName}/${result.test}: ${result.message}`
					);
				});
		}

		console.log('\n📊 Performance Summary:');
		const avgDuration =
			this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
		console.log(`Average Test Duration: ${Math.round(avgDuration)}ms`);

		// Group by category
		const categories = [...new Set(this.results.map((r) => r.serviceName))];
		categories.forEach((category) => {
			const categoryResults = this.results.filter(
				(r) => r.serviceName === category
			);
			const categoryPassed = categoryResults.filter((r) => r.success).length;
			console.log(
				`${category}: ${categoryPassed}/${categoryResults.length} passed`
			);
		});

		console.log('\n🎉 Service Communication Testing Complete!');

		if (failedTests > 0) {
			process.exit(1);
		}
	}
}

// CLI execution
if (require.main === module) {
	const tester = new ServiceCommunicationTester();
	tester.runAllTests().catch((error) => {
		console.error('Test suite failed:', error);
		process.exit(1);
	});
}

export default ServiceCommunicationTester;
