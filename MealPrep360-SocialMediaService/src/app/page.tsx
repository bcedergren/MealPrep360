export const metadata = {
	title: 'MealPrep360 - Social Service',
};

async function getServiceStatus() {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
		const response = await fetch(`${apiUrl}/api/health`, {
			next: { revalidate: 60 }, // Use ISR: revalidate every 60 seconds
		});

		if (!response.ok) {
			return { error: `Health check failed: ${response.statusText}` };
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching service status:', error);
		return {
			error:
				error instanceof Error
					? error.message
					: 'Failed to fetch service status',
		};
	}
}

export default async function Home() {
	const status = await getServiceStatus();
	const currentTime = new Date().toISOString();

	return (
		<div
			style={{
				padding: '2rem',
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				maxWidth: '1200px',
				margin: '0 auto',
				lineHeight: '1.6',
			}}
		>
			<div
				style={{
					background: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
					color: 'white',
					padding: '2rem',
					borderRadius: '8px',
					marginBottom: '2rem',
					textAlign: 'center',
				}}
			>
				<h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>
					👥 MealPrep360 Social Service
				</h1>
				<p style={{ margin: '0', fontSize: '1.2rem', opacity: '0.9' }}>
					{status.error
						? 'Service Status: Degraded'
						: 'Service Status: Operational'}
				</p>
				<p
					style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: '0.8' }}
				>
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
						<span
							style={{
								background: status.error ? '#dc3545' : '#28a745',
								color: 'white',
								padding: '0.25rem 0.5rem',
								borderRadius: '4px',
								fontSize: '0.9rem',
							}}
						>
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
					<div
						style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
					>
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
							href='/api/social/feed'
							style={{
								background: '#e91e63',
								color: 'white',
								padding: '0.5rem 1rem',
								textDecoration: 'none',
								borderRadius: '4px',
								fontSize: '0.9rem',
								textAlign: 'center',
							}}
						>
							Social Feed
						</a>
						<a
							href='/swagger'
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
							API Documentation
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
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#e91e63' }}>
							📱 Social Posts
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/social/feed</li>
							<li>POST /api/social/posts</li>
							<li>POST /api/social/posts/[id]/like</li>
							<li>POST /api/social/posts/[id]/comments</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#6f42c1' }}>
							👤 User Management
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/users/[userId]</li>
							<li>POST /api/users/[userId]/follow</li>
							<li>GET /api/users/[userId]/followers</li>
							<li>GET /api/users/[userId]/following</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#fd7e14' }}>
							🍳 Recipe Collaboration
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>POST /api/recipes/[id]/collaborate</li>
							<li>GET /api/recipes/[id]/version</li>
							<li>POST /api/recipes/[id]/version</li>
							<li>GET /api/recipes/collaborative</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#20c997' }}>
							💬 Messaging
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/messages</li>
							<li>POST /api/messages</li>
							<li>GET /api/notifications</li>
							<li>POST /api/websocket</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#17a2b8' }}>
							🔍 Search & Discovery
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/search</li>
							<li>GET /api/search/users</li>
							<li>GET /api/search/recipes</li>
							<li>GET /api/search/posts</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#dc3545' }}>
							🛡️ Moderation
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/moderation/reports</li>
							<li>POST /api/moderation/reports</li>
							<li>GET /api/moderation/reports/[id]</li>
							<li>GET /api/metrics</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>
							🔧 System
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>GET /api/health</li>
							<li>GET /api/metrics</li>
							<li>GET /api/swagger</li>
							<li>GET /swagger</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>
							✨ Features
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>Real-time messaging</li>
							<li>Recipe collaboration</li>
							<li>Social feed algorithms</li>
							<li>Content moderation</li>
						</ul>
					</div>
				</div>
			</div>

			{!status.error && (
				<div
					style={{
						background: '#fce4ec',
						border: '1px solid #e91e63',
						borderRadius: '8px',
						padding: '1.5rem',
						marginBottom: '2rem',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#ad1457' }}>
						📈 Service Metrics
					</h3>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
							gap: '1rem',
						}}
					>
						<div>
							<strong style={{ color: '#ad1457' }}>Environment:</strong>
							<span style={{ marginLeft: '0.5rem', color: '#666' }}>
								{process.env.NODE_ENV || 'development'}
							</span>
						</div>
						<div>
							<strong style={{ color: '#ad1457' }}>Version:</strong>
							<span style={{ marginLeft: '0.5rem', color: '#666' }}>
								{process.env.npm_package_version || '1.0.0'}
							</span>
						</div>
						<div>
							<strong style={{ color: '#ad1457' }}>Database:</strong>
							<span style={{ marginLeft: '0.5rem', color: '#666' }}>
								{status.database?.connected ? 'Connected' : 'Disconnected'}
							</span>
						</div>
						<div>
							<strong style={{ color: '#ad1457' }}>WebSocket:</strong>
							<span style={{ marginLeft: '0.5rem', color: '#666' }}>
								{status.websocket?.connected ? 'Connected' : 'Disconnected'}
							</span>
						</div>
					</div>
				</div>
			)}

			<div
				style={{
					background: 'white',
					border: '1px solid #e9ecef',
					borderRadius: '8px',
					padding: '1.5rem',
					marginBottom: '2rem',
				}}
			>
				<h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
					🌟 Social Features
				</h3>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: '1rem',
					}}
				>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#e91e63' }}>
							Community
						</h4>
						<p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
							Connect with fellow meal preppers and share experiences
						</p>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍳</div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#e91e63' }}>
							Recipe Sharing
						</h4>
						<p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
							Share and collaborate on recipes with the community
						</p>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#e91e63' }}>
							Real-time Chat
						</h4>
						<p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
							Instant messaging and notifications for seamless communication
						</p>
					</div>
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#e91e63' }}>
							Moderation
						</h4>
						<p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
							Smart content moderation to maintain a positive community
						</p>
					</div>
				</div>
			</div>

			<div
				style={{
					marginTop: '2rem',
					padding: '1rem',
					background: '#f8f9fa',
					borderRadius: '8px',
					textAlign: 'center',
					borderLeft: '4px solid #e91e63',
				}}
			>
				<p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
					<strong>MealPrep360 Social Service</strong> - Connect, share, and
					collaborate on meal preparation
				</p>
				<p
					style={{
						margin: '0.5rem 0 0 0',
						color: '#6c757d',
						fontSize: '0.8rem',
					}}
				>
					Built with Next.js, TypeScript, WebSocket, and MongoDB
				</p>
			</div>
		</div>
	);
}
