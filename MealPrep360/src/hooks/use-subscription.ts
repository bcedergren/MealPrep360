'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSnackbar } from '@/app/components/ui/snackbar';

// Updated interface to match the API documentation
interface SubscriptionResponse {
	plan: 'FREE' | 'STARTER' | 'PLUS' | 'FAMILY' | 'PROFESSIONAL';
	features?: Record<string, any>;
}

interface FullSubscription {
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
	plan: 'FREE' | 'STARTER' | 'PLUS' | 'FAMILY' | 'PROFESSIONAL';
	features?: Record<string, any>;
}

export function useSubscription() {
	const { userId, getToken, isLoaded } = useAuth();
	const { showSnackbar } = useSnackbar();
	const [currentPlan, setCurrentPlan] = useState<FullSubscription | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isLoaded && userId) {
			fetchSubscription();
		} else if (isLoaded && !userId) {
			setIsLoading(false);
		}
	}, [isLoaded, userId]);

	const fetchSubscription = async () => {
		try {
			setError(null);
			const token = await getToken();

			const response = await fetch('/api/subscription', {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data: SubscriptionResponse = await response.json();
				// Transform the API response to match our expected structure
				const subscription: FullSubscription = {
					plan: data.plan,
					features: data.features,
					status: 'active', // Default status since API doesn't provide it in the simple response
				};
				setCurrentPlan(subscription);
			} else if (response.status === 401) {
				setError('Unauthorized - please sign in again');
			} else if (response.status === 404) {
				// User not found, default to FREE plan
				setCurrentPlan({
					plan: 'FREE',
					status: 'active',
				});
			} else {
				const errorData = await response
					.json()
					.catch(() => ({ error: 'Unknown error' }));
				setError(errorData.error || 'Failed to fetch subscription');
			}
		} catch (error) {
			console.error('Error fetching subscription:', error);
			setError('Network error - please check your connection');
			// Fallback to FREE plan on error
			setCurrentPlan({
				plan: 'FREE',
				status: 'active',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const upgradePlan = async (
		plan: string,
		billingInterval: 'monthly' | 'yearly' = 'monthly'
	) => {
		try {
			const token = await getToken();

			const response = await fetch('/api/subscription/checkout', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					plan,
					billingInterval,
					action: 'upgrade',
				}),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.url) {
					// Redirect to Stripe checkout
					window.location.href = data.url;
				} else {
					// Refresh subscription data
					await fetchSubscription();
					showSnackbar('Plan upgraded successfully', 'success');
				}
			} else {
				const errorData = await response
					.json()
					.catch(() => ({ error: 'Unknown error' }));
				showSnackbar(errorData.error || 'Failed to upgrade plan', 'error');
			}
		} catch (error) {
			console.error('Error upgrading plan:', error);
			showSnackbar('Failed to upgrade plan - please try again', 'error');
		}
	};

	const cancelSubscription = async (
		reason?: string,
		feedback?: string,
		immediateCancel = false
	) => {
		try {
			const token = await getToken();

			const response = await fetch('/api/subscription/cancel', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					reason,
					feedback,
					retentionOffer: 'none',
					immediateCancel,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				await fetchSubscription(); // Refresh subscription data
				showSnackbar(
					data.message || 'Your subscription has been canceled',
					'success'
				);
				return data;
			} else {
				const errorData = await response
					.json()
					.catch(() => ({ error: 'Unknown error' }));
				showSnackbar(
					errorData.error || 'Failed to cancel subscription',
					'error'
				);
				throw new Error(errorData.error || 'Failed to cancel subscription');
			}
		} catch (error) {
			console.error('Error canceling subscription:', error);
			showSnackbar('Failed to cancel subscription - please try again', 'error');
			throw error;
		}
	};

	const refreshSubscription = () => {
		if (userId) {
			fetchSubscription();
		}
	};

	const adminSwitchPlan = async (plan: string) => {
		try {
			const token = await getToken();

			const response = await fetch('/api/subscription/admin', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ plan }),
			});

			if (response.ok) {
				const data = await response.json();
				await fetchSubscription(); // Refresh subscription data
				showSnackbar(data.message, 'success');
				return data;
			} else {
				const errorData = await response
					.json()
					.catch(() => ({ error: 'Unknown error' }));
				showSnackbar(errorData.error || 'Failed to switch plan', 'error');
				throw new Error(errorData.error || 'Failed to switch plan');
			}
		} catch (error) {
			console.error('Error switching admin plan:', error);
			showSnackbar('Failed to switch plan - please try again', 'error');
			throw error;
		}
	};

	return {
		currentPlan,
		isLoading,
		error,
		upgradePlan,
		cancelSubscription,
		refreshSubscription,
		adminSwitchPlan,
	};
}
