'use client';

import {
	Box,
	AppBar,
	Toolbar,
	IconButton,
	Menu,
	MenuItem,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Container, Grid, Typography } from '@mui/material';

const NavLink = ({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) => (
	<Link href={href}>
		<Box
			sx={{
				color: '#E0E0E0',
				textDecoration: 'none',
				fontSize: '0.9rem',
				fontWeight: 500,
				letterSpacing: '0.3px',
				padding: '0.5rem 0',
				position: 'relative',
				cursor: 'pointer',
			}}
		>
			{children}
		</Box>
	</Link>
);

const SignInLink = () => (
	<Link href='/auth/signin'>
		<Box
			sx={{
				color: '#E0E0E0',
				textDecoration: 'none',
				fontSize: '0.9rem',
				fontWeight: 500,
				letterSpacing: '0.3px',
				padding: '0.5rem 1.5rem',
				backgroundColor: 'rgba(255, 255, 255, 0.1)',
				borderRadius: '4px',
				transition: 'all 0.3s ease',
			}}
		>
			Sign In
		</Box>
	</Link>
);

export default function BlogLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(
		null
	);

	const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setMobileMenuAnchor(event.currentTarget);
	};

	const handleMobileMenuClose = () => {
		setMobileMenuAnchor(null);
	};

	const scrollToSection = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
		handleMobileMenuClose();
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
					{/* @ts-ignore */}
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
							<Menu
								anchorEl={mobileMenuAnchor}
								open={Boolean(mobileMenuAnchor)}
								onClose={handleMobileMenuClose}
							>
								<MenuItem onClick={() => scrollToSection('features')}>
									Features
								</MenuItem>
								<MenuItem onClick={() => scrollToSection('pricing')}>
									Pricing
								</MenuItem>
								<MenuItem onClick={() => scrollToSection('faq')}>FAQ</MenuItem>
							</Menu>
						</>
					) : (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<NavLink href='/#features'>Features</NavLink>
							<NavLink href='/#pricing'>Pricing</NavLink>
							<NavLink href='/#faq'>FAQ</NavLink>
							<SignInLink />
						</Box>
					)}
				</Toolbar>
			</AppBar>
			<Box sx={{ height: '64px' }} /> {/* Spacer for fixed AppBar */}
			<Box
				component='main'
				sx={{ flex: 1 }}
			>
				{children}
			</Box>
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
							{/* @ts-ignore */}
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
								<Link href='/#features'>
									<Box
										sx={{
											color: '#A0A0A0',
											textDecoration: 'none',
											fontSize: '0.9rem',
										}}
									>
										Features
									</Box>
								</Link>
								<Link href='/#pricing'>
									<Box
										sx={{
											color: '#A0A0A0',
											textDecoration: 'none',
											fontSize: '0.9rem',
										}}
									>
										Pricing
									</Box>
								</Link>
								<Link href='/#faq'>
									<Box
										sx={{
											color: '#A0A0A0',
											textDecoration: 'none',
											fontSize: '0.9rem',
										}}
									>
										FAQ
									</Box>
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
								<Link href='/about'>
									<Box
										sx={{
											color: '#A0A0A0',
											textDecoration: 'none',
											fontSize: '0.9rem',
										}}
									>
										About
									</Box>
								</Link>
								<Link href='/blog'>
									<Box
										sx={{
											color: '#A0A0A0',
											textDecoration: 'none',
											fontSize: '0.9rem',
										}}
									>
										Blog
									</Box>
								</Link>
								<Link href='/contact'>
									<Box
										sx={{
											color: '#A0A0A0',
											textDecoration: 'none',
											fontSize: '0.9rem',
										}}
									>
										Contact
									</Box>
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
								<Link href='/privacy'>
									<Box
										sx={{
											color: '#A0A0A0',
											textDecoration: 'none',
											fontSize: '0.9rem',
										}}
									>
										Privacy
									</Box>
								</Link>
								<Link href='/terms'>
									<Box
										sx={{
											color: '#A0A0A0',
											textDecoration: 'none',
											fontSize: '0.9rem',
										}}
									>
										Terms
									</Box>
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
								<Box
									component='a'
									href='https://twitter.com/mealprep360'
									target='_blank'
									rel='noopener noreferrer'
									sx={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Twitter
								</Box>
								<Box
									component='a'
									href='https://instagram.com/mealprep360'
									target='_blank'
									rel='noopener noreferrer'
									sx={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Instagram
								</Box>
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
		</Box>
	);
}
