export class ServiceRegistry {
	private static instance: ServiceRegistry;
	private services: Map<string, any>;

	private constructor() {
		this.services = new Map();
	}

	static getInstance(): ServiceRegistry {
		if (!ServiceRegistry.instance) {
			ServiceRegistry.instance = new ServiceRegistry();
		}
		return ServiceRegistry.instance;
	}

	register<T>(name: string, service: T): void {
		this.services.set(name, service);
	}

	get<T>(name: string): T {
		const service = this.services.get(name);
		if (!service) {
			throw new Error(`Service ${name} not found in registry`);
		}
		return service as T;
	}

	has(name: string): boolean {
		return this.services.has(name);
	}

	clear(): void {
		this.services.clear();
	}
}
