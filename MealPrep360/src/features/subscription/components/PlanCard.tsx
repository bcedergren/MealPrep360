'use client';

import React from 'react';
import {
	Typography,
	Paper,
	Box,
	Chip,
	Button,
	CircularProgress,
} from '@mui/material';
import { PlanIcon } from './PlanIcon';
import { PlanFeatures } from './PlanFeatures';
import {
	SubscriptionPlan,
	PLAN_HIERARCHY,
	PLAN_PRICES,
	BillingInterval,
} from '@/types/subscription';

interface PlanCardProps {
	plan: SubscriptionPlan;
	currentPlan: SubscriptionPlan;
	billingInterval: BillingInterval;
	availablePlans: readonly SubscriptionPlan[];
	processingPlan: SubscriptionPlan | null;
	onPlanChange: (plan: SubscriptionPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
	plan,
	currentPlan,
	billingInterval,
	availablePlans,
	processingPlan,
	onPlanChange,
}) => {
	const isCurrentPlan = plan === currentPlan;
	const isProcessing = processingPlan === plan;
	const isUpgrade = PLAN_HIERARCHY[plan] > PLAN_HIERARCHY[currentPlan];

	const getButtonText = () => {
		if (isProcessing) return <CircularProgress size={24} />;
		if (isCurrentPlan) return 'Current Plan';
		return isUpgrade ? 'Upgrade' : 'Downgrade';
	};

	const getMonthlyPrice = (yearlyPrice: number) => {
		return (yearlyPrice / 12).toFixed(2);
	};

	return (
		<Paper
			elevation={3}
			sx={{
				p: 3,
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				position: 'relative',
				border: isCurrentPlan ? 2 : 0,
				borderColor: 'primary.main',
			}}
		>
			{isCurrentPlan && (
				<Chip
					label='Current Plan'
					color='primary'
					size='small'
					sx={{
						position: 'absolute',
						top: 10,
						right: 10,
					}}
				/>
			)}
			<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
				<PlanIcon plan={plan} />
				<Typography
					variant='h6'
					sx={{ ml: 1 }}
				>
					{plan}
				</Typography>
			</Box>

			{plan !== 'FREE' && (
				<>
					<Typography
						variant='h4'
						sx={{
							mb: 2,
							fontWeight: 'bold',
							color: 'primary.main',
							display: 'flex',
							alignItems: 'baseline',
							gap: 0.5,
						}}
					>
						${PLAN_PRICES[plan][billingInterval]}
						<Typography
							component='span'
							variant='body2'
							sx={{ color: 'text.secondary' }}
						>
							/{billingInterval === 'yearly' ? 'year' : 'mo'}
						</Typography>
					</Typography>

					{billingInterval === 'yearly' && (
						<Typography
							variant='body2'
							sx={{ mb: 2, color: 'success.main' }}
						>
							${getMonthlyPrice(PLAN_PRICES[plan].yearly)}/mo when billed yearly
						</Typography>
					)}
				</>
			)}

			<Box sx={{ flexGrow: 1 }}>
				<PlanFeatures
					plan={plan}
					availablePlans={availablePlans}
				/>
			</Box>

			<Button
				variant={isCurrentPlan ? 'outlined' : 'contained'}
				color='primary'
				fullWidth
				disabled={isCurrentPlan || processingPlan !== null}
				onClick={() => onPlanChange(plan)}
				sx={{ mt: 2 }}
			>
				{getButtonText()}
			</Button>
		</Paper>
	);
};
