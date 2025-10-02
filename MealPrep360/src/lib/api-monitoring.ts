// API Monitoring Utilities

interface ApiFailureLog {
	endpoint: string;
	timestamp: Date;
	error: string;
	retryAttempt?: number;
	isFallback: boolean;
	responseTime?: number;
}

interface ApiStats {
	totalCalls: number;
	failedCalls: number;
	fallbackCalls: number;
	avgResponseTime: number;
	uptime: number; // percentage
}

class ApiMonitor {
	private failures: ApiFailureLog[] = [];
	private stats: ApiStats = {
		totalCalls: 0,
		failedCalls: 0,
		fallbackCalls: 0,
		avgResponseTime: 0,
		uptime: 100,
	};

	logFailure(
		endpoint: string,
		error: string,
		retryAttempt?: number,
		responseTime?: number
	) {
		const failure: ApiFailureLog = {
			endpoint,
			timestamp: new Date(),
			error,
			retryAttempt,
			isFallback: false,
			responseTime,
		};

		this.failures.push(failure);
		this.stats.failedCalls++;
		this.updateStats();

		// Enhanced console logging
		console.group(`🚨 API Failure: ${endpoint}`);
		console.error(`Error: ${error}`);
		console.info(`Time: ${failure.timestamp.toLocaleTimeString()}`);
		if (retryAttempt) console.info(`Retry Attempt: ${retryAttempt}`);
		if (responseTime) console.info(`Response Time: ${responseTime}ms`);
		console.info(`Total Failures Today: ${this.stats.failedCalls}`);
		console.info(`Current Uptime: ${this.stats.uptime.toFixed(1)}%`);
		console.groupEnd();
	}

	logFallback(endpoint: string, reason: string) {
		const fallback: ApiFailureLog = {
			endpoint,
			timestamp: new Date(),
			error: reason,
			isFallback: true,
		};

		this.failures.push(fallback);
		this.stats.fallbackCalls++;
		this.updateStats();

		console.group(`🔄 Fallback Response: ${endpoint}`);
		console.warn(`Reason: ${reason}`);
		console.info(`Time: ${fallback.timestamp.toLocaleTimeString()}`);
		console.info(`Total Fallbacks Today: ${this.stats.fallbackCalls}`);
		console.groupEnd();
	}

	logSuccess(endpoint: string, responseTime: number) {
		this.stats.totalCalls++;
		this.updateResponseTime(responseTime);
		this.updateStats();
	}

	private updateResponseTime(responseTime: number) {
		const totalResponseTime =
			this.stats.avgResponseTime * (this.stats.totalCalls - 1);
		this.stats.avgResponseTime =
			(totalResponseTime + responseTime) / this.stats.totalCalls;
	}

	private updateStats() {
		this.stats.totalCalls = this.stats.failedCalls + this.getSuccessfulCalls();
		if (this.stats.totalCalls > 0) {
			this.stats.uptime =
				((this.stats.totalCalls - this.stats.failedCalls) /
					this.stats.totalCalls) *
				100;
		}
	}

	private getSuccessfulCalls(): number {
		// This is a simplified calculation - in a real implementation you'd track this separately
		return Math.max(0, this.stats.totalCalls - this.stats.failedCalls);
	}

	private hasRecentFailures(): boolean {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		return this.failures.some((failure) => failure.timestamp > fiveMinutesAgo);
	}

	private shouldLogSuccess(endpoint: string): boolean {
		// Only log success for critical endpoints or when debugging
		const criticalEndpoints = [
			'/api/settings',
			'/api/subscription',
			'/api/user/role',
		];

		// Don't log success for external clerk endpoints or common endpoints
		if (
			endpoint.includes('clerk.accounts.dev') ||
			endpoint.includes('_rsc=') ||
			endpoint.includes('/api/shopping-lists') ||
			endpoint.includes('/api/recipes/recommended')
		) {
			return false;
		}

		return criticalEndpoints.some((critical) => endpoint.includes(critical));
	}

	// Get recent failures (last hour)
	getRecentFailures(): ApiFailureLog[] {
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
		return this.failures.filter((failure) => failure.timestamp > oneHourAgo);
	}

	// Get stats for the current session
	getStats(): ApiStats {
		return { ...this.stats };
	}

	// Get failure summary by endpoint
	getFailureSummary(): Record<string, number> {
		const summary: Record<string, number> = {};
		this.failures.forEach((failure) => {
			summary[failure.endpoint] = (summary[failure.endpoint] || 0) + 1;
		});
		return summary;
	}

	// Print comprehensive report to console
	printReport() {
		console.group('📊 API Health Report');
		console.table(this.getStats());

		console.group('🔍 Failure Summary by Endpoint');
		console.table(this.getFailureSummary());
		console.groupEnd();

		const recentFailures = this.getRecentFailures();
		if (recentFailures.length > 0) {
			console.group(
				`⚠️ Recent Failures (Last Hour) - ${recentFailures.length} total`
			);
			recentFailures.forEach((failure) => {
				console.log(
					`${failure.timestamp.toLocaleTimeString()} - ${failure.endpoint}: ${
						failure.error
					}`
				);
			});
			console.groupEnd();
		}

		console.groupEnd();
	}

	// Clear old failures (keep last 24 hours)
	cleanup() {
		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		this.failures = this.failures.filter(
			(failure) => failure.timestamp > twentyFourHoursAgo
		);
	}
}

// Global instance
export const apiMonitor = new ApiMonitor();

// Auto cleanup every hour
if (typeof window !== 'undefined') {
	setInterval(
		() => {
			apiMonitor.cleanup();
		},
		60 * 60 * 1000
	);

	// Make available globally for debugging
	(window as any).apiMonitor = apiMonitor;

	// Add keyboard shortcut to print report (Ctrl+Shift+R)
	window.addEventListener('keydown', (e) => {
		if (e.ctrlKey && e.shiftKey && e.key === 'R') {
			apiMonitor.printReport();
		}
	});

	// API Monitor loaded silently - use Ctrl+Shift+R for health report
}

export default apiMonitor;
