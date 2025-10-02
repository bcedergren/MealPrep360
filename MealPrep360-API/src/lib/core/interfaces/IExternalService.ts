export interface ServiceEndpoint {
	url: string;
	version: string;
	capabilities: string[];
}

export interface IExternalService {
	getServiceEndpoint(): ServiceEndpoint;
	getServiceConfig(): ServiceEndpoint;
}
