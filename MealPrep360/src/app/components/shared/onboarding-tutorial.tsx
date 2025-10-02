'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Dialog,
	DialogContent,
	Typography,
	Button,
	Step,
	Stepper,
	StepLabel,
	StepContent,
	Paper,
	IconButton,
	Fade,
	Slide,
	Zoom,
} from '@mui/material';
import {
	Close as CloseIcon,
	Restaurant as RecipeIcon,
	CalendarMonth as PlannerIcon,
	ShoppingCart as ShoppingIcon,
	Kitchen as FreezerIcon,
	MenuBook as MyRecipesIcon,
	ViewList as MealPlansIcon,
	Tune as PreferencesIcon,
	Settings as SettingsIcon,
	ArrowForward as ArrowForwardIcon,
	PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingTutorialProps {
	open: boolean;
	onClose: () => void;
	onComplete: () => void;
}

const tutorialSteps = [
	{
		title: 'Welcome to MealPrep360!',
		description:
			"Let's take a quick tour of your new kitchen companion. We'll show you how to make the most of our meal planning features.",
		icon: <PlayIcon sx={{ fontSize: 60 }} />,
		animation: 'bounce',
	},
	{
		title: 'Save Recipes',
		description:
			'Start by browsing our recommended recipes and saving the ones you like. These will become the foundation of your meal plans.',
		icon: <RecipeIcon sx={{ fontSize: 60 }} />,
		animation: 'pulse',
		highlight: 'Save recipes from our curated recommendations',
	},
	{
		title: 'Generate Meal Plans',
		description:
			'Use the meal planner to create weekly meal schedules. Our AI will suggest meals based on your saved recipes and preferences.',
		icon: <PlannerIcon sx={{ fontSize: 60 }} />,
		animation: 'rotate',
		highlight: 'Create smart meal plans with AI assistance',
	},
	{
		title: 'Create Shopping Lists',
		description:
			'Generate shopping lists automatically from your meal plans. All ingredients will be organized by category for easy shopping.',
		icon: <ShoppingIcon sx={{ fontSize: 60 }} />,
		animation: 'slide',
		highlight: 'Auto-generate organized shopping lists',
	},
	{
		title: 'Track Frozen Meals',
		description:
			'When you batch cook and freeze meals, mark them as "frozen" in your meal planner. Track your freezer inventory here. (Requires paid subscription)',
		icon: <FreezerIcon sx={{ fontSize: 60 }} />,
		animation: 'freeze',
		highlight: 'Manage your freezer inventory efficiently',
	},
	{
		title: 'Access Your Content',
		description:
			'Find all your saved recipes in "My Recipes" and view your meal planning history in "My Meal Plans".',
		icon: <MyRecipesIcon sx={{ fontSize: 60 }} />,
		animation: 'flip',
		highlight: 'Easy access to your saved content',
	},
	{
		title: 'Customize Your Experience',
		description:
			'Set your meal preferences (dietary restrictions, cuisines, etc.) and configure your account settings.',
		icon: <PreferencesIcon sx={{ fontSize: 60 }} />,
		animation: 'scale',
		highlight: 'Personalize your meal planning experience',
	},
];

export function OnboardingTutorial({
	open,
	onClose,
	onComplete,
}: OnboardingTutorialProps) {
	const [activeStep, setActiveStep] = useState(0);
	const [animationKey, setAnimationKey] = useState(0);

	const handleNext = () => {
		if (activeStep < tutorialSteps.length - 1) {
			setActiveStep(activeStep + 1);
			setAnimationKey((prev) => prev + 1);
		} else {
			handleComplete();
		}
	};

	const handleBack = () => {
		if (activeStep > 0) {
			setActiveStep(activeStep - 1);
			setAnimationKey((prev) => prev + 1);
		}
	};

	const handleComplete = () => {
		onComplete();
		onClose();
	};

	const handleClose = () => {
		onClose();
	};

	const getAnimationVariants = (animationType: string) => {
		switch (animationType) {
			case 'bounce':
				return {
					initial: { y: 0 },
					animate: {
						y: [-10, 0, -10, 0],
						transition: {
							duration: 2,
							repeat: Infinity,
						},
					},
				};
			case 'pulse':
				return {
					initial: { scale: 1 },
					animate: {
						scale: [1, 1.1, 1],
						transition: {
							duration: 1.5,
							repeat: Infinity,
						},
					},
				};
			case 'rotate':
				return {
					initial: { rotate: 0 },
					animate: {
						rotate: 360,
						transition: {
							duration: 3,
							repeat: Infinity,
						},
					},
				};
			case 'slide':
				return {
					initial: { x: 0 },
					animate: {
						x: [0, 20, 0, -20, 0],
						transition: {
							duration: 2,
							repeat: Infinity,
						},
					},
				};
			case 'freeze':
				return {
					initial: { scale: 1, opacity: 1 },
					animate: {
						scale: [1, 0.9, 1],
						opacity: [1, 0.7, 1],
						transition: {
							duration: 2,
							repeat: Infinity,
						},
					},
				};
			case 'flip':
				return {
					initial: { rotateY: 0 },
					animate: {
						rotateY: [0, 180, 360],
						transition: {
							duration: 3,
							repeat: Infinity,
						},
					},
				};
			case 'scale':
				return {
					initial: { scale: 1 },
					animate: {
						scale: [1, 1.2, 1, 0.8, 1],
						transition: {
							duration: 2.5,
							repeat: Infinity,
						},
					},
				};
			default:
				return {
					initial: { scale: 1 },
					animate: { scale: 1 },
				};
		}
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth='md'
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: 'hidden',
					background:
						'linear-gradient(135deg, #4CAF50 0%, #2E7D32 50%, #1B5E20 100%)',
					color: 'white',
				},
			}}
		>
			<DialogContent sx={{ p: 0 }}>
				<Box sx={{ position: 'relative' }}>
					<IconButton
						onClick={handleClose}
						sx={{
							position: 'absolute',
							top: 16,
							right: 16,
							color: 'rgba(255, 255, 255, 0.8)',
							zIndex: 1,
							backgroundColor: 'rgba(255, 255, 255, 0.1)',
							backdropFilter: 'blur(10px)',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.2)',
								color: 'white',
								transform: 'scale(1.1)',
							},
							transition: 'all 0.3s ease',
						}}
					>
						<CloseIcon />
					</IconButton>

					<Box sx={{ p: 4 }}>
						<Stepper
							activeStep={activeStep}
							orientation='vertical'
							sx={{
								'& .MuiStepLabel-root': {
									color: 'white',
								},
								'& .MuiStepIcon-root': {
									color: 'rgba(255, 255, 255, 0.4)',
									'&.Mui-active': {
										color: '#81C784',
										filter: 'drop-shadow(0 0 8px rgba(129, 199, 132, 0.5))',
									},
									'&.Mui-completed': {
										color: '#A5D6A7',
										filter: 'drop-shadow(0 0 6px rgba(165, 214, 167, 0.4))',
									},
								},
								'& .MuiStepConnector-line': {
									borderColor: 'rgba(255, 255, 255, 0.4)',
									borderWidth: 2,
								},
							}}
						>
							{tutorialSteps.map((step, index) => (
								<Step key={index}>
									<StepLabel>
										<Typography
											variant='h6'
											sx={{ color: 'white', fontWeight: 'bold' }}
										>
											{step.title}
										</Typography>
									</StepLabel>
									<StepContent>
										<AnimatePresence mode='wait'>
											{activeStep === index && (
												<motion.div
													key={`${index}-${animationKey}`}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -20 }}
													transition={{ duration: 0.5 }}
												>
													<Paper
														sx={{
															p: 3,
															mb: 3,
															background:
																'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
															backdropFilter: 'blur(15px)',
															border: '1px solid rgba(255, 255, 255, 0.3)',
															borderRadius: 3,
															boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
														}}
													>
														<Box
															sx={{
																display: 'flex',
																alignItems: 'center',
																mb: 2,
																flexDirection: { xs: 'column', sm: 'row' },
																textAlign: { xs: 'center', sm: 'left' },
															}}
														>
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	mr: { xs: 0, sm: 2 },
																	mb: { xs: 2, sm: 0 },
																}}
															>
																<motion.div
																	{...getAnimationVariants(step.animation)}
																	style={{
																		display: 'flex',
																		alignItems: 'center',
																		justifyContent: 'center',
																	}}
																>
																	{step.icon}
																</motion.div>
															</Box>
															<Box sx={{ flex: 1 }}>
																<Typography
																	variant='body1'
																	sx={{
																		mb: 1,
																		color: 'rgba(255, 255, 255, 0.9)',
																		lineHeight: 1.6,
																	}}
																>
																	{step.description}
																</Typography>
																{step.highlight && (
																	<motion.div
																		initial={{ opacity: 0, scale: 0.9 }}
																		animate={{ opacity: 1, scale: 1 }}
																		transition={{ delay: 0.3, duration: 0.3 }}
																	>
																		<Typography
																			variant='body2'
																			sx={{
																				color: '#81C784',
																				fontWeight: 'bold',
																				display: 'flex',
																				alignItems: 'center',
																				gap: 1,
																				mt: 1,
																				textShadow:
																					'1px 1px 2px rgba(0, 0, 0, 0.3)',
																			}}
																		>
																			<ArrowForwardIcon sx={{ fontSize: 16 }} />
																			{step.highlight}
																		</Typography>
																	</motion.div>
																)}
															</Box>
														</Box>
													</Paper>
												</motion.div>
											)}
										</AnimatePresence>

										<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
											<Button
												disabled={activeStep === 0}
												onClick={handleBack}
												variant='outlined'
												sx={{
													color: 'rgba(255, 255, 255, 0.9)',
													borderColor: 'rgba(255, 255, 255, 0.6)',
													'&:hover': {
														borderColor: '#81C784',
														backgroundColor: 'rgba(129, 199, 132, 0.1)',
														color: '#81C784',
													},
													'&:disabled': {
														color: 'rgba(255, 255, 255, 0.3)',
														borderColor: 'rgba(255, 255, 255, 0.2)',
													},
												}}
											>
												Back
											</Button>
											<Button
												onClick={handleNext}
												variant='contained'
												sx={{
													background:
														'linear-gradient(45deg, #81C784 30%, #66BB6A 90%)',
													color: 'white',
													fontWeight: 'bold',
													boxShadow: '0 4px 20px rgba(129, 199, 132, 0.3)',
													'&:hover': {
														background:
															'linear-gradient(45deg, #66BB6A 30%, #4CAF50 90%)',
														boxShadow: '0 6px 25px rgba(129, 199, 132, 0.4)',
														transform: 'translateY(-1px)',
													},
													transition: 'all 0.3s ease',
												}}
											>
												{activeStep === tutorialSteps.length - 1
													? 'Get Started!'
													: 'Next'}
											</Button>
										</Box>
									</StepContent>
								</Step>
							))}
						</Stepper>

						{/* Progress indicator */}
						<Box
							sx={{
								mt: 3,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								gap: 1,
							}}
						>
							<Typography
								variant='caption'
								sx={{
									color: 'rgba(255, 255, 255, 0.8)',
									fontWeight: 500,
								}}
							>
								{activeStep + 1} of {tutorialSteps.length}
							</Typography>
							<Box sx={{ display: 'flex', gap: 0.5 }}>
								{tutorialSteps.map((_, index) => (
									<Box
										key={index}
										sx={{
											width: 10,
											height: 10,
											borderRadius: '50%',
											backgroundColor:
												index <= activeStep
													? '#81C784'
													: 'rgba(255, 255, 255, 0.4)',
											boxShadow:
												index <= activeStep
													? '0 0 10px rgba(129, 199, 132, 0.6)'
													: 'none',
											transition: 'all 0.3s ease',
											transform:
												index === activeStep ? 'scale(1.2)' : 'scale(1)',
										}}
									/>
								))}
							</Box>
						</Box>
					</Box>
				</Box>
			</DialogContent>
		</Dialog>
	);
}
