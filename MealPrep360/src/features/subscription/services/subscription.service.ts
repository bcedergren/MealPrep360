'use client';

import {
	SubscriptionResponse,
	Subscription,
	SubscriptionPlan,
} from '@/types/subscription';

export interface SubscriptionServiceConfig {
	baseUrl?: string;
	onError?: (error: Error) => void;
}

export class SubscriptionService {
	private baseUrl: string;
	private onError: (error: Error) => void;

	constructor(config: SubscriptionServiceConfig = {}) {
		this.baseUrl = config.baseUrl || '/api/subscription';
		this.onError = config.onError || console.error;
	}

	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...options.headers,
				},
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error('Unauthorized - please sign in again');
				}
				const errorData = await response
					.json()
					.catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					errorData.error || `Failed with status ${response.status}`
				);
			}

			return await response.json();
		} catch (error) {
			this.onError(error as Error);
			throw error;
		}
	}

	async fetchSubscription(token: string): Promise<Subscription> {
		try {
			const data = await this.makeRequest<SubscriptionResponse>('', {
				headers: { Authorization: `Bearer ${token}` },
			});

			return {
				plan: data.plan,
				features: data.features,
				status: 'active',
			};
		} catch (error) {
			if ((error as Error).message.includes('404')) {
				return {
					plan: 'FREE',
					status: 'active',
				};
			}
			throw error;
		}
	}

	async upgradePlan(
		token: string,
		plan: SubscriptionPlan,
		billingInterval: 'monthly' | 'yearly' = 'monthly'
	): Promise<{ url?: string }> {
		return this.makeRequest('/checkout', {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
			body: JSON.stringify({
				plan,
				billingInterval,
				action: 'upgrade',
			}),
		});
	}

	async cancelSubscription(
		token: string,
		options: {
			reason?: string;
			feedback?: string;
			immediateCancel?: boolean;
		}
	): Promise<any> {
		return this.makeRequest('/cancel', {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
			body: JSON.stringify({
				...options,
				retentionOffer: 'none',
			}),
		});
	}

	async adminSwitchPlan(token: string, plan: SubscriptionPlan): Promise<any> {
		return this.makeRequest('/admin', {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
			body: JSON.stringify({ plan }),
		});
	}
}

// Create a singleton instance
export const subscriptionService = new SubscriptionService();
