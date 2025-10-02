'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { AdminNav } from '../navigation/admin-nav';
import { AdminFooter } from '../navigation/admin-footer';
import { MainContent } from './main-content';

const publicPaths = ['/', '/signup', '/sign-in', '/sign-up'];

export default function RootLayoutWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userId, isLoaded, sessionId } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

	useEffect(() => {
		// Only redirect if auth state is loaded and we're not already on a public route
		if (isLoaded) {
			const isPublicPath = publicPaths.includes(pathname);

			if (!userId && !isPublicPath) {
				router.replace('/');
			} else if (userId && isPublicPath) {
				router.replace('/dashboard');
			} else {
				setIsCheckingAuth(false);
			}
		}
	}, [userId, isLoaded, sessionId, pathname, router]);

	// Show loading state while checking auth
	if (!isLoaded || isCheckingAuth) {
		return (
			<Box
				display='flex'
				justifyContent='center'
				alignItems='center'
				minHeight='100vh'
			>
				<CircularProgress />
			</Box>
		);
	}

	// If we have a userId, show the full layout
	if (userId) {
		return (
			<Box
				sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
			>
				<AdminNav />
				<MainContent>{children}</MainContent>
				<AdminFooter />
			</Box>
		);
	}

	// For public routes, just show the content
	return <MainContent>{children}</MainContent>;
}
