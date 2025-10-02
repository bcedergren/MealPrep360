import { RequestValidator } from '../../core/validation/RequestValidator';
import {
	SubscriptionPlan,
	Subscription,
	SubscriptionInvoice,
	SubscriptionPromotion,
	BillingInterval,
	BillingCurrency,
	PaymentMethod,
} from '../types';

export class SubscriptionPlanValidator extends RequestValidator<
	Omit<SubscriptionPlan, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.name === 'string' && data.name.length >= 3,
			message: 'Name must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				typeof data.description === 'string' && data.description.length >= 10,
			message: 'Description must be at least 10 characters long',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.features) &&
				data.features.every(
					(f) =>
						typeof f.name === 'string' &&
						typeof f.description === 'string' &&
						['boolean', 'numeric', 'text'].includes(f.type)
				),
			message: 'Invalid features configuration',
		});

		this.addRule({
			validate: (data) =>
				typeof data.pricing === 'object' &&
				typeof data.pricing.amount === 'number' &&
				data.pricing.amount > 0 &&
				['USD', 'EUR', 'GBP'].includes(data.pricing.currency) &&
				['monthly', 'quarterly', 'annual'].includes(data.pricing.interval),
			message: 'Invalid pricing configuration',
		});

		this.addRule({
			validate: (data) =>
				typeof data.limits === 'object' &&
				Object.values(data.limits).every(
					(v) => typeof v === 'number' && v >= 0
				),
			message: 'Invalid limits configuration',
		});
	}
}

export class SubscriptionValidator extends RequestValidator<
	Omit<Subscription, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) => !!data.planId,
			message: 'Plan ID is required',
		});

		this.addRule({
			validate: (data) =>
				[
					'active',
					'canceled',
					'expired',
					'past_due',
					'pending',
					'trialing',
					'unpaid',
				].includes(data.status),
			message: 'Invalid subscription status',
		});

		this.addRule({
			validate: (data) =>
				data.currentPeriod &&
				data.currentPeriod.start instanceof Date &&
				data.currentPeriod.end instanceof Date &&
				data.currentPeriod.start < data.currentPeriod.end,
			message: 'Invalid subscription period',
		});

		this.addRule({
			validate: (data) =>
				typeof data.billing === 'object' &&
				typeof data.billing.amount === 'number' &&
				data.billing.amount > 0 &&
				['USD', 'EUR', 'GBP'].includes(data.billing.currency) &&
				['monthly', 'quarterly', 'annual'].includes(data.billing.interval) &&
				[
					'credit_card',
					'debit_card',
					'paypal',
					'bank_transfer',
					'apple_pay',
					'google_pay',
				].includes(data.billing.paymentMethod),
			message: 'Invalid billing configuration',
		});
	}
}

export class SubscriptionInvoiceValidator extends RequestValidator<
	Omit<SubscriptionInvoice, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.subscriptionId,
			message: 'Subscription ID is required',
		});

		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) => typeof data.amount === 'number' && data.amount > 0,
			message: 'Amount must be greater than 0',
		});

		this.addRule({
			validate: (data) => ['USD', 'EUR', 'GBP'].includes(data.currency),
			message: 'Invalid currency',
		});

		this.addRule({
			validate: (data) =>
				['draft', 'open', 'paid', 'void', 'uncollectible'].includes(
					data.status
				),
			message: 'Invalid invoice status',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.items) &&
				data.items.every(
					(item) =>
						typeof item.description === 'string' &&
						typeof item.amount === 'number' &&
						typeof item.quantity === 'number'
				),
			message: 'Invalid invoice items',
		});
	}
}

export class SubscriptionPromotionValidator extends RequestValidator<
	Omit<SubscriptionPromotion, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.code === 'string' && /^[A-Z0-9_-]{6,}$/.test(data.code),
			message:
				'Code must be at least 6 characters long and contain only uppercase letters, numbers, underscores, and hyphens',
		});

		this.addRule({
			validate: (data) =>
				typeof data.description === 'string' && data.description.length >= 10,
			message: 'Description must be at least 10 characters long',
		});

		this.addRule({
			validate: (data) =>
				['percentage', 'fixed_amount', 'trial_extension'].includes(data.type),
			message: 'Invalid promotion type',
		});

		this.addRule({
			validate: (data) =>
				typeof data.value === 'number' &&
				data.value > 0 &&
				(data.type !== 'percentage' || data.value <= 100),
			message:
				'Value must be greater than 0 and not exceed 100 for percentage discounts',
		});

		this.addRule({
			validate: (data) =>
				typeof data.constraints === 'object' &&
				(!data.constraints.maxUses ||
					typeof data.constraints.maxUses === 'number') &&
				(!data.constraints.minPurchaseAmount ||
					typeof data.constraints.minPurchaseAmount === 'number') &&
				(!data.constraints.applicablePlans ||
					Array.isArray(data.constraints.applicablePlans)),
			message: 'Invalid constraints configuration',
		});
	}
}
