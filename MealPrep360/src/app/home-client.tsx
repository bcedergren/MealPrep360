'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/subscription-context';
import { SubscriptionPlan } from '@/types/subscription';
import {
	Box,
	Container,
	Typography,
	Button,
	Grid,
	Card,
	CardContent,
	CardActions,
	Paper,
	TextField,
	InputAdornment,
	Snackbar,
	Alert,
	IconButton,
	AppBar,
	Toolbar,
	useMediaQuery,
	Menu,
	MenuItem,
	Modal,
	Stack,
	Divider,
	Collapse,
	Chip,
	Avatar,
	Switch,
	FormControlLabel,
	Drawer,
	List,
	ListItem,
	ListItemText,
} from '@mui/material';
import {
	Email,
	CheckCircle,
	Star,
	ExpandMore,
	ExpandLess,
	ArrowLeft,
	ArrowRight,
	Menu as MenuIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { PLAN_NAMES, PLAN_PRICES, PLAN_FEATURES } from '@/types/subscription';

export default function HomeClient() {
	const { isSignedIn, isLoaded } = useAuth();
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const { currentPlan, upgradePlan } = useSubscription();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Don't render until mounted and Clerk is loaded
	if (!mounted || !isLoaded) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
				}}
			>
				<div>Loading...</div>
			</Box>
		);
	}

	const [isScrolled, setIsScrolled] = useState(false);
	const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(
		null
	);
	const [email, setEmail] = useState('');
	const [isSubscribing, setIsSubscribing] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		description: '',
		severity: 'success' as 'success' | 'error' | 'warning' | 'info',
	});

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
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

	return (
		<Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* Hero Section */}
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
						backgroundPosition: 'center',
						filter: 'brightness(0.7)',
						zIndex: 1,
					},
				}}
			>
				<Container
					maxWidth='lg'
					sx={{
						position: 'relative',
						zIndex: 2,
						textAlign: 'center',
						color: 'white',
					}}
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
					>
						<Typography
							variant='h1'
							component='h1'
							sx={{
								fontSize: { xs: '3rem', md: '4.5rem' },
								fontWeight: 'bold',
								mb: 3,
								textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
							}}
						>
							MealPrep360
						</Typography>
						<Typography
							variant='h4'
							component='h2'
							sx={{
								fontSize: { xs: '1.5rem', md: '2rem' },
								mb: 4,
								textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
								maxWidth: '800px',
								mx: 'auto',
							}}
						>
							Your AI-powered kitchen companion
						</Typography>
						<Typography
							variant='h6'
							sx={{
								mb: 6,
								textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
								maxWidth: '600px',
								mx: 'auto',
							}}
						>
							Smart meal planning, recipe management, and cooking assistance.
						</Typography>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={3}
							justifyContent='center'
							alignItems='center'
						>
							<Button
								component={Link}
								href='/dashboard'
								variant='contained'
								size='large'
								sx={{
									px: 4,
									py: 2,
									fontSize: '1.1rem',
									fontWeight: 'bold',
									backgroundColor: '#4CAF50',
									'&:hover': {
										backgroundColor: '#45a049',
										transform: 'translateY(-2px)',
									},
									transition: 'all 0.3s ease',
								}}
							>
								Get Started
							</Button>
							<Button
								component={Link}
								href='/pricing'
								variant='outlined'
								size='large'
								sx={{
									px: 4,
									py: 2,
									fontSize: '1.1rem',
									fontWeight: 'bold',
									color: 'white',
									borderColor: 'white',
									'&:hover': {
										borderColor: '#4CAF50',
										backgroundColor: 'rgba(76, 175, 80, 0.1)',
										transform: 'translateY(-2px)',
									},
									transition: 'all 0.3s ease',
								}}
							>
								View Pricing
							</Button>
						</Stack>
					</motion.div>
				</Container>
			</Box>

			{/* Features Section */}
			<Container
				maxWidth='lg'
				sx={{ py: 8 }}
			>
				<Typography
					variant='h2'
					component='h2'
					align='center'
					sx={{
						mb: 6,
						fontWeight: 'bold',
						color: 'text.primary',
					}}
				>
					Why Choose MealPrep360?
				</Typography>
				<Grid
					container
					spacing={4}
				>
					<Grid
						item
						xs={12}
						md={4}
					>
						<Card
							sx={{
								height: '100%',
								textAlign: 'center',
								p: 3,
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: 6,
								},
								transition: 'all 0.3s ease',
							}}
						>
							<CardContent>
								<Typography
									variant='h5'
									component='h3'
									gutterBottom
								>
									AI-Powered Planning
								</Typography>
								<Typography
									variant='body1'
									color='text.secondary'
								>
									Let our AI create personalized meal plans based on your
									preferences, dietary restrictions, and schedule.
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid
						item
						xs={12}
						md={4}
					>
						<Card
							sx={{
								height: '100%',
								textAlign: 'center',
								p: 3,
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: 6,
								},
								transition: 'all 0.3s ease',
							}}
						>
							<CardContent>
								<Typography
									variant='h5'
									component='h3'
									gutterBottom
								>
									Smart Shopping Lists
								</Typography>
								<Typography
									variant='body1'
									color='text.secondary'
								>
									Automatically generated shopping lists that sync with your
									meal plans and track your pantry inventory.
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid
						item
						xs={12}
						md={4}
					>
						<Card
							sx={{
								height: '100%',
								textAlign: 'center',
								p: 3,
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: 6,
								},
								transition: 'all 0.3s ease',
							}}
						>
							<CardContent>
								<Typography
									variant='h5'
									component='h3'
									gutterBottom
								>
									Recipe Management
								</Typography>
								<Typography
									variant='body1'
									color='text.secondary'
								>
									Organize your favorite recipes, discover new ones, and get
									step-by-step cooking guidance.
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			</Container>

			{/* Newsletter Section */}
			<Box sx={{ bgcolor: 'grey.100', py: 8 }}>
				<Container maxWidth='md'>
					<Typography
						variant='h4'
						component='h2'
						align='center'
						sx={{ mb: 3, fontWeight: 'bold' }}
					>
						Stay Updated
					</Typography>
					<Typography
						variant='body1'
						align='center'
						color='text.secondary'
						sx={{ mb: 4 }}
					>
						Get the latest meal planning tips and feature updates delivered to
						your inbox.
					</Typography>
					<Box
						component='form'
						onSubmit={handleSubscribe}
						sx={{
							display: 'flex',
							gap: 2,
							maxWidth: 500,
							mx: 'auto',
							flexDirection: { xs: 'column', sm: 'row' },
						}}
					>
						<TextField
							fullWidth
							type='email'
							placeholder='Enter your email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							InputProps={{
								startAdornment: (
									<InputAdornment position='start'>
										<Email />
									</InputAdornment>
								),
							}}
						/>
						<Button
							type='submit'
							variant='contained'
							disabled={isSubscribing}
							sx={{
								px: 4,
								whiteSpace: 'nowrap',
								minWidth: { xs: 'auto', sm: 140 },
							}}
						>
							{isSubscribing ? 'Subscribing...' : 'Subscribe'}
						</Button>
					</Box>
				</Container>
			</Box>

			{/* Snackbar for notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					severity={snackbar.severity}
					sx={{ width: '100%' }}
				>
					<Typography
						variant='body2'
						fontWeight='bold'
					>
						{snackbar.message}
					</Typography>
					{snackbar.description && (
						<Typography variant='body2'>{snackbar.description}</Typography>
					)}
				</Alert>
			</Snackbar>
		</Box>
	);
}
