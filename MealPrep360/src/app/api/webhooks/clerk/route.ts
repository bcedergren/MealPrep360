import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

export async function POST(req: Request) {
	// Get the headers
	const headerPayload = await headers();
	const svix_id = headerPayload.get('svix-id');
	const svix_timestamp = headerPayload.get('svix-timestamp');
	const svix_signature = headerPayload.get('svix-signature');

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new Response('Error occured -- no svix headers', {
			status: 400,
		});
	}

	// Get the body
	const payload = await req.json();
	const body = JSON.stringify(payload);

	// Create a new Svix instance with your webhook secret
	const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

	let evt: WebhookEvent;

	// Verify the payload with the headers
	try {
		evt = wh.verify(body, {
			'svix-id': svix_id,
			'svix-timestamp': svix_timestamp,
			'svix-signature': svix_signature,
		}) as WebhookEvent;
	} catch (err) {
		console.error('Error verifying webhook:', err);
		return new Response('Error occured', {
			status: 400,
		});
	}

	// Handle the webhook
	const eventType = evt.type;

	if (eventType === 'user.created') {
		const { id, email_addresses, first_name, last_name, image_url } = evt.data;

		const userData = {
			clerkId: id,
			email: email_addresses[0].email_address,
			name: `${first_name || ''} ${last_name || ''}`.trim() || null,
			image: image_url,
		};

		// Create user in our local database
		try {
			await connectDB();
			await User.create(userData);
		} catch (error) {
			console.error('Error creating user in local database:', error);
			return new Response('Error creating user in database', {
				status: 500,
			});
		}
	}

	return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
