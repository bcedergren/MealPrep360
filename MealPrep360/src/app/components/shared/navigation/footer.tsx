'use client';

import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { FeedbackDialog } from '../feedback-dialog';
import { Feedback } from '@mui/icons-material';
import { ApiHealthMonitor } from '../ApiHealthMonitor';

export function Footer() {
	const { userId, isLoaded } = useAuth();
	const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Show interactive elements only when mounted
	const showInteractive = mounted;

	return (
		<Box
			component='footer'
			sx={{
				py: 3,
				px: 2,
				mt: 'auto',
				backgroundColor: (theme) =>
					theme.palette.mode === 'light'
						? theme.palette.grey[200]
						: theme.palette.grey[800],
			}}
		>
			{showInteractive && (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						gap: 2,
						mt: 1,
						mb: 2,
					}}
				>
					<Button
						size='small'
						variant='contained'
						onClick={() => setIsFeedbackOpen(true)}
						startIcon={<Feedback sx={{ fontSize: '1.1rem' }} />}
						sx={{
							background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
							borderRadius: 2,
							textTransform: 'none',
							fontWeight: 600,
							boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
							'&:hover': {
								background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
								boxShadow: '0 3px 8px 2px rgba(33, 203, 243, .4)',
								transform: 'translateY(-1px)',
							},
							transition: 'all 0.2s ease-in-out',
							py: 0.5,
							px: 2,
						}}
					>
						Submit Feedback
					</Button>
				</Box>
			)}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
				}}
			>
				<Typography
					variant='body2'
					color='text.secondary'
					align='center'
					sx={{ flex: 1 }}
				>
					© {new Date().getFullYear()} MealPrep360. All rights reserved.
				</Typography>
				{showInteractive && <ApiHealthMonitor />}
			</Box>

			{showInteractive && (
				<FeedbackDialog
					open={isFeedbackOpen}
					onClose={() => setIsFeedbackOpen(false)}
				/>
			)}
		</Box>
	);
}
