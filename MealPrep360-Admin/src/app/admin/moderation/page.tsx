import { Suspense } from 'react';
import { ModerationStats } from './components/ModerationStats';
import { FlaggedContentList } from './components/FlaggedContentList';

export default function ModerationPage() {
	return (
		<div className='container mx-auto px-4 py-8'>
			<h1 className='text-3xl font-bold mb-8'>Content Moderation</h1>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				<div className='lg:col-span-1'>
					<Suspense fallback={<div>Loading stats...</div>}>
						<ModerationStats />
					</Suspense>
				</div>

				<div className='lg:col-span-2'>
					<Suspense fallback={<div>Loading flagged content...</div>}>
						<FlaggedContentList />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
