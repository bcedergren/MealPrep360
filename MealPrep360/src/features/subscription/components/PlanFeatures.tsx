'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { SubscriptionPlan, PLAN_FEATURES } from '@/types/subscription';

interface PlanFeaturesProps {
	plan: SubscriptionPlan;
	availablePlans: readonly SubscriptionPlan[];
}

export const PlanFeatures: React.FC<PlanFeaturesProps> = ({
	plan,
	availablePlans,
}) => {
	// Get all valid features for this plan
	const features = Object.entries(PLAN_FEATURES[plan]).filter(
		([feature, value]) =>
			value !== 0 &&
			value !== '0' &&
			value !== false &&
			!(feature === 'AI Blog Generation' && value === true) &&
			feature !== 'Recipe Images' &&
			!(
				plan === 'STARTER' &&
				feature === 'Recommended Recipes' &&
				value === 'Unlimited'
			)
	);

	if (plan === 'FREE') {
		return (
			<>
				{features.map(([feature, value]) => (
					<Typography
						key={feature}
						variant='body2'
						sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
					>
						<CheckCircle
							fontSize='small'
							sx={{ mr: 1, color: 'success.main' }}
						/>
						{typeof value === 'number'
							? `${value} `
							: typeof value === 'boolean'
								? ''
								: value === 'Browse Only'
									? ''
									: `${value} `}
						{feature.replace(/: $/, '')}
					</Typography>
				))}
			</>
		);
	}

	// For other plans, find the most recent previous plan
	const previousPlan = availablePlans
		.slice(0, availablePlans.indexOf(plan))
		.reverse()[0];

	// Separate features into shared and new/different
	const { shared, different } = features.reduce<{
		shared: [string, string | number | boolean][];
		different: [string, string | number | boolean][];
	}>(
		(acc, [feature, value]) => {
			const prevValue = PLAN_FEATURES[previousPlan][feature];
			if (
				prevValue !== undefined &&
				prevValue !== 0 &&
				prevValue !== '0' &&
				prevValue !== false &&
				prevValue.toString() === value.toString()
			) {
				acc.shared.push([feature, value]);
			} else {
				acc.different.push([feature, value]);
			}
			return acc;
		},
		{ shared: [], different: [] }
	);

	return (
		<>
			{shared.length > 0 && (
				<Typography
					variant='body2'
					sx={{
						mb: 2,
						display: 'flex',
						alignItems: 'center',
						color: 'text.secondary',
					}}
				>
					<CheckCircle
						fontSize='small'
						sx={{
							mr: 1,
							color: 'success.main',
							opacity: 0.7,
						}}
					/>
					Includes all {previousPlan} features
				</Typography>
			)}
			{different.map(([feature, value]) => (
				<Typography
					key={feature}
					variant='body2'
					sx={{
						mb: 1,
						display: 'flex',
						alignItems: 'center',
					}}
				>
					<CheckCircle
						fontSize='small'
						sx={{ mr: 1, color: 'success.main' }}
					/>
					{typeof value === 'number'
						? `${value} `
						: typeof value === 'boolean'
							? ''
							: value === 'Browse Only'
								? ''
								: `${value} `}
					{feature.replace(/: $/, '')}
				</Typography>
			))}
		</>
	);
};
