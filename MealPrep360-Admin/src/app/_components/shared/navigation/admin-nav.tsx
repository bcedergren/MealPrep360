'use client';

import {
	AppBar,
	Toolbar,
	Typography,
	Box,
	IconButton,
	Menu,
	MenuItem,
	Divider,
	Avatar,
	useMediaQuery,
	useTheme,
	Button,
	CircularProgress,
} from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import {
	Dashboard as DashboardIcon,
	People as PeopleIcon,
	Restaurant as RestaurantIcon,
	Logout as LogoutIcon,
	Person as PersonIcon,
	Image as ImageIcon,
	Article as ArticleIcon,
	Notifications as NotificationsIcon,
	Settings as SettingsIcon,
	HealthAndSafety as HealthIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

const adminRoutes = [
	{
		path: '/dashboard',
		label: 'Dashboard',
		icon: DashboardIcon,
	},
	{
		path: '/users',
		label: 'Users',
		icon: PeopleIcon,
	},
	{
		path: '/recipes',
		label: 'Recipes',
		icon: RestaurantIcon,
	},
	{
		path: '/blog',
		label: 'Blog Posts',
		icon: ArticleIcon,
	},
	{
		path: '/notifications',
		label: 'Notifications',
		icon: NotificationsIcon,
	},
	{
		path: '/feedback',
		label: 'Feedback',
		icon: ImageIcon,
	},
	{
		path: '/admin/services',
		label: 'Service Health',
		icon: HealthIcon,
	},
];

export function AdminNav() {
	const { userId, isLoaded, sessionId } = useAuth();
	const { signOut } = useClerk();
	const router = useRouter();
	const pathname = usePathname();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleSignOut = async () => {
		try {
			await signOut();
			router.push('/');
		} catch (error) {
			console.error('Error signing out:', error);
		}
	};

	if (!isLoaded) {
		return (
			<AppBar
				position='static'
				color='transparent'
				elevation={1}
			>
				<Toolbar>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							width: '100%',
							justifyContent: 'center',
						}}
					>
						<CircularProgress size={24} />
					</Box>
				</Toolbar>
			</AppBar>
		);
	}

	if (!userId) {
		return null;
	}

	return (
		<AppBar
			position='static'
			color='transparent'
			elevation={1}
			sx={{
				backgroundColor: 'white',
				borderBottom: '1px solid',
				borderColor: 'divider',
			}}
		>
			<Toolbar>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Image
						src='/logo.png'
						alt='MealPrep360 Admin'
						width={180}
						height={40}
					/>
				</Box>
				<Box
					sx={{
						flexGrow: 1,
						display: 'flex',
						justifyContent: 'flex-end',
						gap: 1,
					}}
				>
					{adminRoutes.map((route) => (
						<Button
							key={route.path}
							onClick={() => router.push(route.path)}
							startIcon={<route.icon />}
							color='inherit'
							sx={{
								color: 'text.primary',
								backgroundColor:
									pathname === route.path ? 'action.selected' : 'transparent',
								'&:hover': {
									backgroundColor: 'action.hover',
								},
							}}
						>
							{route.label}
						</Button>
					))}
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<IconButton
						size='large'
						aria-label='notifications'
						color='inherit'
						sx={{ color: 'text.primary' }}
					>
						<NotificationsIcon />
					</IconButton>
					<IconButton
						size='large'
						aria-label='account of current user'
						aria-controls='menu-appbar'
						aria-haspopup='true'
						onClick={handleMenu}
						color='inherit'
						sx={{ color: 'text.primary' }}
					>
						<Avatar sx={{ width: 32, height: 32 }} />
					</IconButton>
					<Menu
						id='menu-appbar'
						anchorEl={anchorEl}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						keepMounted
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						open={Boolean(anchorEl)}
						onClose={handleClose}
					>
						<MenuItem onClick={() => router.push('/profile')}>
							<PersonIcon
								fontSize='small'
								sx={{ mr: 1 }}
							/>
							Profile
						</MenuItem>
						<MenuItem onClick={() => router.push('/settings')}>
							<SettingsIcon
								fontSize='small'
								sx={{ mr: 1 }}
							/>
							Settings
						</MenuItem>
						<Divider />
						<MenuItem onClick={handleSignOut}>
							<LogoutIcon
								fontSize='small'
								sx={{ mr: 1 }}
							/>
							Sign Out
						</MenuItem>
					</Menu>
				</Box>
			</Toolbar>
		</AppBar>
	);
}
