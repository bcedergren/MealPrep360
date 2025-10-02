import { headers } from 'next/headers';

async function getServiceStatus() {
	const headersList = headers();
	const token = process.env.API_TOKEN;
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

	if (!token) {
		return { error: 'API_TOKEN environment variable is not set' };
	}

	try {
		const response = await fetch(`${apiUrl}/api/health`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			cache: 'no-store',
		});

		if (!response.ok) {
			return { error: `Failed to fetch service status: ${response.statusText}` };
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching service status:', error);
		return { error: error instanceof Error ? error.message : 'Failed to fetch service status' };
	}
}

export default async function Home() {
	const status = await getServiceStatus();
	const currentTime = new Date().toISOString();

	return (
		<div
			style={{
				padding: '2rem',
				fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				maxWidth: '1200px',
				margin: '0 auto',
				lineHeight: '1.6',
			}}
		>
			<div
				style={{
					background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
					color: 'white',
					padding: '2rem',
					borderRadius: '8px',
					marginBottom: '2rem',
					textAlign: 'center',
				}}
			>
				<h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>
					📅 MealPrep360 Meal Plan Service
				</h1>
				<p style={{ margin: '0', fontSize: '1.2rem', opacity: '0.9' }}>
					{status.error ? 'Service Status: Degraded' : 'Service Status: Operational'}
				</p>
				<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: '0.8' }}>
					Last Updated: {currentTime}
				</p>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
					gap: '1.5rem',
					marginBottom: '2rem',
				}}
			>
				<div
					style={{
						background: '#f8f9fa',
						padding: '1.5rem',
						borderRadius: '8px',
						border: '1px solid #e9ecef',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
						📊 Service Health
					</h3>
					<div style={{ margin: '0 0 1rem 0' }}>
						<span style={{ 
							background: status.error ? '#dc3545' : '#28a745',
							color: 'white',
							padding: '0.25rem 0.5rem',
							borderRadius: '4px',
							fontSize: '0.9rem',
						}}>
							{status.error ? 'Unhealthy' : 'Healthy'}
						</span>
					</div>
					<p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
						{status.error ? status.error : 'All systems operational'}
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
						🔗 Quick Links
					</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						<a
							href='/api/health'
							style={{
								background: '#17a2b8',
								color: 'white',
								padding: '0.5rem 1rem',
								textDecoration: 'none',
								borderRadius: '4px',
								fontSize: '0.9rem',
								textAlign: 'center',
							}}
						>
							Health Check
						</a>
						<a
							href='/api/meal-plans'
							style={{
								background: '#28a745',
								color: 'white',
								padding: '0.5rem 1rem',
								textDecoration: 'none',
								borderRadius: '4px',
								fontSize: '0.9rem',
								textAlign: 'center',
							}}
						>
							Meal Plans API
						</a>
					</div>
				</div>
			</div>

			<div
				style={{
					background: 'white',
					border: '1px solid #e9ecef',
					borderRadius: '8px',
					padding: '1.5rem',
					marginBottom: '2rem',
				}}
			>
				<h2 style={{ margin: '0 0 1.5rem 0', color: '#495057' }}>
					🚀 API Endpoints
				</h2>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
						gap: '1.5rem',
					}}
				>
					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#6f42c1' }}>
							📋 Meal Plan Management
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/meal-plans</li>
							<li>POST /api/meal-plans</li>
							<li>PUT /api/meal-plans/[id]</li>
							<li>DELETE /api/meal-plans/[id]</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#e83e8c' }}>
							📅 Day Management
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/meal-plans/[id]/days/[dayIndex]</li>
							<li>POST /api/meal-plans/[id]/days/[dayIndex]/skip</li>
							<li>POST /api/meal-plans/[id]/days/[dayIndex]/unskip</li>
							<li>POST /api/meal-plans/skip-date</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#17a2b8' }}>
							🏥 System Health
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/health</li>
							<li>GET /dashboard</li>
							<li>GET /meal-plan</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#fd7e14' }}>
							🔧 Service Features
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>AI-powered meal planning</li>
							<li>Smart scheduling</li>
							<li>Skip/unskip functionality</li>
							<li>MongoDB integration</li>
						</ul>
					</div>
				</div>
			</div>

			{!status.error && (
				<div
					style={{
						background: '#e8f5e9',
						border: '1px solid #4caf50',
						borderRadius: '8px',
						padding: '1.5rem',
						marginBottom: '2rem',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#2e7d32' }}>
						📈 Service Metrics
					</h3>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
						<div>
							<strong style={{ color: '#2e7d32' }}>Environment:</strong>
							<span style={{ marginLeft: '0.5rem', color: '#666' }}>
								{process.env.NODE_ENV || 'development'}
							</span>
						</div>
						<div>
							<strong style={{ color: '#2e7d32' }}>Version:</strong>
							<span style={{ marginLeft: '0.5rem', color: '#666' }}>
								{process.env.npm_package_version || '1.0.0'}
							</span>
						</div>
						<div>
							<strong style={{ color: '#2e7d32' }}>Database:</strong>
							<span style={{ marginLeft: '0.5rem', color: '#666' }}>
								{status.database?.connected ? 'Connected' : 'Disconnected'}
							</span>
						</div>
						<div>
							<strong style={{ color: '#2e7d32' }}>Uptime:</strong>
							<span style={{ marginLeft: '0.5rem', color: '#666' }}>
								{status.uptime ? `${Math.floor(status.uptime / 60)}min` : 'N/A'}
							</span>
						</div>
					</div>
				</div>
			)}

			<div
				style={{
					marginTop: '2rem',
					padding: '1rem',
					background: '#f8f9fa',
					borderRadius: '8px',
					textAlign: 'center',
					borderLeft: '4px solid #4f46e5',
				}}
			>
				<p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
					<strong>MealPrep360 Meal Plan Service</strong> - Intelligent meal planning and scheduling
				</p>
				<p style={{ margin: '0.5rem 0 0 0', color: '#6c757d', fontSize: '0.8rem' }}>
					Built with Next.js, TypeScript, and MongoDB
				</p>
			</div>
		</div>
	);
}
