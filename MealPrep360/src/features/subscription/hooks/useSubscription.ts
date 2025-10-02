'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSnackbar } from '@/app/components/ui/snackbar';
import { subscriptionService } from '../services/subscription.service';
import type { Subscription, SubscriptionPlan } from '@/types/subscription';

export function useSubscription() {
	const { userId, getToken, isLoaded } = useAuth();
	const { showSnackbar } = useSnackbar();
	const [currentPlan, setCurrentPlan] = useState<Subscription | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSubscription = async () => {
		try {
			setError(null);
			const token = await getToken();
			if (!token) throw new Error('No authentication token available');

			const subscription = await subscriptionService.fetchSubscription(token);
			setCurrentPlan(subscription);
		} catch (error) {
			const errorMessage = (error as Error).message;
			setError(errorMessage);
			showSnackbar(errorMessage, 'error');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (isLoaded && userId) {
			fetchSubscription();
		} else if (isLoaded && !userId) {
			setIsLoading(false);
		}
	}, [isLoaded, userId]);

	const upgradePlan = async (
		plan: SubscriptionPlan,
		billingInterval: 'monthly' | 'yearly' = 'monthly'
	) => {
		try {
			const token = await getToken();
			if (!token) throw new Error('No authentication token available');

			const result = await subscriptionService.upgradePlan(
				token,
				plan,
				billingInterval
			);

			if (result.url) {
				window.location.href = result.url;
			} else {
				await fetchSubscription();
				showSnackbar('Successfully changed subscription plan', 'success');
			}
		} catch (error) {
			const errorMessage = (error as Error).message;
			showSnackbar(errorMessage, 'error');
			throw error;
		}
	};

	const cancelSubscription = async (
		reason?: string,
		feedback?: string,
		immediateCancel = false
	) => {
		try {
			const token = await getToken();
			if (!token) throw new Error('No authentication token available');

			await subscriptionService.cancelSubscription(token, {
				reason,
				feedback,
				immediateCancel,
			});

			await fetchSubscription();
			showSnackbar('Your subscription has been canceled', 'success');
		} catch (error) {
			const errorMessage = (error as Error).message;
			showSnackbar(errorMessage, 'error');
			throw error;
		}
	};

	const adminSwitchPlan = async (plan: SubscriptionPlan) => {
		try {
			const token = await getToken();
			if (!token) throw new Error('No authentication token available');

			await subscriptionService.adminSwitchPlan(token, plan);
			await fetchSubscription();
			showSnackbar('Plan switched successfully', 'success');
		} catch (error) {
			const errorMessage = (error as Error).message;
			showSnackbar(errorMessage, 'error');
			throw error;
		}
	};

	return {
		currentPlan,
		isLoading,
		error,
		upgradePlan,
		cancelSubscription,
		refreshSubscription: fetchSubscription,
		adminSwitchPlan,
	};
}
