export type SubscriptionStatus =
	| 'active'
	| 'canceled'
	| 'expired'
	| 'past_due'
	| 'pending'
	| 'trialing'
	| 'unpaid';

export type BillingInterval = 'monthly' | 'quarterly' | 'annual';

export type BillingCurrency = 'USD' | 'EUR' | 'GBP';

export type PaymentMethod =
	| 'credit_card'
	| 'debit_card'
	| 'paypal'
	| 'bank_transfer'
	| 'apple_pay'
	| 'google_pay';

export interface PlanFeature {
	id: string;
	name: string;
	description: string;
	type: 'boolean' | 'numeric' | 'text';
	value: boolean | number | string;
	sortOrder?: number;
	metadata?: {
		icon?: string;
		highlight?: boolean;
		category?: string;
		[key: string]: any;
	};
}

export interface SubscriptionPlan {
	id: string;
	name: string;
	description: string;
	features: PlanFeature[];
	pricing: {
		amount: number;
		currency: BillingCurrency;
		interval: BillingInterval;
		trialDays?: number;
		setupFee?: number;
	};
	limits: {
		recipes?: number;
		mealPlans?: number;
		shoppingLists?: number;
		aiRequests?: number;
		[key: string]: number | undefined;
	};
	metadata?: {
		popular?: boolean;
		enterprise?: boolean;
		legacy?: boolean;
		hidden?: boolean;
		[key: string]: any;
	};
}

export interface Subscription {
	id: string;
	userId: string;
	planId: string;
	status: SubscriptionStatus;
	currentPeriod: {
		start: Date;
		end: Date;
	};
	billing: {
		amount: number;
		currency: BillingCurrency;
		interval: BillingInterval;
		nextBillingDate: Date;
		paymentMethod: PaymentMethod;
		lastPayment?: {
			date: Date;
			amount: number;
			status: 'success' | 'failed' | 'pending';
		};
	};
	usage: {
		recipes: number;
		mealPlans: number;
		shoppingLists: number;
		aiRequests: number;
		[key: string]: number;
	};
	metadata?: {
		source?: string;
		promotionCode?: string;
		cancelReason?: string;
		notes?: string;
		[key: string]: any;
	};
}

export interface SubscriptionInvoice {
	id: string;
	subscriptionId: string;
	userId: string;
	amount: number;
	currency: BillingCurrency;
	status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
	dueDate: Date;
	items: Array<{
		description: string;
		amount: number;
		quantity: number;
		metadata?: Record<string, any>;
	}>;
	payment?: {
		method: PaymentMethod;
		date: Date;
		transactionId: string;
		status: 'success' | 'failed' | 'pending';
	};
	metadata?: {
		notes?: string;
		customFields?: Record<string, any>;
		[key: string]: any;
	};
}

export interface SubscriptionPromotion {
	id: string;
	code: string;
	description: string;
	type: 'percentage' | 'fixed_amount' | 'trial_extension';
	value: number;
	constraints: {
		startDate?: Date;
		endDate?: Date;
		maxUses?: number;
		minPurchaseAmount?: number;
		applicablePlans?: string[];
		newCustomersOnly?: boolean;
		stackable?: boolean;
	};
	usage: {
		totalUses: number;
		remainingUses?: number;
		lastUsed?: Date;
	};
	metadata?: {
		campaign?: string;
		source?: string;
		[key: string]: any;
	};
}

export interface SubscriptionMetrics {
	period: {
		start: Date;
		end: Date;
	};
	revenue: {
		total: number;
		byPlan: Record<string, number>;
		byInterval: Record<BillingInterval, number>;
		recurring: number;
		oneTime: number;
	};
	subscriptions: {
		total: number;
		active: number;
		canceled: number;
		byPlan: Record<string, number>;
		byStatus: Record<SubscriptionStatus, number>;
	};
	conversions: {
		trials: {
			started: number;
			converted: number;
			rate: number;
		};
		upgrades: number;
		downgrades: number;
		churn: {
			count: number;
			rate: number;
			reasons?: Record<string, number>;
		};
	};
	usage: {
		byFeature: Record<
			string,
			{
				total: number;
				average: number;
				peak: number;
			}
		>;
		byPlan: Record<
			string,
			{
				utilization: number;
				limitReached: number;
			}
		>;
	};
}
