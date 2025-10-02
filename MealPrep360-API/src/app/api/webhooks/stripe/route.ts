import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';
import { SubscriptionPlan, STRIPE_PRICE_IDS } from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-06-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Map Stripe price IDs to our plan names
function getPlanFromPriceId(priceId: string): SubscriptionPlan {
	const planEntry = Object.entries(STRIPE_PRICE_IDS).find(
		([_, prices]) => prices.monthly === priceId || prices.yearly === priceId
	);
	return (planEntry?.[0] as SubscriptionPlan) || 'FREE';
}

async function handleSubscriptionChange(
	subscription: Stripe.Subscription,
	customerId: string
) {
	await connectDB();

	const user = await User.findOne({
		'subscription.stripeCustomerId': customerId,
	});

	if (!user) {
		console.error('No user found for customer:', customerId);
		return;
	}

	// Get the plan from the price ID
	const priceId = subscription.items.data[0]?.price.id;
	const plan = priceId ? getPlanFromPriceId(priceId) : 'FREE';

	const currentPeriodEnd = new Date(
		(subscription as any).current_period_end * 1000
	);

	const status = (
		subscription.status === 'active'
			? 'ACTIVE'
			: subscription.status === 'past_due'
			? 'PAST_DUE'
			: subscription.status === 'canceled'
			? 'CANCELED'
			: subscription.status === 'unpaid'
			? 'UNPAID'
			: subscription.status === 'incomplete'
			? 'INCOMPLETE'
			: subscription.status === 'incomplete_expired'
			? 'INCOMPLETE_EXPIRED'
			: subscription.status === 'trialing'
			? 'TRIALING'
			: 'INACTIVE'
	) as
		| 'ACTIVE'
		| 'PAST_DUE'
		| 'CANCELED'
		| 'UNPAID'
		| 'INCOMPLETE'
		| 'INCOMPLETE_EXPIRED'
		| 'TRIALING'
		| 'INACTIVE';

	await User.findByIdAndUpdate(
		user._id,
		{
			$set: {
				'subscription.plan': plan,
				'subscription.status': status,
				'subscription.currentPeriodEnd': currentPeriodEnd,
				'subscription.stripeSubscriptionId': subscription.id,
			},
		},
		{ new: true }
	);

	console.log(`Updated subscription for user ${user._id}: ${plan} (${status})`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
	await connectDB();

	const user = await User.findOne({
		'subscription.stripeCustomerId': session.customer as string,
	});

	if (!user) {
		console.error('No user found for customer:', session.customer);
		return;
	}

	// Get subscription details
	if (session.subscription) {
		const subscription = await stripe.subscriptions.retrieve(
			session.subscription as string
		);
		await handleSubscriptionChange(subscription, session.customer as string);
	}
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	await connectDB();

	const user = await User.findOne({
		'subscription.stripeCustomerId': subscription.customer as string,
	});

	if (!user) {
		console.error('No user found for customer:', subscription.customer);
		return;
	}

	// Downgrade to free plan
	await User.findByIdAndUpdate(
		user._id,
		{
			$set: {
				'subscription.plan': 'FREE',
				'subscription.status': 'CANCELED',
				'subscription.currentPeriodEnd': new Date(
					(subscription as any).current_period_end * 1000
				),
			},
		},
		{ new: true }
	);

	console.log(
		`Downgraded user ${user._id} to FREE plan due to subscription cancellation`
	);
}

export async function POST(req: Request) {
	const signature = headers().get('stripe-signature');

	if (!signature || !webhookSecret) {
		return NextResponse.json(
			{ error: 'Missing stripe signature or webhook secret' },
			{ status: 400 }
		);
	}

	try {
		const body = await req.text();
		const event = stripe.webhooks.constructEvent(
			body,
			signature,
			webhookSecret
		);

		console.log(`Processing Stripe webhook: ${event.type}`);

		switch (event.type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionChange(
					subscription,
					subscription.customer as string
				);
				break;
			}
			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionDeleted(subscription);
				break;
			}
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutCompleted(session);
				break;
			}
			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice;
				// Handle failed payment - could send notification to user
				console.log(`Payment failed for customer: ${invoice.customer}`);
				break;
			}
			case 'invoice.payment_succeeded': {
				const invoice = event.data.object as Stripe.Invoice;
				// Handle successful payment - could send confirmation
				console.log(`Payment succeeded for customer: ${invoice.customer}`);
				break;
			}
			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (err) {
		console.error('Error processing webhook:', err);
		return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
	}
}

export const dynamic = 'force-dynamic';
