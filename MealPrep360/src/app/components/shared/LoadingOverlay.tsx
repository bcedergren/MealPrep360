'use client';

import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	CircularProgress,
	Fade,
	LinearProgress,
} from '@mui/material';
import {
	Settings,
	Restaurant,
	CalendarMonth,
	CheckCircle,
} from '@mui/icons-material';

// Add these loading states at the top level
const LOADING_STATES = [
	{
		message: 'Analyzing your preferences...',
		icon: Settings,
		duration: 1500,
	},
	{
		message: 'Selecting recipes...',
		icon: Restaurant,
		duration: 2000,
	},
	{
		message: 'Organizing your meal plan...',
		icon: CalendarMonth,
		duration: 1500,
	},
	{
		message: 'Finalizing your plan...',
		icon: CheckCircle,
		duration: 1000,
	},
];

// Enhanced loading overlay with animated steps
export function LoadingOverlay() {
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;
		let progressInterval: ReturnType<typeof setInterval>;

		const updateProgress = () => {
			setProgress((prev) => {
				if (prev >= 100) {
					return 0;
				}
				return prev + 2;
			});
		};

		const nextStep = () => {
			setCurrentStep((prev) => {
				if (prev >= LOADING_STATES.length - 1) {
					return 0;
				}
				return prev + 1;
			});
			setProgress(0);
		};

		progressInterval = setInterval(updateProgress, 50);
		timeoutId = setTimeout(nextStep, LOADING_STATES[currentStep].duration);

		return () => {
			clearTimeout(timeoutId);
			clearInterval(progressInterval);
		};
	}, [currentStep]);

	const CurrentIcon = LOADING_STATES[currentStep].icon;

	return (
		<Fade in={true}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					bgcolor: 'background.paper',
					borderRadius: 2,
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
					p: 4,
				}}
			>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						maxWidth: 400,
						textAlign: 'center',
					}}
				>
					<Box
						sx={{
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							mb: 3,
						}}
					>
						<CircularProgress
							size={80}
							thickness={3}
							sx={{
								position: 'absolute',
								color: 'primary.light',
							}}
						/>
						<CurrentIcon
							sx={{
								fontSize: 40,
								color: 'primary.main',
								animation: 'pulse 1.5s infinite',
							}}
						/>
					</Box>

					<Typography
						variant='h6'
						sx={{
							fontWeight: 600,
							color: 'primary.main',
							mb: 1,
						}}
					>
						Generating Your Meal Plan
					</Typography>

					<Typography
						variant='body1'
						sx={{
							color: 'text.secondary',
							mb: 2,
							minHeight: '3em',
							display: 'flex',
							alignItems: 'center',
						}}
					>
						{LOADING_STATES[currentStep].message}
					</Typography>

					<Box sx={{ width: '100%', mt: 2 }}>
						<LinearProgress
							variant='determinate'
							value={progress}
							sx={{
								height: 6,
								borderRadius: 3,
								backgroundColor: 'primary.light',
								'& .MuiLinearProgress-bar': {
									borderRadius: 3,
									backgroundColor: 'primary.main',
								},
							}}
						/>
					</Box>
				</Box>
			</Box>
		</Fade>
	);
}
