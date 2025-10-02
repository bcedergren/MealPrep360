'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { NotificationType } from '@/types/notifications';
import { format } from 'date-fns';
import {
	Box,
	Typography,
	useMediaQuery,
	Paper,
	Button,
	TextField,
	Select as MuiSelect,
	MenuItem,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	FormControl,
	InputLabel,
	Stack,
	Divider,
	Tooltip,
	Fade,
	CircularProgress,
	Snackbar,
	Alert,
} from '@mui/material';
import {
	Send as SendIcon,
	Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { clientAdminApiClient } from '@/lib/apiClient';

interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	body: string;
	userId: string;
	status: string;
	createdAt: Date;
}

export default function AdminNotificationsPage() {
	const { userId } = useAuth();
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: 'success' | 'error';
	}>({
		open: false,
		message: '',
		severity: 'success',
	});
	const [formData, setFormData] = useState({
		type: 'meal_plan_reminder' as NotificationType,
		userId: '',
		title: '',
		body: '',
	});
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		const checkAdminStatus = async () => {
			try {
				const data = await clientAdminApiClient.checkStatus();
				if (!data.isAdmin) {
					setIsAdmin(false);
					router.push('/');
					return;
				}
				setIsAdmin(true);
				fetchNotifications();
			} catch (error) {
				console.error('Error checking admin status:', error);
				setIsAdmin(false);
				router.push('/');
			} finally {
				setIsLoading(false);
			}
		};

		if (userId) {
			checkAdminStatus();
		}
	}, [userId, router]);

	const handleCloseSnackbar = () => {
		setSnackbar({ ...snackbar, open: false });
	};

	const fetchNotifications = async () => {
		try {
			const data = await clientAdminApiClient.getNotifications();
			setNotifications(data);
		} catch (error) {
			console.error('Error fetching notifications:', error);
			setSnackbar({
				open: true,
				message: 'Failed to fetch notifications',
				severity: 'error',
			});
		}
	};

	const handleInputChange = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSendNotification = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.userId || !formData.title || !formData.body) {
			setSnackbar({
				open: true,
				message: 'Please fill in all fields',
				severity: 'error',
			});
			return;
		}

		setIsSending(true);
		try {
			await clientAdminApiClient.sendNotification(formData);

			setSnackbar({
				open: true,
				message: 'Notification sent successfully',
				severity: 'success',
			});
			setFormData({
				type: 'meal_plan_reminder',
				userId: '',
				title: '',
				body: '',
			});
			fetchNotifications();
		} catch (error) {
			console.error('Error sending notification:', error);
			setSnackbar({
				open: true,
				message: 'Failed to send notification',
				severity: 'error',
			});
		} finally {
			setIsSending(false);
		}
	};

	if (isLoading) {
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
		return null;
	}

	return (
		<>
			<Box
				sx={{
					maxWidth: 1200,
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
					Notifications Management
				</Typography>

				<Paper
					elevation={3}
					sx={{
						p: 4,
						mb: 4,
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
						<NotificationsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
						<Typography
							variant='h5'
							sx={{ fontWeight: 700, letterSpacing: 0.5 }}
						>
							Send Notification
						</Typography>
					</Stack>
					<Divider sx={{ mb: 4 }} />
					<form onSubmit={handleSendNotification}>
						<Stack
							spacing={3}
							sx={{ mb: 4 }}
						>
							<Stack
								direction={{ xs: 'column', md: 'row' }}
								spacing={3}
							>
								<FormControl fullWidth>
									<InputLabel>Notification Type</InputLabel>
									<MuiSelect
										value={formData.type}
										onChange={(e) =>
											setFormData({
												...formData,
												type: e.target.value as NotificationType,
											})
										}
										label='Notification Type'
									>
										<MenuItem value='meal_plan_reminder'>
											Meal Plan Reminder
										</MenuItem>
										<MenuItem value='shopping_list_ready'>
											Shopping List Ready
										</MenuItem>
										<MenuItem value='recipe_suggestion'>
											Recipe Suggestion
										</MenuItem>
										<MenuItem value='meal_completed'>Meal Completed</MenuItem>
										<MenuItem value='shopping_list_updated'>
											Shopping List Updated
										</MenuItem>
										<MenuItem value='weekly_summary'>Weekly Summary</MenuItem>
									</MuiSelect>
								</FormControl>
								<TextField
									fullWidth
									label='User ID'
									name='userId'
									value={formData.userId}
									onChange={handleInputChange}
									placeholder='Enter user ID'
								/>
							</Stack>
							<TextField
								fullWidth
								label='Title'
								name='title'
								value={formData.title}
								onChange={handleInputChange}
								placeholder='Enter notification title'
							/>
							<TextField
								fullWidth
								label='Body'
								name='body'
								value={formData.body}
								onChange={handleInputChange}
								placeholder='Enter notification body'
								multiline
								rows={isMobile ? 3 : 4}
							/>
						</Stack>
						<Button
							type='submit'
							variant='contained'
							color='primary'
							fullWidth
							startIcon={<SendIcon />}
							sx={{
								py: 1.5,
								fontWeight: 600,
								fontSize: '1.1rem',
								borderRadius: 2,
								boxShadow: 2,
								textTransform: 'none',
								letterSpacing: 0.5,
								transition: 'all 0.2s',
								'&:hover': {
									transform: 'translateY(-1px)',
									boxShadow: 4,
								},
							}}
							disabled={isSending}
						>
							{isSending ? 'Sending...' : 'Send Notification'}
						</Button>
					</form>
				</Paper>

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
						<NotificationsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
						<Typography
							variant='h5'
							sx={{ fontWeight: 700, letterSpacing: 0.5 }}
						>
							Recent Notifications
						</Typography>
					</Stack>
					<Divider sx={{ mb: 4 }} />
					<Box sx={{ overflowX: 'auto' }}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell
										sx={{
											fontWeight: 700,
											bgcolor: 'grey.100',
											color: 'text.primary',
										}}
									>
										Type
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 700,
											bgcolor: 'grey.100',
											color: 'text.primary',
										}}
									>
										Title
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 700,
											bgcolor: 'grey.100',
											color: 'text.primary',
										}}
									>
										User ID
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 700,
											bgcolor: 'grey.100',
											color: 'text.primary',
										}}
									>
										Status
									</TableCell>
									<TableCell
										sx={{
											fontWeight: 700,
											bgcolor: 'grey.100',
											color: 'text.primary',
										}}
									>
										Date
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{notifications.map((n) => (
									<TableRow
										key={n.id}
										sx={{
											'&:hover': { bgcolor: 'action.hover' },
											transition: 'background-color 0.2s',
										}}
									>
										<TableCell>{n.type}</TableCell>
										<TableCell>{n.title}</TableCell>
										<TableCell>{n.userId}</TableCell>
										<TableCell>
											<Tooltip
												title={n.status}
												arrow
												TransitionComponent={Fade}
												placement='top'
											>
												<Box
													sx={{
														display: 'inline-block',
														px: 1.5,
														py: 0.5,
														borderRadius: 1,
														bgcolor:
															n.status === 'sent'
																? 'success.light'
																: 'warning.light',
														color:
															n.status === 'sent'
																? 'success.dark'
																: 'warning.dark',
														fontWeight: 500,
														fontSize: '0.875rem',
													}}
												>
													{n.status}
												</Box>
											</Tooltip>
										</TableCell>
										<TableCell>{format(new Date(n.createdAt), 'Pp')}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Box>
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
