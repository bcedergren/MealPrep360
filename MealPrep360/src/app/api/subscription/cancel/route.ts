import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { reason, feedback, retentionOffer, immediateCancel } = body;

		// For now, just return a mock response
		// In a real implementation, you would integrate with Stripe and your database

		if (retentionOffer && retentionOffer !== 'none') {
			return NextResponse.json({
				success: true,
				retentionApplied: true,
				message: `Retention offer applied: ${retentionOffer}`,
			});
		}

		const message = immediateCancel
			? 'Your subscription has been canceled immediately'
			: 'Your subscription will be canceled at the end of the current billing period';

		return NextResponse.json({
			success: true,
			message,
			canceledAt: immediateCancel ? new Date() : null,
			cancelAtPeriodEnd: !immediateCancel,
		});
	} catch (error) {
		console.error('Error canceling subscription:', error);
		return NextResponse.json(
			{ error: 'Failed to cancel subscription' },
			{ status: 500 }
		);
	}
}
