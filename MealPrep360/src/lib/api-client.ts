import { API_CONFIG } from './api-config';

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export class ApiClient {
	private baseURL: string;
	private defaultHeaders: Record<string, string>;
	private timeout: number;

	constructor() {
		// Client-side should use relative URLs to go through Next.js API routes
		this.baseURL = '/api';
		this.defaultHeaders = API_CONFIG.defaultHeaders;
		this.timeout = API_CONFIG.timeout;
	}

	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		try {
			const url = `${this.baseURL}${endpoint}`;

			const response = await fetch(url, {
				...options,
				headers: {
					...this.defaultHeaders,
					...options.headers,
				},
				signal: AbortSignal.timeout(this.timeout),
			});

			const data = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: data.error || data.message || `HTTP ${response.status}`,
					data: data,
				};
			}

			return {
				success: true,
				data: data,
			};
		} catch (error) {
			console.error('API request failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Network error',
			};
		}
	}

	async get<T>(
		endpoint: string,
		params?: Record<string, any>
	): Promise<ApiResponse<T>> {
		const url = new URL(endpoint, this.baseURL);
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value));
				}
			});
		}

		return this.makeRequest<T>(url.pathname + url.search);
	}

	async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		return this.makeRequest<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		return this.makeRequest<T>(endpoint, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
		return this.makeRequest<T>(endpoint, {
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
		return this.makeRequest<T>(endpoint, {
			method: 'DELETE',
		});
	}

	async upload<T>(
		endpoint: string,
		formData: FormData
	): Promise<ApiResponse<T>> {
		try {
			const url = `${this.baseURL}${endpoint}`;

			const response = await fetch(url, {
				method: 'POST',
				headers: this.defaultHeaders,
				body: formData,
				signal: AbortSignal.timeout(this.timeout),
			});

			const data = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: data.error || data.message || `HTTP ${response.status}`,
					data: data,
				};
			}

			return {
				success: true,
				data: data,
			};
		} catch (error) {
			console.error('Upload request failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Upload failed',
			};
		}
	}
}

// Client-side API client (for use in components)
export const apiClient = new ApiClient();
