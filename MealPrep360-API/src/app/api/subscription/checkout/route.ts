import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import {
	SubscriptionPlan,
	BillingInterval,
	STRIPE_PRICE_IDS,
	canUpgradeTo,
	canDowngradeTo,
} from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-06-30.basil',
});

export async function POST(req: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const body = await req.json();
		const {
			plan,
			billingInterval = 'monthly',
			action = 'upgrade',
		}: {
			plan: SubscriptionPlan;
			billingInterval?: BillingInterval;
			action?: 'upgrade' | 'downgrade' | 'change';
		} = body;

		if (!plan || plan === 'FREE') {
			return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
		}

		if (!['monthly', 'yearly'].includes(billingInterval)) {
			return NextResponse.json(
				{ error: 'Invalid billing interval' },
				{ status: 400 }
			);
		}

		// Get user from database
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const currentPlan = user.subscription?.plan || 'FREE';
		const stripeCustomerId = user.subscription?.stripeCustomerId;
		const stripeSubscriptionId = user.subscription?.stripeSubscriptionId;

		// Validate the plan change
		if (action === 'upgrade' && !canUpgradeTo(currentPlan, plan)) {
			return NextResponse.json(
				{ error: 'Cannot upgrade to this plan' },
				{ status: 400 }
			);
		}

		if (action === 'downgrade' && !canDowngradeTo(currentPlan, plan)) {
			return NextResponse.json(
				{ error: 'Cannot downgrade to this plan' },
				{ status: 400 }
			);
		}

		const priceId = STRIPE_PRICE_IDS[plan][billingInterval];
		if (!priceId) {
			return NextResponse.json(
				{
					error: `Price ID not configured for ${plan} ${billingInterval} plan`,
				},
				{ status: 400 }
			);
		}

		// If user has existing subscription, handle upgrade/downgrade
		if (stripeCustomerId && stripeSubscriptionId) {
			try {
				// Get current subscription
				const subscription = await stripe.subscriptions.retrieve(
					stripeSubscriptionId
				);

				if (subscription.status === 'active') {
					// Update existing subscription
					const updatedSubscription = await stripe.subscriptions.update(
						stripeSubscriptionId,
						{
							items: [
								{
									id: subscription.items.data[0].id,
									price: priceId,
								},
							],
							proration_behavior:
								action === 'upgrade' ? 'create_prorations' : 'none',
							billing_cycle_anchor:
								action === 'downgrade' ? 'unchanged' : undefined,
						}
					);

					// Update user in database
					await User.findByIdAndUpdate(user._id, {
						$set: {
							'subscription.plan': plan,
							'subscription.billingInterval': billingInterval,
							'subscription.status': 'ACTIVE',
							'subscription.currentPeriodEnd': new Date(
								(updatedSubscription as any).current_period_end * 1000
							),
						},
					});

					return NextResponse.json({
						success: true,
						message: `Successfully ${action}d to ${plan} (${billingInterval})`,
						subscription: updatedSubscription,
					});
				}
			} catch (error) {
				console.error('Error updating subscription:', error);
				// Fall through to create new subscription
			}
		}

		// Create new subscription or checkout session
		let customer;

		if (stripeCustomerId) {
			customer = await stripe.customers.retrieve(stripeCustomerId);
		} else {
			// Create new customer
			customer = await stripe.customers.create({
				email: user.email,
				metadata: {
					userId: user._id.toString(),
					clerkId: userId,
				},
			});

			// Update user with customer ID
			await User.findByIdAndUpdate(user._id, {
				$set: {
					'subscription.stripeCustomerId': customer.id,
				},
			});
		}

		// Create checkout session for new subscription
		const session = await stripe.checkout.sessions.create({
			customer: customer.id,
			payment_method_types: ['card'],
			mode: 'subscription',
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&interval=${billingInterval}`,
			cancel_url: `${req.nextUrl.origin}/dashboard`,
			metadata: {
				userId: user._id.toString(),
				clerkId: userId,
				plan,
				billingInterval,
				action,
			},
			// Add discount for annual billing
			...(billingInterval === 'yearly' && {
				discounts: [
					{
						coupon: process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID || undefined,
					},
				].filter(Boolean),
			}),
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		console.error('Error in subscription checkout:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
