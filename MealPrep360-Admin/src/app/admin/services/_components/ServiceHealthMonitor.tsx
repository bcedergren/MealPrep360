'use client';

import { useEffect, useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Chip,
	IconButton,
	Tooltip,
	CircularProgress,
	Grid,
	Paper,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Divider,
} from '@mui/material';
import {
	Refresh as RefreshIcon,
	CheckCircle as CheckCircleIcon,
	Error as ErrorIcon,
	Warning as WarningIcon,
	AccessTime as AccessTimeIcon,
	BugReport as BugReportIcon,
	Timer as TimerIcon,
	Speed as SpeedIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { clientAdminApiClient } from '@/lib/apiClient';

interface ServiceError {
	code: string;
	message: string;
	details?: string;
	timestamp: string;
}

interface ServiceMetrics {
	responseTime: number;
	uptime: number;
	lastSuccessfulCheck?: string;
}

interface ServiceStatus {
	name: string;
	status: 'healthy' | 'unhealthy' | 'loading';
	lastChecked: string;
	errors?: ServiceError[];
	metrics?: ServiceMetrics;
}

export function ServiceHealthMonitor() {
	const [services, setServices] = useState<ServiceStatus[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const checkServices = async () => {
		try {
			setRefreshing(true);
			const data = await clientAdminApiClient.getServicesHealth();
			setServices(data);
		} catch (error) {
			console.error('Failed to fetch service health:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		checkServices();
		// Refresh every 30 seconds
		const interval = setInterval(checkServices, 30000);
		return () => clearInterval(interval);
	}, []);

	const getStatusColor = (status: ServiceStatus['status']) => {
		switch (status) {
			case 'healthy':
				return 'success';
			case 'unhealthy':
				return 'error';
			default:
				return 'warning';
		}
	};

	const getStatusIcon = (status: ServiceStatus['status']) => {
		switch (status) {
			case 'healthy':
				return <CheckCircleIcon color='success' />;
			case 'unhealthy':
				return <ErrorIcon color='error' />;
			default:
				return <WarningIcon color='warning' />;
		}
	};

	if (loading) {
		return (
			<Box
				display='flex'
				justifyContent='center'
				alignItems='center'
				minHeight='400px'
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
				}}
			>
				<Typography
					variant='h6'
					color='text.secondary'
				>
					{services.length} Services Monitored
				</Typography>
				<Tooltip title='Refresh Status'>
					<IconButton
						onClick={checkServices}
						disabled={refreshing}
						sx={{
							backgroundColor: 'background.paper',
							'&:hover': { backgroundColor: 'action.hover' },
						}}
					>
						<RefreshIcon
							sx={{
								animation: refreshing ? 'spin 1s linear infinite' : 'none',
								'@keyframes spin': {
									'0%': { transform: 'rotate(0deg)' },
									'100%': { transform: 'rotate(360deg)' },
								},
							}}
						/>
					</IconButton>
				</Tooltip>
			</Box>

			<Grid
				container
				spacing={3}
			>
				{services.map((service) => (
					<Grid
						item
						xs={12}
						md={6}
						lg={4}
						key={service.name}
					>
						<Card
							elevation={0}
							sx={{
								height: '100%',
								border: '1px solid',
								borderColor: 'divider',
								transition: 'transform 0.2s, box-shadow 0.2s',
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: 4,
								},
							}}
						>
							<CardContent>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'flex-start',
										mb: 2,
									}}
								>
									<Typography
										variant='h6'
										component='h2'
									>
										{service.name}
									</Typography>
									<Chip
										icon={getStatusIcon(service.status)}
										label={service.status}
										color={getStatusColor(service.status)}
										size='small'
									/>
								</Box>

								<Box
									sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
								>
									<AccessTimeIcon
										fontSize='small'
										color='action'
									/>
									<Typography
										variant='body2'
										color='text.secondary'
									>
										Last checked{' '}
										{formatDistanceToNow(new Date(service.lastChecked), {
											addSuffix: true,
										})}
									</Typography>
								</Box>

								{service.metrics && (
									<Box sx={{ mb: 2 }}>
										<List dense>
											<ListItem>
												<ListItemIcon>
													<SpeedIcon
														fontSize='small'
														color='action'
													/>
												</ListItemIcon>
												<ListItemText
													primary='Response Time'
													secondary={`${service.metrics.responseTime}ms`}
												/>
											</ListItem>
											<ListItem>
												<ListItemIcon>
													<TimerIcon
														fontSize='small'
														color='action'
													/>
												</ListItemIcon>
												<ListItemText
													primary='Uptime'
													secondary={`${Math.round(
														service.metrics.uptime / 3600
													)} hours`}
												/>
											</ListItem>
										</List>
									</Box>
								)}

								{service.errors && service.errors.length > 0 && (
									<Box sx={{ mt: 2 }}>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1,
												mb: 1,
											}}
										>
											<BugReportIcon
												color='error'
												fontSize='small'
											/>
											<Typography
												variant='subtitle2'
												color='error'
											>
												{service.errors.length}{' '}
												{service.errors.length === 1 ? 'Error' : 'Errors'}{' '}
												Detected
											</Typography>
										</Box>
										<Paper
											elevation={0}
											sx={{
												p: 1.5,
												backgroundColor: 'rgba(255, 0, 0, 0.05)',
												color: 'error.main',
												borderRadius: 1,
											}}
										>
											<List dense>
												{service.errors.map((error, index) => (
													<Box key={error.timestamp}>
														{index > 0 && <Divider sx={{ my: 1 }} />}
														<ListItem>
															<ListItemText
																primary={
																	<Typography variant='subtitle2'>
																		{error.code}
																	</Typography>
																}
																secondary={
																	<>
																		<Typography
																			variant='body2'
																			sx={{ mb: 0.5 }}
																		>
																			{error.message}
																		</Typography>
																		{error.details && (
																			<Typography
																				variant='caption'
																				sx={{ display: 'block' }}
																			>
																				{error.details}
																			</Typography>
																		)}
																		<Typography
																			variant='caption'
																			sx={{ display: 'block', mt: 0.5 }}
																		>
																			{formatDistanceToNow(
																				new Date(error.timestamp),
																				{ addSuffix: true }
																			)}
																		</Typography>
																	</>
																}
															/>
														</ListItem>
													</Box>
												))}
											</List>
										</Paper>
									</Box>
								)}
							</CardContent>
						</Card>
					</Grid>
				))}
			</Grid>
		</Box>
	);
}
