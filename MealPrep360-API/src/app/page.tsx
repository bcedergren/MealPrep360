// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function Home() {
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
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					color: 'white',
					padding: '2rem',
					borderRadius: '8px',
					marginBottom: '2rem',
					textAlign: 'center',
				}}
			>
				<h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>
					🍽️ MealPrep360 API
				</h1>
				<p style={{ margin: '0', fontSize: '1.2rem', opacity: '0.9' }}>
					Production API Service - Ready & Running
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
						📚 Documentation
					</h3>
					<p style={{ margin: '0 0 1rem 0', color: '#6c757d' }}>
						Interactive API documentation with authentication and testing
						capabilities.
					</p>
					<a
						href='/docs'
						style={{
							background: '#007bff',
							color: 'white',
							padding: '0.5rem 1rem',
							textDecoration: 'none',
							borderRadius: '4px',
							display: 'inline-block',
						}}
					>
						View API Docs
					</a>
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
						🏥 Health Check
					</h3>
					<p style={{ margin: '0 0 1rem 0', color: '#6c757d' }}>
						Monitor API status and connectivity.
					</p>
					<div style={{ display: 'flex', gap: '0.5rem' }}>
						<a
							href='/api/ping'
							style={{
								background: '#28a745',
								color: 'white',
								padding: '0.5rem 1rem',
								textDecoration: 'none',
								borderRadius: '4px',
								fontSize: '0.9rem',
							}}
						>
							Ping
						</a>
						<a
							href='/api/health'
							style={{
								background: '#17a2b8',
								color: 'white',
								padding: '0.5rem 1rem',
								textDecoration: 'none',
								borderRadius: '4px',
								fontSize: '0.9rem',
							}}
						>
							Health
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
							👤 User Management
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>/api/user</li>
							<li>/api/user/preferences</li>
							<li>/api/user/settings</li>
							<li>/api/user/stats</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#e83e8c' }}>
							🍳 Recipes
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>/api/recipes</li>
							<li>/api/recipes/search</li>
							<li>/api/recipes/recommended</li>
							<li>/api/recipes/analyze</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#fd7e14' }}>
							📅 Meal Planning
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>/api/meal-plans</li>
							<li>/api/meal-plans/generate</li>
							<li>/api/meal-plans/optimized</li>
							<li>/api/meals/planned</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#20c997' }}>
							🛒 Shopping
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>/api/shopping-lists</li>
							<li>/api/shopping-lists/generate</li>
							<li>/api/freezer/inventory</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#6610f2' }}>
							🤖 AI Features
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>/api/ai</li>
							<li>/api/ai/suggestions</li>
							<li>/api/generate-image</li>
							<li>/api/generate-blog</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#dc3545' }}>
							🔐 Authentication
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>/api/auth/token</li>
							<li>/api/security/2fa</li>
							<li>/api/webhooks/clerk</li>
							<li>/api/subscription</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#17a2b8' }}>
							📊 Analytics & Admin
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>/api/admin/analytics</li>
							<li>/api/admin/users</li>
							<li>/api/admin/stats</li>
							<li>/api/feedback</li>
						</ul>
					</div>

					<div>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>
							🌐 Integration
						</h4>
						<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
							<li>/api/integrations/calendar</li>
							<li>/api/integrations/shopping-list</li>
							<li>/api/newsletter/subscribe</li>
							<li>/api/language</li>
						</ul>
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
					borderLeft: '4px solid #007bff',
				}}
			>
				<p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
					<strong>MealPrep360 API</strong> - Powering intelligent meal planning
					and nutrition tracking
				</p>
				<p
					style={{
						margin: '0.5rem 0 0 0',
						color: '#6c757d',
						fontSize: '0.8rem',
					}}
				>
					Built with Next.js, TypeScript, and MongoDB
				</p>
			</div>
		</div>
	);
}
