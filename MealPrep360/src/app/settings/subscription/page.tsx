'use client';

import dynamic from 'next/dynamic';

const SubscriptionClient = dynamic(
	() => import('./subscription-client') as any,
	{
		ssr: false,
	}
);

export default function SubscriptionPage() {
	return <SubscriptionClient />;
}
