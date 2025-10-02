'use client';

import dynamicImport from 'next/dynamic';
import { useState } from 'react';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamicImport(() => import('swagger-ui-react'), {
	ssr: false,
	loading: () => <div>Loading API documentation...</div>,
});

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DocsPage() {
	const [showSwagger, setShowSwagger] = useState(false);

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
					📚 API Documentation
				</h1>
				<p style={{ margin: '0', fontSize: '1.2rem', opacity: '0.9' }}>
					MealPrep360 API Reference & Interactive Explorer
				</p>
			</div>

			<div
				style={{
					background: '#f8f9fa',
					padding: '1.5rem',
					borderRadius: '8px',
					border: '1px solid #e9ecef',
					marginBottom: '2rem',
				}}
			>
				<h2 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
					🚀 Interactive API Explorer
				</h2>
				<p style={{ margin: '0 0 1rem 0', color: '#6c757d' }}>
					Access the full interactive API documentation with testing
					capabilities.
				</p>
				<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
					<button
						onClick={() => setShowSwagger(!showSwagger)}
						style={{
							background: showSwagger ? '#dc3545' : '#007bff',
							color: 'white',
							padding: '0.75rem 1.5rem',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '1rem',
						}}
					>
						{showSwagger ? 'Hide' : 'Show'} Interactive API Explorer
					</button>
					<a
						href='/api/docs'
						target='_blank'
						rel='noopener noreferrer'
						style={{
							background: '#28a745',
							color: 'white',
							padding: '0.75rem 1.5rem',
							textDecoration: 'none',
							borderRadius: '4px',
							display: 'inline-block',
							fontSize: '1rem',
						}}
					>
						Open API Spec (JSON)
					</a>
					<a
						href='/api/health'
						target='_blank'
						rel='noopener noreferrer'
						style={{
							background: '#17a2b8',
							color: 'white',
							padding: '0.75rem 1.5rem',
							textDecoration: 'none',
							borderRadius: '4px',
							display: 'inline-block',
							fontSize: '1rem',
						}}
					>
						Health Check
					</a>
				</div>
			</div>

			{showSwagger && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e9ecef',
						borderRadius: '8px',
						marginBottom: '2rem',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							background: '#f8f9fa',
							padding: '1rem',
							borderBottom: '1px solid #e9ecef',
						}}
					>
						<h3 style={{ margin: '0', color: '#495057' }}>
							🔧 Interactive API Testing
						</h3>
						<p
							style={{
								margin: '0.5rem 0 0 0',
								color: '#6c757d',
								fontSize: '0.9rem',
							}}
						>
							Click "Authorize" below and enter your JWT token to test
							authenticated endpoints.
						</p>
					</div>
					<SwaggerUI
						url='/api/docs'
						docExpansion='list'
						deepLinking={true}
						displayRequestDuration={true}
						tryItOutEnabled={true}
						filter={true}
						showExtensions={true}
						showCommonExtensions={true}
					/>
				</div>
			)}

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
						background: 'white',
						padding: '1.5rem',
						borderRadius: '8px',
						border: '1px solid #e9ecef',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#6f42c1' }}>
						👤 User Management
					</h3>
					<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
						<li>
							<code>GET /api/user</code> - Get user profile
						</li>
						<li>
							<code>POST /api/user</code> - Update user profile
						</li>
						<li>
							<code>GET /api/user/preferences</code> - Get preferences &
							settings
						</li>
						<li>
							<code>POST /api/user/preferences</code> - Update preferences
						</li>
						<li>
							<code>GET /api/user/settings</code> - Get settings
						</li>
						<li>
							<code>GET /api/user/stats</code> - Get user statistics
						</li>
					</ul>
				</div>

				<div
					style={{
						background: 'white',
						padding: '1.5rem',
						borderRadius: '8px',
						border: '1px solid #e9ecef',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#e83e8c' }}>🍳 Recipes</h3>
					<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
						<li>
							<code>GET /api/recipes</code> - List recipes
						</li>
						<li>
							<code>POST /api/recipes</code> - Create recipe
						</li>
						<li>
							<code>GET /api/recipes/[id]</code> - Get recipe details
						</li>
						<li>
							<code>GET /api/recipes/search</code> - Search recipes
						</li>
						<li>
							<code>GET /api/recipes/recommended</code> - Get recommendations
						</li>
						<li>
							<code>POST /api/recipes/analyze</code> - Analyze recipe
						</li>
					</ul>
				</div>

				<div
					style={{
						background: 'white',
						padding: '1.5rem',
						borderRadius: '8px',
						border: '1px solid #e9ecef',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#fd7e14' }}>
						📅 Meal Planning
					</h3>
					<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
						<li>
							<code>GET /api/meal-plans</code> - Get meal plans
						</li>
						<li>
							<code>POST /api/meal-plans</code> - Create meal plan
						</li>
						<li>
							<code>POST /api/meal-plans/generate</code> - Generate plan
						</li>
						<li>
							<code>GET /api/meal-plans/optimized</code> - Get optimized plans
						</li>
						<li style={{ color: '#28a745', fontWeight: 'bold' }}>
							<code>GET /api/skipped-days</code> - Get skipped days ✨
						</li>
						<li>
							<code>GET /api/meals/planned</code> - Get planned meals
						</li>
					</ul>
				</div>

				<div
					style={{
						background: 'white',
						padding: '1.5rem',
						borderRadius: '8px',
						border: '1px solid #e9ecef',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#20c997' }}>
						🛒 Shopping Lists
					</h3>
					<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
						<li>
							<code>GET /api/shopping-lists</code> - Get shopping lists
						</li>
						<li>
							<code>POST /api/shopping-lists</code> - Create shopping list
						</li>
						<li>
							<code>POST /api/shopping-lists/generate</code> - Generate list
						</li>
						<li>
							<code>GET /api/freezer/inventory</code> - Get freezer inventory
						</li>
					</ul>
				</div>

				<div
					style={{
						background: 'white',
						padding: '1.5rem',
						borderRadius: '8px',
						border: '1px solid #e9ecef',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#6610f2' }}>
						🤖 AI Features
					</h3>
					<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
						<li>
							<code>POST /api/ai</code> - AI assistance
						</li>
						<li>
							<code>GET /api/ai/suggestions</code> - Get AI suggestions
						</li>
						<li>
							<code>POST /api/generate-image</code> - Generate images
						</li>
						<li>
							<code>POST /api/generate-blog</code> - Generate blog content
						</li>
					</ul>
				</div>

				<div
					style={{
						background: 'white',
						padding: '1.5rem',
						borderRadius: '8px',
						border: '1px solid #e9ecef',
					}}
				>
					<h3 style={{ margin: '0 0 1rem 0', color: '#dc3545' }}>
						🔐 Authentication
					</h3>
					<ul style={{ margin: '0', paddingLeft: '1rem', color: '#6c757d' }}>
						<li>
							<code>GET /api/auth/token</code> - Get auth token
						</li>
						<li>
							<code>POST /api/security/2fa</code> - Two-factor auth
						</li>
						<li>
							<code>POST /api/webhooks/clerk</code> - Clerk webhooks
						</li>
						<li>
							<code>GET /api/subscription</code> - Get subscription
						</li>
					</ul>
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
				<h2 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
					🔧 Authentication
				</h2>
				<p style={{ margin: '0 0 1rem 0', color: '#6c757d' }}>
					Most endpoints require authentication. Include your API token in the
					Authorization header:
				</p>
				<div
					style={{
						background: '#f8f9fa',
						padding: '1rem',
						borderRadius: '4px',
						border: '1px solid #e9ecef',
						fontFamily: 'monospace',
						fontSize: '0.9rem',
					}}
				>
					Authorization: Bearer YOUR_JWT_TOKEN
				</div>
				<p
					style={{ margin: '1rem 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}
				>
					💡 <strong>Tip:</strong> Use the interactive API explorer above to
					test endpoints with your token.
				</p>
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
				<h2 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
					✨ Recently Added Endpoints
				</h2>
				<div style={{ margin: '1rem 0' }}>
					<div
						style={{
							padding: '1rem',
							background: '#d4edda',
							borderRadius: '4px',
							border: '1px solid #c3e6cb',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
							GET /api/user/preferences
						</h4>
						<p style={{ margin: '0', color: '#155724', fontSize: '0.9rem' }}>
							Returns comprehensive user dietary preferences and cooking
							settings including theme, notifications, meal planning
							preferences, and more.
						</p>
					</div>
					<div
						style={{
							padding: '1rem',
							background: '#d4edda',
							borderRadius: '4px',
							border: '1px solid #c3e6cb',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
							POST /api/user/preferences
						</h4>
						<p style={{ margin: '0', color: '#155724', fontSize: '0.9rem' }}>
							Updates user dietary preferences array. Send an array of
							preference strings in the request body.
						</p>
					</div>
					<div
						style={{
							padding: '1rem',
							background: '#d4edda',
							borderRadius: '4px',
							border: '1px solid #c3e6cb',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
							GET /api/skipped-days
						</h4>
						<p style={{ margin: '0', color: '#155724', fontSize: '0.9rem' }}>
							Returns skipped meal plan days for a specified date range.
							Requires startDate and endDate query parameters.
						</p>
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
				<h2 style={{ margin: '0 0 1rem 0', color: '#495057' }}>
					📖 Additional Resources
				</h2>
				<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
					<a
						href='/'
						style={{
							background: '#6c757d',
							color: 'white',
							padding: '0.5rem 1rem',
							textDecoration: 'none',
							borderRadius: '4px',
							display: 'inline-block',
						}}
					>
						← Back to API Home
					</a>
					<a
						href='/api/ping'
						style={{
							background: '#28a745',
							color: 'white',
							padding: '0.5rem 1rem',
							textDecoration: 'none',
							borderRadius: '4px',
							display: 'inline-block',
						}}
					>
						Test API Connection
					</a>
					<a
						href='/api/auth/token'
						style={{
							background: '#ffc107',
							color: '#212529',
							padding: '0.5rem 1rem',
							textDecoration: 'none',
							borderRadius: '4px',
							display: 'inline-block',
						}}
					>
						Get Auth Token Guide
					</a>
				</div>
			</div>
		</div>
	);
}
