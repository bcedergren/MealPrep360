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

export interface ISubscriptionService {
	// Plan Management
	createPlan(
		plan: Omit<SubscriptionPlan, 'id'>
	): Promise<ISubscriptionPlanDocument>;
	updatePlan(
		planId: string,
		updates: Partial<SubscriptionPlan>
	): Promise<ISubscriptionPlanDocument>;
	getPlan(planId: string): Promise<ISubscriptionPlanDocument>;
	listPlans(filters?: {
		active?: boolean;
		currency?: BillingCurrency;
		interval?: BillingInterval;
	}): Promise<ISubscriptionPlanDocument[]>;
	deletePlan(planId: string): Promise<void>;

	// Subscription Management
	createSubscription(
		subscription: Omit<Subscription, 'id'>
	): Promise<ISubscriptionDocument>;
	updateSubscription(
		subscriptionId: string,
		updates: Partial<Subscription>
	): Promise<ISubscriptionDocument>;
	getSubscription(subscriptionId: string): Promise<ISubscriptionDocument>;
	listSubscriptions(filters?: {
		userId?: string;
		planId?: string;
		status?: SubscriptionStatus;
	}): Promise<ISubscriptionDocument[]>;
	cancelSubscription(
		subscriptionId: string,
		reason?: string
	): Promise<ISubscriptionDocument>;

	// Billing Operations
	createInvoice(
		invoice: Omit<SubscriptionInvoice, 'id'>
	): Promise<ISubscriptionInvoiceDocument>;
	updateInvoice(
		invoiceId: string,
		updates: Partial<SubscriptionInvoice>
	): Promise<ISubscriptionInvoiceDocument>;
	getInvoice(invoiceId: string): Promise<ISubscriptionInvoiceDocument>;
	listInvoices(filters?: {
		userId?: string;
		subscriptionId?: string;
		status?: string;
	}): Promise<ISubscriptionInvoiceDocument[]>;
	voidInvoice(
		invoiceId: string,
		reason: string
	): Promise<ISubscriptionInvoiceDocument>;

	// Payment Processing
	processPayment(
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
	}>;

	refundPayment(
		invoiceId: string,
		amount?: number,
		reason?: string
	): Promise<{
		success: boolean;
		refundId?: string;
		error?: string;
	}>;

	// Promotion Management
	createPromotion(
		promotion: Omit<SubscriptionPromotion, 'id'>
	): Promise<ISubscriptionPromotionDocument>;
	updatePromotion(
		promotionId: string,
		updates: Partial<SubscriptionPromotion>
	): Promise<ISubscriptionPromotionDocument>;
	getPromotion(promotionId: string): Promise<ISubscriptionPromotionDocument>;
	listPromotions(filters?: {
		active?: boolean;
		type?: string;
		code?: string;
	}): Promise<ISubscriptionPromotionDocument[]>;
	validatePromotion(
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
	}>;

	// Usage Tracking
	trackUsage(
		subscriptionId: string,
		feature: string,
		quantity: number
	): Promise<{
		recorded: boolean;
		current: number;
		limit?: number;
		remaining?: number;
	}>;

	getUsage(
		subscriptionId: string,
		feature?: string
	): Promise<{
		[feature: string]: {
			current: number;
			limit: number;
			remaining: number;
		};
	}>;

	// Subscription Lifecycle
	activateSubscription(subscriptionId: string): Promise<ISubscriptionDocument>;

	suspendSubscription(
		subscriptionId: string,
		reason: string
	): Promise<ISubscriptionDocument>;

	reactivateSubscription(
		subscriptionId: string
	): Promise<ISubscriptionDocument>;

	changePlan(
		subscriptionId: string,
		newPlanId: string,
		options?: {
			immediate?: boolean;
			prorationMode?: 'create_prorations' | 'none';
		}
	): Promise<ISubscriptionDocument>;

	// Metrics & Analytics
	getSubscriptionMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			planId?: string;
			status?: SubscriptionStatus;
		}
	): Promise<ISubscriptionMetricsDocument>;

	getRevenueMetrics(
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
	}>;

	// Error Handling
	handleSubscriptionError(
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
	}>;
}
