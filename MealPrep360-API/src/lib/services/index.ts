// Service Layer Entry Point
// This file initializes and exports all service-related functionality

import { serviceAuth } from './auth';
import { serviceDiscovery } from './discovery';
import { resilientClient } from './resilience';
import { monitoring } from './monitoring';
import { serviceConfig } from './config';

export interface ServiceInitializationOptions {
	enableMonitoring?: boolean;
	enableHealthChecks?: boolean;
	enableAuth?: boolean;
	logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class ServiceManager {
	private static instance: ServiceManager;
	private initialized = false;
	private options: ServiceInitializationOptions = {};

	private constructor() {}

	static getInstance(): ServiceManager {
		if (!ServiceManager.instance) {
			ServiceManager.instance = new ServiceManager();
		}
		return ServiceManager.instance;
	}

	async initialize(options: ServiceInitializationOptions = {}): Promise<void> {
		if (this.initialized) {
			console.log('🔄 Service manager already initialized');
			return;
		}

		this.options = {
			enableMonitoring: true,
			enableHealthChecks: true,
			enableAuth: true,
			logLevel: 'info',
			...options,
		};

		console.log('🚀 Initializing MealPrep360 Service Manager...');

		try {
			// Check if using external API only
			const useExternalApiOnly = process.env.USE_EXTERNAL_API_ONLY === 'true';

			if (useExternalApiOnly) {
				console.log(
					'🔗 External API mode detected - skipping internal service initialization'
				);
			} else {
				// Step 1: Initialize service configuration
				console.log('📋 Initializing service configuration...');
				await serviceConfig.initializeServices();
			}

			// Step 2: Initialize monitoring (if enabled)
			if (this.options.enableMonitoring) {
				console.log('📊 Initializing monitoring system...');
				monitoring.initialize();
			}

			// Step 3: Start health checks (if enabled)
			if (this.options.enableHealthChecks) {
				if (useExternalApiOnly) {
					console.log('🔍 Starting health monitoring for external services...');
				} else {
					console.log('🔍 Starting health monitoring...');
				}
				serviceDiscovery.startHealthChecks();
			}

			// Step 4: Validate authentication setup
			if (this.options.enableAuth) {
				console.log('🔐 Validating authentication setup...');
				this.validateAuthSetup();
			}

			this.initialized = true;
			console.log('✅ Service manager initialized successfully');

			// Display service status
			await this.displayServiceStatus();
		} catch (error) {
			console.error('❌ Failed to initialize service manager:', error);
			throw error;
		}
	}

	async shutdown(): Promise<void> {
		if (!this.initialized) {
			return;
		}

		console.log('🛑 Shutting down service manager...');

		try {
			// Stop health checks
			serviceDiscovery.stopHealthChecks();

			// Shutdown monitoring
			monitoring.shutdown();

			this.initialized = false;
			console.log('✅ Service manager shutdown complete');
		} catch (error) {
			console.error('❌ Error during service manager shutdown:', error);
		}
	}

	private validateAuthSetup(): void {
		const services = serviceAuth.getAllServices();
		const missingKeys = services.filter((service) => !service.apiKey);

		if (missingKeys.length > 0) {
			console.warn(
				'⚠️  Missing API keys for services:',
				missingKeys.map((s) => s.serviceName)
			);
		} else {
			console.log('✅ All service API keys configured');
		}
	}

	private async displayServiceStatus(): Promise<void> {
		const useExternalApiOnly = process.env.USE_EXTERNAL_API_ONLY === 'true';

		if (useExternalApiOnly) {
			console.log('\n📊 Service Status Summary:');
			console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
			console.log(`Mode: External API Only`);
			console.log(`Internal Services: Disabled`);
			console.log(`Status: Healthy (External API Mode)`);
			return;
		}

		const status = await serviceConfig.getServiceStatus();
		console.log('\n📊 Service Status Summary:');
		console.log(`Environment: ${status.environment}`);
		console.log(`Total Services: ${status.totalServices}`);
		console.log(`Enabled Services: ${status.enabledServices}`);
		console.log(`Healthy Services: ${status.healthyServices}`);

		if (status.enabledServices > 0) {
			console.log('\n🔧 Enabled Services:');
			status.services
				.filter((s: any) => s.enabled)
				.forEach((service: any) => {
					const healthStatus = service.healthy ? '🟢' : '🔴';
					console.log(`  ${healthStatus} ${service.name} - ${service.url}`);
				});
		}
	}

	isInitialized(): boolean {
		return this.initialized;
	}

	getOptions(): ServiceInitializationOptions {
		return { ...this.options };
	}

	async getSystemHealth(): Promise<any> {
		if (!this.initialized) {
			throw new Error('Service manager not initialized');
		}

		return monitoring.getSystemHealth();
	}

	async performHealthCheck(): Promise<any> {
		if (!this.initialized) {
			throw new Error('Service manager not initialized');
		}

		// Check if using external API only
		const useExternalApiOnly = process.env.USE_EXTERNAL_API_ONLY === 'true';

		if (useExternalApiOnly) {
			return {
				timestamp: new Date().toISOString(),
				services: [],
				overall: 'healthy',
				mode: 'external-api-only',
			};
		}

		const services = serviceConfig.getEnabledServices();
		const healthResults = [];

		for (const service of services) {
			try {
				await serviceDiscovery.checkServiceHealth(service.name);
				const serviceStatus = serviceDiscovery.getService(service.name);
				healthResults.push({
					name: service.name,
					status: serviceStatus?.health?.status || 'unknown',
					responseTime: serviceStatus?.health?.responseTime || 0,
					lastCheck: serviceStatus?.health?.lastHealthCheck,
				});
			} catch (error) {
				healthResults.push({
					name: service.name,
					status: 'error',
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return {
			timestamp: new Date().toISOString(),
			services: healthResults,
			overall: healthResults.every((s) => s.status === 'healthy')
				? 'healthy'
				: 'degraded',
			mode: 'full-service',
		};
	}
}

// Global service manager instance
export const serviceManager = ServiceManager.getInstance();

// Export all service components
export {
	serviceAuth,
	serviceDiscovery,
	resilientClient,
	monitoring,
	serviceConfig,
};

// Auto-initialize if environment variable is set
if (process.env.AUTO_INIT_SERVICES === 'true') {
	serviceManager.initialize().catch((error) => {
		console.error('Failed to auto-initialize services:', error);
	});
}
