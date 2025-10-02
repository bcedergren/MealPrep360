import { Suspense } from 'react';
import GroupPrepSession from '../../components/social/GroupPrepSession';

interface GroupPrepPageProps {
	searchParams: {
		sessionId?: string;
	};
}

export default function GroupPrepPage({ searchParams }: GroupPrepPageProps) {
	const { sessionId } = searchParams;

	if (!sessionId) {
		return (
			<div className='min-h-screen bg-gray-50'>
				<div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
					<div className='px-4 py-6 sm:px-0'>
						<div className='text-center'>
							<h1 className='text-2xl font-bold text-gray-900'>
								Group Meal Prep
							</h1>
							<p className='mt-2 text-gray-600'>
								Join or create a group meal prep session to cook together!
							</p>
							<div className='mt-6'>
								<a
									href='/social/group-prep/create'
									className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
								>
									Create New Session
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
				<div className='px-4 py-6 sm:px-0'>
					<Suspense fallback={<div>Loading session...</div>}>
						<GroupPrepSession sessionId={sessionId} />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
