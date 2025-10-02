'use client';

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';
import { SubscriptionPlan, PLAN_FEATURES } from '@/types/subscription';

interface SubscriptionContextType {
	currentPlan: SubscriptionPlan;
	features: (typeof PLAN_FEATURES)[SubscriptionPlan];
	isLoading: boolean;
	canAccessFeature: (
		feature: keyof (typeof PLAN_FEATURES)[SubscriptionPlan]
	) => boolean;
	getFeatureLimit: (
		feature: keyof (typeof PLAN_FEATURES)[SubscriptionPlan]
	) => number;
	upgradePlan: (plan: SubscriptionPlan) => void;
	getMealPlanDurationLimit: () => number;
	refreshSubscription: () => void;
	adminSwitchPlan: (plan: SubscriptionPlan) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
	undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
	const { user } = useUser();
	const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('FREE');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchSubscription = async () => {
			try {
				if (!user) {
					setCurrentPlan('FREE');
					setIsLoading(false);
					return;
				}

				const response = await fetch('/api/subscription');

				if (!response.ok) {
					throw new Error(`Failed to fetch subscription: ${response.status}`);
				}

				const data = await response.json();

				setCurrentPlan(data.plan || 'FREE');
			} catch (error) {
				console.error('[NEW SUBSCRIPTION] Error:', error);
				setCurrentPlan('FREE');
			} finally {
				setIsLoading(false);
			}
		};
		fetchSubscription();
	}, [user]);

	const canAccessFeature = (
		feature: keyof (typeof PLAN_FEATURES)[SubscriptionPlan]
	) => {
		const featureValue = PLAN_FEATURES[currentPlan][feature];
		if (typeof featureValue === 'boolean') return featureValue;
		if (typeof featureValue === 'number') return featureValue > 0;
		return false;
	};

	const getFeatureLimit = (
		feature: keyof (typeof PLAN_FEATURES)[SubscriptionPlan]
	) => {
		const featureValue = PLAN_FEATURES[currentPlan][feature];
		if (typeof featureValue === 'number') return featureValue;
		return 0;
	};

	const getMealPlanDurationLimit = () => {
		const feature = PLAN_FEATURES[currentPlan]['Meal Plans'];

		if (feature === 'Unlimited') return -1; // -1 means unlimited
		if (typeof feature === 'string') {
			// Extract number from strings like "1 Week", "2 Weeks", "4 Weeks"
			const match = feature.match(/(\d+)\s*Week/i);
			if (match) {
				const days = parseInt(match[1]) * 7; // Convert weeks to days
				return days;
			}
			return 0;
		}
		if (typeof feature === 'number') return feature;
		return 0; // Default to 0 if no access
	};

	const upgradePlan = async (plan: SubscriptionPlan) => {
		try {
			const response = await fetch('/api/subscription/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					plan,
					billingInterval: 'monthly',
					action: 'upgrade',
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create checkout session');
			}

			const { url } = await response.json();
			if (url) {
				window.location.href = url;
			}
		} catch (error) {
			console.error('Error upgrading plan:', error);
			toast.error('Failed to upgrade plan. Please try again.');
		}
	};

	const refreshSubscription = () => {
		if (user) {
			const fetchSubscription = async () => {
				try {
					const response = await fetch('/api/subscription');
					if (response.ok) {
						const data = await response.json();
						setCurrentPlan(data.plan || 'FREE');
					}
				} catch (error) {
					console.error('Error refreshing subscription:', error);
				}
			};
			fetchSubscription();
		}
	};

	const adminSwitchPlan = async (plan: SubscriptionPlan) => {
		try {
			const response = await fetch('/api/subscription/admin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ plan }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to switch plan');
			}

			const data = await response.json();
			// Refresh the subscription data
			refreshSubscription();
			toast.success(data.message || 'Plan switched successfully');
		} catch (error) {
			console.error('Error switching admin plan:', error);
			toast.error('Failed to switch plan. Please try again.');
			throw error;
		}
	};

	return (
		<SubscriptionContext.Provider
			value={{
				currentPlan,
				features: PLAN_FEATURES[currentPlan],
				isLoading,
				canAccessFeature,
				getFeatureLimit,
				upgradePlan,
				getMealPlanDurationLimit,
				refreshSubscription,
				adminSwitchPlan,
			}}
		>
			{children}
		</SubscriptionContext.Provider>
	);
}

export function useSubscription() {
	const context = useContext(SubscriptionContext);
	if (context === undefined) {
		throw new Error(
			'useSubscription must be used within a SubscriptionProvider'
		);
	}
	return context;
}
