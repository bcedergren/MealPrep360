import { ServiceEndpoint } from '../core/interfaces/IExternalService';

export interface ServiceHealthStatus {
	status: 'healthy' | 'unhealthy' | 'unknown' | 'error';
	responseTime: number;
	lastHealthCheck: string;
	error?: string;
}

export interface ServiceConfig {
	name: string;
	endpoint: ServiceEndpoint;
	status?: string;
	health?: ServiceHealthStatus;
}

export class ServiceDiscovery {
	private static instance: ServiceDiscovery;
	private services: Map<string, ServiceConfig>;
	private healthCheckInterval: NodeJS.Timeout | null = null;

	private constructor() {
		this.services = new Map();
	}

	public static getInstance(): ServiceDiscovery {
		if (!ServiceDiscovery.instance) {
			ServiceDiscovery.instance = new ServiceDiscovery();
		}
		return ServiceDiscovery.instance;
	}

	public registerService(name: string, config: ServiceConfig): void {
		this.services.set(name, config);
	}

	public getService(name: string): ServiceConfig | null {
		return this.services.get(name) || null;
	}

	public listServices(): ServiceConfig[] {
		return Array.from(this.services.values());
	}

	public async checkServiceHealth(serviceName: string): Promise<void> {
		const service = this.getService(serviceName);
		if (!service) {
			throw new Error(`Service ${serviceName} not found`);
		}

		const startTime = Date.now();
		try {
			const { serviceConfig } = await import('./config');
			const isHealthy = await serviceConfig.isServiceHealthy(serviceName);
			const responseTime = Date.now() - startTime;

			service.health = {
				status: isHealthy ? 'healthy' : 'unhealthy',
				responseTime,
				lastHealthCheck: new Date().toISOString(),
			};

			this.services.set(serviceName, service);
		} catch (error) {
			service.health = {
				status: 'error',
				responseTime: Date.now() - startTime,
				lastHealthCheck: new Date().toISOString(),
				error: error instanceof Error ? error.message : String(error),
			};
			this.services.set(serviceName, service);
			throw error;
		}
	}

	public startHealthChecks(interval: number = 60000): void {
		if (this.healthCheckInterval) {
			return;
		}

		this.healthCheckInterval = setInterval(async () => {
			const services = this.listServices();
			for (const service of services) {
				try {
					await this.checkServiceHealth(service.name);
					console.log(
						`Health check for ${service.name}: ${service.health?.status === 'healthy' ? '✅' : '❌'}`
					);
				} catch (error) {
					console.error(`Health check failed for ${service.name}:`, error);
				}
			}
		}, interval);
	}

	public stopHealthChecks(): void {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}
	}

	public getAllServices(): { [key: string]: ServiceConfig } {
		return Object.fromEntries(this.services);
	}

	public getHealthyServices(): { [key: string]: ServiceConfig } {
		return Object.fromEntries(
			Array.from(this.services).filter(
				([_, config]) => config.health && !config.health.error
			)
		);
	}
}

export const serviceDiscovery = ServiceDiscovery.getInstance();
