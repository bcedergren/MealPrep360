'use client';

import React from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Grid,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { useSubscription } from '../hooks/useSubscription';
import { BillingToggle } from './BillingToggle';
import { PlanCard } from './PlanCard';
import { SubscriptionErrorBoundary } from './SubscriptionErrorBoundary';
import { SubscriptionPlan, BillingInterval } from '@/types/subscription';
import { useSnackbar } from '@/app/components/ui/snackbar';

interface SubscriptionChangeModalProps {
	open: boolean;
	onClose: () => void;
	currentPlan: SubscriptionPlan;
}

export function SubscriptionChangeModal({
	open,
	onClose,
	currentPlan,
}: SubscriptionChangeModalProps) {
	const { upgradePlan } = useSubscription();
	const { showSnackbar } = useSnackbar();
	const [processingPlan, setProcessingPlan] =
		React.useState<SubscriptionPlan | null>(null);
	const [billingInterval, setBillingInterval] =
		React.useState<BillingInterval>('monthly');

	const availablePlans: SubscriptionPlan[] = [
		'FREE',
		'STARTER',
		'PLUS',
		'FAMILY',
	];

	const handlePlanChange = async (plan: SubscriptionPlan) => {
		setProcessingPlan(plan);
		try {
			await upgradePlan(plan, billingInterval);
			showSnackbar('Successfully changed subscription plan', 'success');
			onClose();
		} catch (error) {
			console.error('Error changing plan:', error);
			showSnackbar(
				(error as Error)?.message || 'Failed to change subscription plan',
				'error'
			);
		} finally {
			setProcessingPlan(null);
		}
	};

	const handleBillingIntervalChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setBillingInterval(event.target.checked ? 'yearly' : 'monthly');
	};

	const handleRetry = () => {
		setProcessingPlan(null);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth='lg'
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					overflow: 'hidden',
				},
			}}
		>
			<DialogTitle
				sx={{
					background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
					color: 'white',
					display: 'flex',
					alignItems: 'center',
					gap: 1,
				}}
			>
				<Star sx={{ fontSize: 24 }} />
				Change Subscription Plan
			</DialogTitle>
			<DialogContent>
				<SubscriptionErrorBoundary onRetry={handleRetry}>
					<BillingToggle
						billingInterval={billingInterval}
						onChange={handleBillingIntervalChange}
					/>
					<Grid
						container
						spacing={3}
						sx={{ mt: 1 }}
					>
						{availablePlans.map((plan) => (
							<Grid
								item
								xs={12}
								sm={6}
								md={3}
								key={plan}
							>
								<PlanCard
									plan={plan}
									currentPlan={currentPlan}
									billingInterval={billingInterval}
									availablePlans={availablePlans}
									processingPlan={processingPlan}
									onPlanChange={handlePlanChange}
								/>
							</Grid>
						))}
					</Grid>
				</SubscriptionErrorBoundary>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={onClose}
					color='primary'
				>
					Close
				</Button>
			</DialogActions>
		</Dialog>
	);
}
