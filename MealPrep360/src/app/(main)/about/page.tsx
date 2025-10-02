'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import Link from 'next/link';
import { Lightbulb, Sparkles, Leaf, Users } from 'lucide-react';
import {
	AppBar,
	Toolbar,
	IconButton,
	useMediaQuery,
	useTheme,
	Drawer,
	List,
	ListItem,
	ListItemText,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Image from 'next/image';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import { PageHeader } from '../../components/shared/page-header';
import { Info as InfoIcon } from '@mui/icons-material';

const NavLink = styled('a')(({ theme }) => ({
	color: '#E0E0E0',
	textDecoration: 'none',
	fontSize: '0.9rem',
	fontWeight: 500,
	letterSpacing: '0.3px',
	padding: '0.5rem 0',
	position: 'relative',
	cursor: 'pointer',
	[theme.breakpoints.down('sm')]: {
		fontSize: '1rem',
		padding: '0.75rem 0',
	},
	'&::after': {
		content: '""',
		position: 'absolute',
		width: '100%',
		height: '1px',
		bottom: 0,
		left: 0,
		backgroundColor: '#E0E0E0',
		transform: 'scaleX(0)',
		transformOrigin: 'right',
		transition: 'transform 0.3s ease',
	},
	'&:hover::after': {
		transform: 'scaleX(1)',
		transformOrigin: 'left',
	},
}));

const SignInLink = styled('a')(({ theme }) => ({
	color: '#E0E0E0',
	textDecoration: 'none',
	fontSize: '0.9rem',
	fontWeight: 500,
	letterSpacing: '0.3px',
	padding: '0.5rem 1.5rem',
	backgroundColor: 'rgba(255, 255, 255, 0.1)',
	borderRadius: '4px',
	transition: 'all 0.3s ease',
	[theme.breakpoints.down('sm')]: {
		fontSize: '1rem',
		padding: '0.75rem 1.5rem',
		width: '100%',
		textAlign: 'center',
		marginTop: '0.5rem',
	},
	'&:hover': {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		transform: 'translateY(-1px)',
	},
}));

const values = [
	{
		title: 'Innovation',
		description:
			'We constantly push the boundaries of what is possible in meal planning technology.',
		icon: <Lightbulb className='h-12 w-12 text-[#4B7F47]' />,
	},
	{
		title: 'Simplicity',
		description:
			'We believe in making complex tasks simple and accessible to everyone.',
		icon: <Sparkles className='h-12 w-12 text-[#4B7F47]' />,
	},
	{
		title: 'Sustainability',
		description:
			'We are committed to reducing food waste and promoting sustainable cooking practices.',
		icon: <Leaf className='h-12 w-12 text-[#4B7F47]' />,
	},
	{
		title: 'Community',
		description:
			'We foster a community of home cooks who share knowledge and inspire each other.',
		icon: <Users className='h-12 w-12 text-[#4B7F47]' />,
	},
];

export default function AboutPage() {
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
			<PageHeader
				title='About MealPrep360'
				description='Learn more about our mission and values'
				backgroundColor='linear-gradient(45deg, #4CAF50 30%, #81C784 90%)'
				icon={<InfoIcon sx={{ fontSize: 180 }} />}
			/>
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
								</List>
							</Drawer>
						</>
					) : (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<NavLink onClick={() => scrollToSection('features')}>
								Features
							</NavLink>
							<NavLink onClick={() => scrollToSection('pricing')}>
								Pricing
							</NavLink>
							<NavLink onClick={() => scrollToSection('faq')}>FAQ</NavLink>
							<SignInLink href='/auth/signin'>Sign In</SignInLink>
						</Box>
					)}
				</Toolbar>
			</AppBar>
			{/* Rest of the About page content */}
			<Box
				component='main'
				sx={{ flex: 1 }}
			>
				{/* Hero Section */}
				<Box
					sx={{
						position: 'relative',
						height: '70vh',
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
							backgroundImage: 'url("/images/about-hero.png")',
							backgroundSize: 'cover',
							backgroundPosition: 'center 30%',
							filter: 'brightness(0.85)',
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
							textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
						}}
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
						>
							<Typography
								variant='h2'
								component='h1'
								sx={{
									fontSize: { xs: '2.5rem', md: '3.5rem' },
									fontWeight: 'bold',
									mb: 3,
									textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
								}}
							>
								Our Story
							</Typography>
							<Typography
								variant='h5'
								sx={{
									textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
									maxWidth: '600px',
									mx: 'auto',
								}}
							>
								Transforming the way people plan, prepare, and enjoy their meals
							</Typography>
						</motion.div>
					</Box>
				</Box>

				{/* Mission Section */}
				<Box sx={{ py: { xs: 6, md: 8 }, px: { xs: 2, sm: 4, md: 6 } }}>
					<Container maxWidth='lg'>
						<Grid
							container
							spacing={4}
							alignItems='center'
						>
							<Grid
								item
								xs={12}
								md={6}
							>
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5 }}
								>
									<Typography
										variant='h3'
										sx={{ mb: 3, fontWeight: 'bold' }}
									>
										Our Mission
									</Typography>
									<Typography
										variant='body1'
										sx={{ mb: 2, fontSize: '1.1rem', lineHeight: 1.7 }}
									>
										At MealPrep360, we&apos;re on a mission to revolutionize
										home cooking by making meal planning and preparation
										effortless, enjoyable, and sustainable.
									</Typography>
									<Typography
										variant='body1'
										sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}
									>
										We believe that everyone deserves to enjoy delicious,
										healthy meals without the stress of planning and
										preparation. Our AI-powered platform helps you save time,
										reduce food waste, and discover new recipes that match your
										preferences and dietary needs.
									</Typography>
								</motion.div>
							</Grid>
							<Grid
								item
								xs={12}
								md={6}
							>
								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: 0.2 }}
								>
									<Box
										sx={{
											position: 'relative',
											width: '100%',
											height: 0,
											paddingBottom: '100%',
											overflow: 'hidden',
											borderRadius: 2,
											boxShadow: 3,
											maxWidth: '500px',
											margin: '0 auto',
										}}
									>
										<Box
											component='img'
											src='/images/OurStory.png'
											alt='Our Mission'
											sx={{
												position: 'absolute',
												top: 0,
												left: 0,
												width: '100%',
												height: '100%',
												objectFit: 'contain',
											}}
										/>
									</Box>
								</motion.div>
							</Grid>
						</Grid>
					</Container>
				</Box>

				{/* Values Section */}
				<Box
					sx={{
						py: { xs: 6, md: 8 },
						px: { xs: 2, sm: 4, md: 6 },
						backgroundColor: '#f5f5f5',
					}}
				>
					<Container maxWidth='lg'>
						<Typography
							variant='h3'
							sx={{ mb: 6, textAlign: 'center', fontWeight: 'bold' }}
						>
							Our Values
						</Typography>
						<Grid
							container
							spacing={4}
						>
							{values.map((value, index) => (
								<Grid
									item
									xs={12}
									sm={6}
									md={3}
									key={index}
								>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: index * 0.1 }}
									>
										<Paper
											sx={{
												p: 4,
												height: '100%',
												minHeight: '300px',
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												textAlign: 'center',
												transition: 'transform 0.3s ease-in-out',
												'&:hover': {
													transform: 'translateY(-8px)',
												},
											}}
										>
											<Box sx={{ mb: 2 }}>{value.icon}</Box>
											<Typography
												variant='h5'
												component='h3'
												sx={{ mb: 2, fontWeight: 'bold' }}
											>
												{value.title}
											</Typography>
											<Typography
												color='text.secondary'
												sx={{ flex: 1 }}
											>
												{value.description}
											</Typography>
										</Paper>
									</motion.div>
								</Grid>
							))}
						</Grid>
					</Container>
				</Box>
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
									href='/#features'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Features
								</Link>
								<Link
									href='/#pricing'
									style={{
										color: '#A0A0A0',
										textDecoration: 'none',
										fontSize: '0.9rem',
									}}
								>
									Pricing
								</Link>
								<Link
									href='/#faq'
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
		</Box>
	);
}
