import { Document, Types } from 'mongoose';
import {
	SubscriptionPlan,
	Subscription,
	SubscriptionInvoice,
	SubscriptionPromotion,
	SubscriptionMetrics,
	SubscriptionStatus,
	BillingInterval,
	BillingCurrency,
	PaymentMethod,
} from './index';

export interface ISubscriptionPlanDocument
	extends Omit<SubscriptionPlan, 'id'>,
		Document {
	id: Types.ObjectId;
	visibility: {
		isPublic: boolean;
		availableCountries?: string[];
		restrictedTo?: string[];
	};
	versioning: {
		version: number;
		validFrom: Date;
		validTo?: Date;
		replacedBy?: string;
	};
	integrations: {
		stripeProductId?: string;
		stripePriceId?: string;
		[key: string]: any;
	};
}

export interface ISubscriptionDocument
	extends Omit<Subscription, 'id'>,
		Document {
	id: Types.ObjectId;
	history: Array<{
		action:
			| 'created'
			| 'activated'
			| 'renewed'
			| 'canceled'
			| 'upgraded'
			| 'downgraded';
		date: Date;
		planId: string;
		userId: string;
		metadata?: Record<string, any>;
	}>;
	notifications: {
		renewalReminder?: boolean;
		paymentReminder?: boolean;
		usageAlerts?: boolean;
		marketingEmails?: boolean;
	};
	customFields?: Record<string, any>;
}

export interface ISubscriptionInvoiceDocument
	extends Omit<SubscriptionInvoice, 'id'>,
		Document {
	id: Types.ObjectId;
	history: Array<{
		status: string;
		date: Date;
		reason?: string;
	}>;
	notifications: {
		sent: Array<{
			type: string;
			date: Date;
			recipient: string;
		}>;
		scheduled?: Array<{
			type: string;
			date: Date;
		}>;
	};
	customFields?: Record<string, any>;
}

export interface ISubscriptionPromotionDocument
	extends Omit<SubscriptionPromotion, 'id'>,
		Document {
	id: Types.ObjectId;
	validation: {
		rules: Array<{
			type: string;
			value: any;
			message: string;
		}>;
		customLogic?: string;
	};
	tracking: {
		source?: string;
		medium?: string;
		campaign?: string;
		term?: string;
		content?: string;
	};
	notifications: {
		onActivation?: boolean;
		onExpiration?: boolean;
		recipients?: string[];
	};
}

export interface ISubscriptionMetricsDocument
	extends Omit<SubscriptionMetrics, 'id'>,
		Document {
	id: Types.ObjectId;
	trends: {
		daily: Array<{
			date: Date;
			revenue: number;
			subscriptions: number;
		}>;
		weekly: Array<{
			week: string;
			revenue: number;
			subscriptions: number;
		}>;
	};
	insights: Array<{
		type: string;
		severity: 'info' | 'warning' | 'critical';
		message: string;
		data?: any;
	}>;
	forecasts: {
		revenue: {
			nextMonth: number;
			nextQuarter: number;
			confidence: number;
		};
		churn: {
			predicted: number;
			atRisk: string[];
			factors: string[];
		};
	};
}
