// Import will be done dynamically to avoid circular dependencies

export interface ServiceEnvironment {
	development: ServiceUrls;
	test: ServiceUrls;
	staging: ServiceUrls;
	production: ServiceUrls;
}

export interface ServiceUrls {
	[serviceName: string]: string;
}

export interface ServiceConfig {
	name: string;
	url: string;
	healthEndpoint: string;
	apiKey: string;
	enabled: boolean;
	metadata: {
		capabilities: string[];
		maxConcurrentRequests: number;
		timeoutMs: number;
	};
}

export class ServiceConfigManager {
	private static instance: ServiceConfigManager;
	private environment: 'development' | 'staging' | 'production' | 'test';
	private serviceConfigs: Map<string, ServiceConfig> = new Map();

	private constructor() {
		this.environment = (process.env.NODE_ENV as any) || 'development';
		// Ensure environment is valid
		if (!['development', 'staging', 'production', 'test'].includes(this.environment)) {
			this.environment = 'development';
		}
		this.initializeServiceConfigs();
	}

	static getInstance(): ServiceConfigManager {
		if (!ServiceConfigManager.instance) {
			ServiceConfigManager.instance = new ServiceConfigManager();
		}
		return ServiceConfigManager.instance;
	}

	private initializeServiceConfigs(): void {
		// Check if using external API only
		const useExternalApiOnly = process.env.USE_EXTERNAL_API_ONLY === 'true';

		if (useExternalApiOnly) {
			console.log(
				"🔗 External API mode: Disabling internal services (keeping shopping service enabled as it's external)"
			);
		}

		const configs: ServiceConfig[] = [
			{
				name: 'recipe-service',
				url: this.getServiceUrl('recipe-service'),
				healthEndpoint: '/health',
				apiKey: process.env.RECIPE_SERVICE_API_KEY || '',
				enabled: useExternalApiOnly
					? false
					: this.isServiceEnabled('recipe-service'),
				metadata: {
					capabilities: [
						'recipe-generation',
						'recipe-search',
						'recipe-validation',
					],
					maxConcurrentRequests: 10,
					timeoutMs: 30000,
				},
			},
			{
				name: 'mealplan-service',
				url: this.getServiceUrl('mealplan-service'),
				healthEndpoint: '/health',
				apiKey: process.env.MEALPLAN_SERVICE_API_KEY || '',
				enabled: this.isServiceEnabled('mealplan-service'), // Always enabled as it's external
				metadata: {
					capabilities: ['meal-planning', 'calendar-management'],
					maxConcurrentRequests: 5,
					timeoutMs: 15000,
				},
			},
			{
				name: 'shopping-service',
				url: this.getServiceUrl('shopping-service'),
				healthEndpoint: '/health',
				apiKey: process.env.SHOPPING_SERVICE_API_KEY || '',
				enabled: this.isServiceEnabled('shopping-service'), // Always enabled as it's external
				metadata: {
					capabilities: ['shopping-list-generation', 'ingredient-aggregation'],
					maxConcurrentRequests: 15,
					timeoutMs: 10000,
				},
			},
			{
				name: 'social-service',
				url: this.getServiceUrl('social-service'),
				healthEndpoint: '/api/health',
				apiKey: process.env.SOCIAL_SERVICE_API_KEY || '',
				enabled: useExternalApiOnly
					? false
					: this.isServiceEnabled('social-service'),
				metadata: {
					capabilities: ['social-posts', 'comments', 'user-profiles'],
					maxConcurrentRequests: 25,
					timeoutMs: 10000,
				},
			},
			{
				name: 'blog-service',
				url: this.getServiceUrl('blog-service'),
				healthEndpoint: '/api/health',
				apiKey: process.env.BLOG_SERVICE_API_KEY || '',
				enabled: useExternalApiOnly
					? false
					: this.isServiceEnabled('blog-service'),
				metadata: {
					capabilities: ['blog-posts', 'content-management'],
					maxConcurrentRequests: 10,
					timeoutMs: 15000,
				},
			},
			{
				name: 'websocket-service',
				url: this.getServiceUrl('websocket-service'),
				healthEndpoint: '/health',
				apiKey: process.env.WEBSOCKET_SERVICE_API_KEY || '',
				enabled: useExternalApiOnly
					? false
					: this.isServiceEnabled('websocket-service'),
				metadata: {
					capabilities: ['real-time-messaging', 'notifications'],
					maxConcurrentRequests: 100,
					timeoutMs: 5000,
				},
			},
		];

		configs.forEach((config) => {
			this.serviceConfigs.set(config.name, config);
		});
	}

	private getServiceUrl(serviceName: string): string {
		const envKey = `${serviceName.toUpperCase().replace('-', '_')}_URL`;
		const envUrl = process.env[envKey];

		if (envUrl) {
			return envUrl;
		}

		// Default URLs based on environment
		const defaultUrls: ServiceEnvironment = {
			development: {
				'recipe-service': 'http://localhost:3002',
				'mealplan-service': 'http://localhost:3003',
				// External shopping service base (override with SHOPPING_SERVICE_URL if needed)
				'shopping-service':
					process.env.SHOPPING_SERVICE_URL ||
					'https://shopping.mealprep360.com',
				'social-service': 'http://localhost:3005',
				'blog-service': 'http://localhost:3006',
				'websocket-service': 'http://localhost:3007',
			},
			test: {
				'recipe-service': 'http://localhost:3002',
				'mealplan-service': 'http://localhost:3003',
				'shopping-service': 'https://shopping.mealprep360.com',
				'social-service': 'http://localhost:3005',
				'blog-service': 'http://localhost:3006',
				'websocket-service': 'http://localhost:3007',
			},
			staging: {
				'recipe-service': 'https://recipe-staging.mealprep360.com',
				'mealplan-service': 'https://mealplan-staging.mealprep360.com',
				// External shopping service staging
				'shopping-service':
					process.env.SHOPPING_SERVICE_URL ||
					'https://shopping-staging.mealprep360.com',
				'social-service': 'https://social-staging.mealprep360.com',
				'blog-service': 'https://blog-staging.mealprep360.com',
				'websocket-service': 'https://ws-staging.mealprep360.com',
			},
			production: {
				'recipe-service': 'https://recipe.mealprep360.com',
				'mealplan-service': 'https://plan.mealprep360.com',
				// External shopping service in production
				'shopping-service':
					process.env.SHOPPING_SERVICE_URL ||
					'https://shopping.mealprep360.com',
				'social-service': 'https://social.mealprep360.com',
				'blog-service': 'https://blog.mealprep360.com',
				'websocket-service': 'https://ws.mealprep360.com',
			},
		};

		return defaultUrls[this.environment][serviceName] || '';
	}

	private isServiceEnabled(serviceName: string): boolean {
		const envKey = `${serviceName.toUpperCase().replace('-', '_')}_ENABLED`;
		const enabled = process.env[envKey];

		// Default to true if not specified
		return enabled !== 'false';
	}

	getServiceConfig(serviceName: string): ServiceConfig | null {
		return this.serviceConfigs.get(serviceName) || null;
	}

	getAllServiceConfigs(): ServiceConfig[] {
		return Array.from(this.serviceConfigs.values());
	}

	getEnabledServices(): ServiceConfig[] {
		return this.getAllServiceConfigs().filter((config) => config.enabled);
	}

	async updateServiceUrl(serviceName: string, newUrl: string): Promise<void> {
		const config = this.serviceConfigs.get(serviceName);
		if (config) {
			config.url = newUrl;
			// Re-register with service discovery
			const { serviceDiscovery } = await import('./discovery');
			await serviceDiscovery.registerService(serviceName, {
				name: serviceName,
				endpoint: {
					url: newUrl,
					version: '1.0.0',
					capabilities: config.metadata.capabilities,
				},
			});
		}
	}

	validateServiceConfiguration(): {
		valid: boolean;
		issues: string[];
		recommendations: string[];
	} {
		const issues: string[] = [];
		const recommendations: string[] = [];

		// Skip validation if using external API only
		if (process.env.USE_EXTERNAL_API_ONLY === 'true') {
			console.log(
				'🔗 External API mode detected - skipping internal service validation'
			);
			return {
				valid: true,
				issues: [],
				recommendations: [
					'Using external API only - internal services disabled',
				],
			};
		}

		this.getAllServiceConfigs().forEach((config) => {
			// Only validate enabled services
			if (!config.enabled) {
				return;
			}

			// Check if URL is valid
			try {
				new URL(config.url);
			} catch (error) {
				issues.push(`Invalid URL for ${config.name}: ${config.url}`);
			}

		// Check if API key is provided (only for enabled services)
		if (config.enabled && !config.apiKey) {
			issues.push(`Missing API key for ${config.name}`);
			recommendations.push(`Set ${config.name.toUpperCase().replace('-', '_')}_API_KEY environment variable`);
		}

			// Check if service is reachable (could be done async)
			if (config.enabled && !config.url.startsWith('http')) {
				issues.push(`Service ${config.name} is enabled but URL is not HTTP(S)`);
			}

			// Recommendations
			if (config.metadata.timeoutMs > 30000) {
				recommendations.push(
					`Consider reducing timeout for ${config.name} (current: ${config.metadata.timeoutMs}ms)`
				);
			}

			if (config.metadata.maxConcurrentRequests > 50) {
				recommendations.push(
					`High concurrent request limit for ${config.name} (current: ${config.metadata.maxConcurrentRequests})`
				);
			}
		});

		return {
			valid: issues.length === 0,
			issues,
			recommendations,
		};
	}

	async initializeServices(): Promise<void> {
		console.log('🔧 Initializing service configurations...');

		const validation = this.validateServiceConfiguration();
		if (!validation.valid) {
			console.error('❌ Service configuration validation failed:');
			validation.issues.forEach((issue) => console.error(`  - ${issue}`));
			throw new Error('Invalid service configuration');
		}

		if (validation.recommendations.length > 0) {
			console.warn('⚠️  Service configuration recommendations:');
			validation.recommendations.forEach((rec) => console.warn(`  - ${rec}`));
		}

		// Initialize monitoring - import dynamically to avoid circular dependencies
		const { monitoring } = await import('./monitoring');
		monitoring.initialize();

		// Register all enabled services with service discovery
		const { serviceDiscovery } = await import('./discovery');
		const enabledServices = this.getEnabledServices();
		for (const config of enabledServices) {
			await serviceDiscovery.registerService(config.name, {
				name: config.name,
				endpoint: {
					url: config.url,
					version: '1.0.0',
					capabilities: config.metadata.capabilities,
				},
			});
		}

		console.log(`✅ Initialized ${enabledServices.length} services`);
	}

	getServiceEndpoint(serviceName: string, endpoint: string): string {
		const config = this.getServiceConfig(serviceName);
		if (!config) {
			throw new Error(`Service ${serviceName} not found`);
		}

		return `${config.url}${endpoint}`;
	}

	async isServiceHealthy(serviceName: string): Promise<boolean> {
		const config = this.getServiceConfig(serviceName);
		if (!config || !config.enabled) {
			return false;
		}

		try {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				config.metadata.timeoutMs
			);

			const healthEndpoint = `${config.url}${config.healthEndpoint}`;
			const response = await fetch(healthEndpoint, {
				method: 'GET',
				signal: controller.signal,
			});

			clearTimeout(timeout);
			return response.ok;
		} catch (error) {
			console.warn(`Health check failed for ${serviceName}:`, error);
			return false;
		}
	}

	async getServiceStatus(): Promise<{
		environment: string;
		totalServices: number;
		enabledServices: number;
		healthyServices: number;
		services: Array<{
			name: string;
			enabled: boolean;
			url: string;
			healthy: boolean;
			capabilities: string[];
		}>;
	}> {
		const allServices = this.getAllServiceConfigs();
		const enabledServices = this.getEnabledServices();

		// Check health for all services
		const healthyServices = [];
		for (const service of enabledServices) {
			const isHealthy = await this.isServiceHealthy(service.name);
			if (isHealthy) {
				healthyServices.push(service);
			}
		}

		const serviceStatuses = [];
		for (const config of allServices) {
			const isHealthy = await this.isServiceHealthy(config.name);
			serviceStatuses.push({
				name: config.name,
				enabled: config.enabled,
				url: config.url,
				healthy: isHealthy,
				capabilities: config.metadata.capabilities,
			});
		}

		return {
			environment: this.environment,
			totalServices: allServices.length,
			enabledServices: enabledServices.length,
			healthyServices: healthyServices.length,
			services: serviceStatuses,
		};
	}
}

export const serviceConfig = ServiceConfigManager.getInstance();
