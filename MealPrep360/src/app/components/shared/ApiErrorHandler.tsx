'use client';

import React from 'react';
import { useSnackbar } from '../ui/snackbar';

interface ApiError {
	success: false;
	error: string;
	message: string;
	details?: {
		originalError?: string;
		timestamp?: string;
		path?: string;
		method?: string;
		reason?: string;
	};
}

interface ApiErrorHandlerProps {
	error: ApiError | Error | any;
	onRetry?: () => void;
	showToast?: boolean;
	className?: string;
}

export function ApiErrorHandler({
	error,
	onRetry,
	showToast = true,
	className = '',
}: ApiErrorHandlerProps) {
	// Parse the error
	const getErrorInfo = () => {
		if (error?.error === 'AUTHENTICATION_REQUIRED') {
			return {
				type: 'AUTHENTICATION_REQUIRED',
				title: 'Authentication Required',
				message:
					error.message || 'You must be logged in to access this resource.',
				details: error.details,
				isRetryable: false,
				requiresLogin: true,
			};
		}

		if (error?.error === 'CONNECTIVITY_ERROR') {
			return {
				type: 'CONNECTIVITY_ERROR',
				title: 'Connection Error',
				message: error.message || 'Unable to connect to the API',
				details: error.details,
				isRetryable: true,
				requiresLogin: false,
			};
		}

		if (error?.status === 401) {
			return {
				type: 'UNAUTHORIZED',
				title: 'Authentication Error',
				message:
					'Your session has expired or you are not authorized to access this resource.',
				details: error.details || { status: 401 },
				isRetryable: false,
				requiresLogin: true,
			};
		}

		if (error?.status >= 500) {
			return {
				type: 'SERVER_ERROR',
				title: 'Server Error',
				message: 'The server encountered an error. Please try again later.',
				details: { status: error.status, statusText: error.statusText },
				isRetryable: true,
				requiresLogin: false,
			};
		}

		if (error?.status >= 400 && error?.status < 500) {
			return {
				type: 'CLIENT_ERROR',
				title: 'Request Error',
				message: error.message || 'There was an issue with your request.',
				details: { status: error.status, statusText: error.statusText },
				isRetryable: false,
				requiresLogin: false,
			};
		}

		// Generic error
		return {
			type: 'UNKNOWN_ERROR',
			title: 'Error',
			message: error?.message || 'An unexpected error occurred.',
			details: error?.details || {},
			isRetryable: true,
			requiresLogin: false,
		};
	};

	const { showSnackbar } = useSnackbar();
	const errorInfo = getErrorInfo();

	// Show toast notification if enabled
	React.useEffect(() => {
		if (showToast && errorInfo.type !== 'CLIENT_ERROR') {
			showSnackbar(errorInfo.message, 'error');
		}
	}, [errorInfo, showToast]);

	return (
		<div
			className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
		>
			<div className='flex items-start'>
				<div className='flex-shrink-0'>
					<svg
						className='h-5 w-5 text-red-400'
						viewBox='0 0 20 20'
						fill='currentColor'
					>
						<path
							fillRule='evenodd'
							d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
							clipRule='evenodd'
						/>
					</svg>
				</div>
				<div className='ml-3 flex-1'>
					<h3 className='text-sm font-medium text-red-800'>
						{errorInfo.title}
					</h3>
					<div className='mt-2 text-sm text-red-700'>
						<p>{errorInfo.message}</p>

						{/* Show additional details in development */}
						{process.env.NODE_ENV === 'development' && errorInfo.details && (
							<details className='mt-2'>
								<summary className='cursor-pointer text-xs text-red-600 hover:text-red-800'>
									Show technical details
								</summary>
								<pre className='mt-1 text-xs bg-red-100 p-2 rounded overflow-auto'>
									{JSON.stringify(errorInfo.details, null, 2)}
								</pre>
							</details>
						)}
					</div>

					{/* Action buttons */}
					<div className='mt-4 flex space-x-2'>
						{errorInfo.requiresLogin && (
							<button
								onClick={() => (window.location.href = '/auth/signin')}
								className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors'
							>
								Sign In
							</button>
						)}

						{errorInfo.isRetryable && onRetry && !errorInfo.requiresLogin && (
							<button
								onClick={onRetry}
								className='bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors'
							>
								Try Again
							</button>
						)}

						{errorInfo.type === 'CONNECTIVITY_ERROR' && (
							<button
								onClick={() => window.location.reload()}
								className='bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors'
							>
								Reload Page
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// Hook for handling API errors in components
export function useApiErrorHandler() {
	const handleError = (error: any) => {
		console.error('API Error:', error);

		// You can add additional error handling logic here
		// such as logging to an error tracking service

		return error;
	};

	return { handleError };
}

// Utility function to check if an error is an API error
export function isApiError(error: any): error is ApiError {
	return (
		error &&
		typeof error === 'object' &&
		'success' in error &&
		error.success === false
	);
}

// Utility function to extract error message from various error types
export function getErrorMessage(error: any): string {
	if (isApiError(error)) {
		return error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	return 'An unexpected error occurred';
}
