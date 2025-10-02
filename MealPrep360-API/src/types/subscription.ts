export type SubscriptionPlan =
	| 'FREE'
	| 'STARTER'
	| 'PLUS'
	| 'FAMILY'
	| 'PROFESSIONAL';
export type BillingInterval = 'monthly' | 'yearly';

export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
	FREE: 'Free',
	STARTER: 'Starter',
	PLUS: 'Plus',
	FAMILY: 'Family',
	PROFESSIONAL: 'Professional',
};

export const PLAN_PRICES: Record<
	SubscriptionPlan,
	{ monthly: number; yearly: number }
> = {
	FREE: { monthly: 0, yearly: 0 },
	STARTER: { monthly: 9.99, yearly: 99.9 }, // ~17% discount (2 months free)
	PLUS: { monthly: 14.99, yearly: 149.9 }, // ~17% discount (2 months free)
	FAMILY: { monthly: 24.99, yearly: 249.9 }, // ~17% discount (2 months free)
	PROFESSIONAL: { monthly: 49.99, yearly: 499.9 }, // ~17% discount (2 months free)
};

export const STRIPE_PRICE_IDS: Record<
	SubscriptionPlan,
	{ monthly: string; yearly: string }
> = {
	FREE: { monthly: '', yearly: '' },
	STARTER: {
		monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || '',
		yearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID || '',
	},
	PLUS: {
		monthly: process.env.NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID || '',
		yearly: process.env.NEXT_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID || '',
	},
	FAMILY: {
		monthly: process.env.NEXT_PUBLIC_STRIPE_FAMILY_MONTHLY_PRICE_ID || '',
		yearly: process.env.NEXT_PUBLIC_STRIPE_FAMILY_YEARLY_PRICE_ID || '',
	},
	PROFESSIONAL: {
		monthly: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '',
		yearly: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || '',
	},
};

export const PLAN_FEATURES: Record<
	SubscriptionPlan,
	Record<string, string | number | boolean>
> = {
	FREE: {
		'Recommended Recipes': 'Browse Only',
		'Saved Recipes': 5,
		'Meal Plans': '1 Week',
		'Shopping Lists': 'Basic',
		'AI Generated Recipes': 0,
		'Recipe Images': 0,
		'Freezer Inventory': false,
		'Calendar Integration': false,
		'Social Features': false,
		Support: 'Email',
	},
	STARTER: {
		'Recommended Recipes': 'Unlimited',
		'Saved Recipes': 'Unlimited',
		'Meal Plans': '2 Weeks',
		'Shopping Lists': 'Basic',
		'AI Generated Recipes': 3,
		'Recipe Images': 5,
		'Freezer Inventory': '10 Items',
		'Calendar Integration': false,
		'Social Features': false,
		Support: 'Email',
	},
	PLUS: {
		'Recommended Recipes': 'Unlimited',
		'Saved Recipes': 'Unlimited',
		'Meal Plans': '4 Weeks',
		'Shopping Lists': 'Advanced',
		'AI Generated Recipes': 15,
		'Recipe Images': 20,
		'Freezer Inventory': 'Unlimited',
		'Calendar Integration': true,
		'Social Features': true,
		'Bulk Recipe Import': true,
		Support: 'Priority Email',
	},
	FAMILY: {
		'Recommended Recipes': 'Unlimited',
		'Saved Recipes': 'Unlimited',
		'Meal Plans': 'Unlimited',
		'Shopping Lists': 'Advanced',
		'AI Generated Recipes': 'Unlimited',
		'Recipe Images': 'Unlimited',
		'AI Blog Generation': true,
		'Freezer Inventory': 'Unlimited',
		'Calendar Integration': true,
		'Social Features': true,
		'Family Sharing': '6 Accounts',
		'Nutrition Analytics': true,
		Support: 'Phone & Email',
	},
	PROFESSIONAL: {
		'Recommended Recipes': 'Unlimited',
		'Saved Recipes': 'Unlimited',
		'Meal Plans': 'Unlimited',
		'Shopping Lists': 'Advanced',
		'AI Generated Recipes': 'Unlimited',
		'Recipe Images': 'Unlimited',
		'AI Blog Generation': true,
		'Freezer Inventory': 'Unlimited',
		'Calendar Integration': true,
		'Social Features': true,
		'Family Sharing': 'Unlimited',
		'White Label Tools': true,
		'API Access': true,
		'Custom Branding': true,
		'Analytics & Reporting': true,
		Support: 'Dedicated Manager',
	},
};

export interface Subscription {
	plan: SubscriptionPlan;
	billingInterval: BillingInterval;
	status:
		| 'ACTIVE'
		| 'PAST_DUE'
		| 'CANCELED'
		| 'UNPAID'
		| 'INCOMPLETE'
		| 'INCOMPLETE_EXPIRED'
		| 'TRIALING'
		| 'INACTIVE';
	currentPeriodEnd?: Date;
	stripeCustomerId?: string;
	stripeSubscriptionId?: string;
}

export const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
	FREE: 0,
	STARTER: 1,
	PLUS: 2,
	FAMILY: 3,
	PROFESSIONAL: 4,
};

export function canUpgradeTo(
	currentPlan: SubscriptionPlan,
	targetPlan: SubscriptionPlan
): boolean {
	return PLAN_HIERARCHY[targetPlan] > PLAN_HIERARCHY[currentPlan];
}

export function canDowngradeTo(
	currentPlan: SubscriptionPlan,
	targetPlan: SubscriptionPlan
): boolean {
	return PLAN_HIERARCHY[targetPlan] < PLAN_HIERARCHY[currentPlan];
}

export function getAnnualDiscount(plan: SubscriptionPlan): number {
	if (plan === 'FREE') return 0;
	const monthly = PLAN_PRICES[plan].monthly * 12;
	const yearly = PLAN_PRICES[plan].yearly;
	return Math.round(((monthly - yearly) / monthly) * 100);
}

export function getPriceDisplay(
	plan: SubscriptionPlan,
	interval: BillingInterval
): string {
	if (plan === 'FREE') return 'Free';

	const price = PLAN_PRICES[plan][interval];
	if (interval === 'yearly') {
		const monthlyEquivalent = price / 12;
		return `$${monthlyEquivalent.toFixed(2)}/mo (billed yearly)`;
	}
	return `$${price}/mo`;
}
