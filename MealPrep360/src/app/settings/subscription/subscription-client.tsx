'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
	Box,
	Container,
	Typography,
	Paper,
	Grid,
	Button,
	Chip,
	CircularProgress,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Divider,
} from '@mui/material';
import {
	CheckCircle,
	Cancel,
	Star,
	TrendingUp,
	TrendingDown,
	Business,
	Person,
} from '@mui/icons-material';
import {
	SubscriptionPlan,
	PLAN_NAMES,
	PLAN_PRICES,
	PLAN_FEATURES,
	PLAN_HIERARCHY,
	canUpgradeTo,
	canDowngradeTo,
	Subscription,
} from '@/types/subscription';
import { useSnackbar } from '../../components/ui/snackbar';
import { useUserRole } from '@/hooks/useUserRole';
import { useSubscription } from '@/contexts/subscription-context';

export default function SubscriptionClient() {
	const { userId, isLoaded } = useAuth();
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const { role } = useUserRole();
	const { currentPlan, adminSwitchPlan, isLoading, refreshSubscription } =
		useSubscription();

	const [currentSubscription, setCurrentSubscription] =
		useState<Subscription | null>(null);
	const [loading, setLoading] = useState(true);
	const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(
		null
	);
	const [confirmDialog, setConfirmDialog] = useState<{
		open: boolean;
		plan: SubscriptionPlan;
		action: 'upgrade' | 'downgrade' | 'admin_switch';
	}>({ open: false, plan: 'FREE', action: 'upgrade' });

	useEffect(() => {
		if (isLoaded && userId) {
			fetchSubscription();
		}
	}, [isLoaded, userId]);

	const fetchSubscription = async () => {
		try {
			const response = await fetch('/api/subscription');
			if (response.ok) {
				const data = await response.json();
				setCurrentSubscription(data);
			}
		} catch (error) {
			console.error('Error fetching subscription:', error);
		} finally {
			setLoading(false);
		}
	};

	const handlePlanChange = async (
		targetPlan: SubscriptionPlan,
		action: 'upgrade' | 'downgrade' | 'admin_switch'
	) => {
		if (!currentSubscription) return;

		setProcessingPlan(targetPlan);

		try {
			if (action === 'admin_switch') {
				await adminSwitchPlan(targetPlan);
				refreshSubscription();
				await fetchSubscription();
			} else {
				const response = await fetch('/api/subscription/checkout', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ plan: targetPlan, action }),
				});

				const data = await response.json();

				if (response.ok) {
					if (data.url) {
						window.location.href = data.url;
					} else if (data.success) {
						showSnackbar(data.message, 'success');
						await fetchSubscription();
					}
				} else {
					throw new Error(data.error || 'Failed to process plan change');
				}
			}
		} catch (error) {
			console.error('Error changing plan:', error);
			showSnackbar(
				error instanceof Error ? error.message : 'Failed to change plan',
				'error'
			);
		} finally {
			setProcessingPlan(null);
			setConfirmDialog({ open: false, plan: 'FREE', action: 'upgrade' });
		}
	};

	const openConfirmDialog = (
		plan: SubscriptionPlan,
		action: 'upgrade' | 'downgrade' | 'admin_switch'
	) => {
		setConfirmDialog({ open: true, plan, action });
	};

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

	if (loading) {
		return (
			<Container
				maxWidth='lg'
				sx={{ py: 4, textAlign: 'center' }}
			>
				<CircularProgress />
			</Container>
		);
	}

	// Use the context's current plan as the primary source
	const activePlan = currentPlan;

	return (
		<Container
			maxWidth='lg'
			sx={{ py: 4 }}
		>
			<Typography
				variant='h3'
				gutterBottom
			>
				Subscription Management
			</Typography>

			{/* Current Plan Status */}
			<Paper sx={{ p: 3, mb: 4 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
					{getPlanIcon(activePlan)}
					<Typography variant='h4'>{PLAN_NAMES[activePlan]} Plan</Typography>
					<Chip
						label={currentSubscription?.status || 'active'}
						color={
							currentSubscription?.status === 'active' ? 'success' : 'warning'
						}
						size='small'
					/>
					{role === 'ADMIN' && (
						<Chip
							label='ADMIN'
							color='error'
							size='small'
							sx={{ backgroundColor: '#FF5722', color: 'white' }}
						/>
					)}
				</Box>

				{currentSubscription?.currentPeriodEnd && (
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{ mb: 2 }}
					>
						{currentSubscription.status === 'active'
							? 'Renews on'
							: 'Expires on'}{' '}
						{new Date(
							currentSubscription.currentPeriodEnd
						).toLocaleDateString()}
					</Typography>
				)}

				<Typography
					variant='h6'
					sx={{ mb: 2 }}
				>
					Current Plan Features:
				</Typography>
				<Grid
					container
					spacing={1}
				>
					{Object.entries(PLAN_FEATURES[activePlan]).map(([key, value]) => (
						<Grid
							item
							xs={12}
							sm={6}
							md={4}
							key={key}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<CheckCircle
									sx={{ color: getPlanColor(activePlan), fontSize: 16 }}
								/>
								<Typography variant='body2'>
									{key}:{' '}
									{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
								</Typography>
							</Box>
						</Grid>
					))}
				</Grid>
			</Paper>

			{/* Available Plans */}
			<Typography
				variant='h4'
				gutterBottom
				sx={{ mb: 3 }}
			>
				Available Plans
			</Typography>

			<Grid
				container
				spacing={3}
			>
				{(Object.keys(PLAN_NAMES) as SubscriptionPlan[]).map((plan) => {
					const isCurrentPlan = plan === activePlan;
					const canUpgrade = canUpgradeTo(activePlan, plan);
					const canDowngrade = canDowngradeTo(activePlan, plan);
					const isProcessing = processingPlan === plan;

					return (
						<Grid
							item
							xs={12}
							md={6}
							lg={4}
							key={plan}
						>
							<Paper
								sx={{
									p: 3,
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									border: isCurrentPlan ? 2 : 1,
									borderColor: isCurrentPlan ? getPlanColor(plan) : 'divider',
								}}
							>
								<Box
									sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
								>
									{getPlanIcon(plan)}
									<Typography variant='h5'>{PLAN_NAMES[plan]}</Typography>
									{isCurrentPlan && (
										<Chip
											label='Current'
											color='primary'
											size='small'
										/>
									)}
								</Box>

								<Typography
									variant='h6'
									sx={{ mb: 2 }}
								>
									{plan === 'FREE'
										? 'Free'
										: `$${PLAN_PRICES[plan].monthly}/month`}
								</Typography>

								{plan !== 'FREE' && (
									<Typography
										variant='body2'
										color='text.secondary'
										sx={{ mb: 2 }}
									>
										${PLAN_PRICES[plan].yearly}/year (Save{' '}
										{Math.round(
											((PLAN_PRICES[plan].monthly * 12 -
												PLAN_PRICES[plan].yearly) /
												(PLAN_PRICES[plan].monthly * 12)) *
												100
										)}
										%)
									</Typography>
								)}

								<Typography
									variant='subtitle2'
									sx={{ mb: 2 }}
								>
									Features:
								</Typography>
								<List
									dense
									sx={{ flexGrow: 1 }}
								>
									{Object.entries(PLAN_FEATURES[plan])
										.slice(0, 5)
										.map(([key, value]) => (
											<ListItem
												key={key}
												sx={{ px: 0 }}
											>
												<ListItemIcon sx={{ minWidth: 32 }}>
													<CheckCircle
														sx={{ color: getPlanColor(plan), fontSize: 16 }}
													/>
												</ListItemIcon>
												<ListItemText
													primary={
														<Typography variant='body2'>
															{key}:{' '}
															{typeof value === 'boolean'
																? value
																	? 'Yes'
																	: 'No'
																: value}
														</Typography>
													}
												/>
											</ListItem>
										))}
								</List>

								{!isCurrentPlan && (
									<Box sx={{ mt: 2 }}>
										{role === 'ADMIN' && (
											<Button
												variant='contained'
												fullWidth
												disabled={isProcessing}
												onClick={() => openConfirmDialog(plan, 'admin_switch')}
												sx={{
													backgroundColor: '#FF5722',
													color: 'white',
													mb: 1,
													'&:hover': {
														backgroundColor: '#E64A19',
													},
												}}
											>
												{isProcessing ? (
													<CircularProgress size={20} />
												) : (
													`Admin Switch to ${PLAN_NAMES[plan]}`
												)}
											</Button>
										)}
										{canUpgrade && (
											<Button
												variant='contained'
												fullWidth
												disabled={isProcessing}
												onClick={() => openConfirmDialog(plan, 'upgrade')}
												sx={{
													backgroundColor: getPlanColor(plan),
													'&:hover': {
														backgroundColor: getPlanColor(plan),
														opacity: 0.9,
													},
												}}
											>
												{isProcessing ? (
													<CircularProgress size={20} />
												) : (
													`Upgrade to ${PLAN_NAMES[plan]}`
												)}
											</Button>
										)}
										{canDowngrade && (
											<Button
												variant='outlined'
												fullWidth
												disabled={isProcessing}
												onClick={() => openConfirmDialog(plan, 'downgrade')}
												sx={{
													borderColor: getPlanColor(plan),
													color: getPlanColor(plan),
													'&:hover': {
														borderColor: getPlanColor(plan),
														backgroundColor: `${getPlanColor(plan)}10`,
													},
												}}
											>
												{isProcessing ? (
													<CircularProgress size={20} />
												) : (
													`Downgrade to ${PLAN_NAMES[plan]}`
												)}
											</Button>
										)}
									</Box>
								)}
							</Paper>
						</Grid>
					);
				})}
			</Grid>

			{/* Confirmation Dialog */}
			<Dialog
				open={confirmDialog.open}
				onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
				maxWidth='sm'
				fullWidth
			>
				<DialogTitle>
					Confirm Plan{' '}
					{confirmDialog.action === 'upgrade'
						? 'Upgrade'
						: confirmDialog.action === 'downgrade'
							? 'Downgrade'
							: 'Admin Switch'}
				</DialogTitle>
				<DialogContent>
					<Typography sx={{ mb: 2 }}>
						Are you sure you want to{' '}
						{confirmDialog.action === 'admin_switch'
							? 'switch'
							: confirmDialog.action}{' '}
						to the {PLAN_NAMES[confirmDialog.plan]} plan?
					</Typography>

					{confirmDialog.action === 'upgrade' && (
						<Alert
							severity='info'
							sx={{ mb: 2 }}
						>
							You'll be redirected to Stripe to complete the payment. The
							upgrade will take effect immediately.
						</Alert>
					)}

					{confirmDialog.action === 'downgrade' && (
						<Alert
							severity='warning'
							sx={{ mb: 2 }}
						>
							Your plan will be downgraded at the end of your current billing
							period. You'll continue to have access to current features until
							then.
						</Alert>
					)}

					{confirmDialog.action === 'admin_switch' && (
						<Alert
							severity='warning'
							sx={{ mb: 2 }}
						>
							<strong>Admin Override:</strong> This will immediately switch your
							subscription plan without going through Stripe. This is for
							testing purposes only.
						</Alert>
					)}

					<Typography
						variant='subtitle2'
						sx={{ mb: 1 }}
					>
						New Plan Features:
					</Typography>
					<List dense>
						{Object.entries(PLAN_FEATURES[confirmDialog.plan])
							.slice(0, 5)
							.map(([key, value]) => (
								<ListItem
									key={key}
									sx={{ px: 0 }}
								>
									<ListItemIcon sx={{ minWidth: 32 }}>
										<CheckCircle
											sx={{
												color: getPlanColor(confirmDialog.plan),
												fontSize: 16,
											}}
										/>
									</ListItemIcon>
									<ListItemText
										primary={
											<Typography variant='body2'>
												{key}:{' '}
												{typeof value === 'boolean'
													? value
														? 'Yes'
														: 'No'
													: value}
											</Typography>
										}
									/>
								</ListItem>
							))}
					</List>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
					>
						Cancel
					</Button>
					<Button
						onClick={() =>
							handlePlanChange(confirmDialog.plan, confirmDialog.action)
						}
						variant='contained'
						disabled={processingPlan !== null}
						sx={{
							backgroundColor:
								confirmDialog.action === 'admin_switch'
									? '#FF5722'
									: getPlanColor(confirmDialog.plan),
							'&:hover': {
								backgroundColor:
									confirmDialog.action === 'admin_switch'
										? '#E64A19'
										: getPlanColor(confirmDialog.plan),
								opacity: 0.9,
							},
						}}
					>
						{processingPlan ? (
							<CircularProgress size={20} />
						) : (
							`Confirm ${
								confirmDialog.action === 'upgrade'
									? 'Upgrade'
									: confirmDialog.action === 'downgrade'
										? 'Downgrade'
										: 'Admin Switch'
							}`
						)}
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
}
