'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { useSubscription } from '@/hooks/use-subscription';
import { useLanguage } from '@/contexts/language-context';
import {
	Box,
	AppBar,
	Toolbar,
	IconButton,
	Drawer,
	List,
	ListItem,
	ListItemText,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { getCurrentSeason } from '@/lib/utils';
import {
	Button,
	Container,
	Grid,
	Paper,
	Typography,
	Snackbar,
	Alert,
	Collapse,
	Chip,
	Switch,
	FormControlLabel,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
	ArrowRight,
	ArrowLeft,
	Sparkles,
	ChefHat,
	CookingPot,
	CalendarCheck,
	ListChecks,
	Snowflake,
	CheckCircle,
	ChevronDown,
	ChevronUp,
} from 'lucide-react';
import {
	SubscriptionPlan,
	PLAN_FEATURES,
	PLAN_NAMES,
	PLAN_PRICES,
} from '@/types/subscription';

export default function Home() {
	const { currentPlan, upgradePlan } = useSubscription();
	const { isSignedIn } = useUser();
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const [season, setSeason] = useState<string>('');
	const [isScrolled, setIsScrolled] = useState(false);
	const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(
		null
	);
	const { translations } = useLanguage();
	const [email, setEmail] = useState('');
	const [isSubscribing, setIsSubscribing] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		description: '',
		severity: 'success' as 'success' | 'error',
	});
	const scrollContainerRef = React.useRef<HTMLDivElement>(null);
	const [expandedFeatures, setExpandedFeatures] = useState<
		Record<string, boolean>
	>({});
	const [isAnnual, setIsAnnual] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		setSeason(getCurrentSeason());
	}, []);

	const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setMobileMenuAnchor(event.currentTarget);
	};

	const handleMobileMenuClose = () => {
		setMobileMenuAnchor(null);
	};

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
		handleMobileMenuClose();
	};

	const handleUpgrade = (plan: SubscriptionPlan) => {
		if (!isSignedIn) {
			sessionStorage.setItem('selectedPlan', plan);
			router.push('/auth/signup?redirect_url=/pricing&source=upgrade');
			return;
		}
		upgradePlan(plan);
	};

	const handleSubscribe = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubscribing(true);

		try {
			const response = await fetch('/api/newsletter/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (response.ok) {
				setSnackbar({
					open: true,
					message: 'Thank you for subscribing to our newsletter!',
					description:
						"You'll receive updates about meal planning tips and new features.",
					severity: 'success',
				});
				setEmail('');
			} else {
				setSnackbar({
					open: true,
					message: data.message || 'Something went wrong. Please try again.',
					description: '',
					severity: 'error',
				});
			}
		} catch (error) {
			setSnackbar({
				open: true,
				message: 'Something went wrong. Please try again.',
				description: '',
				severity: 'error',
			});
		} finally {
			setIsSubscribing(false);
		}
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

	return (
		<Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
			<AppBar
				position='fixed'
				sx={{
					backgroundColor: '#1A1A1A',
					boxShadow: 'none',
					borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
					transition: 'all 0.3s ease-in-out',
				}}
			>
				<Toolbar
					sx={{
						justifyContent: 'space-between',
						px: { xs: 2, md: 4 },
						flexDirection: { xs: 'row', sm: 'row' },
						alignItems: 'center',
					}}
				>
					<Image
						src='/images/logo_dark.png'
						alt='MealPrep360 Logo'
						width={240}
						height={60}
						priority
						style={{
							objectFit: 'contain',
							width: 'auto',
							height: '40px',
							[theme.breakpoints.down('sm')]: {
								height: '32px',
							},
						}}
					/>
					{isMobile ? (
						<>
							<IconButton
								edge='start'
								color='inherit'
								aria-label='menu'
								onClick={handleMobileMenuOpen}
								sx={{ display: { md: 'none' } }}
							>
								<MenuIcon />
							</IconButton>
							<Drawer
								anchor='right'
								open={Boolean(mobileMenuAnchor)}
								onClose={handleMobileMenuClose}
							>
								<List>
									<ListItem
										button
										onClick={() => scrollToSection('features')}
									>
										<ListItemText primary='Features' />
									</ListItem>
									<ListItem
										button
										onClick={() => scrollToSection('pricing')}
									>
										<ListItemText primary='Pricing' />
									</ListItem>
									<ListItem
										button
										onClick={() => scrollToSection('faq')}
									>
										<ListItemText primary='FAQ' />
									</ListItem>
									<ListItem
										button
										onClick={() => {
											router.push('/auth/signin');
											handleMobileMenuClose();
										}}
										sx={{
											borderTop: '1px solid rgba(0, 0, 0, 0.12)',
											mt: 1,
											pt: 1,
										}}
									>
										<ListItemText
											primary='Sign In'
											primaryTypographyProps={{
												sx: { fontWeight: 600 },
											}}
										/>
									</ListItem>
								</List>
							</Drawer>
						</>
					) : (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<Link
								href='#features'
								style={{
									color: 'white',
									textDecoration: 'none',
									cursor: 'pointer',
									position: 'relative',
									padding: '0 8px',
								}}
								className='nav-underline'
								onClick={(e) => {
									e.preventDefault();
									scrollToSection('features');
								}}
							>
								Features
							</Link>
							<Link
								href='#pricing'
								style={{
									color: 'white',
									textDecoration: 'none',
									cursor: 'pointer',
									position: 'relative',
									padding: '0 8px',
								}}
								className='nav-underline'
								onClick={(e) => {
									e.preventDefault();
									scrollToSection('pricing');
								}}
							>
								Pricing
							</Link>
							<Link
								href='#faq'
								style={{
									color: 'white',
									textDecoration: 'none',
									cursor: 'pointer',
									position: 'relative',
									padding: '0 8px',
								}}
								className='nav-underline'
								onClick={(e) => {
									e.preventDefault();
									scrollToSection('faq');
								}}
							>
								FAQ
							</Link>
							<Link
								href='/auth/signin'
								passHref
								legacyBehavior
							>
								<Button
									variant='contained'
									sx={{
										background: '#444',
										color: 'white',
										boxShadow: 'none',
										textTransform: 'none',
										fontWeight: 600,
										ml: 2,
										px: 3,
										py: 1,
										borderRadius: 2,
										'&:hover': {
											background: '#222',
										},
									}}
								>
									Sign In
								</Button>
							</Link>
						</Box>
					)}
				</Toolbar>
			</AppBar>
			<Box sx={{ height: '64px' }} /> {/* Spacer for fixed AppBar */}
			<Box
				sx={{
					position: 'relative',
					height: '100vh',
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundImage: 'url("/images/hero-bg.png")',
						backgroundSize: 'cover',
						backgroundPosition: 'center 30%',
						filter: 'brightness(0.7)',
						zIndex: 1,
					},
				}}
			>
				<Box
					sx={{
						position: 'relative',
						zIndex: 2,
						textAlign: 'center',
						color: 'white',
						maxWidth: '800px',
						px: 4,
					}}
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<Typography
							variant='h4'
							component='h1'
							sx={{
								fontSize: { xs: '2.5rem', md: '3.5rem' },
								fontWeight: 'bold',
								mb: 3,
								textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
							}}
						>
							Your AI-Powered Kitchen Companion
						</Typography>
						<Typography
							variant='body1'
							sx={{
								mb: 4,
								textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
								maxWidth: '600px',
								mx: 'auto',
							}}
						>
							Smart meal planning, batch cooking, and freezer management made
							simple with AI
						</Typography>
						<Box
							sx={{
								display: 'flex',
								gap: 2,
								justifyContent: 'center',
							}}
						>
							<Button
								size='large'
								sx={{
									gap: 1,
									backgroundColor: '#4B7F47',
									color: 'white',
									'&:hover': {
										backgroundColor: '#406B3C',
									},
								}}
								onClick={() => {
									router.push('/auth/signup');
								}}
							>
								Get Started <ArrowRight className='h-4 w-4' />
							</Button>
						</Box>
					</motion.div>
				</Box>
			</Box>
			<Box
				component='main'
				sx={{ flex: 1 }}
			>
				<Container
					maxWidth='lg'
					sx={{ py: 8, textAlign: 'center' }}
				>
					<Typography
						variant='h4'
						component='h2'
						sx={{ mb: 6, fontWeight: 'bold' }}
						id='features'
					>
						Features
					</Typography>
					<Grid
						container
						spacing={4}
						sx={{ mb: 8 }}
						id='features'
					>
						<FeatureCard
							icon={<Sparkles className='h-8 w-8' />}
							title='AI Meal Assistant'
							description='Get personalized recipe suggestions based on your preferences, season, and ingredients'
						/>
						<FeatureCard
							icon={<ChefHat className='h-8 w-8' />}
							title='Smart Recipe Box'
							description='Save and organize recipes with AI-powered parsing and categorization'
						/>
						<FeatureCard
							icon={<CookingPot className='h-8 w-8' />}
							title='Seasonal Collections'
							description='AI-generated meal plans for each season with prep instructions and grocery lists'
						/>
						<FeatureCard
							icon={<CalendarCheck className='h-8 w-8' />}
							title='Smart Planning'
							description='AI-powered meal planning based on your preferences and cooking history'
						/>
						<FeatureCard
							icon={<ListChecks className='h-8 w-8' />}
							title='Grocery Lists'
							description='Automatically generated shopping lists from your meal plans'
						/>
						<FeatureCard
							icon={<Snowflake className='h-8 w-8' />}
							title='Freezer Tracking'
							description='Track your frozen meals with expiration reminders and AI suggestions (Paid plans)'
						/>
					</Grid>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className='mb-16'
						id='how-it-works'
					>
						<Typography
							variant='h4'
							component='h2'
							sx={{ mb: 6, fontWeight: 'bold' }}
						>
							How It Works
						</Typography>
						<Box
							sx={{
								position: 'relative',
								width: '100%',
								height: 'auto',
								maxWidth: '1000px',
								margin: '0 auto',
							}}
						>
							<Image
								src='/images/HowItWorks.png'
								alt='How RecipeBox works - Step by step guide'
								width={1000}
								height={500}
								style={{
									width: '100%',
									height: 'auto',
									borderRadius: '12px',
									boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
								}}
								priority
							/>
						</Box>
					</motion.div>

					{/* Pricing Section */}
					<Box
						id='pricing'
						sx={{
							py: { xs: 8, md: 12 },
							backgroundColor: 'rgba(240, 240, 240, 0.8)',
							px: { xs: 2, sm: 4, md: 6 },
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
										color: '#000000',
									}}
								>
									Simple, Transparent Pricing
								</Typography>
								<Typography
									variant='h5'
									sx={{
										color: '#333333',
										maxWidth: '600px',
										mx: 'auto',
										mb: 2,
									}}
								>
									From free meal planning to professional-grade tools
								</Typography>
								<Typography
									variant='body1'
									sx={{
										color: '#666666',
										maxWidth: '500px',
										mx: 'auto',
										mb: 4,
									}}
								>
									Start free and upgrade anytime. All plans include our core
									meal planning features.
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
										sx={{
											color: isAnnual ? '#666666' : '#000000',
											fontWeight: isAnnual ? 400 : 600,
											fontSize: '1.1rem',
										}}
									>
										Monthly
									</Typography>
									<FormControlLabel
										control={
											<Switch
												checked={isAnnual}
												onChange={(e) => setIsAnnual(e.target.checked)}
												sx={{
													'& .MuiSwitch-thumb': {
														backgroundColor: '#4CAF50',
													},
													'& .MuiSwitch-track': {
														backgroundColor: '#4CAF50',
													},
												}}
											/>
										}
										label=''
										sx={{ m: 0 }}
									/>
									<Typography
										sx={{
											color: isAnnual ? '#000000' : '#666666',
											fontWeight: isAnnual ? 600 : 400,
											fontSize: '1.1rem',
										}}
									>
										Annual
									</Typography>
									{isAnnual && (
										<Chip
											label='Save 20%'
											size='small'
											sx={{
												backgroundColor: '#4CAF50',
												color: 'white',
												fontWeight: 600,
												fontSize: '0.75rem',
											}}
										/>
									)}
								</Box>
							</Box>

							{/* Pricing Cards with Navigation */}
							<Box sx={{ position: 'relative' }}>
								{/* Left Arrow Button */}
								<IconButton
									onClick={() => scrollPricingCards('left')}
									sx={{
										position: 'absolute',
										left: { xs: -20, md: -60 },
										top: '50%',
										transform: 'translateY(-50%)',
										zIndex: 10,
										backgroundColor: 'rgba(0, 0, 0, 0.7)',
										color: 'white',
										width: { xs: 40, md: 56 },
										height: { xs: 40, md: 56 },
										'&:hover': {
											backgroundColor: 'rgba(0, 0, 0, 0.9)',
											transform: 'translateY(-50%) scale(1.1)',
										},
										transition: 'all 0.2s ease',
										display: { xs: 'none', sm: 'flex' },
									}}
								>
									<ArrowLeft size={24} />
								</IconButton>

								{/* Right Arrow Button */}
								<IconButton
									onClick={() => scrollPricingCards('right')}
									sx={{
										position: 'absolute',
										right: { xs: -20, md: -60 },
										top: '50%',
										transform: 'translateY(-50%)',
										zIndex: 10,
										backgroundColor: 'rgba(0, 0, 0, 0.7)',
										color: 'white',
										width: { xs: 40, md: 56 },
										height: { xs: 40, md: 56 },
										'&:hover': {
											backgroundColor: 'rgba(0, 0, 0, 0.9)',
											transform: 'translateY(-50%) scale(1.1)',
										},
										transition: 'all 0.2s ease',
										display: { xs: 'none', sm: 'flex' },
									}}
								>
									<ArrowRight size={24} />
								</IconButton>

								<Box
									ref={scrollContainerRef}
									sx={{
										display: 'flex',
										gap: { xs: 2, md: 3 },
										overflowX: 'auto',
										pb: 2,
										px: { xs: 1, md: 0 },
										scrollbarWidth: 'none', // Firefox
										'&::-webkit-scrollbar': {
											display: 'none', // Chrome, Safari, Edge
										},
									}}
								>
									{Object.entries(PLAN_FEATURES).map(([plan, features]) => {
										const planName = plan as SubscriptionPlan;
										const isPopular = plan === 'PLUS';

										return (
											<Box
												key={plan}
												sx={{
													minWidth: { xs: '280px', sm: '320px', md: '280px' },
													flex: {
														xs: '0 0 280px',
														sm: '0 0 320px',
														md: '0 0 280px',
													},
												}}
											>
												<Paper
													sx={{
														p: { xs: 2.5, sm: 3 },
														height: '100%',
														backgroundColor: '#1A1A1A',
														borderRadius: 2,
														display: 'flex',
														flexDirection: 'column',
														position: 'relative',
														overflow: 'hidden',
														border: isPopular
															? '2px solid #4CAF50'
															: '1px solid rgba(255, 255, 255, 0.1)',
														boxShadow: 'none',
														'&:hover': {
															transform: 'translateY(-4px)',
															transition: 'transform 0.3s ease',
															boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
														},
													}}
												>
													{isPopular && (
														<Box
															sx={{
																position: 'absolute',
																top: 0,
																left: 0,
																right: 0,
																backgroundColor: '#4CAF50',
																color: 'white',
																py: 1,
																textAlign: 'center',
																fontSize: '0.875rem',
																fontWeight: 600,
															}}
														>
															⭐ MOST POPULAR
														</Box>
													)}

													<Box
														sx={{
															mb: 3,
															mt: isPopular ? 2.5 : 0,
														}}
													>
														<Typography
															variant='h5'
															sx={{
																fontSize: { xs: '1.25rem', sm: '1.4rem' },
																fontWeight: 700,
																color: '#E0E0E0',
																mb: 0.5,
																textAlign: 'center',
															}}
														>
															{PLAN_NAMES[planName]}
														</Typography>

														<Typography
															variant='body2'
															sx={{
																color: '#B0B0B0',
																textAlign: 'center',
																mb: 2,
																fontSize: '0.85rem',
																lineHeight: 1.3,
															}}
														>
															{getPlanDescription(planName)}
														</Typography>

														<Box sx={{ textAlign: 'center' }}>
															<Typography
																sx={{
																	fontSize: { xs: '2rem', sm: '2.25rem' },
																	fontWeight: 700,
																	color: getPlanColor(planName),
																	mb: 0.5,
																}}
															>
																$
																{planName === 'FREE'
																	? '0'
																	: isAnnual
																		? PLAN_PRICES[planName].yearly.toFixed(2)
																		: PLAN_PRICES[planName].monthly}
																{planName !== 'FREE' && (
																	<Typography
																		component='span'
																		sx={{ fontSize: '1rem', ml: 0.5 }}
																	>
																		{isAnnual ? '/year' : '/mo'}
																	</Typography>
																)}
															</Typography>
															{planName === 'FREE' ? (
																<Typography
																	variant='body2'
																	sx={{ color: '#A0A0A0', fontSize: '0.8rem' }}
																>
																	Forever free
																</Typography>
															) : isAnnual ? (
																<Typography
																	variant='body2'
																	sx={{ color: '#A0A0A0', fontSize: '0.8rem' }}
																>
																	${PLAN_PRICES[planName].monthly}/mo billed
																	annually
																</Typography>
															) : null}
														</Box>
													</Box>

													<Box sx={{ flex: 1, mb: 3 }}>
														{(() => {
															const previousPlan = getPreviousPlan(planName);
															const hasIdenticalFeatures =
																previousPlan &&
																areFeaturesIdentical(planName, previousPlan);

															if (hasIdenticalFeatures) {
																return (
																	<Box sx={{ textAlign: 'center', py: 2 }}>
																		<Chip
																			label={`Same as ${PLAN_NAMES[previousPlan]}`}
																			sx={{
																				backgroundColor: getPlanColor(planName),
																				color: 'white',
																				fontWeight: 600,
																				fontSize: '0.9rem',
																			}}
																		/>
																	</Box>
																);
															}

															const topFeatures = getTopFeatures(features);
															const remainingFeatures =
																Object.entries(features).slice(3);
															const isExpanded = expandedFeatures[planName];

															return (
																<>
																	{/* Top 3 Features */}
																	{topFeatures.map(([feature, value]) => (
																		<Box
																			key={feature}
																			sx={{
																				display: 'flex',
																				alignItems: 'flex-start',
																				gap: 1.5,
																				mb: 1.5,
																				py: 0.5,
																				textAlign: 'left',
																			}}
																		>
																			<CheckCircle
																				style={{
																					color: getPlanColor(planName),
																					fontSize: '1.2rem',
																					flexShrink: 0,
																					marginTop: '2px',
																				}}
																			/>
																			<Box sx={{ minWidth: 0, flex: 1 }}>
																				<Typography
																					sx={{
																						color: '#E0E0E0',
																						fontSize: {
																							xs: '0.85rem',
																							sm: '0.9rem',
																						},
																						fontWeight: 500,
																						lineHeight: 1.3,
																					}}
																				>
																					{feature}
																				</Typography>
																				{(typeof value === 'number' &&
																					value > 0) ||
																				(typeof value === 'string' &&
																					value !== 'Unlimited' &&
																					value !== 'Included') ? (
																					<Typography
																						variant='body2'
																						sx={{
																							color: '#A0A0A0',
																							fontSize: '0.75rem',
																							mt: 0.25,
																						}}
																					>
																						{typeof value === 'number' &&
																						value > 0
																							? `${value}/month`
																							: value}
																					</Typography>
																				) : null}
																			</Box>
																		</Box>
																	))}

																	{/* Show More/Less Button */}
																	{remainingFeatures.length > 0 && (
																		<Button
																			onClick={() => toggleFeatures(planName)}
																			sx={{
																				width: '100%',
																				justifyContent: 'center',
																				color: getPlanColor(planName),
																				fontSize: '0.85rem',
																				fontWeight: 500,
																				textTransform: 'none',
																				py: 1,
																				mb: 1,
																				'&:hover': {
																					backgroundColor: `rgba(${getPlanColor(
																						planName
																					)
																						.slice(1)
																						.match(/.{2}/g)
																						?.map((hex) => parseInt(hex, 16))
																						.join(', ')}, 0.1)`,
																				},
																			}}
																			endIcon={
																				isExpanded ? (
																					<ChevronUp size={16} />
																				) : (
																					<ChevronDown size={16} />
																				)
																			}
																		>
																			{isExpanded
																				? 'Show Less'
																				: `Show ${remainingFeatures.length} More Features`}
																		</Button>
																	)}

																	{/* Collapsible Additional Features */}
																	<Collapse in={isExpanded}>
																		<Box>
																			{remainingFeatures.map(
																				([feature, value]) => (
																					<Box
																						key={feature}
																						sx={{
																							display: 'flex',
																							alignItems: 'flex-start',
																							gap: 1.5,
																							mb: 1.5,
																							py: 0.5,
																							textAlign: 'left',
																						}}
																					>
																						<CheckCircle
																							style={{
																								color: getPlanColor(planName),
																								fontSize: '1.2rem',
																								flexShrink: 0,
																								marginTop: '2px',
																							}}
																						/>
																						<Box sx={{ minWidth: 0, flex: 1 }}>
																							<Typography
																								sx={{
																									color: '#E0E0E0',
																									fontSize: {
																										xs: '0.85rem',
																										sm: '0.9rem',
																									},
																									fontWeight: 500,
																									lineHeight: 1.3,
																								}}
																							>
																								{feature}
																							</Typography>
																							{(typeof value === 'number' &&
																								value > 0) ||
																							(typeof value === 'string' &&
																								value !== 'Unlimited' &&
																								value !== 'Included') ? (
																								<Typography
																									variant='body2'
																									sx={{
																										color: '#A0A0A0',
																										fontSize: '0.75rem',
																										mt: 0.25,
																									}}
																								>
																									{typeof value === 'number' &&
																									value > 0
																										? `${value}/month`
																										: value}
																								</Typography>
																							) : null}
																						</Box>
																					</Box>
																				)
																			)}
																		</Box>
																	</Collapse>
																</>
															);
														})()}
													</Box>

													<Button
														variant={isPopular ? 'contained' : 'outlined'}
														fullWidth
														size='medium'
														onClick={() => handleUpgrade(planName)}
														disabled={
															isSignedIn && planName === currentPlan?.plan
														}
														sx={{
															py: 1.5,
															fontSize: '0.95rem',
															fontWeight: 600,
															backgroundColor:
																isSignedIn && planName === currentPlan?.plan
																	? 'rgba(255, 255, 255, 0.1)'
																	: isPopular
																		? '#4CAF50'
																		: 'transparent',
															color:
																isSignedIn && planName === currentPlan?.plan
																	? '#A0A0A0'
																	: isPopular
																		? '#1A1A1A'
																		: getPlanColor(planName),
															border:
																isSignedIn && planName === currentPlan?.plan
																	? '1px solid rgba(255, 255, 255, 0.2)'
																	: isPopular
																		? 'none'
																		: `1px solid ${getPlanColor(planName)}`,
															'&:hover': {
																backgroundColor:
																	isSignedIn && planName === currentPlan?.plan
																		? 'rgba(255, 255, 255, 0.1)'
																		: isPopular
																			? '#45A049'
																			: `rgba(${getPlanColor(planName)
																					.slice(1)
																					.match(/.{2}/g)
																					?.map((hex) => parseInt(hex, 16))
																					.join(', ')}, 0.1)`,
															},
														}}
													>
														{isSignedIn && planName === currentPlan?.plan
															? 'Current Plan'
															: planName === 'FREE'
																? 'Get Started'
																: `Choose Plan`}
													</Button>
												</Paper>
											</Box>
										);
									})}
								</Box>
							</Box>
						</Container>
					</Box>

					{/* Testimonials Section */}
					<Box sx={{ my: 10 }}>
						<Typography
							variant='h4'
							sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}
						>
							What Our Users Say
						</Typography>
						<Grid
							container
							spacing={4}
							justifyContent='center'
						>
							<Grid
								item
								xs={12}
								md={4}
							>
								<Paper sx={{ p: 4, minHeight: 180 }}>
									<Typography
										variant='body1'
										sx={{ mb: 2 }}
									>
										&quot;MealPrep360 has completely changed how I plan my week!
										The AI suggestions are spot on.&quot;
									</Typography>
									<Typography variant='subtitle2'>— Alex R.</Typography>
								</Paper>
							</Grid>
							<Grid
								item
								xs={12}
								md={4}
							>
								<Paper sx={{ p: 4, minHeight: 180 }}>
									<Typography
										variant='body1'
										sx={{ mb: 2 }}
									>
										&quot;I love the freezer tracking and batch prep features.
										Huge time saver!&quot;
									</Typography>
									<Typography variant='subtitle2'>— Jamie L.</Typography>
								</Paper>
							</Grid>
							<Grid
								item
								xs={12}
								md={4}
							>
								<Paper sx={{ p: 4, minHeight: 180 }}>
									<Typography
										variant='body1'
										sx={{ mb: 2 }}
									>
										&quot;The best meal planning app I&apos;ve tried. The AI is
										actually useful!&quot;
									</Typography>
									<Typography variant='subtitle2'>— Morgan S.</Typography>
								</Paper>
							</Grid>
						</Grid>
					</Box>

					{/* Newsletter Signup Section */}
					<Box sx={{ my: 10, textAlign: 'center' }}>
						<Typography
							variant='h4'
							sx={{ fontWeight: 'bold', mb: 2 }}
						>
							Stay in the Loop
						</Typography>
						<Typography sx={{ mb: 3 }}>
							Get meal planning tips and updates delivered to your inbox.
						</Typography>
						<Box
							component='form'
							onSubmit={handleSubscribe}
							sx={{
								display: 'flex',
								justifyContent: 'center',
								gap: 2,
								maxWidth: 400,
								mx: 'auto',
							}}
						>
							<input
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder='Your email'
								required
								style={{
									flex: 1,
									padding: '10px',
									borderRadius: 4,
									border: '1px solid #ccc',
									fontSize: 16,
								}}
							/>
							<Button
								type='submit'
								variant='contained'
								disabled={isSubscribing}
								sx={{
									backgroundColor: '#4B7F47',
									color: 'white',
									'&:hover': {
										backgroundColor: '#406B3C',
									},
								}}
							>
								{isSubscribing ? 'Subscribing...' : 'Subscribe'}
							</Button>
						</Box>
					</Box>

					{/* FAQ Section */}
					<Box
						id='faq'
						sx={{
							py: { xs: 6, md: 8 },
							px: { xs: 2, sm: 4, md: 6 },
						}}
					>
						<Container maxWidth='lg'>
							<Typography
								variant='h2'
								sx={{
									fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
									fontWeight: 700,
									textAlign: 'center',
									mb: { xs: 4, md: 6 },
									color: '#000000',
								}}
							>
								Frequently Asked Questions
							</Typography>
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
							>
								{[
									{
										question: 'How does the AI meal planning work?',
										answer:
											'Our AI analyzes your preferences, dietary restrictions, and available ingredients to create personalized meal plans. It considers factors like cooking time, nutritional balance, and food waste reduction.',
									},
									{
										question: 'Can I customize my meal plans?',
										answer:
											'Yes! You can customize your meal plans by adjusting preferences, adding or removing recipes, and modifying serving sizes. The AI will adapt to your changes while maintaining nutritional balance.',
									},
									{
										question: 'How do I manage my freezer inventory?',
										answer:
											'The app helps you track your frozen meals with expiration dates, storage locations, and defrosting instructions. You can scan barcodes or manually add items to your inventory.',
									},
									{
										question: 'What if I have dietary restrictions?',
										answer:
											'You can set your dietary preferences and restrictions in your profile. The AI will ensure all meal plans and recipes comply with your requirements.',
									},
									{
										question: 'How do I get started?',
										answer:
											'Simply sign up for a free account, set your preferences, and start exploring meal plans. You can try our basic features for free or upgrade to access advanced features.',
									},
									{
										question: 'Can I share meal plans with family?',
										answer:
											'Yes! With our Family plan, you can share meal plans, shopping lists, and recipes with family members. Everyone can contribute to the planning process.',
									},
								].map((faq, index) => (
									<Grid
										item
										xs={12}
										md={6}
										key={index}
									>
										<Paper
											sx={{
												p: { xs: 2, sm: 3 },
												backgroundColor: '#1A1A1A',
												borderRadius: 2,
												height: '100%',
											}}
										>
											<Typography
												variant='h3'
												sx={{
													fontSize: { xs: '1.1rem', sm: '1.25rem' },
													fontWeight: 600,
													color: '#E0E0E0',
													mb: 1,
												}}
											>
												{faq.question}
											</Typography>
											<Typography
												sx={{
													color: '#A0A0A0',
													fontSize: { xs: '0.9rem', sm: '1rem' },
												}}
											>
												{faq.answer}
											</Typography>
										</Paper>
									</Grid>
								))}
							</Grid>
						</Container>
					</Box>
				</Container>
			</Box>
			{/* Ready to Transform Section moved just above the footer */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				className='mb-16'
			>
				<Paper
					elevation={0}
					sx={{
						p: 6,
						backgroundColor: '#4B7F47',
						color: 'white',
						borderRadius: 4,
						mb: 10,
						maxWidth: 1000,
						mx: 'auto',
						textAlign: 'center',
					}}
				>
					<Typography
						variant='h4'
						component='h2'
						sx={{ mb: 2, fontWeight: 'bold' }}
					>
						Ready to Transform Your Kitchen?
					</Typography>
					<Typography
						variant='body1'
						color='text.secondary'
						sx={{ mb: 4, maxWidth: 'md', mx: 'auto' }}
					>
						Join thousands of home cooks who are saving time and reducing food
						waste with RecipeBox
					</Typography>
					<Link href='/auth/signup'>
						<Button
							size='large'
							sx={{
								gap: 1,
								background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
								color: 'white',
								'&:hover': {
									background:
										'linear-gradient(45deg, #FF5252 30%, #FF7B3D 90%)',
								},
							}}
						>
							Start Your Free Trial <ArrowRight className='h-4 w-4' />
						</Button>
					</Link>
				</Paper>
			</motion.div>
			{/* Footer */}
			<Box
				component='footer'
				sx={{
					py: { xs: 4, md: 6 },
					px: { xs: 2, sm: 4, md: 6 },
					backgroundColor: '#1A1A1A',
					borderTop: '1px solid rgba(255, 255, 255, 0.1)',
				}}
			>
				<Container maxWidth='lg'>
					<Grid
						container
						spacing={{ xs: 4, md: 6 }}
					>
						<Grid
							item
							xs={12}
							md={4}
						>
							<Image
								src='/images/logo_dark.png'
								alt='MealPrep360 Logo'
								width={200}
								height={50}
								style={{
									objectFit: 'contain',
									marginBottom: '1rem',
								}}
							/>
							<Typography
								sx={{
									color: '#A0A0A0',
									fontSize: { xs: '0.9rem', sm: '1rem' },
									mb: 2,
								}}
							>
								Making meal prep simple and efficient for everyone.
							</Typography>
						</Grid>
						<Grid
							item
							xs={6}
							md={2}
						>
							<Typography
								variant='h4'
								sx={{
									fontSize: { xs: '1rem', sm: '1.1rem' },
									fontWeight: 600,
									color: '#E0E0E0',
									mb: 2,
								}}
							>
								Product
							</Typography>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 1,
								}}
							>
								<Link
									href='#features'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Features
								</Link>
								<Link
									href='#pricing'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Pricing
								</Link>
								<Link
									href='#faq'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									FAQ
								</Link>
							</Box>
						</Grid>
						<Grid
							item
							xs={6}
							md={2}
						>
							<Typography
								variant='h4'
								sx={{
									fontSize: { xs: '1rem', sm: '1.1rem' },
									fontWeight: 600,
									color: '#E0E0E0',
									mb: 2,
								}}
							>
								Company
							</Typography>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 1,
								}}
							>
								<Link
									href='/about'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									About
								</Link>
								<Link
									href='/blog'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Blog
								</Link>
								<Link
									href='/contact'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Contact
								</Link>
							</Box>
						</Grid>
						<Grid
							item
							xs={6}
							md={2}
						>
							<Typography
								variant='h4'
								sx={{
									fontSize: { xs: '1rem', sm: '1.1rem' },
									fontWeight: 600,
									color: '#E0E0E0',
									mb: 2,
								}}
							>
								Legal
							</Typography>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 1,
								}}
							>
								<Link
									href='/privacy'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Privacy
								</Link>
								<Link
									href='/terms'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Terms
								</Link>
							</Box>
						</Grid>
						<Grid
							item
							xs={6}
							md={2}
						>
							<Typography
								variant='h4'
								sx={{
									fontSize: { xs: '1rem', sm: '1.1rem' },
									fontWeight: 600,
									color: '#E0E0E0',
									mb: 2,
								}}
							>
								Social
							</Typography>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 1,
								}}
							>
								<Link
									href='https://twitter.com/mealprep360'
									target='_blank'
									rel='noopener noreferrer'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Twitter
								</Link>
								<Link
									href='https://instagram.com/mealprep360'
									target='_blank'
									rel='noopener noreferrer'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Instagram
								</Link>
							</Box>
						</Grid>
					</Grid>
					<Box
						sx={{
							mt: { xs: 4, md: 6 },
							pt: { xs: 3, md: 4 },
							borderTop: '1px solid rgba(255, 255, 255, 0.1)',
							textAlign: 'center',
						}}
					>
						<Typography
							sx={{
								color: '#A0A0A0',
								fontSize: { xs: '0.8rem', sm: '0.9rem' },
							}}
						>
							© {new Date().getFullYear()} MealPrep360. All rights reserved.
						</Typography>
					</Box>
				</Container>
			</Box>
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					severity={snackbar.severity}
					variant='filled'
					sx={{ width: '100%' }}
				>
					<Typography
						variant='subtitle1'
						sx={{ fontWeight: 600 }}
					>
						{snackbar.message}
					</Typography>
					{snackbar.description && (
						<Typography
							variant='body2'
							sx={{ mt: 0.5 }}
						>
							{snackbar.description}
						</Typography>
					)}
				</Alert>
			</Snackbar>
		</Box>
	);
}

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<Grid
			item
			xs={12}
			sm={6}
			md={4}
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<Paper
					elevation={0}
					sx={{
						p: 4,
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						textAlign: 'center',
						border: '1px solid',
						borderColor: 'divider',
						backgroundColor: 'background.paper',
						'&:hover': {
							boxShadow: 2,
							transform: 'translateY(-4px)',
							transition: 'all 0.2s ease-in-out',
						},
					}}
				>
					<Box sx={{ color: 'primary.main', mb: 2 }}>{icon}</Box>
					<Typography
						variant='h5'
						component='h3'
						sx={{ mb: 1, fontWeight: 'medium' }}
					>
						{title}
					</Typography>
					<Typography color='text.secondary'>{description}</Typography>
				</Paper>
			</motion.div>
		</Grid>
	);
}
