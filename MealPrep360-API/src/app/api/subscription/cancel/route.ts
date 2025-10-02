import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { SubscriptionPlan, PLAN_HIERARCHY } from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-06-30.basil',
});

interface CancelRequest {
	reason?: string;
	feedback?: string;
	retentionOffer?: 'discount' | 'pause' | 'downgrade' | 'none';
	immediateCancel?: boolean;
}

export async function POST(req: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const body = await req.json();
		const {
			reason,
			feedback,
			retentionOffer = 'none',
			immediateCancel = false,
		}: CancelRequest = body;

		// Get user from database
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const stripeCustomerId = user.subscription?.stripeCustomerId;
		const stripeSubscriptionId = user.subscription?.stripeSubscriptionId;
		const currentPlan = user.subscription?.plan || 'FREE';

		if (!stripeCustomerId || !stripeSubscriptionId || currentPlan === 'FREE') {
			return NextResponse.json(
				{
					error: 'No active subscription found',
				},
				{ status: 400 }
			);
		}

		try {
			// Get current subscription
			const subscription = await stripe.subscriptions.retrieve(
				stripeSubscriptionId
			);

			if (subscription.status !== 'active') {
				return NextResponse.json(
					{
						error: 'Subscription is not active',
					},
					{ status: 400 }
				);
			}

			// Handle retention offers
			if (retentionOffer !== 'none' && !immediateCancel) {
				const retentionResult = await handleRetentionOffer(
					stripeSubscriptionId,
					retentionOffer,
					currentPlan,
					user._id
				);

				if (retentionResult.success) {
					// Log the retention attempt
					await User.findByIdAndUpdate(user._id, {
						$push: {
							'subscription.retentionHistory': {
								date: new Date(),
								offer: retentionOffer,
								reason,
								feedback,
								accepted: true,
							},
						},
					});

					return NextResponse.json({
						success: true,
						message: retentionResult.message,
						retentionApplied: true,
						newPlan: retentionResult.newPlan,
					});
				}
			}

			// Proceed with cancellation
			let canceledSubscription;

			if (immediateCancel) {
				// Cancel immediately
				canceledSubscription = await stripe.subscriptions.cancel(
					stripeSubscriptionId
				);
			} else {
				// Cancel at period end
				canceledSubscription = await stripe.subscriptions.update(
					stripeSubscriptionId,
					{
						cancel_at_period_end: true,
					}
				);
			}

			// Update user in database
			await User.findByIdAndUpdate(user._id, {
				$set: {
					'subscription.status': immediateCancel ? 'CANCELED' : 'ACTIVE',
					'subscription.cancelAtPeriodEnd': !immediateCancel,
					'subscription.cancellationDate': new Date(),
					'subscription.cancellationReason': reason,
					'subscription.cancellationFeedback': feedback,
				},
				$push: {
					'subscription.retentionHistory': {
						date: new Date(),
						offer: retentionOffer,
						reason,
						feedback,
						accepted: false,
						canceled: true,
					},
				},
			});

			return NextResponse.json({
				success: true,
				message: immediateCancel
					? 'Subscription canceled immediately'
					: 'Subscription will be canceled at the end of your billing period',
				canceledAt: immediateCancel
					? new Date()
					: new Date((canceledSubscription as any).current_period_end * 1000),
				accessUntil: new Date(
					(canceledSubscription as any).current_period_end * 1000
				),
			});
		} catch (error) {
			console.error('Error canceling subscription:', error);
			return NextResponse.json(
				{ error: 'Failed to cancel subscription' },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Error in subscription cancel:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

async function handleRetentionOffer(
	subscriptionId: string,
	offer: string,
	currentPlan: SubscriptionPlan,
	userId: string
): Promise<{ success: boolean; message: string; newPlan?: SubscriptionPlan }> {
	try {
		switch (offer) {
			case 'discount':
				// Apply 25% discount for 3 months
				const discountCoupon = process.env.STRIPE_RETENTION_DISCOUNT_COUPON_ID;
				if (discountCoupon) {
					await stripe.subscriptions.update(subscriptionId, {
						default_payment_method: undefined,
						coupon: discountCoupon,
					} as any);
					return {
						success: true,
						message:
							"Great news! We've applied a 25% discount for the next 3 months.",
					};
				}
				break;

			case 'pause':
				// Pause subscription for 1 month (if Stripe supports it)
				try {
					await stripe.subscriptions.update(subscriptionId, {
						pause_collection: {
							behavior: 'mark_uncollectible',
							resumes_at: Math.floor(
								(Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000
							), // 30 days
						},
					});
					return {
						success: true,
						message:
							"We've paused your subscription for 30 days. You'll keep access without being charged.",
					};
				} catch (pauseError) {
					console.error('Pause not supported:', pauseError);
				}
				break;

			case 'downgrade':
				// Offer to downgrade to a lower plan
				const downgradePlan = getDowngradePlan(currentPlan);
				if (downgradePlan) {
					// This would require getting the price ID for the downgrade plan
					// For now, we'll just return a message
					return {
						success: true,
						message: `How about downgrading to our ${downgradePlan} plan instead? You'll save money while keeping core features.`,
						newPlan: downgradePlan,
					};
				}
				break;
		}

		return { success: false, message: 'Retention offer not available' };
	} catch (error) {
		console.error('Error applying retention offer:', error);
		return { success: false, message: 'Failed to apply retention offer' };
	}
}

function getDowngradePlan(
	currentPlan: SubscriptionPlan
): SubscriptionPlan | null {
	const hierarchy = PLAN_HIERARCHY;
	const currentLevel = hierarchy[currentPlan];

	// Find the next lower plan
	const plans = Object.entries(hierarchy)
		.filter(([_, level]) => level < currentLevel)
		.sort(([_, a], [__, b]) => b - a);

	return plans.length > 0 ? (plans[0][0] as SubscriptionPlan) : null;
}

export const dynamic = 'force-dynamic';
