'use client';

import React, { useState, useEffect } from 'react';
import {
	Box,
	AppBar,
	Toolbar,
	Typography,
	Button,
	IconButton,
	Menu,
	MenuItem,
	useMediaQuery,
	Modal,
	Paper,
	Stack,
	Divider,
	Collapse,
	Avatar,
	Switch,
	FormControlLabel,
	Chip,
	Grid,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Calendar, Settings, LogOut } from 'lucide-react';
import { Restaurant as RecipeIcon } from '@mui/icons-material';
import { Tune as TuneIcon } from '@mui/icons-material';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTranslations } from '@/hooks/use-translations';
import { useTheme } from '@mui/material/styles';
import { useSubscription } from '@/contexts/subscription-context';
import { PLAN_NAMES, PLAN_PRICES, PLAN_FEATURES } from '@/types/subscription';
import {
	CheckCircle,
	Star,
	ExpandMore,
	ExpandLess,
	ArrowLeft,
	ArrowRight,
} from '@mui/icons-material';
import { SubscriptionPlan } from '@/types/subscription';
import { PlanSection } from './plan-section';

interface MainNavProps {
	logoSize?: number;
	logoCentered?: boolean;
}

function MainNavContent({
	logoSize = 160,
	logoCentered = false,
}: MainNavProps): JSX.Element {
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === 'dark';
	const pathname = usePathname();
	const { signOut } = useClerk();
	const { user, isLoaded } = useUser();
	const translations = useTranslations();

	// Don't render user-specific content until loaded
	if (!isLoaded) {
		return (
			<AppBar
				position='static'
				color='default'
				elevation={1}
				sx={{ minHeight: '64px' }}
			>
				<Toolbar
					sx={{
						justifyContent: 'space-between',
						minHeight: '64px',
						px: { xs: 1, sm: 2, md: 3 },
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Image
							src={isDarkMode ? '/images/logo_dark.png' : '/images/logo.png'}
							alt='MealPrep360 Logo'
							width={logoSize}
							height={logoSize / 4}
							style={{ objectFit: 'contain' }}
						/>
					</Box>
				</Toolbar>
			</AppBar>
		);
	}

	// Align "mobile" breakpoint with layouts (mobile < 1280px)
	const isMobile = !useMediaQuery('(min-width:1280px)', { noSsr: true });
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

	const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
		setMenuAnchor(event.currentTarget);
	};

	const handleMenuClose = () => {
		setMenuAnchor(null);
	};

	const handleSignOut = () => {
		signOut();
	};

	return (
		<>
			<AppBar
				position='static'
				color='default'
				elevation={1}
			>
				<Toolbar
					sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2, md: 3 } }}
				>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Link
							href='/'
							passHref
						>
							<Image
								src={isDarkMode ? '/images/logo_dark.png' : '/images/logo.png'}
								alt='MealPrep360 Logo'
								width={logoSize}
								height={logoSize / 4}
								priority
								style={{ objectFit: 'contain', cursor: 'pointer' }}
							/>
						</Link>
					</Box>

					{/* Desktop: show plan right after the logo */}
					{!isMobile && (
						<Box sx={{ ml: 2 }}>
							<PlanSection />
						</Box>
					)}

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						{!isMobile && (
							<>
								<Button
									component={Link}
									href='/dashboard'
									color='inherit'
									startIcon={<Home />}
								>
									{translations.common.dashboard}
								</Button>
								<Button
									component={Link}
									href='/my-recipes'
									color='inherit'
									startIcon={<RecipeIcon />}
								>
									{translations.common.recipes}
								</Button>
								<Button
									component={Link}
									href='/my-mealplans'
									color='inherit'
									startIcon={<Calendar />}
								>
									{translations.common.myMealPlans}
								</Button>
							</>
						)}
						<IconButton
							edge='end'
							color='inherit'
							aria-label='menu'
							onClick={handleMenuClick}
						>
							<MenuIcon />
						</IconButton>

						<Menu
							anchorEl={menuAnchor}
							open={Boolean(menuAnchor)}
							onClose={handleMenuClose}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'right',
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
						>
							<MenuItem sx={{ opacity: 0.7, cursor: 'default' }}>
								{user?.emailAddresses?.[0]?.emailAddress}
							</MenuItem>
							<Divider />
							{isMobile && (
								<>
									<MenuItem
										component={Link}
										href='/dashboard'
										onClick={handleMenuClose}
									>
										<Box
											component={Home}
											sx={{ mr: 1 }}
										/>{' '}
										{translations.common.dashboard}
									</MenuItem>
									<MenuItem
										component={Link}
										href='/my-recipes'
										onClick={handleMenuClose}
									>
										<Box
											component={RecipeIcon}
											sx={{ mr: 1 }}
										/>{' '}
										{translations.common.recipes}
									</MenuItem>
									<MenuItem
										component={Link}
										href='/my-mealplans'
										onClick={handleMenuClose}
									>
										<Box
											component={Calendar}
											sx={{ mr: 1 }}
										/>{' '}
										{translations.common.mealPlan}
									</MenuItem>
									<Divider />
								</>
							)}
							<MenuItem
								component={Link}
								href='/preferences'
								onClick={handleMenuClose}
							>
								<Box
									component={TuneIcon}
									sx={{ mr: 1 }}
								/>{' '}
								{translations.common.preferences}
							</MenuItem>
							<MenuItem
								component={Link}
								href='/settings'
								onClick={handleMenuClose}
							>
								<Box
									component={Settings}
									sx={{ mr: 1 }}
								/>{' '}
								{translations.common.settings}
							</MenuItem>
							<Divider />
							<MenuItem onClick={handleSignOut}>
								<Box
									component={LogOut}
									sx={{ mr: 1 }}
								/>{' '}
								{translations.common.signOut}
							</MenuItem>
						</Menu>
					</Box>
				</Toolbar>
			</AppBar>
		</>
	);
}

export function MainNav(props: MainNavProps): JSX.Element {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Don't render during SSR to avoid hydration mismatch
	if (!mounted) {
		return (
			<AppBar
				position='static'
				color='default'
				elevation={1}
				sx={{ minHeight: '64px' }}
			>
				<Toolbar
					sx={{
						justifyContent: 'space-between',
						minHeight: '64px',
						px: { xs: 1, sm: 2, md: 3 },
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Link
							href='/'
							passHref
						>
							<Image
								src='/images/logo.png'
								alt='MealPrep360 Logo'
								width={props.logoSize || 160}
								height={40}
								priority
								style={{
									objectFit: 'contain',
									cursor: 'pointer',
								}}
							/>
						</Link>
					</Box>
				</Toolbar>
			</AppBar>
		);
	}

	return <MainNavContent {...props} />;
}
