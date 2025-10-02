'use client';

import { useEffect } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error('Application error:', error);
	}, [error]);

	return (
		<div
			style={{
				padding: '2rem',
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				maxWidth: '600px',
				margin: '0 auto',
				textAlign: 'center',
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div
				style={{
					background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
					color: 'white',
					padding: '2rem',
					borderRadius: '8px',
					marginBottom: '2rem',
				}}
			>
				<h1 style={{ margin: '0 0 0.5rem 0', fontSize: '3rem' }}>500</h1>
				<h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
					Something went wrong!
				</h2>
				<p style={{ margin: '0', fontSize: '1rem', opacity: '0.9' }}>
					An unexpected error occurred. Please try again.
				</p>
			</div>

			<div
				style={{
					background: '#f8f9fa',
					padding: '1.5rem',
					borderRadius: '8px',
					border: '1px solid #e9ecef',
					display: 'flex',
					gap: '1rem',
					flexWrap: 'wrap',
					justifyContent: 'center',
				}}
			>
				<button
					onClick={() => reset()}
					style={{
						background: '#28a745',
						color: 'white',
						padding: '0.5rem 1rem',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '1rem',
					}}
				>
					Try Again
				</button>
				<a
					href='/'
					style={{
						background: '#007bff',
						color: 'white',
						padding: '0.5rem 1rem',
						textDecoration: 'none',
						borderRadius: '4px',
						display: 'inline-block',
						fontSize: '1rem',
					}}
				>
					Go Home
				</a>
			</div>
		</div>
	);
}
