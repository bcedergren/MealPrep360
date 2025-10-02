// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NotFound() {
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
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					color: 'white',
					padding: '2rem',
					borderRadius: '8px',
					marginBottom: '2rem',
				}}
			>
				<h1 style={{ margin: '0 0 0.5rem 0', fontSize: '3rem' }}>404</h1>
				<h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
					Page Not Found
				</h2>
				<p style={{ margin: '0', fontSize: '1rem', opacity: '0.9' }}>
					The page you're looking for doesn't exist.
				</p>
			</div>

			<div
				style={{
					background: '#f8f9fa',
					padding: '1.5rem',
					borderRadius: '8px',
					border: '1px solid #e9ecef',
				}}
			>
				<h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
					🏠 Go Back Home
				</h3>
				<p style={{ margin: '0 0 1rem 0', color: '#6c757d' }}>
					Return to the MealPrep360 API homepage.
				</p>
				<a
					href='/'
					style={{
						background: '#007bff',
						color: 'white',
						padding: '0.5rem 1rem',
						textDecoration: 'none',
						borderRadius: '4px',
						display: 'inline-block',
					}}
				>
					Go Home
				</a>
			</div>
		</div>
	);
}
