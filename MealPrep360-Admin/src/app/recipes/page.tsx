'use client';

import React, { useEffect, useState } from 'react';
import {
	Box,
	Typography,
	Paper,
	Button,
	Stack,
	Container,
	Grid,
	CircularProgress,
	Card,
	CardContent,
	Divider,
	Chip,
	Alert,
	IconButton,
	LinearProgress,
	Tooltip,
} from '@mui/material';
import Link from 'next/link';
import {
	Add as AddIcon,
	Image as ImageIcon,
	TrendingUp as TrendingUpIcon,
	Speed as SpeedIcon,
	Memory as MemoryIcon,
	Storage as StorageIcon,
	Warning as WarningIcon,
	CheckCircle as CheckCircleIcon,
	Error as ErrorIcon,
	Refresh as RefreshIcon,
} from '@mui/icons-material';
import { clientAdminApiClient } from '@/lib/apiClient';

interface ServiceStatus {
	status: string;
	version: string;
	uptime: number;
	lastCheck: string;
}

interface ServiceMetrics {
	requests: {
		total: number;
		byEndpoint: Record<string, number>;
		byStatus: Record<string, number>;
		averageResponseTime: number;
		errors: number;
		responseTimeHistory: number[];
	};
	database: {
		connectionAttempts: number;
		successfulConnections: number;
		failedConnections: number;
		lastConnectionTime: number;
		totalConnectionTime: number;
		queryStats: {
			total: number;
			slow: number;
			errors: number;
			averageTime: number;
			totalTime: number;
			byOperation: Record<string, number>;
			recentQueries: any[];
			performance: {
				p50: number;
				p90: number;
				p95: number;
				p99: number;
				lastUpdate: number;
			};
		};
		health: {
			status: string;
			lastCheck: number;
			issues: Array<{
				type: string;
				message: string;
				timestamp: number;
				severity: string;
			}>;
			indicators: {
				connectionSuccessRate: number;
				querySuccessRate: number;
				averageResponseTime: number;
				errorRate: number;
				lastUpdate: number;
			};
		};
	};
	system: {
		uptime: number;
		cpuUsage: {
			user: number;
			system: number;
		};
		memoryUsage: {
			rss: number;
			heapTotal: number;
			heapUsed: number;
			external: number;
			arrayBuffers: number;
		};
		lastUpdate: number;
		loadAverage: number[];
		totalMemory: number;
		freeMemory: number;
		cpus: number;
	};
}

export default function AdminRecipesPage() {
	const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [healthIssues, setHealthIssues] = useState<
		Array<{
			type: string;
			message: string;
			timestamp: number;
			severity: string;
		}>
	>([]);

	const fetchServiceStatus = async () => {
		try {
			setRefreshing(true);
			const [metricsData, healthData] = await Promise.all([
				clientAdminApiClient.getRecipeGenerationPerformance(),
				clientAdminApiClient.getRecipeGenerationHealth(),
			]);

			// Defensive: fallback for missing health or nested properties
			const health = healthData?.health || {};
			const healthIndicators = health.indicators || {};
			const healthRequests = health.requests || {};
			const healthDatabase = health.database || {};
			const healthIssues = health.issues || [];

			// Transform the data to match our interface
			const transformedMetrics: ServiceMetrics = {
				requests: {
					total: healthRequests.total || 0,
					byEndpoint: {},
					byStatus: {},
					averageResponseTime: healthIndicators.averageResponseTime || 0,
					errors: 0,
					responseTimeHistory: [],
				},
				database: {
					connectionAttempts: 0,
					successfulConnections: 0,
					failedConnections: 0,
					lastConnectionTime: 0,
					totalConnectionTime: 0,
					queryStats: {
						total: 0,
						slow: metricsData.performance?.database?.slowQueries || 0,
						errors: 0,
						averageTime: 0,
						totalTime: 0,
						byOperation: {},
						recentQueries: [],
						performance: metricsData.performance?.database
							?.queryPerformance || {
							p50: 0,
							p90: 0,
							p95: 0,
							p99: 0,
							lastUpdate: 0,
						},
					},
					health: {
						status: health.status || 'unknown',
						lastCheck: health.lastCheck || 0,
						issues: healthIssues,
						indicators: {
							connectionSuccessRate:
								healthIndicators.connectionSuccessRate || 0,
							querySuccessRate: healthIndicators.querySuccessRate || 0,
							averageResponseTime: healthIndicators.averageResponseTime || 0,
							errorRate: healthIndicators.errorRate || 0,
							lastUpdate: healthIndicators.lastUpdate || 0,
						},
					},
				},
				system: {
					uptime: 0,
					cpuUsage: metricsData.performance?.system?.cpu || {
						user: 0,
						system: 0,
					},
					memoryUsage: metricsData.performance?.system?.memory || {
						rss: 0,
						heapTotal: 0,
						heapUsed: 0,
						external: 0,
						arrayBuffers: 0,
					},
					lastUpdate: Date.now(),
					loadAverage: metricsData.performance?.system?.loadAverage || [
						0, 0, 0,
					],
					totalMemory: 0,
					freeMemory: 0,
					cpus: 0,
				},
			};

			setMetrics(transformedMetrics);
			setHealthIssues(healthIssues);
			setError(null);
		} catch (err) {
			console.error('Error fetching service status:', err);
			setError('Failed to fetch service status. Please try again.');
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchServiceStatus();
		const interval = setInterval(fetchServiceStatus, 30000); // Refresh every 30 seconds
		return () => clearInterval(interval);
	}, []);

	return (
		<Container
			maxWidth='lg'
			sx={{ mt: 4, mb: 4 }}
		>
			<Grid
				container
				spacing={3}
			>
				{/* Action Buttons */}
				<Grid
					item
					xs={12}
				>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							mb: 4,
							background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
							borderRadius: 2,
							display: 'flex',
							justifyContent: 'center',
						}}
					>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={2}
							alignItems='center'
							sx={{ maxWidth: 'fit-content' }}
						>
							<Button
								component={Link}
								href='/recipes/generate'
								variant='contained'
								color='primary'
								startIcon={<AddIcon />}
								sx={{
									py: 2,
									px: 4,
									fontSize: '1.1rem',
									fontWeight: 600,
									background:
										'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
									boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
									'&:hover': {
										background:
											'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
									},
								}}
							>
								Generate Recipes
							</Button>
							<Button
								component={Link}
								href='/recipes/management'
								variant='contained'
								color='secondary'
								startIcon={<ImageIcon />}
								sx={{
									py: 2,
									px: 4,
									fontSize: '1.1rem',
									fontWeight: 600,
									background:
										'linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)',
									boxShadow: '0 3px 5px 2px rgba(156, 39, 176, .3)',
									'&:hover': {
										background:
											'linear-gradient(45deg, #7B1FA2 30%, #8E24AA 90%)',
									},
								}}
							>
								Manage Recipes
							</Button>
						</Stack>
					</Paper>
				</Grid>

				{/* Performance Metrics */}
				<Grid
					item
					xs={12}
				>
					<Paper
						elevation={2}
						sx={{
							p: 3,
							background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
							borderRadius: 2,
						}}
					>
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
								sx={{ fontWeight: 600, color: 'primary.main' }}
							>
								Performance Metrics
							</Typography>
							<Button
								variant='outlined'
								color='primary'
								startIcon={<RefreshIcon />}
								onClick={fetchServiceStatus}
								disabled={refreshing}
								sx={{
									'&:hover': {
										background: 'rgba(33, 150, 243, 0.04)',
									},
								}}
							>
								{refreshing ? 'Refreshing...' : 'Refresh'}
							</Button>
						</Box>
						{metrics ? (
							<Grid
								container
								spacing={3}
							>
								{/* Request Metrics */}
								<Grid
									item
									xs={12}
									md={6}
								>
									<Card
										sx={{
											height: '100%',
											background: 'rgba(255, 255, 255, 0.8)',
										}}
									>
										<CardContent>
											<Stack
												direction='row'
												alignItems='center'
												spacing={1}
												mb={2}
											>
												<SpeedIcon color='primary' />
												<Typography
													variant='subtitle1'
													sx={{ fontWeight: 600 }}
												>
													Request Metrics
												</Typography>
											</Stack>
											<Grid
												container
												spacing={2}
											>
												<Grid
													item
													xs={6}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Total Requests
													</Typography>
													<Typography
														variant='h6'
														sx={{ fontWeight: 600 }}
													>
														{metrics?.requests?.total || 0}
													</Typography>
												</Grid>
												<Grid
													item
													xs={6}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Errors
													</Typography>
													<Typography
														variant='h6'
														sx={{
															fontWeight: 600,
															color:
																(metrics?.requests?.errors || 0) > 0
																	? 'error.main'
																	: 'success.main',
														}}
													>
														{metrics?.requests?.errors || 0}
													</Typography>
												</Grid>
												<Grid
													item
													xs={6}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Avg Response Time
													</Typography>
													<Typography
														variant='h6'
														sx={{ fontWeight: 600 }}
													>
														{(
															metrics?.requests?.averageResponseTime || 0
														).toFixed(1)}
														ms
													</Typography>
												</Grid>
												<Grid
													item
													xs={6}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Success Rate
													</Typography>
													<Typography
														variant='h6'
														sx={{ fontWeight: 600 }}
													>
														{metrics?.requests?.total
															? ((metrics.requests.byStatus?.['200'] || 0) /
																	metrics.requests.total) *
															  100
															: 0}
														%
													</Typography>
												</Grid>
											</Grid>
										</CardContent>
									</Card>
								</Grid>

								{/* Database Health */}
								<Grid
									item
									xs={12}
									md={6}
								>
									<Card
										sx={{
											height: '100%',
											background: 'rgba(255, 255, 255, 0.8)',
										}}
									>
										<CardContent>
											<Stack
												direction='row'
												alignItems='center'
												spacing={1}
												mb={2}
											>
												<SpeedIcon color='primary' />
												<Typography
													variant='subtitle1'
													sx={{ fontWeight: 600 }}
												>
													Database Health
												</Typography>
											</Stack>
											<Grid
												container
												spacing={2}
											>
												<Grid
													item
													xs={6}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Connection Success
													</Typography>
													<Typography
														variant='h6'
														sx={{ fontWeight: 600 }}
													>
														{metrics?.database?.connectionAttempts
															? ((metrics.database.successfulConnections || 0) /
																	metrics.database.connectionAttempts) *
															  100
															: 0}
														%
													</Typography>
												</Grid>
												<Grid
													item
													xs={6}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Query Success
													</Typography>
													<Typography
														variant='h6'
														sx={{ fontWeight: 600 }}
													>
														{(
															metrics?.database?.health?.indicators
																?.querySuccessRate || 0
														).toFixed(1)}
														%
													</Typography>
												</Grid>
												<Grid
													item
													xs={12}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Health Status
													</Typography>
													<Chip
														label={
															metrics?.database?.health?.status || 'unknown'
														}
														color={
															metrics?.database?.health?.status === 'healthy'
																? 'success'
																: 'error'
														}
														sx={{ mt: 1 }}
													/>
												</Grid>
											</Grid>
										</CardContent>
									</Card>
								</Grid>

								{/* System Resources */}
								<Grid
									item
									xs={12}
									md={6}
								>
									<Card
										sx={{
											height: '100%',
											background: 'rgba(255, 255, 255, 0.8)',
										}}
									>
										<CardContent>
											<Stack
												direction='row'
												alignItems='center'
												spacing={1}
												mb={2}
											>
												<MemoryIcon color='primary' />
												<Typography
													variant='subtitle1'
													sx={{ fontWeight: 600 }}
												>
													System Resources
												</Typography>
											</Stack>
											<Grid
												container
												spacing={2}
												key='system-resources-grid'
											>
												<Grid
													item
													xs={4}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														CPU Usage
													</Typography>
													<Typography
														variant='h6'
														sx={{ fontWeight: 600 }}
													>
														{metrics?.system?.cpuUsage
															? (
																	(metrics.system.cpuUsage.user +
																		metrics.system.cpuUsage.system) /
																	1000000
															  ).toFixed(1)
															: 0}
														%
													</Typography>
												</Grid>
												<Grid
													item
													xs={4}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Memory Usage
													</Typography>
													<Typography
														variant='h6'
														sx={{ fontWeight: 600 }}
													>
														{metrics?.system?.memoryUsage
															? (
																	(metrics.system.memoryUsage.heapUsed /
																		metrics.system.memoryUsage.heapTotal) *
																	100
															  ).toFixed(1)
															: 0}
														%
													</Typography>
												</Grid>
												<Grid
													item
													xs={4}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Load Average
													</Typography>
													<Typography
														variant='h6'
														sx={{ fontWeight: 600 }}
													>
														{(metrics?.system?.loadAverage?.[0] || 0).toFixed(
															2
														)}
													</Typography>
												</Grid>
												<Grid
													item
													xs={12}
												>
													<Typography
														variant='body2'
														color='text.secondary'
													>
														Uptime
													</Typography>
													<Typography
														variant='body1'
														sx={{ fontWeight: 500 }}
													>
														{metrics?.system?.uptime
															? Math.floor(metrics.system.uptime / 3600)
															: 0}{' '}
														hours
													</Typography>
												</Grid>
											</Grid>
										</CardContent>
									</Card>
								</Grid>

								{/* Health Issues */}
								<Grid
									item
									xs={12}
									md={6}
								>
									<Card
										sx={{
											height: '100%',
											background: 'rgba(255, 255, 255, 0.8)',
										}}
									>
										<CardContent>
											<Stack
												direction='row'
												alignItems='center'
												spacing={1}
												mb={2}
											>
												<ErrorIcon color='primary' />
												<Typography
													variant='subtitle1'
													sx={{ fontWeight: 600 }}
												>
													Health Issues
												</Typography>
											</Stack>
											{healthIssues.length > 0 ? (
												<Stack spacing={1}>
													{healthIssues.map((issue, index) => (
														<Chip
															key={index}
															label={`${issue.type}: ${issue.message}`}
															color={
																issue.severity === 'high' ? 'error' : 'warning'
															}
															sx={{ mb: 1 }}
														/>
													))}
												</Stack>
											) : (
												<Typography
													variant='body2'
													color='success.main'
												>
													No health issues detected
												</Typography>
											)}
										</CardContent>
									</Card>
								</Grid>
							</Grid>
						) : (
							<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
								<CircularProgress />
							</Box>
						)}
					</Paper>
				</Grid>
			</Grid>
		</Container>
	);
}
