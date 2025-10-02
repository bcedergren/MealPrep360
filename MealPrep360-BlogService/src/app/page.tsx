import Link from 'next/link';
import { JSX } from 'react';

export default function Home(): JSX.Element {
	return (
		<main className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100'>
			<div className='container mx-auto px-4 py-16'>
				<div className='max-w-3xl mx-auto text-center'>
					<h1 className='text-4xl font-bold text-gray-900 mb-6'>
						Welcome to MealPrep360 Blog Service
					</h1>
					<p className='text-xl text-gray-600 mb-8'>
						Your AI-powered blog content generation service is up and running!
					</p>

					<div className='bg-white rounded-lg shadow-lg p-8 mb-8'>
						<h2 className='text-2xl font-semibold text-gray-800 mb-4'>
							Service Status
						</h2>
						<div className='flex items-center justify-center space-x-2 mb-4'>
							<div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
							<span className='text-green-600 font-medium'>
								Service is operational
							</span>
						</div>
						<p className='text-gray-600'>
							The blog service is ready to generate and manage your content.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='bg-white rounded-lg shadow-lg p-6'>
							<h3 className='text-xl font-semibold text-gray-800 mb-3'>
								API Endpoints
							</h3>
							<ul className='text-left text-gray-600 space-y-2'>
								<li>• GET /api/blog - List all blog posts</li>
								<li>• POST /api/blog - Create new blog post</li>
								<li>• GET /api/blog/[id] - Get single blog post</li>
								<li>• PUT /api/blog/[id] - Update blog post</li>
							</ul>
						</div>

						<div className='bg-white rounded-lg shadow-lg p-6'>
							<h3 className='text-xl font-semibold text-gray-800 mb-3'>
								Features
							</h3>
							<ul className='text-left text-gray-600 space-y-2'>
								<li>• AI-powered content generation</li>
								<li>• Automatic image generation</li>
								<li>• MongoDB database integration</li>
								<li>• RESTful API endpoints</li>
							</ul>
						</div>
					</div>

					<div className='mt-8'>
						<Link
							href='/api/blog'
							className='inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
						>
							View Blog Posts
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}
