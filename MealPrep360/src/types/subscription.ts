export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PLUS' | 'FAMILY';
export type BillingInterval = 'monthly' | 'yearly';

export interface Subscription {
	_id?: string;
	userId?: string;
	stripeCustomerId?: string;
	stripeSubscriptionId?: string;
	status?: 'active' | 'canceled' | 'past_due' | 'unpaid';
	currentPeriodStart?: string;
	currentPeriodEnd?: string;
	planId?: string;
	createdAt?: string;
	updatedAt?: string;
	plan: SubscriptionPlan;
	features?: Record<string, any>;
}

export interface SubscriptionResponse {
	plan: SubscriptionPlan;
	features?: Record<string, any>;
}

export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
	FREE: 'Free',
	STARTER: 'Starter',
	PLUS: 'Plus',
	FAMILY: 'Family',
};

export const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
	FREE: 0,
	STARTER: 1,
	PLUS: 2,
	FAMILY: 3,
};

export const PLAN_PRICES: Record<
	Exclude<SubscriptionPlan, 'FREE'>,
	Record<BillingInterval, number>
> = {
	STARTER: {
		monthly: 9.99,
		yearly: 99.99,
	},
	PLUS: {
		monthly: 19.99,
		yearly: 199.99,
	},
	FAMILY: {
		monthly: 29.99,
		yearly: 299.99,
	},
};

export const PLAN_FEATURES: Record<
	SubscriptionPlan,
	Record<string, string | number | boolean>
> = {
	FREE: {
		Recipes: 10,
		'Shopping Lists': true,
		'Recipe Images': 'Browse Only',
		'Meal Plans': '1 Week',
	},
	STARTER: {
		Recipes: 50,
		'Shopping Lists': true,
		'Recipe Images': true,
		'Recommended Recipes': 'Unlimited',
		'Meal Plans': '2 Weeks',
	},
	PLUS: {
		Recipes: 'Unlimited',
		'Shopping Lists': true,
		'Recipe Images': true,
		'Recommended Recipes': 'Unlimited',
		'AI Blog Generation': true,
		'Meal Plans': '4 Weeks',
	},
	FAMILY: {
		Recipes: 'Unlimited',
		'Shopping Lists': true,
		'Recipe Images': true,
		'Recommended Recipes': 'Unlimited',
		'AI Blog Generation': true,
		'Family Sharing': true,
		'Meal Plans': 'Unlimited',
	},
};

export const STRIPE_PRICE_IDS: Record<
	Exclude<SubscriptionPlan, 'FREE'>,
	Record<BillingInterval, string>
> = {
	STARTER: {
		monthly: 'price_starter_monthly',
		yearly: 'price_starter_yearly',
	},
	PLUS: {
		monthly: 'price_plus_monthly',
		yearly: 'price_plus_yearly',
	},
	FAMILY: {
		monthly: 'price_family_monthly',
		yearly: 'price_family_yearly',
	},
};

export const getAnnualDiscount = (plan: SubscriptionPlan): number => {
	if (plan === 'FREE') return 0;
	const monthlyPrice = PLAN_PRICES[plan].monthly * 12;
	const yearlyPrice = PLAN_PRICES[plan].yearly;
	return Math.round(((monthlyPrice - yearlyPrice) / monthlyPrice) * 100);
};

export const canUpgradeTo = (
	currentPlan: SubscriptionPlan,
	targetPlan: SubscriptionPlan
): boolean => {
	return PLAN_HIERARCHY[targetPlan] > PLAN_HIERARCHY[currentPlan];
};

export const canDowngradeTo = (
	currentPlan: SubscriptionPlan,
	targetPlan: SubscriptionPlan
): boolean => {
	return PLAN_HIERARCHY[targetPlan] < PLAN_HIERARCHY[currentPlan];
};
