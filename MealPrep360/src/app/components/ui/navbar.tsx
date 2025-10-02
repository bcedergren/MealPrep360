import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu as MenuIcon, X } from 'lucide-react';
import { useSubscription } from '@/contexts/subscription-context';
import {
	AppBar,
	Box,
	Button,
	IconButton,
	Toolbar,
	Typography,
	Drawer,
	List,
	ListItem,
	ListItemText,
	useTheme,
	useMediaQuery,
} from '@mui/material';

export function Navbar() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { currentPlan, isLoading } = useSubscription();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	useEffect(() => {
		setMounted(true);
	}, []);

	// Check if user has access to freezer features
	const hasFreezerAccess = currentPlan && currentPlan !== 'FREE';

	// Show basic structure even during loading
	const showNavLinks = mounted && !isLoading;

	type NavLink = {
		href: string;
		label: string;
		color?:
			| 'inherit'
			| 'warning'
			| 'primary'
			| 'secondary'
			| 'success'
			| 'error'
			| 'info';
	};

	const navLinks: NavLink[] = [
		{ href: '/', label: 'Home' },
		{ href: '/my-recipes', label: 'My Recipes' },
		{ href: '/dashboard', label: 'Planner' },
		{
			href: hasFreezerAccess ? '/freezer' : '/pricing',
			label: hasFreezerAccess ? 'Freezer' : 'Freezer (Upgrade)',
			color: hasFreezerAccess ? 'inherit' : 'warning',
		},
		{ href: '/assistant', label: 'AI Assistant' },
		{ href: '/snap', label: 'Snap-to-Recipe' },
	];

	return (
		<AppBar
			position='static'
			sx={{ bgcolor: 'grey.900' }}
		>
			<Toolbar>
				{/* Mobile menu button */}
				{showNavLinks && isMobile && (
					<IconButton
						edge='start'
						color='inherit'
						aria-label='menu'
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						sx={{ mr: 2 }}
					>
						{isMenuOpen ? <X /> : <MenuIcon />}
					</IconButton>
				)}

				{/* Desktop menu */}
				{showNavLinks && !isMobile && (
					<Box sx={{ display: 'flex', gap: 2 }}>
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								style={{ textDecoration: 'none' }}
							>
								<Button
									color={link.color || 'inherit'}
									sx={{
										'&:hover': {
											bgcolor: 'rgba(255, 255, 255, 0.08)',
										},
									}}
								>
									{link.label}
								</Button>
							</Link>
						))}
					</Box>
				)}
			</Toolbar>

			{/* Mobile menu drawer */}
			{showNavLinks && (
				<Drawer
					anchor='left'
					open={isMobile && isMenuOpen}
					onClose={() => setIsMenuOpen(false)}
					PaperProps={{
						sx: { width: 240, bgcolor: 'grey.900' },
					}}
				>
					<List>
						{navLinks.map((link) => (
							<ListItem
								key={link.href}
								component={Link}
								href={link.href}
								onClick={() => setIsMenuOpen(false)}
								sx={{
									color:
										link.color === 'warning' ? 'warning.main' : 'common.white',
									'&:hover': {
										bgcolor: 'rgba(255, 255, 255, 0.08)',
									},
								}}
							>
								<ListItemText primary={link.label} />
							</ListItem>
						))}
					</List>
				</Drawer>
			)}
		</AppBar>
	);
}
