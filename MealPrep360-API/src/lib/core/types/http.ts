export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface HttpRequestConfig {
	params?: Record<string, any>;
	data?: any;
	headers?: Record<string, string>;
}

export interface HttpResponse<T = any> {
	data: T;
	status: number;
	headers: Record<string, string>;
}

export interface HttpClient {
	request<T = any>(
		method: HttpMethod,
		url: string,
		config?: HttpRequestConfig
	): Promise<HttpResponse<T>>;
}
