'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import {
	Box,
	Container,
	Grid,
	Paper,
	Typography,
	Button,
	IconButton,
	Collapse,
	Chip,
	Switch,
} from '@mui/material';
import {
	CheckCircle,
	ArrowBack,
	ArrowForward,
	ExpandMore,
	ExpandLess,
} from '@mui/icons-material';
import {
	PLAN_FEATURES,
	PLAN_NAMES,
	PLAN_PRICES,
	SubscriptionPlan,
} from '@/types/subscription';
import { useSubscription } from '@/contexts/subscription-context';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
	const { currentPlan, upgradePlan } = useSubscription();
	const { isSignedIn } = useUser();
	const router = useRouter();
	const scrollContainerRef = React.useRef<HTMLDivElement>(null);
	const [expandedFeatures, setExpandedFeatures] = React.useState<
		Record<string, boolean>
	>({});
	const [isAnnual, setIsAnnual] = React.useState(false);

	const handleUpgrade = (plan: SubscriptionPlan) => {
		if (plan === 'FREE') return;

		if (!isSignedIn) {
			router.push('/auth/sign-in?redirect_url=/pricing');
			return;
		}

		upgradePlan(plan);
	};

	const scrollPricingCards = (direction: 'left' | 'right') => {
		if (scrollContainerRef.current) {
			const scrollAmount = 320; // Width of one card plus gap
			const currentScroll = scrollContainerRef.current.scrollLeft;
			const targetScroll =
				direction === 'left'
					? currentScroll - scrollAmount
					: currentScroll + scrollAmount;

			scrollContainerRef.current.scrollTo({
				left: targetScroll,
				behavior: 'smooth',
			});
		}
	};

	const getPlanColor = (plan: SubscriptionPlan) => {
		switch (plan) {
			case 'FREE':
				return '#9E9E9E';
			case 'STARTER':
				return '#2196F3';
			case 'PLUS':
				return '#4CAF50';
			case 'FAMILY':
				return '#FF9800';
			default:
				return '#9E9E9E';
		}
	};

	const getPlanDescription = (plan: SubscriptionPlan) => {
		switch (plan) {
			case 'FREE':
				return 'Perfect for trying out MealPrep360';
			case 'STARTER':
				return 'Great for individuals getting started';
			case 'PLUS':
				return 'Best for active meal planners';
			case 'FAMILY':
				return 'Perfect for families and meal prep enthusiasts';
			default:
				return '';
		}
	};

	const toggleFeatures = (planName: string) => {
		setExpandedFeatures((prev) => ({
			...prev,
			[planName]: !prev[planName],
		}));
	};

	const getPreviousPlan = (
		currentPlan: SubscriptionPlan
	): SubscriptionPlan | null => {
		const plans: SubscriptionPlan[] = ['FREE', 'STARTER', 'PLUS', 'FAMILY'];
		const currentIndex = plans.indexOf(currentPlan);
		return currentIndex > 0 ? plans[currentIndex - 1] : null;
	};

	const areFeaturesIdentical = (
		currentPlan: SubscriptionPlan,
		previousPlan: SubscriptionPlan
	): boolean => {
		const currentFeatures = PLAN_FEATURES[currentPlan];
		const previousFeatures = PLAN_FEATURES[previousPlan];

		return JSON.stringify(currentFeatures) === JSON.stringify(previousFeatures);
	};

	const getTopFeatures = (
		features: Record<string, string | number | boolean>
	): Array<[string, string | number | boolean]> => {
		const entries = Object.entries(features);
		return entries.slice(0, 3); // Show first 3 features
	};

	return (
		<Box
			sx={{
				py: { xs: 6, md: 8 },
				px: { xs: 2, sm: 4, md: 6 },
				backgroundColor: '#1A1A1A',
				minHeight: '100vh',
			}}
		>
			<Container maxWidth='lg'>
				<Box sx={{ textAlign: 'center', mb: 8 }}>
					<Typography
						variant='h2'
						sx={{
							fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
							fontWeight: 700,
							textAlign: 'center',
							mb: { xs: 2, md: 3 },
							color: '#E0E0E0',
						}}
					>
						Choose Your Perfect Plan
					</Typography>
					<Typography
						variant='h5'
						sx={{
							color: '#A0A0A0',
							maxWidth: '600px',
							mx: 'auto',
							mb: 2,
						}}
					>
						From free meal planning to family-sized tools
					</Typography>
					<Typography
						variant='body1'
						sx={{
							color: '#B0B0B0',
							maxWidth: '500px',
							mx: 'auto',
							mb: 4,
						}}
					>
						Start free and upgrade anytime. All plans include our core meal
						planning features.
					</Typography>

					{/* Billing Toggle */}
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 2,
							mb: 2,
						}}
					>
						<Typography
							variant='body2'
							sx={{
								color: isAnnual ? '#B0B0B0' : '#E0E0E0',
								fontWeight: isAnnual ? 400 : 600,
							}}
						>
							Monthly
						</Typography>
						<Switch
							checked={isAnnual}
							onChange={(e) => setIsAnnual(e.target.checked)}
							sx={{
								'& .MuiSwitch-switchBase.Mui-checked': {
									color: '#4CAF50',
								},
								'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
									backgroundColor: '#4CAF50',
								},
							}}
						/>
						<Typography
							variant='body2'
							sx={{
								color: isAnnual ? '#E0E0E0' : '#B0B0B0',
								fontWeight: isAnnual ? 600 : 400,
							}}
						>
							Annual
						</Typography>
						<Chip
							label='Save 20%'
							size='small'
							sx={{
								backgroundColor: '#4CAF50',
								color: 'white',
								fontWeight: 600,
							}}
						/>
					</Box>
				</Box>

				{/* Mobile Navigation */}
				<Box
					sx={{
						display: { xs: 'flex', md: 'none' },
						justifyContent: 'center',
						alignItems: 'center',
						gap: 2,
						mb: 4,
					}}
				>
					<IconButton
						onClick={() => scrollPricingCards('left')}
						sx={{
							backgroundColor: '#2A2A2A',
							color: '#E0E0E0',
							'&:hover': { backgroundColor: '#3A3A3A' },
						}}
					>
						<ArrowBack />
					</IconButton>
					<Typography
						variant='body2'
						sx={{ color: '#B0B0B0' }}
					>
						Swipe to see all plans
					</Typography>
					<IconButton
						onClick={() => scrollPricingCards('right')}
						sx={{
							backgroundColor: '#2A2A2A',
							color: '#E0E0E0',
							'&:hover': { backgroundColor: '#3A3A3A' },
						}}
					>
						<ArrowForward />
					</IconButton>
				</Box>

				{/* Pricing Cards */}
				<Box
					ref={scrollContainerRef}
					sx={{
						display: 'flex',
						gap: 3,
						overflowX: { xs: 'auto', md: 'visible' },
						scrollSnapType: 'x mandatory',
						pb: 2,
						'&::-webkit-scrollbar': {
							display: 'none',
						},
						scrollbarWidth: 'none',
					}}
				>
					{(Object.keys(PLAN_NAMES) as SubscriptionPlan[]).map((plan) => {
						const planName = PLAN_NAMES[plan];
						const planColor = getPlanColor(plan);
						const planDescription = getPlanDescription(plan);
						const features = PLAN_FEATURES[plan];
						const topFeatures = getTopFeatures(features);
						const isExpanded = expandedFeatures[planName];
						const isCurrentPlan = currentPlan === plan;
						const previousPlan = getPreviousPlan(plan);
						const featuresIdentical =
							previousPlan && areFeaturesIdentical(plan, previousPlan);

						return (
							<Paper
								key={plan}
								elevation={isCurrentPlan ? 8 : 2}
								sx={{
									minWidth: { xs: '280px', md: '300px' },
									maxWidth: { xs: '280px', md: '300px' },
									p: 3,
									backgroundColor: isCurrentPlan ? '#2A2A2A' : '#1E1E1E',
									border: isCurrentPlan
										? `2px solid ${planColor}`
										: '1px solid #333',
									borderRadius: 2,
									scrollSnapAlign: 'start',
									position: 'relative',
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-4px)',
										boxShadow: `0 8px 32px ${planColor}40`,
									},
								}}
							>
								{isCurrentPlan && (
									<Chip
										label='Current Plan'
										size='small'
										sx={{
											position: 'absolute',
											top: -10,
											right: 16,
											backgroundColor: planColor,
											color: 'white',
											fontWeight: 600,
										}}
									/>
								)}

								<Box sx={{ textAlign: 'center', mb: 3 }}>
									<Typography
										variant='h5'
										sx={{
											color: planColor,
											fontWeight: 700,
											mb: 1,
										}}
									>
										{planName}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: '#B0B0B0',
											mb: 2,
											minHeight: '40px',
										}}
									>
										{planDescription}
									</Typography>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'baseline',
											justifyContent: 'center',
											gap: 1,
										}}
									>
										{plan !== 'FREE' && (
											<>
												<Typography
													variant='h3'
													sx={{
														color: '#E0E0E0',
														fontWeight: 700,
													}}
												>
													$
													{isAnnual
														? PLAN_PRICES[plan].yearly
														: PLAN_PRICES[plan].monthly}
												</Typography>
												<Typography
													variant='body2'
													sx={{ color: '#B0B0B0' }}
												>
													/{isAnnual ? 'year' : 'month'}
												</Typography>
											</>
										)}
									</Box>
									{isAnnual && plan !== 'FREE' && (
										<Typography
											variant='body2'
											sx={{
												color: '#4CAF50',
												fontWeight: 600,
												mt: 1,
											}}
										>
											Save $
											{PLAN_PRICES[plan].monthly * 12 -
												PLAN_PRICES[plan].yearly}{' '}
											annually
										</Typography>
									)}
								</Box>

								<Box sx={{ mb: 3 }}>
									<Typography
										variant='subtitle2'
										sx={{
											color: '#E0E0E0',
											fontWeight: 600,
											mb: 2,
										}}
									>
										Top Features:
									</Typography>
									{topFeatures.map(([key, value]) => (
										<Box
											key={key}
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1,
												mb: 1,
											}}
										>
											<CheckCircle
												sx={{
													color: planColor,
													fontSize: 16,
												}}
											/>
											<Typography
												variant='body2'
												sx={{ color: '#B0B0B0' }}
											>
												{key
													.replace(/([A-Z])/g, ' $1')
													.replace(/^./, (str) => str.toUpperCase())}
												{typeof value === 'number' && value > 0 && `: ${value}`}
												{typeof value === 'boolean' && value && ''}
											</Typography>
										</Box>
									))}

									{Object.keys(features).length > 3 && (
										<Button
											onClick={() => toggleFeatures(planName)}
											sx={{
												color: planColor,
												textTransform: 'none',
												p: 0,
												mt: 1,
												minWidth: 'auto',
											}}
											endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
										>
											{isExpanded
												? 'Show Less'
												: `+${Object.keys(features).length - 3} More`}
										</Button>
									)}

									<Collapse in={isExpanded}>
										<Box sx={{ mt: 2 }}>
											{Object.entries(features)
												.slice(3)
												.map(([key, value]) => (
													<Box
														key={key}
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 1,
															mb: 1,
														}}
													>
														<CheckCircle
															sx={{
																color: planColor,
																fontSize: 16,
															}}
														/>
														<Typography
															variant='body2'
															sx={{ color: '#B0B0B0' }}
														>
															{key
																.replace(/([A-Z])/g, ' $1')
																.replace(/^./, (str) => str.toUpperCase())}
															{typeof value === 'number' &&
																value > 0 &&
																`: ${value}`}
															{typeof value === 'boolean' && value && ''}
														</Typography>
													</Box>
												))}
										</Box>
									</Collapse>
								</Box>

								<Button
									variant={isCurrentPlan ? 'outlined' : 'contained'}
									fullWidth
									disabled={isCurrentPlan}
									onClick={() => handleUpgrade(plan)}
									sx={{
										backgroundColor: isCurrentPlan ? 'transparent' : planColor,
										borderColor: planColor,
										color: isCurrentPlan ? planColor : 'white',
										fontWeight: 600,
										py: 1.5,
										'&:hover': {
											backgroundColor: isCurrentPlan
												? `${planColor}20`
												: `${planColor}CC`,
										},
										'&:disabled': {
											backgroundColor: 'transparent',
											borderColor: planColor,
											color: planColor,
										},
									}}
								>
									{isCurrentPlan
										? 'Current Plan'
										: plan === 'FREE'
											? 'Get Started Free'
											: `Upgrade to ${planName}`}
								</Button>

								{featuresIdentical && previousPlan && (
									<Typography
										variant='body2'
										sx={{
											color: '#FFA726',
											textAlign: 'center',
											mt: 2,
											fontStyle: 'italic',
										}}
									>
										Same features as {PLAN_NAMES[previousPlan]}
									</Typography>
								)}
							</Paper>
						);
					})}
				</Box>

				{/* Additional Information */}
				<Box
					sx={{
						mt: 8,
						textAlign: 'center',
					}}
				>
					<Typography
						variant='h4'
						sx={{
							color: '#E0E0E0',
							fontWeight: 700,
							mb: 4,
						}}
					>
						Frequently Asked Questions
					</Typography>
					<Grid
						container
						spacing={4}
						sx={{ maxWidth: '800px', mx: 'auto' }}
					>
						<Grid
							item
							xs={12}
							md={6}
						>
							<Paper
								sx={{
									p: 3,
									backgroundColor: '#1E1E1E',
									border: '1px solid #333',
								}}
							>
								<Typography
									variant='h6'
									sx={{
										color: '#E0E0E0',
										fontWeight: 600,
										mb: 2,
									}}
								>
									Can I change plans anytime?
								</Typography>
								<Typography
									variant='body2'
									sx={{ color: '#B0B0B0' }}
								>
									Yes! You can upgrade or downgrade your plan at any time.
									Changes take effect immediately, and we'll prorate any billing
									adjustments.
								</Typography>
							</Paper>
						</Grid>
						<Grid
							item
							xs={12}
							md={6}
						>
							<Paper
								sx={{
									p: 3,
									backgroundColor: '#1E1E1E',
									border: '1px solid #333',
								}}
							>
								<Typography
									variant='h6'
									sx={{
										color: '#E0E0E0',
										fontWeight: 600,
										mb: 2,
									}}
								>
									Is there a free trial?
								</Typography>
								<Typography
									variant='body2'
									sx={{ color: '#B0B0B0' }}
								>
									Our Free plan gives you access to core features with no time
									limit. You can upgrade anytime to unlock additional features.
								</Typography>
							</Paper>
						</Grid>
						<Grid
							item
							xs={12}
							md={6}
						>
							<Paper
								sx={{
									p: 3,
									backgroundColor: '#1E1E1E',
									border: '1px solid #333',
								}}
							>
								<Typography
									variant='h6'
									sx={{
										color: '#E0E0E0',
										fontWeight: 600,
										mb: 2,
									}}
								>
									What payment methods do you accept?
								</Typography>
								<Typography
									variant='body2'
									sx={{ color: '#B0B0B0' }}
								>
									We accept all major credit cards, PayPal, and bank transfers.
									All payments are processed securely through Stripe.
								</Typography>
							</Paper>
						</Grid>
						<Grid
							item
							xs={12}
							md={6}
						>
							<Paper
								sx={{
									p: 3,
									backgroundColor: '#1E1E1E',
									border: '1px solid #333',
								}}
							>
								<Typography
									variant='h6'
									sx={{
										color: '#E0E0E0',
										fontWeight: 600,
										mb: 2,
									}}
								>
									Can I cancel anytime?
								</Typography>
								<Typography
									variant='body2'
									sx={{ color: '#B0B0B0' }}
								>
									Absolutely! You can cancel your subscription at any time.
									You'll continue to have access to paid features until the end
									of your billing period.
								</Typography>
							</Paper>
						</Grid>
					</Grid>
				</Box>
			</Container>
		</Box>
	);
}
