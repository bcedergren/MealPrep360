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
		const { plan, action, billingInterval } = body;

		// For now, just return a mock success response
		// In a real implementation, you would integrate with Stripe
		if (action === 'upgrade') {
			return NextResponse.json({
				success: true,
				message: `Successfully upgraded to ${plan} plan`,
				url: null, // For immediate upgrades, no redirect needed
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Checkout session created',
			url: 'https://checkout.stripe.com/mock-session', // Mock Stripe checkout URL
		});
	} catch (error) {
		console.error('Error creating checkout session:', error);
		return NextResponse.json(
			{ error: 'Failed to create checkout session' },
			{ status: 500 }
		);
	}
}
