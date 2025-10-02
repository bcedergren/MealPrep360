'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
	Box,
	Container,
	Typography,
	Paper,
	Button,
	TextField,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Chip,
	CircularProgress,
} from '@mui/material';
import {
	Warning,
	CheckCircle,
	MoneyOff,
	Pause,
	TrendingDown,
	Cancel,
} from '@mui/icons-material';
import { useSnackbar } from '../../../components/ui/snackbar';

interface RetentionOffer {
	type: 'discount' | 'pause' | 'downgrade';
	title: string;
	description: string;
	savings?: string;
	icon: React.ReactNode;
}

const retentionOffers: RetentionOffer[] = [
	{
		type: 'discount',
		title: '25% Off for 3 Months',
		description: 'Get a discount on your current plan for the next 3 months',
		savings: 'Save up to $37.50',
		icon: <MoneyOff color='success' />,
	},
	{
		type: 'pause',
		title: 'Pause Your Subscription',
		description: 'Take a 30-day break without losing your data or settings',
		savings: 'Skip one payment',
		icon: <Pause color='primary' />,
	},
	{
		type: 'downgrade',
		title: 'Switch to a Lower Plan',
		description: 'Keep the core features at a lower price point',
		savings: 'Save monthly',
		icon: <TrendingDown color='warning' />,
	},
];

const cancellationReasons = [
	'Too expensive',
	'Not using it enough',
	'Missing features I need',
	'Found a better alternative',
	'Technical issues',
	'Temporary financial situation',
	'Other',
];

export default function CancelSubscriptionPage() {
	const { userId } = useAuth();
	const router = useRouter();
	const { showSnackbar } = useSnackbar();

	const [step, setStep] = useState<
		'reason' | 'retention' | 'confirm' | 'processing'
	>('reason');
	const [reason, setReason] = useState('');
	const [feedback, setFeedback] = useState('');
	const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
	const [showRetentionDialog, setShowRetentionDialog] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleReasonSubmit = () => {
		if (!reason) {
			showSnackbar('Help us understand why you want to cancel', 'error');
			return;
		}

		// Show retention offers based on reason
		if (['Too expensive', 'Temporary financial situation'].includes(reason)) {
			setStep('retention');
		} else {
			setStep('confirm');
		}
	};

	const handleRetentionOffer = async (offerType: string) => {
		setLoading(true);
		try {
			const response = await fetch('/api/subscription/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reason,
					feedback,
					retentionOffer: offerType,
					immediateCancel: false,
				}),
			});

			const data = await response.json();

			if (data.success && data.retentionApplied) {
				showSnackbar(data.message, 'success');
				router.push('/settings/subscription');
			} else {
				throw new Error(data.error || 'Failed to apply offer');
			}
		} catch (error) {
			console.error('Error applying retention offer:', error);
			showSnackbar('Failed to apply the offer. Please try again.', 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleFinalCancel = async (immediate = false) => {
		setLoading(true);
		try {
			const response = await fetch('/api/subscription/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reason,
					feedback,
					retentionOffer: 'none',
					immediateCancel: immediate,
				}),
			});

			const data = await response.json();

			if (data.success) {
				showSnackbar(data.message, 'success');
				router.push('/dashboard');
			} else {
				throw new Error(data.error || 'Failed to cancel subscription');
			}
		} catch (error) {
			console.error('Error canceling subscription:', error);
			showSnackbar('Failed to cancel subscription. Please try again.', 'error');
		} finally {
			setLoading(false);
		}
	};

	if (step === 'reason') {
		return (
			<Container maxWidth='md'>
				<Box sx={{ py: 4 }}>
					<Typography
						variant='h4'
						gutterBottom
					>
						Cancel Subscription
					</Typography>
					<Typography
						variant='body1'
						color='text.secondary'
						sx={{ mb: 4 }}
					>
						We're sorry to see you go. Help us understand why you're canceling.
					</Typography>

					<Paper sx={{ p: 3 }}>
						<FormControl
							component='fieldset'
							fullWidth
						>
							<FormLabel
								component='legend'
								sx={{ mb: 2 }}
							>
								What's the main reason for canceling?
							</FormLabel>
							<RadioGroup
								value={reason}
								onChange={(e) => setReason(e.target.value)}
							>
								{cancellationReasons.map((r) => (
									<FormControlLabel
										key={r}
										value={r}
										control={<Radio />}
										label={r}
									/>
								))}
							</RadioGroup>
						</FormControl>

						<TextField
							fullWidth
							multiline
							rows={4}
							label='Additional feedback (optional)'
							value={feedback}
							onChange={(e) => setFeedback(e.target.value)}
							sx={{ mt: 3, mb: 3 }}
							placeholder='Tell us more about your experience or what could have been better...'
						/>

						<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
							<Button
								variant='outlined'
								onClick={() => router.back()}
							>
								Go Back
							</Button>
							<Button
								variant='contained'
								onClick={handleReasonSubmit}
								disabled={!reason}
							>
								Continue
							</Button>
						</Box>
					</Paper>
				</Box>
			</Container>
		);
	}

	if (step === 'retention') {
		return (
			<Container maxWidth='md'>
				<Box sx={{ py: 4 }}>
					<Typography
						variant='h4'
						gutterBottom
					>
						Wait! We Have Some Options
					</Typography>
					<Typography
						variant='body1'
						color='text.secondary'
						sx={{ mb: 4 }}
					>
						Before you cancel, here are some alternatives that might work better
						for you:
					</Typography>

					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
						{retentionOffers.map((offer) => (
							<Paper
								key={offer.type}
								sx={{
									p: 3,
									cursor: 'pointer',
									border: selectedOffer === offer.type ? 2 : 1,
									borderColor:
										selectedOffer === offer.type ? 'primary.main' : 'divider',
									'&:hover': { borderColor: 'primary.main' },
								}}
								onClick={() => setSelectedOffer(offer.type)}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									{offer.icon}
									<Box sx={{ flex: 1 }}>
										<Typography variant='h6'>{offer.title}</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
										>
											{offer.description}
										</Typography>
									</Box>
									{offer.savings && (
										<Chip
											label={offer.savings}
											color='success'
											variant='outlined'
										/>
									)}
								</Box>
							</Paper>
						))}
					</Box>

					<Alert
						severity='info'
						sx={{ mb: 3 }}
					>
						These offers are only available if you don't cancel. Choose one to
						continue with your subscription.
					</Alert>

					<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
						<Button
							variant='outlined'
							onClick={() => setStep('confirm')}
						>
							No Thanks, Cancel Anyway
						</Button>
						<Button
							variant='contained'
							onClick={() =>
								selectedOffer && handleRetentionOffer(selectedOffer)
							}
							disabled={!selectedOffer || loading}
						>
							{loading ? <CircularProgress size={20} /> : 'Apply This Offer'}
						</Button>
					</Box>
				</Box>
			</Container>
		);
	}

	if (step === 'confirm') {
		return (
			<Container maxWidth='md'>
				<Box sx={{ py: 4 }}>
					<Typography
						variant='h4'
						gutterBottom
						color='error'
					>
						Confirm Cancellation
					</Typography>

					<Alert
						severity='warning'
						sx={{ mb: 4 }}
					>
						<Typography
							variant='h6'
							gutterBottom
						>
							You're about to cancel your subscription
						</Typography>
						<Typography variant='body2'>
							• You'll lose access to premium features at the end of your
							billing period
							<br />
							• Your data will be preserved for 30 days in case you want to
							reactivate
							<br />• You can resubscribe at any time
						</Typography>
					</Alert>

					<Paper sx={{ p: 3, mb: 3 }}>
						<Typography
							variant='h6'
							gutterBottom
						>
							Cancellation Summary
						</Typography>
						<Typography
							variant='body2'
							color='text.secondary'
						>
							<strong>Reason:</strong> {reason}
						</Typography>
						{feedback && (
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{ mt: 1 }}
							>
								<strong>Feedback:</strong> {feedback}
							</Typography>
						)}
					</Paper>

					<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
						<Button
							variant='outlined'
							onClick={() => setStep('retention')}
						>
							See Retention Offers
						</Button>
						<Button
							variant='outlined'
							onClick={() => handleFinalCancel(false)}
							disabled={loading}
						>
							{loading ? (
								<CircularProgress size={20} />
							) : (
								'Cancel at Period End'
							)}
						</Button>
						<Button
							variant='contained'
							color='error'
							onClick={() => handleFinalCancel(true)}
							disabled={loading}
						>
							{loading ? <CircularProgress size={20} /> : 'Cancel Immediately'}
						</Button>
					</Box>
				</Box>
			</Container>
		);
	}

	return null;
}
