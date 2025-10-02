'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
	Box,
	Typography,
	Paper,
	Button,
	Grid,
	Alert,
	Card,
	CardContent,
	LinearProgress,
	Stack,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Checkbox,
	CircularProgress,
	IconButton,
	List,
	ListItem,
	ListItemText,
} from '@mui/material';
import {
	WbSunny as SummerIcon,
	AcUnit as WinterIcon,
	Grass as SpringIcon,
	Park as FallIcon,
	Error as ErrorIcon,
	Delete as DeleteIcon,
	Refresh as RefreshIcon,
	Settings as SettingsIcon,
	ContentCopy as ContentCopyIcon,
	SelectAll as SelectAllIcon,
} from '@mui/icons-material';
import { clientAdminApiClient } from '@/lib/apiClient';

interface JobData {
	season?: string;
	recipes?: Array<{
		id: string;
		title: string;
		cuisine?: string;
		difficulty?: string;
		[key: string]: unknown;
	}>;
	[key: string]: unknown;
}

interface JobResult {
	recipes?: Array<{
		id: string;
		title: string;
		[key: string]: unknown;
	}>;
	[key: string]: unknown;
}

interface JobStatus {
	id: string;
	status: string;
	progress: number;
	total: number;
	data: JobData;
	error?: string;
	createdAt: string;
	updatedAt: string;
	attempts?: number;
	maxAttempts?: number;
}

interface JobQueueItem extends JobStatus {
	[key: string]: unknown;
}

interface PerformanceMetrics {
	responseTime: {
		p50: number;
		p90: number;
		p95: number;
		p99: number;
		average: number;
		min: number;
		max: number;
	};
	database: {
		queryPerformance: {
			p50: number;
			p90: number;
			p95: number;
			p99: number;
			lastUpdate: number;
		};
		slowQueries: number;
		errorRate: number;
	};
	system: {
		cpu: {
			user: number;
			system: number;
		};
		memory: {
			rss: number;
			heapTotal: number;
			heapUsed: number;
			external: number;
			arrayBuffers: number;
		};
		loadAverage: number[];
	};
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
			recentQueries: number[];
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
			issues: string[];
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

export default function GenerateRecipesPage() {
	const { getToken } = useAuth();
	const [selectedSeason, setSelectedSeason] = useState<string>('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
	const [jobQueue, setJobQueue] = useState<JobQueueItem[]>([]);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [jobToDelete, setJobToDelete] = useState<JobQueueItem | null>(null);
	const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
	const [healthIssues, setHealthIssues] = useState<string[]>([]);
	const [lastProgress, setLastProgress] = useState<number | null>(null);
	const [lastProgressTime, setLastProgressTime] = useState<number | null>(null);
	const [failJobDialogOpen, setFailJobDialogOpen] = useState(false);
	const [jobToFail, setJobToFail] = useState<JobQueueItem | null>(null);
	const [stopGenerationDialogOpen, setStopGenerationDialogOpen] =
		useState(false);
	const STUCK_THRESHOLD_MS = 300000; // 5 minutes in milliseconds

	const seasons = [
		{ id: 'spring', label: 'Spring', icon: SpringIcon },
		{ id: 'summer', label: 'Summer', icon: SummerIcon },
		{ id: 'fall', label: 'Fall', icon: FallIcon },
		{ id: 'winter', label: 'Winter', icon: WinterIcon },
	];

	const fetchJobQueue = useCallback(async () => {
		try {
			const data = await clientAdminApiClient.getRecipeGenerationJobs();

			// Handle different possible response formats
			let jobs: JobQueueItem[] = [];
			if (Array.isArray(data)) {
				jobs = data;
			} else if (data.jobs && Array.isArray(data.jobs)) {
				jobs = data.jobs;
			} else if (data.data && Array.isArray(data.data)) {
				jobs = data.data;
			} else if (typeof data === 'object') {
				// If it's a single job object, wrap it in an array
				jobs = [data as JobQueueItem];
			}

			setJobQueue(jobs);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to fetch job queue');
			setJobQueue([]);
		}
	}, []);

	useEffect(() => {
		fetchJobQueue();
	}, [fetchJobQueue]);

	const getCurrentJob = useCallback(() => {
		if (!jobQueue.length) return null;
		// Return a job if it's pending or processing
		return (
			jobQueue.find(
				(job) => job.status === 'pending' || job.status === 'processing'
			) || null
		);
	}, [jobQueue]);

	useEffect(() => {
		const currentJob = getCurrentJob();
		if (currentJob) {
			setJobStatus(currentJob);
			setJobId(currentJob.id);
			setIsGenerating(true);
		} else if (!jobId) {
			// Only clear if we don't have a jobId set (i.e., not actively tracking a job)
			setJobStatus(null);
			setJobId(null);
			setIsGenerating(false);
		}
	}, [jobQueue, getCurrentJob, jobId]);

	useEffect(() => {
		if (jobId) {
			const pollInterval = setInterval(async () => {
				try {
					const data = await clientAdminApiClient.getRecipeGenerationStatus(
						jobId
					);
					const job = data.job ? data.job : data;

					// Reset error count on successful response
					(window as any).pollErrorCount = 0;

					// Always update the job status to ensure progress is reflected
					setJobStatus(job);

					// If service is unavailable but we got cached data, show a warning
					if (job.serviceUnavailable) {
						setError(
							'Recipe service temporarily unavailable - showing last known status'
						);
					} else if (error) {
						// Clear any previous service unavailable errors
						setError(null);
					}

					// Update progress tracking
					if (job.status === 'processing' || job.status === 'pending') {
						if (
							job.status === 'processing' &&
							(lastProgress === null || job.progress > lastProgress)
						) {
							setLastProgress(job.progress);
							setLastProgressTime(Date.now());
						}
						// Keep the job in the Generation Status section
						setIsGenerating(true);
					} else if (job.status === 'completed' || job.status === 'failed') {
						setLastProgress(null);
						setLastProgressTime(null);
						clearInterval(pollInterval);
						setIsGenerating(false);
						if (job.status === 'failed') {
							setError(job.error || 'Generation failed');
						}
						fetchJobQueue();
					}
				} catch (error) {
					console.error('Error polling job status:', error);
					// Don't stop polling immediately on single errors - the service might be temporarily unavailable
					// Only stop after multiple consecutive failures
					if (!(window as any).pollErrorCount)
						(window as any).pollErrorCount = 0;
					(window as any).pollErrorCount++;

					if ((window as any).pollErrorCount >= 5) {
						// After 5 consecutive failures (10 seconds), stop polling and show error
						clearInterval(pollInterval);
						setIsGenerating(false);
						setError(
							error instanceof Error
								? `Failed to check generation status: ${error.message}`
								: 'Failed to check generation status'
						);
					}
					// Otherwise, continue polling - the service might recover
				}
			}, 2000);

			return () => clearInterval(pollInterval);
		}
	}, [jobId, fetchJobQueue, lastProgress]);

	// Add a timer update effect
	useEffect(() => {
		if (jobStatus?.status === 'processing' || jobStatus?.status === 'pending') {
			const timerInterval = setInterval(() => {
				// Force a re-render by updating a dummy state
				setLastProgressTime(Date.now());
			}, 1000);

			return () => clearInterval(timerInterval);
		}
	}, [jobStatus?.status]);

	const fetchServiceStatus = async () => {
		try {
			setRefreshing(true);
			const [metricsData, healthData] = await Promise.all([
				clientAdminApiClient.getRecipeGenerationPerformance(),
				clientAdminApiClient.getRecipeGenerationHealth(),
			]);

			// Transform the data to match our interface
			const transformedMetrics: ServiceMetrics = {
				requests: {
					total: healthData.health?.requests?.total || 0,
					byEndpoint: healthData.health?.requests?.byEndpoint || {},
					byStatus: healthData.health?.requests?.byStatus || {},
					averageResponseTime:
						healthData.health?.indicators?.averageResponseTime || 0,
					errors: healthData.health?.requests?.errors || 0,
					responseTimeHistory:
						healthData.health?.requests?.responseTimeHistory || [],
				},
				database: {
					connectionAttempts:
						healthData.health?.database?.connectionAttempts || 0,
					successfulConnections:
						healthData.health?.database?.successfulConnections || 0,
					failedConnections:
						healthData.health?.database?.failedConnections || 0,
					lastConnectionTime:
						healthData.health?.database?.lastConnectionTime || 0,
					totalConnectionTime:
						healthData.health?.database?.totalConnectionTime || 0,
					queryStats: {
						total: healthData.health?.database?.queryStats?.total || 0,
						slow: metricsData.performance?.database?.slowQueries || 0,
						errors: healthData.health?.database?.queryStats?.errors || 0,
						averageTime:
							healthData.health?.database?.queryStats?.averageTime || 0,
						totalTime: healthData.health?.database?.queryStats?.totalTime || 0,
						byOperation:
							healthData.health?.database?.queryStats?.byOperation || {},
						recentQueries:
							healthData.health?.database?.queryStats?.recentQueries || [],
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
						status: healthData.health?.status || 'unknown',
						lastCheck: healthData.health?.lastCheck || 0,
						issues: healthData.health?.issues || [],
						indicators: {
							connectionSuccessRate:
								healthData.health?.indicators?.connectionSuccessRate || 0,
							querySuccessRate:
								healthData.health?.indicators?.querySuccessRate || 0,
							averageResponseTime:
								healthData.health?.indicators?.averageResponseTime || 0,
							errorRate: healthData.health?.indicators?.errorRate || 0,
							lastUpdate: healthData.health?.indicators?.lastUpdate || 0,
						},
					},
				},
				system: {
					uptime: healthData.health?.system?.uptime || 0,
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
					totalMemory: healthData.health?.system?.totalMemory || 0,
					freeMemory: healthData.health?.system?.freeMemory || 0,
					cpus: healthData.health?.system?.cpus || 0,
				},
			};

			setMetrics(transformedMetrics);
			setHealthIssues(healthData.health?.issues || []);
			setError(null);
		} catch (err) {
			console.error('Error fetching service status:', err);
			setError(
				err instanceof Error
					? err.message
					: 'Failed to fetch service status. Please try again.'
			);
			setMetrics(null);
			setHealthIssues([]);
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchServiceStatus();
		const interval = setInterval(fetchServiceStatus, 30000); // Refresh every 30 seconds
		return () => clearInterval(interval);
	}, []);

	const handleGenerate = async () => {
		try {
			setIsGenerating(true);
			setError(null);

			const data = await clientAdminApiClient.generateRecipes({
				season: selectedSeason,
			});

			if (!data.job || !data.job.id) {
				throw new Error('No job ID received from server');
			}
			setJobId(data.job.id);
			setJobStatus({
				id: data.job.id,
				status: data.job.status || 'pending',
				progress: data.job.progress ?? 0,
				total: data.job.total ?? 30,
				data: { season: data.job.season || selectedSeason },
				createdAt: data.job.createdAt ?? new Date().toISOString(),
				updatedAt: data.job.updatedAt ?? new Date().toISOString(),
				error: undefined,
			});

			// Refresh job queue to show the new job
			await fetchJobQueue();
		} catch (error) {
			console.error('Error generating recipe:', error);
			setError(
				error instanceof Error ? error.message : 'Failed to generate recipe'
			);
			setIsGenerating(false);
			setJobId(null);
		}
	};

	const getProgress = () => {
		if (!jobStatus) return 0;
		return Math.floor((jobStatus.progress / jobStatus.total) * 100);
	};

	const handleDeleteClick = (job: JobQueueItem) => {
		setJobToDelete(job);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!jobToDelete) return;

		try {
			await clientAdminApiClient.deleteRecipeGenerationJob(jobToDelete.id, {
				action: 'delete',
				reason: 'Deleted by admin',
			});

			// Refresh the job queue
			await fetchJobQueue();

			setJobToDelete(null);
			setDeleteDialogOpen(false);
		} catch (error) {
			console.error('Error deleting job:', error);
			setError(
				error instanceof Error
					? error.message
					: 'Failed to delete job. Please try again.'
			);
		}
	};

	const handleJobSelect = (jobId: string) => {
		setSelectedJobs((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(jobId)) {
				newSet.delete(jobId);
			} else {
				newSet.add(jobId);
			}
			return newSet;
		});
	};

	const handleBulkDelete = async () => {
		try {
			const deletePromises = Array.from(selectedJobs).map((jobId) =>
				clientAdminApiClient.deleteRecipeGenerationJob(jobId, {
					action: 'delete',
					reason: 'Bulk deleted by admin',
				})
			);

			await Promise.all(deletePromises);

			// Refresh the job queue
			await fetchJobQueue();

			setSelectedJobs(new Set());
			setBulkDeleteDialogOpen(false);
		} catch (error) {
			console.error('Error deleting jobs:', error);
			setError(
				error instanceof Error
					? error.message
					: 'Failed to delete jobs. Please try again.'
			);
		}
	};

	const handleRetry = async (job: JobQueueItem) => {
		try {
			// Check if the job is in a retryable state
			if (job.status !== 'failed' && !isStuck(job)) {
				throw new Error('Cannot retry job. Job must be failed or stuck.');
			}

			await clientAdminApiClient.retryRecipeGenerationJob(job.id, {
				reason: isStuck(job) ? 'Retrying stuck job' : 'Retrying failed job',
			});

			// Refresh jobs after retry
			await fetchJobQueue();
		} catch (error) {
			console.error('Error retrying job:', error);
			setError(error instanceof Error ? error.message : 'Failed to retry job');
		}
	};

	const handleFailJob = async (job: JobQueueItem) => {
		try {
			await clientAdminApiClient.failRecipeGenerationJob(job.id);

			// Refresh jobs after failing
			await fetchJobQueue();
			setFailJobDialogOpen(false);
			setJobToFail(null);
		} catch (error) {
			console.error('Error failing job:', error);
			setError(error instanceof Error ? error.message : 'Failed to fail job');
		}
	};

	const handleFailJobClick = (job: JobQueueItem) => {
		setJobToFail(job);
		setFailJobDialogOpen(true);
	};

	const handleStopGeneration = async () => {
		if (!jobStatus || !jobId) return;

		try {
			setStopGenerationDialogOpen(false);
			setIsGenerating(false);
			setError(null);

			await clientAdminApiClient.failRecipeGenerationJob(jobId);

			// Update local state
			setJobStatus(null);
			setJobId(null);

			// Refresh job queue to show updated status
			await fetchJobQueue();

			// Note: We're not showing an error message for success
			// The UI will update to show the job is no longer processing
		} catch (error) {
			console.error('Failed to stop job:', error);
			setError(
				error instanceof Error ? error.message : 'Failed to stop generation'
			);
		}
	};

	// Calculate job duration in milliseconds
	const getJobDuration = (job: JobStatus) => {
		if (!job.createdAt) return 0;
		return Date.now() - new Date(job.createdAt).getTime();
	};

	// Update the isStuck calculation to be more robust
	const isStuck = (job: JobStatus) => {
		if (!job || job.status !== 'processing') return false;

		const now = Date.now();
		const jobStartTime = new Date(job.createdAt).getTime();
		const jobDuration = now - jobStartTime;

		// Check if job has been running for more than 5 minutes
		if (jobDuration < STUCK_THRESHOLD_MS) return false;

		// If we have a last progress time, check if it's been more than 5 minutes
		if (lastProgressTime !== null) {
			const timeSinceLastProgress = now - lastProgressTime;
			return timeSinceLastProgress > STUCK_THRESHOLD_MS;
		}

		// If no progress time is recorded but job has been running for more than 5 minutes
		return true;
	};

	// Update the debug log to be more concise
	useEffect(() => {
		if (jobStatus && jobStatus.status === 'processing') {
			const duration = getJobDuration(jobStatus);
			const timeSinceLastProgress = lastProgressTime
				? Date.now() - lastProgressTime
				: null;

			// Only log if the job might be stuck or has been running for a while
			if (
				duration > STUCK_THRESHOLD_MS ||
				(timeSinceLastProgress && timeSinceLastProgress > STUCK_THRESHOLD_MS)
			) {
				const durationMinutes = Math.floor(duration / 1000 / 60);
				const progressMinutes = timeSinceLastProgress
					? Math.floor(timeSinceLastProgress / 1000 / 60)
					: null;

				// Commented out debug logging for production
			}
		}
	}, [jobStatus, lastProgress, lastProgressTime]);

	const getTimeAgo = (date: string) => {
		const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

		if (seconds < 60) return `${seconds}s ago`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	};

	// Add a helper to format duration
	function formatDuration(ms: number) {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}m ${seconds}s`;
	}

	// Helper to get recipe count
	function getRecipeCount(job: JobQueueItem) {
		if (job.status === 'completed' && Array.isArray(job.data?.recipes)) {
			return job.data.recipes.length;
		}
		return job.progress || 0;
	}

	function getRecipeTotal(job: JobQueueItem) {
		if (job.status === 'completed' && Array.isArray(job.data?.recipes)) {
			return job.data.recipes.length;
		}
		return job.total || 0;
	}

	const renderJobCard = (job: JobQueueItem) => {
		const maxAttempts = job.maxAttempts || 3;
		const attemptsLeft = maxAttempts - (job.attempts || 0);
		const isJobStuck = isStuck(job);

		return (
			<Card
				key={job.id}
				sx={{
					height: '100%',
					background: 'rgba(255, 255, 255, 0.98)',
					transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
					'&:hover': {
						transform: 'translateY(-4px) scale(1.01)',
						boxShadow: (theme) =>
							`0 12px 24px -6px ${theme.palette.primary.main}20`,
					},
					border: '1px solid',
					borderColor:
						job.status === 'completed'
							? 'success.light'
							: job.status === 'failed'
							? 'error.light'
							: 'primary.light',
					borderRadius: 2.5,
					position: 'relative',
					overflow: 'visible',
					backdropFilter: 'blur(12px)',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '4px',
						background:
							job.status === 'completed'
								? 'linear-gradient(90deg, #4caf50 0%, #81c784 50%, #a5d6a7 100%)'
								: job.status === 'failed'
								? 'linear-gradient(90deg, #f44336 0%, #e57373 50%, #ef9a9a 100%)'
								: 'linear-gradient(90deg, #2196f3 0%, #64b5f6 50%, #90caf9 100%)',
						borderTopLeftRadius: '10px',
						borderTopRightRadius: '10px',
						opacity: 0.95,
						transition: 'opacity 0.3s ease',
					},
					'&:hover::before': {
						opacity: 1,
					},
				}}
			>
				<CardContent sx={{ p: 1.75 }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							mb: 1.25,
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
							<Checkbox
								checked={selectedJobs.has(job.id)}
								onChange={() => handleJobSelect(job.id)}
								disabled={job.status === 'processing'}
								size='small'
								sx={{
									p: 0.5,
									color: 'primary.light',
									'&.Mui-checked': {
										color: 'primary.main',
									},
									'&:hover': {
										backgroundColor: 'rgba(33, 150, 243, 0.08)',
									},
									transition: 'all 0.2s ease',
									'&:hover:not(.Mui-disabled)': {
										transform: 'scale(1.1)',
									},
								}}
							/>
							<Stack
								direction='row'
								spacing={1.25}
								alignItems='center'
							>
								<Typography
									variant='subtitle2'
									sx={{
										fontWeight: 700,
										fontSize: '0.875rem',
										color: 'text.primary',
										letterSpacing: '0.02em',
										textTransform: 'capitalize',
										transition: 'color 0.2s ease',
										'&:hover': {
											color: 'primary.main',
										},
									}}
								>
									{job.data?.season}
								</Typography>
								<Chip
									label={job.status}
									size='small'
									sx={{
										height: '24px',
										'& .MuiChip-label': {
											px: 1.75,
											fontSize: '0.75rem',
											fontWeight: 600,
											letterSpacing: '0.02em',
											textTransform: 'capitalize',
										},
										backgroundColor:
											job.status === 'completed'
												? 'rgba(76, 175, 80, 0.12)'
												: job.status === 'failed'
												? 'rgba(244, 67, 54, 0.12)'
												: 'rgba(33, 150, 243, 0.12)',
										color:
											job.status === 'completed'
												? 'success.dark'
												: job.status === 'failed'
												? 'error.dark'
												: 'primary.dark',
										border: '1px solid',
										borderColor:
											job.status === 'completed'
												? 'success.light'
												: job.status === 'failed'
												? 'error.light'
												: 'primary.light',
										transition: 'all 0.3s ease',
										'&:hover': {
											backgroundColor:
												job.status === 'completed'
													? 'rgba(76, 175, 80, 0.2)'
													: job.status === 'failed'
													? 'rgba(244, 67, 54, 0.2)'
													: 'rgba(33, 150, 243, 0.2)',
											transform: 'translateY(-1px)',
											boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
										},
									}}
								/>
							</Stack>
						</Box>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'flex-end',
								gap: 0.5,
							}}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Typography
									variant='body2'
									color='text.secondary'
								>
									{getTimeAgo(job.createdAt)}
								</Typography>
							</Box>
						</Box>
					</Box>

					{/* Progress and Duration */}
					<Box sx={{ mb: 1.25 }}>
						<Box
							sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
						>
							<Typography
								variant='body2'
								color='text.secondary'
							>
								Progress
							</Typography>
							<Typography
								variant='body2'
								color='text.secondary'
							>
								Duration: {formatDuration(getJobDuration(job))}
							</Typography>
						</Box>
						<LinearProgress
							variant='determinate'
							value={(job.progress / job.total) * 100}
							sx={{
								height: 6,
								borderRadius: 3,
								backgroundColor: 'rgba(0, 0, 0, 0.08)',
								'& .MuiLinearProgress-bar': {
									borderRadius: 3,
									backgroundColor:
										job.status === 'completed'
											? 'success.main'
											: job.status === 'failed'
											? 'error.main'
											: 'primary.main',
								},
							}}
						/>
						<Box
							sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}
						>
							<Typography
								variant='caption'
								color='text.secondary'
							>
								{getRecipeCount(job)} / {getRecipeTotal(job)} recipes
							</Typography>
							<Typography
								variant='caption'
								color='text.secondary'
							>
								100%
							</Typography>
						</Box>
					</Box>

					{/* Job Details */}
					<Box sx={{ mb: 1.25 }}>
						<Grid
							container
							spacing={1}
						>
							<Grid
								item
								xs={6}
							>
								<Paper
									variant='outlined'
									sx={{
										p: 1,
										backgroundColor: 'rgba(0, 0, 0, 0.02)',
										borderColor: 'divider',
									}}
								>
									<Typography
										variant='caption'
										color='text.secondary'
										display='block'
									>
										Attempts
									</Typography>
									<Typography variant='body2'>
										{job.attempts || 0} / {job.maxAttempts || 3}
									</Typography>
								</Paper>
							</Grid>
							<Grid
								item
								xs={6}
							>
								<Paper
									variant='outlined'
									sx={{
										p: 1,
										backgroundColor: 'rgba(0, 0, 0, 0.02)',
										borderColor: 'divider',
									}}
								>
									<Typography
										variant='caption'
										color='text.secondary'
										display='block'
									>
										Recipes Generated
									</Typography>
									<Typography variant='body2'>{getRecipeCount(job)}</Typography>
								</Paper>
							</Grid>
						</Grid>
					</Box>

					{/* Generated Recipes List */}
					{job.status === 'completed' &&
						Array.isArray(job.data?.recipes) &&
						job.data.recipes.length > 0 && (
							<Box sx={{ mb: 1.25 }}>
								<Typography
									variant='subtitle2'
									sx={{
										fontWeight: 600,
										color: 'text.secondary',
										mb: 1,
									}}
								>
									Generated Recipes
								</Typography>
								<Paper
									variant='outlined'
									sx={{
										p: 1,
										backgroundColor: 'rgba(0, 0, 0, 0.02)',
										borderColor: 'divider',
										maxHeight: '200px',
										overflow: 'auto',
									}}
								>
									<List
										dense
										disablePadding
									>
										{job.data.recipes.map((recipe, index) => (
											<ListItem
												key={recipe.id || index}
												disablePadding
												sx={{
													py: 0.5,
													borderBottom:
														Array.isArray(job.data.recipes) &&
														index < job.data.recipes.length - 1
															? '1px solid'
															: 'none',
													borderColor: 'divider',
												}}
											>
												<ListItemText
													primary={recipe.title}
													primaryTypographyProps={{
														variant: 'body2',
														sx: { fontWeight: 500 },
													}}
													secondary={
														<Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
															{recipe.cuisine && (
																<Chip
																	label={recipe.cuisine}
																	size='small'
																	sx={{
																		height: '20px',
																		'& .MuiChip-label': {
																			px: 1,
																			fontSize: '0.7rem',
																		},
																	}}
																/>
															)}
															{recipe.difficulty && (
																<Chip
																	label={recipe.difficulty}
																	size='small'
																	sx={{
																		height: '20px',
																		'& .MuiChip-label': {
																			px: 1,
																			fontSize: '0.7rem',
																		},
																	}}
																/>
															)}
														</Box>
													}
												/>
											</ListItem>
										))}
									</List>
								</Paper>
							</Box>
						)}

					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 1,
							mb: 1.25,
						}}
					>
						<Typography
							variant='body2'
							sx={{
								fontFamily: 'monospace',
								backgroundColor: 'rgba(0, 0, 0, 0.04)',
								padding: '4px 8px',
								borderRadius: 1,
								fontSize: '0.75rem',
							}}
						>
							ID: {job.id}
						</Typography>
						<IconButton
							size='small'
							onClick={() => {
								navigator.clipboard.writeText(job.id);
							}}
							sx={{
								padding: '4px',
								'&:hover': {
									backgroundColor: 'rgba(0, 0, 0, 0.08)',
								},
							}}
						>
							<ContentCopyIcon fontSize='small' />
						</IconButton>
					</Box>

					<Box
						sx={{
							mt: 1.25,
							display: 'flex',
							gap: 1.25,
							justifyContent: 'flex-end',
						}}
					>
						{(job.status === 'failed' || isStuck(job)) && attemptsLeft > 0 && (
							<Button
								size='small'
								variant='outlined'
								color={isStuck(job) ? 'warning' : 'primary'}
								onClick={() => handleRetry(job)}
								startIcon={<RefreshIcon />}
								sx={{
									borderRadius: 2,
									textTransform: 'none',
									fontWeight: 600,
									py: 0.75,
									px: 1.25,
									minWidth: 'auto',
									fontSize: '0.75rem',
									borderWidth: '1.5px',
									transition: 'all 0.3s ease',
									'&:hover': {
										borderWidth: '1.5px',
										backgroundColor: isStuck(job)
											? 'rgba(255, 152, 0, 0.08)'
											: 'rgba(33, 150, 243, 0.08)',
										transform: 'translateY(-1px)',
										boxShadow: isStuck(job)
											? '0 2px 4px rgba(255, 152, 0, 0.2)'
											: '0 2px 4px rgba(33, 150, 243, 0.2)',
									},
								}}
								title={
									isStuck(job)
										? 'Retry this stuck job'
										: 'Retry this failed job'
								}
							>
								{isStuck(job) ? 'Retry Stuck Job' : 'Retry'}
							</Button>
						)}
						<Button
							size='small'
							variant='outlined'
							color='error'
							onClick={() => handleDeleteClick(job)}
							disabled={job.status === 'processing'}
							startIcon={<DeleteIcon sx={{ fontSize: '0.875rem' }} />}
							sx={{
								borderRadius: 2,
								textTransform: 'none',
								fontWeight: 600,
								py: 0.75,
								px: 1.25,
								minWidth: 'auto',
								fontSize: '0.75rem',
								borderWidth: '1.5px',
								transition: 'all 0.3s ease',
								'&:hover': {
									borderWidth: '1.5px',
									backgroundColor: 'rgba(244, 67, 54, 0.08)',
									transform: 'translateY(-1px)',
									boxShadow: '0 2px 4px rgba(244, 67, 54, 0.2)',
								},
								'&.Mui-disabled': {
									borderWidth: '1.5px',
									opacity: 0.5,
								},
							}}
						>
							Delete
						</Button>
					</Box>

					{job.error && (
						<Alert
							severity='error'
							sx={{
								mt: 1.25,
								py: 0.75,
								'& .MuiAlert-icon': {
									padding: '4px 0',
									fontSize: '1rem',
								},
								'& .MuiAlert-message': {
									padding: '4px 0',
									fontSize: '0.75rem',
									fontWeight: 500,
								},
								backgroundColor: 'rgba(244, 67, 54, 0.08)',
								border: '1px solid',
								borderColor: 'error.light',
								borderRadius: 1.5,
								transition: 'all 0.2s ease',
								'&:hover': {
									backgroundColor: 'rgba(244, 67, 54, 0.12)',
								},
							}}
							icon={<ErrorIcon sx={{ fontSize: '1rem' }} />}
						>
							{job.error}
						</Alert>
					)}

					{isStuck(job) && (
						<Box sx={{ mt: 2 }}>
							<Alert
								severity='warning'
								sx={{
									mb: 2,
									backgroundColor: 'rgba(255, 152, 0, 0.08)',
									border: '1px solid',
									borderColor: 'warning.light',
									'& .MuiAlert-icon': {
										color: 'warning.main',
									},
								}}
							>
								<Typography
									variant='body2'
									sx={{ fontWeight: 500 }}
								>
									This job may be stuck. No progress detected for 5 minutes and
									has been running for{' '}
									{Math.floor(getJobDuration(job) / 1000 / 60)} minutes.
								</Typography>
							</Alert>
						</Box>
					)}
				</CardContent>
			</Card>
		);
	};

	const jobsToShow = jobQueue.filter((job) => {
		// Only filter out jobs that are currently active (pending or processing)
		// Failed and completed jobs should always show in historic section
		if (job.status === 'failed' || job.status === 'completed') {
			return true;
		}
		// For pending/processing jobs, only show if they're not the current active job
		return job.id !== jobId;
	});

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
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				Recipe Generation
				<Button
					variant='outlined'
					href='/recipes/management'
					startIcon={<SettingsIcon />}
					sx={{
						borderRadius: 2,
						textTransform: 'none',
						fontWeight: 600,
					}}
				>
					Manage Recipes
				</Button>
			</Typography>

			{error && (
				<Alert
					severity='error'
					sx={{ mb: 3 }}
				>
					{error}
				</Alert>
			)}

			<Grid
				container
				spacing={3}
			>
				{/* Season Selection */}
				<Grid
					item
					xs={12}
					md={6}
				>
					<Paper
						elevation={2}
						sx={{
							p: 3,
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							gap: 2,
							background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
							borderRadius: 2,
						}}
					>
						<Typography
							variant='h6'
							gutterBottom
							sx={{ fontWeight: 600, color: 'primary.main' }}
						>
							Select Season
						</Typography>
						<Grid
							container
							spacing={2}
						>
							{seasons.map((season) => (
								<Grid
									item
									xs={6}
									key={season.id}
								>
									<Button
										fullWidth
										variant={
											selectedSeason === season.id ? 'contained' : 'outlined'
										}
										onClick={() => setSelectedSeason(season.id)}
										disabled={isGenerating}
										sx={{
											height: '120px',
											display: 'flex',
											flexDirection: 'column',
											gap: 1,
											textTransform: 'none',
											borderRadius: 2,
											transition: 'all 0.2s ease-in-out',
											'&:hover': {
												transform: 'translateY(-2px)',
												boxShadow: 2,
											},
										}}
									>
										<season.icon sx={{ fontSize: 36 }} />
										<Typography
											variant='subtitle1'
											sx={{ fontWeight: 600 }}
										>
											{season.label}
										</Typography>
									</Button>
								</Grid>
							))}
						</Grid>
						<Button
							variant='contained'
							color='primary'
							onClick={handleGenerate}
							disabled={!selectedSeason || isGenerating}
							sx={{
								mt: 2,
								py: 1.5,
								fontWeight: 600,
								borderRadius: 2,
								textTransform: 'none',
								fontSize: '1.1rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 1,
							}}
						>
							{isGenerating ? (
								<>
									<CircularProgress
										size={22}
										color='inherit'
										sx={{ mr: 1 }}
									/>{' '}
									Generating...
								</>
							) : (
								'Generate Recipes'
							)}
						</Button>
					</Paper>
				</Grid>

				{/* Generation Status */}
				<Grid
					item
					xs={12}
					md={6}
				>
					<Paper
						elevation={2}
						sx={{
							p: 3,
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							gap: 2,
							background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
							borderRadius: 2,
						}}
					>
						<Typography
							variant='h6'
							gutterBottom
							sx={{ fontWeight: 600, color: 'primary.main' }}
						>
							Generation Status
						</Typography>
						{jobStatus ? (
							<Card
								elevation={0}
								sx={{ boxShadow: 'none', background: 'none', p: 0 }}
							>
								<CardContent sx={{ p: 0 }}>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 2,
											mb: 2,
										}}
									>
										<Typography
											variant='subtitle1'
											sx={{ fontWeight: 600 }}
										>
											{jobStatus.data?.season}
										</Typography>
										<Chip
											label={jobStatus.status}
											color={
												jobStatus.status === 'completed'
													? 'success'
													: jobStatus.status === 'failed'
													? 'error'
													: 'primary'
											}
											sx={{ fontWeight: 600 }}
										/>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Typography
												variant='body2'
												color='text.secondary'
											>
												Attempt {jobStatus.attempts || 0}/
												{jobStatus.maxAttempts || 3}
											</Typography>
										</Box>
									</Box>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 1,
											mb: 2,
										}}
									>
										<Typography
											variant='body2'
											sx={{
												fontFamily: 'monospace',
												backgroundColor: 'rgba(0, 0, 0, 0.04)',
												padding: '4px 8px',
												borderRadius: 1,
												fontSize: '0.875rem',
											}}
										>
											ID: {jobStatus.id}
										</Typography>
										<IconButton
											size='small'
											onClick={() => {
												navigator.clipboard.writeText(jobStatus.id);
											}}
											sx={{
												padding: '4px',
												'&:hover': {
													backgroundColor: 'rgba(0, 0, 0, 0.08)',
												},
											}}
										>
											<ContentCopyIcon fontSize='small' />
										</IconButton>
									</Box>
									{(jobStatus.status === 'processing' ||
										jobStatus.status === 'pending') && (
										<Box sx={{ width: '100%', mb: 2 }}>
											<LinearProgress
												variant='determinate'
												value={
													jobStatus.total
														? Math.floor(
																(jobStatus.progress / jobStatus.total) * 100
														  )
														: 0
												}
												sx={{
													height: 10,
													borderRadius: 5,
													backgroundColor: 'rgba(0, 0, 0, 0.1)',
													'& .MuiLinearProgress-bar': { borderRadius: 5 },
												}}
											/>
											<Typography
												variant='body2'
												color='text.secondary'
												sx={{ mt: 0.5, textAlign: 'right' }}
											>
												{jobStatus.progress}/{jobStatus.total} recipes
											</Typography>
											{(jobStatus.status === 'processing' ||
												jobStatus.status === 'pending') && (
												<Button
													variant='outlined'
													color='error'
													onClick={() => {
														setStopGenerationDialogOpen(true);
													}}
													startIcon={<ErrorIcon />}
													fullWidth
													sx={{ mt: 2 }}
												>
													Stop Generation
												</Button>
											)}
										</Box>
									)}
									<Typography
										variant='body1'
										sx={{ fontWeight: 500 }}
									>
										Recipes Produced: {jobStatus.progress ?? 0}
										{jobStatus.status === 'completed' && jobStatus.total
											? ` / ${jobStatus.total}`
											: ''}
									</Typography>
									<Stack
										spacing={1}
										sx={{ mt: 2 }}
									>
										<Typography
											variant='body2'
											color='text.secondary'
										>
											Created:{' '}
											{jobStatus.createdAt
												? new Date(jobStatus.createdAt).toLocaleString()
												: 'N/A'}
										</Typography>
										{(jobStatus.status === 'processing' ||
											jobStatus.status === 'pending') && (
											<Typography
												variant='body2'
												color='text.secondary'
											>
												Last Updated:{' '}
												{jobStatus.updatedAt
													? new Date(jobStatus.updatedAt).toLocaleString()
													: 'N/A'}
											</Typography>
										)}
										{jobStatus.status === 'completed' && (
											<Typography
												variant='body2'
												color='text.secondary'
											>
												Completed:{' '}
												{jobStatus.updatedAt
													? new Date(jobStatus.updatedAt).toLocaleString()
													: 'N/A'}
											</Typography>
										)}
										{(jobStatus.status === 'processing' ||
											jobStatus.status === 'pending') && (
											<Typography
												variant='body2'
												color='text.secondary'
												sx={{ fontWeight: 500 }}
											>
												Duration:{' '}
												{(() => {
													const seconds = Math.floor(
														(Date.now() -
															new Date(
																jobStatus.createdAt as string
															).getTime()) /
															1000
													);
													if (seconds < 60) {
														return `${seconds}s`;
													}
													const minutes = Math.floor(seconds / 60);
													const remainingSeconds = seconds % 60;
													return remainingSeconds > 0
														? `${minutes}m ${remainingSeconds}s`
														: `${minutes}m`;
												})()}
											</Typography>
										)}
									</Stack>
									{jobStatus.status === 'failed' && (
										<Box
											sx={{
												display: 'flex',
												gap: 1,
												mt: 2,
												justifyContent: 'flex-end',
											}}
										>
											<Button
												size='small'
												variant='outlined'
												color='primary'
												onClick={() => handleRetry(jobStatus as JobQueueItem)}
												startIcon={<RefreshIcon />}
												disabled={
													(jobStatus.attempts ?? 0) >=
													(jobStatus.maxAttempts ?? 3)
												}
												sx={{
													borderRadius: 2,
													textTransform: 'none',
													fontWeight: 600,
												}}
												title={
													(jobStatus.attempts ?? 0) >=
													(jobStatus.maxAttempts ?? 3)
														? 'Maximum retry attempts reached'
														: 'Retry this job'
												}
											>
												{(jobStatus.attempts ?? 0) >=
												(jobStatus.maxAttempts ?? 3)
													? 'Max Attempts Reached'
													: 'Retry'}
											</Button>
										</Box>
									)}
									{isStuck(jobStatus) && (
										<Box sx={{ mt: 2 }}>
											<Alert
												severity='warning'
												sx={{
													mb: 2,
													backgroundColor: 'rgba(255, 152, 0, 0.08)',
													border: '1px solid',
													borderColor: 'warning.light',
													'& .MuiAlert-icon': {
														color: 'warning.main',
													},
												}}
											>
												<Typography
													variant='body2'
													sx={{ fontWeight: 500 }}
												>
													This job may be stuck. No progress detected for 5
													minutes and has been running for{' '}
													{Math.floor(getJobDuration(jobStatus) / 1000 / 60)}{' '}
													minutes.
												</Typography>
											</Alert>
											<Box
												sx={{
													display: 'flex',
													gap: 1,
													justifyContent: 'flex-end',
												}}
											>
												<Button
													size='small'
													variant='outlined'
													color='warning'
													onClick={() => handleRetry(jobStatus as JobQueueItem)}
													startIcon={<RefreshIcon />}
													disabled={
														(jobStatus.attempts ?? 0) >=
														(jobStatus.maxAttempts ?? 3)
													}
													sx={{
														borderRadius: 2,
														textTransform: 'none',
														fontWeight: 600,
														py: 1,
														px: 2,
														borderWidth: '1.5px',
														transition: 'all 0.3s ease',
														'&:hover': {
															borderWidth: '1.5px',
															backgroundColor: 'rgba(255, 152, 0, 0.08)',
															transform: 'translateY(-1px)',
															boxShadow: '0 2px 4px rgba(255, 152, 0, 0.2)',
														},
														'&.Mui-disabled': {
															borderWidth: '1.5px',
															opacity: 0.5,
														},
													}}
													title={
														(jobStatus.attempts ?? 0) >=
														(jobStatus.maxAttempts ?? 3)
															? 'Maximum retry attempts reached'
															: 'Retry this stuck job'
													}
												>
													{(jobStatus.attempts ?? 0) >=
													(jobStatus.maxAttempts ?? 3)
														? 'Max Attempts Reached'
														: 'Retry Stuck Job'}
												</Button>
											</Box>
										</Box>
									)}
									{jobStatus.error && (
										<Alert
											severity='error'
											sx={{ mt: 2 }}
											icon={<ErrorIcon />}
										>
											{jobStatus.error}
										</Alert>
									)}
								</CardContent>
							</Card>
						) : isGenerating ? (
							<Box
								sx={{
									textAlign: 'center',
									py: 4,
									px: 2,
									borderRadius: 2,
									backgroundColor: 'rgba(0, 0, 0, 0.02)',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 2,
								}}
							>
								<CircularProgress
									size={36}
									color='primary'
								/>
								<Typography
									variant='h6'
									color='text.secondary'
									sx={{ fontWeight: 500 }}
								>
									Starting generation...
								</Typography>
								<Typography
									variant='body2'
									color='text.secondary'
									sx={{ mt: 1 }}
								>
									Please wait while your job is being created.
								</Typography>
							</Box>
						) : (
							<Box
								sx={{
									textAlign: 'center',
									py: 4,
									px: 2,
									borderRadius: 2,
									backgroundColor: 'rgba(0, 0, 0, 0.02)',
								}}
							>
								<Typography
									variant='h6'
									color='text.secondary'
									sx={{ fontWeight: 500 }}
								>
									No active generation
								</Typography>
								<Typography
									variant='body2'
									color='text.secondary'
									sx={{ mt: 1 }}
								>
									Select a season and click Generate Recipes to start
								</Typography>
							</Box>
						)}
					</Paper>
				</Grid>

				{/* Job Queue */}
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
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Typography
									variant='h6'
									sx={{ fontWeight: 600, color: 'primary.main' }}
								>
									Recipe Generation Jobs
								</Typography>
								<Button
									variant='outlined'
									onClick={fetchJobQueue}
									startIcon={<RefreshIcon />}
									sx={{
										borderRadius: 2,
										textTransform: 'none',
										fontWeight: 600,
									}}
								>
									Refresh
								</Button>
								<Button
									variant='outlined'
									onClick={() => {
										const allJobIds = jobsToShow.map((job) => job.id);
										setSelectedJobs(new Set(allJobIds));
									}}
									startIcon={<SelectAllIcon />}
									sx={{
										borderRadius: 2,
										textTransform: 'none',
										fontWeight: 600,
									}}
								>
									Select All
								</Button>
							</Box>
							{selectedJobs.size > 0 && (
								<Button
									variant='contained'
									color='error'
									onClick={() => setBulkDeleteDialogOpen(true)}
									startIcon={<DeleteIcon />}
									sx={{
										borderRadius: 2,
										textTransform: 'none',
										fontWeight: 600,
									}}
								>
									Delete Selected ({selectedJobs.size})
								</Button>
							)}
						</Box>
						<Grid
							container
							spacing={2}
						>
							{jobsToShow.length === 0 ? (
								<Grid
									item
									xs={12}
								>
									<Box
										sx={{
											textAlign: 'center',
											py: 4,
											px: 2,
											borderRadius: 2,
											backgroundColor: 'rgba(0, 0, 0, 0.02)',
										}}
									>
										<Typography
											variant='h6'
											color='text.secondary'
											sx={{ fontWeight: 500 }}
										>
											No previous jobs found
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
											sx={{ mt: 1 }}
										>
											When you generate more recipes, previous jobs will appear
											here.
										</Typography>
									</Box>
								</Grid>
							) : (
								jobsToShow.map((job) => (
									<Grid
										item
										xs={12}
										sm={6}
										md={4}
										key={job.id}
									>
										{renderJobCard(job)}
									</Grid>
								))
							)}
						</Grid>
					</Paper>
				</Grid>
			</Grid>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
				PaperProps={{
					sx: {
						borderRadius: 2,
						boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 600 }}>Confirm Delete</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete this job? This action cannot be
						undone.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						onClick={() => setDeleteDialogOpen(false)}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: 2,
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						color='error'
						variant='contained'
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: 2,
						}}
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>

			{/* Bulk Delete Confirmation Dialog */}
			<Dialog
				open={bulkDeleteDialogOpen}
				onClose={() => setBulkDeleteDialogOpen(false)}
				PaperProps={{
					sx: {
						borderRadius: 2,
						boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 600 }}>Confirm Bulk Delete</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete {selectedJobs.size} selected jobs?
						This action cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						onClick={() => setBulkDeleteDialogOpen(false)}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: 2,
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleBulkDelete}
						color='error'
						variant='contained'
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: 2,
						}}
					>
						Delete All
					</Button>
				</DialogActions>
			</Dialog>

			{/* Fail Job Confirmation Dialog */}
			<Dialog
				open={failJobDialogOpen}
				onClose={() => setFailJobDialogOpen(false)}
				PaperProps={{
					sx: {
						borderRadius: 2,
						boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 600 }}>Confirm Fail Job</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to mark this job as failed? This action cannot
						be undone.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						onClick={() => setFailJobDialogOpen(false)}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: 2,
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={() => jobToFail && handleFailJob(jobToFail)}
						color='error'
						variant='contained'
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: 2,
						}}
					>
						Fail Job
					</Button>
				</DialogActions>
			</Dialog>

			{/* Stop Generation Confirmation Dialog */}
			<Dialog
				open={stopGenerationDialogOpen}
				onClose={() => setStopGenerationDialogOpen(false)}
				PaperProps={{
					sx: {
						borderRadius: 2,
						boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 600 }}>
					Confirm Stop Generation
				</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to stop this generation? This action cannot be
						undone.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						onClick={() => setStopGenerationDialogOpen(false)}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: 2,
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleStopGeneration}
						color='error'
						variant='contained'
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: 2,
						}}
					>
						Stop Generation
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
