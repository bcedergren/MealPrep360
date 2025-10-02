'use client';

import React, { useState } from 'react';
import {
	ApiErrorHandler,
	useApiErrorHandler,
	getErrorMessage,
} from './ApiErrorHandler';

export function ApiErrorExample() {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<any>(null);
	const [error, setError] = useState<any>(null);
	const { handleError } = useApiErrorHandler();

	const fetchData = async (endpoint: string) => {
		setLoading(true);
		setError(null);
		setData(null);

		try {
			const response = await fetch(endpoint);

			if (!response.ok) {
				// Try to get error details from response
				let errorData;
				try {
					errorData = await response.json();
				} catch {
					errorData = {
						success: false,
						error: 'HTTP_ERROR',
						message: `HTTP ${response.status}: ${response.statusText}`,
						status: response.status,
						statusText: response.statusText,
					};
				}

				throw errorData;
			}

			const result = await response.json();
			setData(result);
		} catch (err) {
			const processedError = handleError(err);
			setError(processedError);
		} finally {
			setLoading(false);
		}
	};

	const testEndpoints = [
		{ name: 'Health Check (Working)', url: '/api/health' },
		{ name: 'Subscription (500 Error)', url: '/api/subscription' },
		{ name: 'Settings (500 Error)', url: '/api/settings' },
		{ name: 'Shopping Lists (500 Error)', url: '/api/shopping-lists' },
		{ name: 'Recipes (500 Error)', url: '/api/recipes/recommended' },
		{ name: 'Test Connection (Local)', url: '/api/test-connection' },
		{ name: 'Non-existent (404)', url: '/api/non-existent' },
	];

	return (
		<div className='p-6 max-w-4xl mx-auto'>
			<h2 className='text-2xl font-bold mb-6'>API Error Testing</h2>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
				{testEndpoints.map((endpoint) => (
					<button
						key={endpoint.url}
						onClick={() => fetchData(endpoint.url)}
						disabled={loading}
						className='p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
					>
						<div className='font-medium text-sm'>{endpoint.name}</div>
						<div className='text-xs text-gray-500 mt-1'>{endpoint.url}</div>
					</button>
				))}
			</div>

			{loading && (
				<div className='flex items-center justify-center p-8'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
					<span className='ml-2'>Loading...</span>
				</div>
			)}

			{error && (
				<div className='mb-6'>
					<h3 className='text-lg font-semibold mb-3 text-red-600'>
						Error Response:
					</h3>
					<ApiErrorHandler
						error={error}
						onRetry={() => window.location.reload()}
						showToast={false}
					/>

					{/* Show raw error details in development */}
					{process.env.NODE_ENV === 'development' && (
						<details className='mt-4'>
							<summary className='cursor-pointer text-sm text-gray-600 hover:text-gray-800'>
								Raw Error Object
							</summary>
							<pre className='mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto'>
								{JSON.stringify(error, null, 2)}
							</pre>
						</details>
					)}
				</div>
			)}

			{data && (
				<div className='mb-6'>
					<h3 className='text-lg font-semibold mb-3 text-green-600'>
						Success Response:
					</h3>
					<div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
						<pre className='text-sm overflow-auto'>
							{JSON.stringify(data, null, 2)}
						</pre>
					</div>
				</div>
			)}

			{/* Instructions */}
			<div className='mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
				<h3 className='font-semibold text-blue-800 mb-2'>Instructions:</h3>
				<ul className='text-sm text-blue-700 space-y-1'>
					<li>• Click any endpoint button to test API error handling</li>
					<li>
						• The middleware now forwards actual API errors instead of using
						fallbacks
					</li>
					<li>
						• 500 errors from the external API will be shown as server errors
					</li>
					<li>
						• Network connectivity issues will be shown as connectivity errors
					</li>
					<li>• Check the browser console for detailed error logs</li>
				</ul>
			</div>

			{/* Error Message Utility Demo */}
			{error && (
				<div className='mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='font-semibold text-gray-800 mb-2'>
						Error Message Utility:
					</h3>
					<p className='text-sm text-gray-600'>
						<code>getErrorMessage(error)</code> returns:{' '}
						<strong>"{getErrorMessage(error)}"</strong>
					</p>
				</div>
			)}
		</div>
	);
}
