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
	ReceiptLong,
	ShoppingCart,
	Category,
	CheckCircle,
	Kitchen,
} from '@mui/icons-material';

// Loading states for shopping list generation
const LOADING_STATES = [
	{
		message: 'Analyzing your meal plan...',
		icon: Kitchen,
		duration: 1500,
	},
	{
		message: 'Calculating ingredients...',
		icon: ReceiptLong,
		duration: 2000,
	},
	{
		message: 'Organizing by category...',
		icon: Category,
		duration: 1500,
	},
	{
		message: 'Creating your shopping list...',
		icon: ShoppingCart,
		duration: 1500,
	},
	{
		message: 'Almost ready...',
		icon: CheckCircle,
		duration: 1000,
	},
];

export function ShoppingListLoadingOverlay() {
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		let timeoutId: number;
		let progressInterval: number;

		const updateProgress = () => {
			setProgress((prev) => {
				if (prev >= 100) {
					return 0;
				}
				// Smooth progress increment
				const increment = 100 / (LOADING_STATES[currentStep].duration / 50);
				return Math.min(prev + increment, 100);
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

		progressInterval = setInterval(updateProgress, 50) as unknown as number;
		timeoutId = setTimeout(
			nextStep,
			LOADING_STATES[currentStep].duration
		) as unknown as number;

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
					borderRadius: 3,
					boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
					p: 5,
					minWidth: { xs: 280, sm: 350 },
					background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
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
					{/* Animated Icon Container */}
					<Box
						sx={{
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							mb: 4,
							width: 120,
							height: 120,
						}}
					>
						{/* Background circles for animation */}
						<Box
							sx={{
								position: 'absolute',
								width: '100%',
								height: '100%',
								borderRadius: '50%',
								bgcolor: 'primary.light',
								opacity: 0.1,
								animation: 'pulse 2s ease-in-out infinite',
							}}
						/>
						<Box
							sx={{
								position: 'absolute',
								width: '80%',
								height: '80%',
								borderRadius: '50%',
								bgcolor: 'primary.light',
								opacity: 0.2,
								animation: 'pulse 2s ease-in-out infinite 0.5s',
							}}
						/>

						{/* Progress circle */}
						<CircularProgress
							size={100}
							thickness={3}
							sx={{
								position: 'absolute',
								color: 'primary.light',
								opacity: 0.3,
							}}
						/>
						<CircularProgress
							variant='determinate'
							value={progress}
							size={100}
							thickness={3}
							sx={{
								position: 'absolute',
								color: 'primary.main',
							}}
						/>

						{/* Central icon */}
						<CurrentIcon
							sx={{
								fontSize: 48,
								color: 'primary.main',
								animation: 'bounce 1.5s ease-in-out infinite',
								zIndex: 1,
							}}
						/>
					</Box>

					<Typography
						variant='h5'
						sx={{
							fontWeight: 700,
							color: 'primary.main',
							mb: 2,
							letterSpacing: '-0.5px',
						}}
					>
						Generating Shopping List
					</Typography>

					<Typography
						variant='body1'
						sx={{
							color: 'text.secondary',
							mb: 3,
							minHeight: '2em',
							display: 'flex',
							alignItems: 'center',
							fontSize: { xs: 14, sm: 16 },
						}}
					>
						{LOADING_STATES[currentStep].message}
					</Typography>

					{/* Progress bar */}
					<Box sx={{ width: '100%', mt: 1 }}>
						<LinearProgress
							variant='determinate'
							value={progress}
							sx={{
								height: 8,
								borderRadius: 4,
								backgroundColor: 'grey.200',
								'& .MuiLinearProgress-bar': {
									borderRadius: 4,
									background:
										'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)',
									transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								},
							}}
						/>
					</Box>

					{/* Step indicator */}
					<Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
						{LOADING_STATES.map((_, index) => (
							<Box
								key={index}
								sx={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									bgcolor: index <= currentStep ? 'primary.main' : 'grey.300',
									transition: 'all 0.3s ease',
								}}
							/>
						))}
					</Box>
				</Box>
			</Box>
		</Fade>
	);
}

// Add keyframe animations
export const shoppingListLoaderStyles = `
	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 0.1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.2;
		}
		100% {
			transform: scale(1);
			opacity: 0.1;
		}
	}

	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}
`;
