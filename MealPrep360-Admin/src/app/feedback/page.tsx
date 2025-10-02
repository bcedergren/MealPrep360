'use client';

import {
	Box,
	Typography,
	Paper,
	CircularProgress,
	Container,
	Grid,
	Card,
	CardContent,
	Rating,
	Divider,
	Alert,
} from '@mui/material';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { clientAdminApiClient } from '@/lib/apiClient';

interface Feedback {
	id: string;
	rating: number;
	feedback: string;
	createdAt: string;
	user: {
		name: string | null;
		email: string;
	};
}

export default function FeedbackPage() {
	const { userId } = useAuth();
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);
	const [feedback, setFeedback] = useState<Feedback[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const checkAdminStatus = async () => {
			try {
				const data = await clientAdminApiClient.checkStatus();
				setIsAdmin(data.isAdmin);
			} catch (error) {
				console.error('Error checking admin status:', error);
			} finally {
				setLoading(false);
			}
		};

		const fetchFeedback = async () => {
			try {
				const data = await clientAdminApiClient.getFeedback();
				setFeedback(data);
			} catch (error) {
				console.error('Error fetching feedback:', error);
				setError('Failed to load feedback data');
			}
		};

		if (userId) {
			checkAdminStatus();
			fetchFeedback();
		}
	}, [userId]);

	if (loading) {
		return (
			<Box
				display='flex'
				justifyContent='center'
				alignItems='center'
				minHeight='100vh'
			>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Container>
				<Alert severity='error'>{error}</Alert>
			</Container>
		);
	}

	if (!isAdmin) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography
					variant='h4'
					color='error'
					gutterBottom
				>
					Access Denied
				</Typography>
				<Typography>You do not have permission to access this page.</Typography>
			</Box>
		);
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			hour12: true,
		});
	};

	return (
		<Container
			maxWidth='lg'
			sx={{ mt: 4, mb: 4 }}
		>
			<Typography
				variant='h4'
				component='h1'
				gutterBottom
			>
				User Feedback
			</Typography>

			<Grid
				container
				spacing={3}
			>
				{feedback.map((item) => (
					<Grid
						item
						xs={12}
						key={item.id}
					>
						<Card>
							<CardContent>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'flex-start',
										mb: 2,
									}}
								>
									<Box>
										<Typography
											variant='h6'
											component='div'
										>
											{item.user.name || 'Anonymous User'}
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
										>
											{item.user.email}
										</Typography>
									</Box>
									<Box>
										<Typography
											variant='body2'
											color='text.secondary'
										>
											{formatDate(item.createdAt)}
										</Typography>
										<Rating
											value={item.rating}
											readOnly
											precision={0.5}
										/>
									</Box>
								</Box>
								<Divider sx={{ my: 2 }} />
								<Typography
									variant='body1'
									sx={{ whiteSpace: 'pre-wrap' }}
								>
									{item.feedback}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				))}

				{feedback.length === 0 && (
					<Grid
						item
						xs={12}
					>
						<Paper sx={{ p: 3, textAlign: 'center' }}>
							<Typography color='text.secondary'>
								No feedback has been submitted yet.
							</Typography>
						</Paper>
					</Grid>
				)}
			</Grid>
		</Container>
	);
}
