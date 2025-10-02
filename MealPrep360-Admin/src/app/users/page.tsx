'use client';

import {
	Box,
	Typography,
	Paper,
	Button,
	Grid,
	TextField,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	CircularProgress,
	Snackbar,
	Alert,
} from '@mui/material';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
	People as PeopleIcon,
	AdminPanelSettings as AdminIcon,
	Person as UserIcon,
} from '@mui/icons-material';
import { blue, orange } from '@mui/material/colors';
import { clientAdminApiClient } from '@/lib/apiClient';

interface User {
	id: string;
	email: string;
	clerkId?: string;
	name: string | null;
	role: string;
	createdAt: string;
	lastLogin?: string;
}

export default function AdminUsersPage() {
	const { userId } = useAuth();
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);
	const [email, setEmail] = useState('');
	const [users, setUsers] = useState<User[]>([]);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		severity: 'success' as 'success' | 'error',
	});

	const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

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

		const fetchUsers = async () => {
			try {
				const data = await clientAdminApiClient.getUsers();
				setUsers(Array.isArray(data.users) ? data.users : []);
			} catch (error) {
				console.error('Error fetching users:', error);
			}
		};

		if (userId) {
			checkAdminStatus();
			fetchUsers();
		}
	}, [userId]);

	const totalAdmins = users.filter((u) => u.role === 'ADMIN').length;
	const totalUsers = users.length;

	const handleSetAdmin = async (userId: string, isAdmin: boolean) => {
		try {
			const data = await clientAdminApiClient.setAdmin({ userId, isAdmin });
			setUsers((prevUsers) =>
				prevUsers.map((user) =>
					user.id === userId
						? { ...user, role: data.isAdmin ? 'ADMIN' : 'USER' }
						: user
				)
			);
			setSnackbar({
				open: true,
				message: `User is now ${data.isAdmin ? 'an admin' : 'not an admin'}`,
				severity: 'success',
			});
		} catch (error) {
			console.error('Error setting admin role:', error);
			setSnackbar({
				open: true,
				message: 'Failed to update admin status',
				severity: 'error',
			});
		}
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '200px',
				}}
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

	return (
		<Box sx={{ p: { xs: 2, md: 4 } }}>
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
				User Management
			</Typography>

			{/* Summary Cards */}
			<Grid
				container
				spacing={3}
				sx={{ mb: 4 }}
			>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Paper
						sx={{
							p: 3,
							borderRadius: 3,
							boxShadow: 6,
							background: `linear-gradient(135deg, ${blue[500]} 60%, ${blue[300]} 100%)`,
							color: 'white',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
						}}
					>
						<PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
						<Typography
							variant='h4'
							sx={{ fontWeight: 900 }}
						>
							{totalUsers}
						</Typography>
						<Typography
							variant='subtitle1'
							sx={{ fontWeight: 500, opacity: 0.9 }}
						>
							Total Users
						</Typography>
					</Paper>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Paper
						sx={{
							p: 3,
							borderRadius: 3,
							boxShadow: 6,
							background: `linear-gradient(135deg, ${orange[600]} 60%, ${orange[400]} 100%)`,
							color: 'white',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
						}}
					>
						<AdminIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
						<Typography
							variant='h4'
							sx={{ fontWeight: 900 }}
						>
							{totalAdmins}
						</Typography>
						<Typography
							variant='subtitle1'
							sx={{ fontWeight: 500, opacity: 0.9 }}
						>
							Admins
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
				<Typography
					variant='h6'
					gutterBottom
					sx={{ fontWeight: 700 }}
				>
					Set User as Admin
				</Typography>
				<Grid
					container
					spacing={2}
				>
					<Grid
						item
						xs={12}
						md={8}
					>
						<TextField
							fullWidth
							label='User Email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</Grid>
					<Grid
						item
						xs={12}
						md={4}
					>
						<Button
							variant='contained'
							onClick={() => handleSetAdmin(email, true)}
							fullWidth
							sx={{ height: '100%' }}
						>
							Set as Admin
						</Button>
					</Grid>
				</Grid>
			</Paper>

			<Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
				<Typography
					variant='h6'
					gutterBottom
					sx={{ fontWeight: 700 }}
				>
					All Users
				</Typography>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Email</TableCell>
								<TableCell>Name</TableCell>
								<TableCell>Role</TableCell>
								<TableCell>Joined</TableCell>
								<TableCell>Last Login</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id || user.clerkId || user.email}>
									<TableCell>{user.email || user.id}</TableCell>
									<TableCell>{user.name || '-'}</TableCell>
									<TableCell>
										<Chip
											icon={
												user.role === 'ADMIN' ? (
													<AdminIcon sx={{ color: orange[700] }} />
												) : (
													<UserIcon sx={{ color: blue[700] }} />
												)
											}
											label={user.role}
											color={user.role === 'ADMIN' ? 'warning' : 'primary'}
											size='small'
											variant='filled'
										/>
									</TableCell>
									<TableCell>
										{new Date(user.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell>
										{user.lastLogin
											? new Date(user.lastLogin).toLocaleString()
											: '-'}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: '100%' }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}
