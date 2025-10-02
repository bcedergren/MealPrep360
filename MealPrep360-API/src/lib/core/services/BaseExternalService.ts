import { serviceDiscovery } from '../../services/discovery';
import { ResilientClient } from '../../services/resilience';
import {
	IExternalService,
	ServiceEndpoint,
} from '../interfaces/IExternalService';
import { NotFoundError } from '../errors/ServiceError';
import { serviceAuth } from '../../services/auth';

export abstract class BaseExternalService implements IExternalService {
	protected readonly resilientClient: ResilientClient;

	constructor(protected readonly serviceName: string) {
		const endpoint = this.getServiceEndpoint();
		this.resilientClient = new ResilientClient({ 
			baseURL: endpoint.url,
			headers: this.getAuthHeaders()
		});
	}

	public getServiceEndpoint(): ServiceEndpoint {
		const service = serviceDiscovery.getService(this.serviceName);
		if (!service) {
			throw new NotFoundError(`Service ${this.serviceName} not found`);
		}
		return service.endpoint;
	}

	public getServiceConfig(): ServiceEndpoint {
		return this.getServiceEndpoint();
	}

	private getAuthHeaders(): Record<string, string> {
		try {
			return serviceAuth.createAuthHeaders(this.serviceName);
		} catch (error) {
			console.warn(`Failed to create auth headers for ${this.serviceName}:`, error);
			return {
				'Content-Type': 'application/json',
			};
		}
	}
}
