'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface HealthStatus {
	status: 'healthy' | 'unhealthy';
	timestamp: string;
	database: {
		status: 'connected' | 'disconnected';
		collections: {
			mealPlans: {
				count: number;
			};
		};
	};
}

export default function DashboardPage() {
	const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchHealthStatus = async () => {
			try {
				const response = await fetch('/api/health', {
					headers: {
						Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
					},
				});
				if (!response.ok) {
					throw new Error('Failed to fetch health status');
				}
				const data = await response.json();
				setHealthStatus(data);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Failed to fetch health status'
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchHealthStatus();
		// Refresh health status every 30 seconds
		const interval = setInterval(fetchHealthStatus, 30000);
		return () => clearInterval(interval);
	}, []);

	if (isLoading) {
		return (
			<div className='container mx-auto p-4'>
				<h1 className='text-2xl font-bold mb-6'>Dashboard</h1>
				<div className='animate-pulse'>
					<div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
					<div className='h-32 bg-gray-200 rounded mb-4'></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='container mx-auto p-4'>
				<h1 className='text-2xl font-bold mb-6'>Dashboard</h1>
				<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
					{error}
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-2xl font-bold mb-6'>Dashboard</h1>

			{healthStatus && (
				<div className='mb-8'>
					<h2 className='text-xl font-semibold mb-4'>Health Status</h2>
					<pre className='bg-gray-100 p-4 rounded overflow-auto'>
						{JSON.stringify(healthStatus, null, 2)}
					</pre>
				</div>
			)}

			<div className='mb-8'>
				<h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					<a
						href='/meal-plan'
						className='bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors'
					>
						Create Meal Plan
					</a>
					<a
						href='/meal-plan?view=saved'
						className='bg-green-50 text-green-700 px-4 py-3 rounded-lg hover:bg-green-100 transition-colors'
					>
						View Saved Plans
					</a>
					<button
						onClick={() => window.location.reload()}
						className='bg-gray-50 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors'
					>
						Refresh Dashboard
					</button>
				</div>
			</div>
		</div>
	);
}
