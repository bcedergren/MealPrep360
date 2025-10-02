'use client';

import React from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Paper,
	Grid,
	Chip,
	CircularProgress,
	Switch,
	FormControlLabel,
} from '@mui/material';
import { Star, CheckCircle, Person, TrendingUp } from '@mui/icons-material';
import { useSubscription } from '@/hooks/use-subscription';
import {
	SubscriptionPlan,
	PLAN_FEATURES,
	PLAN_HIERARCHY,
	PLAN_PRICES,
	BillingInterval,
	getAnnualDiscount,
} from '@/types/subscription';

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

	const getPlanIcon = (plan: SubscriptionPlan) => {
		switch (plan) {
			case 'FREE':
				return <Person />;
			case 'STARTER':
				return <TrendingUp />;
			case 'PLUS':
				return <Star />;
			case 'FAMILY':
				return <CheckCircle />;
			default:
				return <Person />;
		}
	};

	const handlePlanChange = async (plan: SubscriptionPlan) => {
		setProcessingPlan(plan);
		try {
			await upgradePlan(plan, billingInterval);
			onClose();
		} catch (error) {
			console.error('Error changing plan:', error);
		} finally {
			setProcessingPlan(null);
		}
	};

	const handleBillingIntervalChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setBillingInterval(event.target.checked ? 'yearly' : 'monthly');
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
				<Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, mt: 2 }}>
					<FormControlLabel
						control={
							<Switch
								checked={billingInterval === 'yearly'}
								onChange={handleBillingIntervalChange}
								color='primary'
							/>
						}
						label={
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Typography>Bill Yearly</Typography>
								<Chip
									label={`Save ${getAnnualDiscount('PLUS')}%`}
									color='success'
									size='small'
									sx={{ height: 20 }}
								/>
							</Box>
						}
					/>
				</Box>
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
							<Paper
								elevation={3}
								sx={{
									p: 3,
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									position: 'relative',
									border: plan === currentPlan ? 2 : 0,
									borderColor: 'primary.main',
								}}
							>
								{plan === currentPlan && (
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
									{getPlanIcon(plan)}
									<Typography
										variant='h6'
										sx={{ ml: 1 }}
									>
										{plan}
									</Typography>
								</Box>
								{plan !== 'FREE' && (
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
								)}
								{billingInterval === 'yearly' && plan !== 'FREE' && (
									<Typography
										variant='body2'
										sx={{ mb: 2, color: 'success.main' }}
									>
										${(PLAN_PRICES[plan].yearly / 12).toFixed(2)}/mo when billed
										yearly
									</Typography>
								)}
								<Box sx={{ flexGrow: 1 }}>
									{(() => {
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
											// For FREE plan, just show all features
											return features.map(([feature, value]) => (
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
											));
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
									})()}
								</Box>
								<Button
									variant={plan === currentPlan ? 'outlined' : 'contained'}
									color='primary'
									fullWidth
									disabled={plan === currentPlan || processingPlan !== null}
									onClick={() => handlePlanChange(plan)}
									sx={{ mt: 2 }}
								>
									{processingPlan === plan ? (
										<CircularProgress size={24} />
									) : plan === currentPlan ? (
										'Current Plan'
									) : PLAN_HIERARCHY[plan] > PLAN_HIERARCHY[currentPlan] ? (
										'Upgrade'
									) : (
										'Downgrade'
									)}
								</Button>
							</Paper>
						</Grid>
					))}
				</Grid>
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
