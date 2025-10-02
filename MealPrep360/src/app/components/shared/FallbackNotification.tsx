'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { apiMonitor } from '@/lib/api-monitoring';

interface ApiHealthStatus {
	isExternalApiDown: boolean;
	lastChecked: Date;
}

export function FallbackNotification() {
	const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({
		isExternalApiDown: false,
		lastChecked: new Date(),
	});

	useEffect(() => {
		let hasShownNotification = false;

		// Monitor API responses for fallback headers
		const originalFetch = window.fetch;

		window.fetch = async (...args) => {
			try {
				const response = await originalFetch(...args);

				// Check if this is a fallback response
				const isFallback =
					response.headers.get('X-Fallback-Response') === 'true';
				const isApiUnavailable =
					response.headers.get('X-External-API-Status') === 'unavailable';
				const endpoint =
					args[0]?.toString().replace(window.location.origin, '') || 'unknown';

				if (isFallback || isApiUnavailable) {
					// Log fallback using apiMonitor
					apiMonitor.logFallback(
						endpoint,
						isApiUnavailable ? 'External API unavailable' : 'Fallback response'
					);

					if (!hasShownNotification) {
						setApiHealth({
							isExternalApiDown: true,
							lastChecked: new Date(),
						});

						toast('⚠️ Running in offline mode - Some features may be limited', {
							duration: 6000,
							style: {
								background: '#f59e0b',
								color: 'white',
							},
							icon: '🔄',
						});

						hasShownNotification = true;

						// Reset notification flag after 5 minutes
						setTimeout(() => {
							hasShownNotification = false;
						}, 5 * 60 * 1000);
					}
				} else if (response.ok) {
					// Log successful API call
					apiMonitor.logSuccess(endpoint, 0); // We don't have response time here

					setApiHealth((prev) => ({
						...prev,
						isExternalApiDown: false,
					}));
				} else {
					// Log API failure
					apiMonitor.logFailure(
						endpoint,
						`HTTP ${response.status}: ${response.statusText}`
					);
				}

				return response;
			} catch (error) {
				return originalFetch(...args);
			}
		};

		// Cleanup
		return () => {
			window.fetch = originalFetch;
		};
	}, []);

	// Don't render anything - this component only handles notifications
	return null;
}

export default FallbackNotification;
