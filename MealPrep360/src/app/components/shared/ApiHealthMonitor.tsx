'use client';

import { useEffect, useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

interface ApiHealthStatus {
	isHealthy: boolean;
	lastSuccessfulCall: Date | null;
	lastFailedCall: Date | null;
	consecutiveFailures: number;
	circuitBreakerOpen: boolean;
	totalCallsToday: number;
	failedCallsToday: number;
	fallbackResponsesServed: number;
	averageResponseTime: number;
	endpoints: {
		[key: string]: {
			lastCalled: Date | null;
			status: 'success' | 'failed' | 'fallback';
			responseTime?: number;
		};
	};
}

interface ApiCall {
	endpoint: string;
	timestamp: Date;
	status: 'success' | 'failed' | 'fallback';
	responseTime?: number;
	error?: string;
}

export function ApiHealthMonitor() {
	const { role, isLoading: roleLoading } = useUserRole();
	const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({
		isHealthy: true,
		lastSuccessfulCall: null,
		lastFailedCall: null,
		consecutiveFailures: 0,
		circuitBreakerOpen: false,
		totalCallsToday: 0,
		failedCallsToday: 0,
		fallbackResponsesServed: 0,
		averageResponseTime: 0,
		endpoints: {},
	});

	const [recentCalls, setRecentCalls] = useState<ApiCall[]>([]);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Monitor API calls by intercepting fetch
		const originalFetch = window.fetch;
		const callTimes = new Map<string, number>();

		window.fetch = async (...args) => {
			const url = args[0]?.toString() || '';
			const startTime = Date.now();
			const callId = `${url}-${startTime}`;

			// Only monitor our API calls
			if (!url.includes('/api/')) {
				return originalFetch(...args);
			}

			callTimes.set(callId, startTime);

			try {
				const response = await originalFetch(...args);
				const endTime = Date.now();
				const responseTime = endTime - startTime;
				const endpoint = url.replace(window.location.origin, '');

				// Check if this is a fallback response
				const isFallback =
					response.headers.get('X-Fallback-Response') === 'true';
				const isApiUnavailable =
					response.headers.get('X-External-API-Status') === 'unavailable';

				const status =
					isFallback || isApiUnavailable
						? 'fallback'
						: response.ok
						? 'success'
						: 'failed';

				const apiCall: ApiCall = {
					endpoint,
					timestamp: new Date(),
					status,
					responseTime,
				};

				// Update API health status
				setApiHealth((prev) => {
					const newEndpoints = { ...prev.endpoints };
					newEndpoints[endpoint] = {
						lastCalled: new Date(),
						status,
						responseTime,
					};

					const newConsecutiveFailures =
						status === 'success'
							? 0
							: status === 'failed'
							? prev.consecutiveFailures + 1
							: prev.consecutiveFailures;

					return {
						...prev,
						isHealthy: status === 'success' && newConsecutiveFailures < 3,
						lastSuccessfulCall:
							status === 'success' ? new Date() : prev.lastSuccessfulCall,
						lastFailedCall:
							status === 'failed' ? new Date() : prev.lastFailedCall,
						consecutiveFailures: newConsecutiveFailures,
						circuitBreakerOpen: isFallback || isApiUnavailable,
						totalCallsToday: prev.totalCallsToday + 1,
						failedCallsToday:
							status === 'failed'
								? prev.failedCallsToday + 1
								: prev.failedCallsToday,
						fallbackResponsesServed:
							isFallback || isApiUnavailable
								? prev.fallbackResponsesServed + 1
								: prev.fallbackResponsesServed,
						endpoints: newEndpoints,
					};
				});

				// Add to recent calls (keep last 20)
				setRecentCalls((prev) => {
					const newCalls = [apiCall, ...prev].slice(0, 20);
					return newCalls;
				});

				callTimes.delete(callId);
				return response;
			} catch (error) {
				const endTime = Date.now();
				const responseTime = endTime - startTime;
				const endpoint = url.replace(window.location.origin, '');

				const apiCall: ApiCall = {
					endpoint,
					timestamp: new Date(),
					status: 'failed',
					responseTime,
					error: error instanceof Error ? error.message : 'Unknown error',
				};

				setApiHealth((prev) => ({
					...prev,
					isHealthy: false,
					lastFailedCall: new Date(),
					consecutiveFailures: prev.consecutiveFailures + 1,
					totalCallsToday: prev.totalCallsToday + 1,
					failedCallsToday: prev.failedCallsToday + 1,
					endpoints: {
						...prev.endpoints,
						[endpoint]: {
							lastCalled: new Date(),
							status: 'failed',
							responseTime,
						},
					},
				}));

				setRecentCalls((prev) => [apiCall, ...prev].slice(0, 20));
				callTimes.delete(callId);
				throw error;
			}
		};

		// Show monitor with Ctrl+Shift+A
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'A') {
				setIsVisible((prev) => !prev);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		// Cleanup
		return () => {
			window.fetch = originalFetch;
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	// Only show for ADMIN users
	if (roleLoading) {
		return null; // Don't show anything while loading role
	}

	if (role !== 'ADMIN') {
		return null; // Don't show for non-admin users
	}

	if (!isVisible) {
		return (
			<div
				style={{
					position: 'relative',
					fontSize: '12px',
					background: apiHealth.isHealthy ? '#10b981' : '#ef4444',
					color: 'white',
					padding: '4px 8px',
					borderRadius: '4px',
					cursor: 'pointer',
					display: 'inline-block',
				}}
				onClick={() => setIsVisible(true)}
				title='Click to view API health details (or Ctrl+Shift+A)'
			>
				API: {apiHealth.isHealthy ? '✅' : '❌'}
				{apiHealth.circuitBreakerOpen && ' 🔴'}
				{apiHealth.fallbackResponsesServed > 0 &&
					` (${apiHealth.fallbackResponsesServed} fallbacks)`}
			</div>
		);
	}

	return (
		<div
			style={{
				position: 'fixed',
				bottom: '80px',
				right: '20px',
				width: '400px',
				maxHeight: '80vh',
				overflowY: 'auto',
				zIndex: 9999,
				background: 'white',
				border: '2px solid #e5e7eb',
				borderRadius: '8px',
				boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
			}}
		>
			<div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
						API Health Monitor
					</h3>
					<button
						onClick={() => setIsVisible(false)}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '18px',
							cursor: 'pointer',
							padding: '4px',
						}}
					>
						✕
					</button>
				</div>

				<div
					style={{
						marginTop: '12px',
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '8px',
					}}
				>
					<div
						style={{
							background: apiHealth.isHealthy ? '#dcfce7' : '#fee2e2',
							padding: '8px',
							borderRadius: '4px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '12px', color: '#6b7280' }}>Status</div>
						<div
							style={{
								fontSize: '14px',
								fontWeight: 'bold',
								color: apiHealth.isHealthy ? '#059669' : '#dc2626',
							}}
						>
							{apiHealth.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}
						</div>
					</div>

					<div
						style={{
							background: apiHealth.circuitBreakerOpen ? '#fee2e2' : '#e0f2fe',
							padding: '8px',
							borderRadius: '4px',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '12px', color: '#6b7280' }}>
							Circuit Breaker
						</div>
						<div
							style={{
								fontSize: '14px',
								fontWeight: 'bold',
								color: apiHealth.circuitBreakerOpen ? '#dc2626' : '#0891b2',
							}}
						>
							{apiHealth.circuitBreakerOpen ? '🔴 Open' : '🟢 Closed'}
						</div>
					</div>
				</div>

				<div
					style={{
						marginTop: '12px',
						display: 'grid',
						gridTemplateColumns: '1fr 1fr 1fr',
						gap: '8px',
						fontSize: '12px',
					}}
				>
					<div style={{ textAlign: 'center' }}>
						<div style={{ color: '#6b7280' }}>Total Calls</div>
						<div style={{ fontWeight: 'bold' }}>
							{apiHealth.totalCallsToday}
						</div>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ color: '#6b7280' }}>Failed</div>
						<div style={{ fontWeight: 'bold', color: '#dc2626' }}>
							{apiHealth.failedCallsToday}
						</div>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ color: '#6b7280' }}>Fallbacks</div>
						<div style={{ fontWeight: 'bold', color: '#f59e0b' }}>
							{apiHealth.fallbackResponsesServed}
						</div>
					</div>
				</div>

				{apiHealth.consecutiveFailures > 0 && (
					<div
						style={{
							marginTop: '8px',
							padding: '8px',
							background: '#fee2e2',
							borderRadius: '4px',
							fontSize: '12px',
							color: '#dc2626',
						}}
					>
						⚠️ {apiHealth.consecutiveFailures} consecutive failures
					</div>
				)}
			</div>

			<div style={{ padding: '16px' }}>
				<h4
					style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}
				>
					Recent API Calls
				</h4>
				<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
					{recentCalls.length === 0 ? (
						<div
							style={{
								textAlign: 'center',
								color: '#6b7280',
								fontSize: '12px',
							}}
						>
							No API calls yet
						</div>
					) : (
						recentCalls.map((call, index) => (
							<div
								key={index}
								style={{
									padding: '8px',
									borderBottom: '1px solid #e5e7eb',
									fontSize: '11px',
								}}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<div style={{ fontWeight: 'bold', flex: 1 }}>
										{call.endpoint.replace('/api/', '')}
									</div>
									<div
										style={{
											padding: '2px 6px',
											borderRadius: '4px',
											background:
												call.status === 'success'
													? '#dcfce7'
													: call.status === 'failed'
													? '#fee2e2'
													: '#fef3c7',
											color:
												call.status === 'success'
													? '#059669'
													: call.status === 'failed'
													? '#dc2626'
													: '#d97706',
											fontSize: '10px',
											fontWeight: 'bold',
										}}
									>
										{call.status.toUpperCase()}
									</div>
								</div>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										marginTop: '4px',
										color: '#6b7280',
									}}
								>
									<div>{call.timestamp.toLocaleTimeString()}</div>
									{call.responseTime && <div>{call.responseTime}ms</div>}
								</div>
								{call.error && (
									<div
										style={{
											marginTop: '4px',
											color: '#dc2626',
											fontSize: '10px',
										}}
									>
										Error: {call.error}
									</div>
								)}
							</div>
						))
					)}
				</div>
			</div>

			<div
				style={{
					padding: '12px 16px',
					borderTop: '1px solid #e5e7eb',
					background: '#f9fafb',
					fontSize: '10px',
					color: '#6b7280',
				}}
			>
				Press Ctrl+Shift+A to toggle monitor | Click outside to minimize
			</div>
		</div>
	);
}

export default ApiHealthMonitor;
