'use client';

import { Box } from '@mui/material';
import { MainNav } from '../components/shared/navigation/main-nav';
import { Footer } from '../components/shared/navigation/footer';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { PlanSection } from '../components/shared/navigation/plan-section';
import { useUserInitialization } from '@/hooks/useUserInitialization';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userId, isLoaded } = useAuth();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	const [isHydrated, setIsHydrated] = useState(false);
	const isMobile = !useMediaQuery('(min-width:1280px)', { noSsr: true });

	// Initialize user on external API
	const { isInitialized, isInitializing } = useUserInitialization();

	// Handle mounting and hydration
	useEffect(() => {
		setMounted(true);
		// Small delay to ensure hydration is complete
		const timer = setTimeout(() => {
			setIsHydrated(true);
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	// Handle authentication redirect
	useEffect(() => {
		if (isHydrated && isLoaded && !userId) {
			router.push('/auth/signin');
		}
	}, [isHydrated, isLoaded, userId, router]);

	// Show loading state until component is fully hydrated and Clerk is loaded
	if (!mounted || !isHydrated || !isLoaded) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
					backgroundColor: 'background.default',
				}}
			>
				<div>Loading...</div>
			</Box>
		);
	}

	// Show initializing state if user is being set up
	if (isInitializing) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
					backgroundColor: 'background.default',
				}}
			>
				<div>Setting up your account...</div>
			</Box>
		);
	}

	// Redirect to sign-in if not authenticated
	if (!userId) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
					backgroundColor: 'background.default',
				}}
			>
				<div>Redirecting to sign in...</div>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '100vh',
			}}
		>
			<Box
				component='header'
				sx={{
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					py: isMobile ? 0.5 : 1.5,
				}}
			>
				<MainNav
					logoSize={180}
					logoCentered
				/>
			</Box>
			{isMobile && (
				<Box
					sx={{
						width: '100%',
						maxWidth: '100%',
						mx: 'auto',
						bgcolor: 'background.paper',
						borderBottom: 1,
						borderColor: 'divider',
						py: 0.5,
						px: 2,
						display: 'flex',
						justifyContent: 'center',
					}}
				>
					<PlanSection mobile />
				</Box>
			)}
			<Box
				component='main'
				sx={{
					flexGrow: 1,
					p: 0,
				}}
			>
				{children}
			</Box>
			<Footer />
		</Box>
	);
}
