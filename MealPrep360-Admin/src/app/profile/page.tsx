'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
	Box,
	Paper,
	Typography,
	TextField,
	Button,
	Avatar,
	Stack,
	Divider,
	CircularProgress,
	Alert,
	Snackbar,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { clientAdminApiClient } from '@/lib/apiClient';

interface UserProfile {
	name: string;
	email: string;
	role: string;
	imageUrl: string;
}

export default function AdminProfilePage() {
	const { userId } = useAuth();
	const { user } = useUser();
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		severity: 'success' as 'success' | 'error',
	});

	useEffect(() => {
		const checkAdminStatus = async () => {
			try {
				const data = await clientAdminApiClient.checkStatus();
				setIsAdmin(data.isAdmin);
			} catch (error) {
				console.error('Error checking admin status:', error);
			} finally {
				setLoading(false);
			}
		};

		if (userId) {
			checkAdminStatus();
		}
	}, [userId]);

	useEffect(() => {
		if (user) {
			setProfile({
				name: user.fullName || '',
				email: user.primaryEmailAddress?.emailAddress || '',
				role: 'ADMIN',
				imageUrl: user.imageUrl,
			});
		}
	}, [user]);

	const handleCloseSnackbar = () => {
		setSnackbar({ ...snackbar, open: false });
	};

	if (loading) {
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

	if (!isAdmin) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography
					variant='h4'
					color='error'
					gutterBottom
				>
					Access Denied
				</Typography>
				<Typography>You do not have permission to access this page.</Typography>
			</Box>
		);
	}

	if (!profile) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity='error'>Failed to load profile information.</Alert>
			</Box>
		);
	}

	return (
		<>
			<Box
				sx={{
					maxWidth: 800,
					mx: 'auto',
					px: { xs: 2, sm: 3, md: 4 },
					py: { xs: 2, sm: 4 },
					background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
					minHeight: '100vh',
				}}
			>
				<Typography
					variant='h4'
					component='h1'
					gutterBottom
					sx={{
						fontWeight: 800,
						letterSpacing: 1,
						mb: 4,
						fontSize: {
							xs: '1.5rem',
							sm: '1.875rem',
							md: '2.25rem',
						},
					}}
				>
					Profile Settings
				</Typography>

				<Paper
					elevation={3}
					sx={{
						p: 4,
						borderRadius: 3,
						boxShadow: 6,
						background: 'white',
						transition: 'transform 0.2s, box-shadow 0.2s',
						'&:hover': {
							transform: 'translateY(-2px)',
							boxShadow: 8,
						},
					}}
				>
					<Stack
						direction='row'
						alignItems='center'
						spacing={2}
						sx={{ mb: 3 }}
					>
						<PersonIcon sx={{ fontSize: 28, color: 'primary.main' }} />
						<Typography
							variant='h5'
							sx={{ fontWeight: 700, letterSpacing: 0.5 }}
						>
							Personal Information
						</Typography>
					</Stack>
					<Divider sx={{ mb: 4 }} />

					<Stack spacing={3}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 3,
								mb: 2,
							}}
						>
							<Avatar
								src={profile.imageUrl}
								alt={profile.name}
								sx={{ width: 100, height: 100 }}
							/>
							<Box>
								<Typography
									variant='h6'
									gutterBottom
								>
									{profile.name}
								</Typography>
								<Typography color='text.secondary'>{profile.email}</Typography>
								<Typography
									sx={{
										mt: 1,
										px: 2,
										py: 0.5,
										borderRadius: 1,
										bgcolor: 'primary.light',
										color: 'primary.dark',
										display: 'inline-block',
										fontWeight: 500,
									}}
								>
									{profile.role}
								</Typography>
							</Box>
						</Box>

						<TextField
							label='Full Name'
							value={profile.name}
							disabled
							fullWidth
						/>
						<TextField
							label='Email'
							value={profile.email}
							disabled
							fullWidth
						/>
						<TextField
							label='Role'
							value={profile.role}
							disabled
							fullWidth
						/>
					</Stack>
				</Paper>
			</Box>
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: '100%' }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
}
