'use client';

import { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AdminDashboard } from '@/app/_components/admin/dashboard/AdminDashboard';
import { clientAdminApiClient } from '@/lib/apiClient';

export default function DashboardPage() {
	const { userId, isLoaded, getToken } = useAuth();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function checkAccess() {
			if (!isLoaded) return;

			if (!userId) {
				router.push('/');
				return null;
			}

			try {
				const data = await clientAdminApiClient.checkStatus();

				if (!data.isAdmin) {
					router.push('/');
					return;
				}

				setIsLoading(false);
			} catch (err) {
				console.error('Error checking admin status:', err);
				setError(
					err instanceof Error ? err.message : 'Failed to check admin status'
				);
				setIsLoading(false);
			}
		}

		checkAccess();
	}, [userId, isLoaded, router, getToken]);

	if (!isLoaded || isLoading) {
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

	if (error) {
		return (
			<Box
				display='flex'
				justifyContent='center'
				alignItems='center'
				minHeight='100vh'
			>
				<Typography color='error'>{error}</Typography>
			</Box>
		);
	}

	return <AdminDashboard />;
}
