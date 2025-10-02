import { Suspense } from 'react';
import SocialFeed from '../components/social/SocialFeed';
import SocialProfile from '../components/social/SocialProfile';
import { useUser } from '@clerk/nextjs';

export default function SocialPage() {
	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
						<div className='lg:col-span-2'>
							<Suspense fallback={<div>Loading feed...</div>}>
								<SocialFeed />
							</Suspense>
						</div>
						<div>
							<Suspense fallback={<div>Loading profile...</div>}>
								<SocialProfile />
							</Suspense>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
