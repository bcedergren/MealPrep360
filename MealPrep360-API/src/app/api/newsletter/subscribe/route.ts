import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';
import { NewsletterSubscriber } from '@/lib/mongodb/schemas';
import { z } from 'zod';

const subscribeSchema = z.object({
	email: z.string().email('Invalid email address'),
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { email } = subscribeSchema.parse(body);

		await connectDB();

		// Check if email already exists
		const existingSubscriber = await NewsletterSubscriber.findOne({ email });

		if (existingSubscriber) {
			return NextResponse.json(
				{ message: 'You are already subscribed!' },
				{ status: 200 }
			);
		}

		// Create new subscriber
		await NewsletterSubscriber.create({
			email,
			subscribedAt: new Date(),
		});

		return NextResponse.json(
			{ message: 'Successfully subscribed to newsletter!' },
			{ status: 201 }
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ message: 'Invalid email address' },
				{ status: 400 }
			);
		}

		console.error('Newsletter subscription error:', error);
		return NextResponse.json(
			{ message: 'Something went wrong' },
			{ status: 500 }
		);
	}
}
