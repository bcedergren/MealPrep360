import { BaseExternalService } from '../../core/services/BaseExternalService';

import { ISubscriptionService } from '../interfaces/ISubscriptionService';
import { AxiosResponse } from 'axios';
import {
	SubscriptionPlan,
	Subscription,
	SubscriptionInvoice,
	SubscriptionPromotion,
	SubscriptionStatus,
	BillingInterval,
	BillingCurrency,
	PaymentMethod,
} from '../types';
import {
	ISubscriptionPlanDocument,
	ISubscriptionDocument,
	ISubscriptionInvoiceDocument,
	ISubscriptionPromotionDocument,
	ISubscriptionMetricsDocument,
} from '../types/subscription';

export class ExternalSubscriptionService
	extends BaseExternalService
	implements ISubscriptionService
{
	constructor() {
		super('subscription');
	}

	// Plan Management
	async createPlan(
		plan: Omit<SubscriptionPlan, 'id'>
	): Promise<ISubscriptionPlanDocument> {
		const response: AxiosResponse<ISubscriptionPlanDocument> =
			await this.resilientClient.post('/plans', plan);
		return response.data;
	}

	async updatePlan(
		planId: string,
		updates: Partial<SubscriptionPlan>
	): Promise<ISubscriptionPlanDocument> {
		const response: AxiosResponse<ISubscriptionPlanDocument> =
			await this.resilientClient.put(`/plans/${planId}`, updates);
		return response.data;
	}

	async getPlan(planId: string): Promise<ISubscriptionPlanDocument> {
		const response: AxiosResponse<ISubscriptionPlanDocument> =
			await this.resilientClient.get(`/plans/${planId}`);
		return response.data;
	}

	async listPlans(filters?: {
		active?: boolean;
		currency?: BillingCurrency;
		interval?: BillingInterval;
	}): Promise<ISubscriptionPlanDocument[]> {
		const response: AxiosResponse<ISubscriptionPlanDocument[]> =
			await this.resilientClient.get('/plans', {
				params: filters,
			});
		return response.data;
	}

	async deletePlan(planId: string): Promise<void> {
		await this.resilientClient.delete(`/plans/${planId}`);
	}

	// Subscription Management
	async createSubscription(
		subscription: Omit<Subscription, 'id'>
	): Promise<ISubscriptionDocument> {
		const response: AxiosResponse<ISubscriptionDocument> =
			await this.resilientClient.post('/subscriptions', subscription);
		return response.data;
	}

	async updateSubscription(
		subscriptionId: string,
		updates: Partial<Subscription>
	): Promise<ISubscriptionDocument> {
		const response: AxiosResponse<ISubscriptionDocument> =
			await this.resilientClient.put(
				`/subscriptions/${subscriptionId}`,
				updates
			);
		return response.data;
	}

	async getSubscription(
		subscriptionId: string
	): Promise<ISubscriptionDocument> {
		const response: AxiosResponse<ISubscriptionDocument> =
			await this.resilientClient.get(`/subscriptions/${subscriptionId}`);
		return response.data;
	}

	async listSubscriptions(filters?: {
		userId?: string;
		planId?: string;
		status?: SubscriptionStatus;
	}): Promise<ISubscriptionDocument[]> {
		const response: AxiosResponse<ISubscriptionDocument[]> =
			await this.resilientClient.get('/subscriptions', {
				params: filters,
			});
		return response.data;
	}

	async cancelSubscription(
		subscriptionId: string,
		reason?: string
	): Promise<ISubscriptionDocument> {
		const response: AxiosResponse<ISubscriptionDocument> =
			await this.resilientClient.post(
				`/subscriptions/${subscriptionId}/cancel`,
				{ reason }
			);
		return response.data;
	}

	// Billing Operations
	async createInvoice(
		invoice: Omit<SubscriptionInvoice, 'id'>
	): Promise<ISubscriptionInvoiceDocument> {
		const response: AxiosResponse<ISubscriptionInvoiceDocument> =
			await this.resilientClient.post('/invoices', invoice);
		return response.data;
	}

	async updateInvoice(
		invoiceId: string,
		updates: Partial<SubscriptionInvoice>
	): Promise<ISubscriptionInvoiceDocument> {
		const response: AxiosResponse<ISubscriptionInvoiceDocument> =
			await this.resilientClient.put(`/invoices/${invoiceId}`, updates);
		return response.data;
	}

	async getInvoice(invoiceId: string): Promise<ISubscriptionInvoiceDocument> {
		const response: AxiosResponse<ISubscriptionInvoiceDocument> =
			await this.resilientClient.get(`/invoices/${invoiceId}`);
		return response.data;
	}

	async listInvoices(filters?: {
		userId?: string;
		subscriptionId?: string;
		status?: string;
	}): Promise<ISubscriptionInvoiceDocument[]> {
		const response: AxiosResponse<ISubscriptionInvoiceDocument[]> =
			await this.resilientClient.get('/invoices', {
				params: filters,
			});
		return response.data;
	}

	async voidInvoice(
		invoiceId: string,
		reason: string
	): Promise<ISubscriptionInvoiceDocument> {
		const response: AxiosResponse<ISubscriptionInvoiceDocument> =
			await this.resilientClient.post(`/invoices/${invoiceId}/void`, {
				reason,
			});
		return response.data;
	}

	// Payment Processing
	async processPayment(
		invoiceId: string,
		paymentMethod: PaymentMethod,
		options?: {
			savePaymentMethod?: boolean;
			metadata?: Record<string, any>;
		}
	): Promise<{
		success: boolean;
		transactionId?: string;
		error?: string;
	}> {
		const response: AxiosResponse<{
			success: boolean;
			transactionId?: string;
			error?: string;
		}> = await this.resilientClient.post(`/invoices/${invoiceId}/pay`, {
			paymentMethod,
			...options,
		});
		return response.data;
	}

	async refundPayment(
		invoiceId: string,
		amount?: number,
		reason?: string
	): Promise<{
		success: boolean;
		refundId?: string;
		error?: string;
	}> {
		const response: AxiosResponse<{
			success: boolean;
			refundId?: string;
			error?: string;
		}> = await this.resilientClient.post(`/invoices/${invoiceId}/refund`, {
			amount,
			reason,
		});
		return response.data;
	}

	// Promotion Management
	async createPromotion(
		promotion: Omit<SubscriptionPromotion, 'id'>
	): Promise<ISubscriptionPromotionDocument> {
		const response: AxiosResponse<ISubscriptionPromotionDocument> =
			await this.resilientClient.post('/promotions', promotion);
		return response.data;
	}

	async updatePromotion(
		promotionId: string,
		updates: Partial<SubscriptionPromotion>
	): Promise<ISubscriptionPromotionDocument> {
		const response: AxiosResponse<ISubscriptionPromotionDocument> =
			await this.resilientClient.put(`/promotions/${promotionId}`, updates);
		return response.data;
	}

	async getPromotion(
		promotionId: string
	): Promise<ISubscriptionPromotionDocument> {
		const response: AxiosResponse<ISubscriptionPromotionDocument> =
			await this.resilientClient.get(`/promotions/${promotionId}`);
		return response.data;
	}

	async listPromotions(filters?: {
		active?: boolean;
		type?: string;
		code?: string;
	}): Promise<ISubscriptionPromotionDocument[]> {
		const response: AxiosResponse<ISubscriptionPromotionDocument[]> =
			await this.resilientClient.get('/promotions', {
				params: filters,
			});
		return response.data;
	}

	async validatePromotion(
		code: string,
		context: {
			userId?: string;
			planId?: string;
			amount?: number;
		}
	): Promise<{
		valid: boolean;
		promotion?: ISubscriptionPromotionDocument;
		error?: string;
	}> {
		const response: AxiosResponse<{
			valid: boolean;
			promotion?: ISubscriptionPromotionDocument;
			error?: string;
		}> = await this.resilientClient.post('/promotions/validate', {
			code,
			...context,
		});
		return response.data;
	}

	// Usage Tracking
	async trackUsage(
		subscriptionId: string,
		feature: string,
		quantity: number
	): Promise<{
		recorded: boolean;
		current: number;
		limit?: number;
		remaining?: number;
	}> {
		const response: AxiosResponse<{
			recorded: boolean;
			current: number;
			limit?: number;
			remaining?: number;
		}> = await this.resilientClient.post(
			`/subscriptions/${subscriptionId}/usage`,
			{
				feature,
				quantity,
			}
		);
		return response.data;
	}

	async getUsage(
		subscriptionId: string,
		feature?: string
	): Promise<{
		[feature: string]: {
			current: number;
			limit: number;
			remaining: number;
		};
	}> {
		const response: AxiosResponse<{
			[feature: string]: {
				current: number;
				limit: number;
				remaining: number;
			};
		}> = await this.resilientClient.get(
			`/subscriptions/${subscriptionId}/usage`,
			{
				params: { feature },
			}
		);
		return response.data;
	}

	// Subscription Lifecycle
	async activateSubscription(
		subscriptionId: string
	): Promise<ISubscriptionDocument> {
		const response: AxiosResponse<ISubscriptionDocument> =
			await this.resilientClient.post(
				`/subscriptions/${subscriptionId}/activate`
			);
		return response.data;
	}

	async suspendSubscription(
		subscriptionId: string,
		reason: string
	): Promise<ISubscriptionDocument> {
		const response: AxiosResponse<ISubscriptionDocument> =
			await this.resilientClient.post(
				`/subscriptions/${subscriptionId}/suspend`,
				{ reason }
			);
		return response.data;
	}

	async reactivateSubscription(
		subscriptionId: string
	): Promise<ISubscriptionDocument> {
		const response: AxiosResponse<ISubscriptionDocument> =
			await this.resilientClient.post(
				`/subscriptions/${subscriptionId}/reactivate`
			);
		return response.data;
	}

	async changePlan(
		subscriptionId: string,
		newPlanId: string,
		options?: {
			immediate?: boolean;
			prorationMode?: 'create_prorations' | 'none';
		}
	): Promise<ISubscriptionDocument> {
		const response: AxiosResponse<ISubscriptionDocument> =
			await this.resilientClient.post(
				`/subscriptions/${subscriptionId}/change-plan`,
				{
					newPlanId,
					...options,
				}
			);
		return response.data;
	}

	// Metrics & Analytics
	async getSubscriptionMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			planId?: string;
			status?: SubscriptionStatus;
		}
	): Promise<ISubscriptionMetricsDocument> {
		const response: AxiosResponse<ISubscriptionMetricsDocument> =
			await this.resilientClient.get('/metrics', {
				params: {
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					...filters,
				},
			});
		return response.data;
	}

	async getRevenueMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			currency?: BillingCurrency;
			interval?: BillingInterval;
		}
	): Promise<{
		total: number;
		recurring: number;
		oneTime: number;
		byPlan: Record<string, number>;
		byPeriod: Array<{
			period: string;
			amount: number;
		}>;
	}> {
		const response: AxiosResponse<{
			total: number;
			recurring: number;
			oneTime: number;
			byPlan: Record<string, number>;
			byPeriod: Array<{
				period: string;
				amount: number;
			}>;
		}> = await this.resilientClient.get('/metrics/revenue', {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				...filters,
			},
		});
		return response.data;
	}

	// Error Handling
	async handleSubscriptionError(
		error: Error,
		context: {
			operation: string;
			subscriptionId?: string;
			userId?: string;
			data?: any;
		}
	): Promise<{
		handled: boolean;
		action?: 'retry' | 'fail' | 'ignore';
		fallback?: {
			type: string;
			value: any;
		};
	}> {
		const response: AxiosResponse<{
			handled: boolean;
			action?: 'retry' | 'fail' | 'ignore';
			fallback?: {
				type: string;
				value: any;
			};
		}> = await this.resilientClient.post('/errors', {
			error: {
				message: error.message,
				stack: error.stack,
			},
			context,
		});
		return response.data;
	}
}
