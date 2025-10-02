import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/notifications/push:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Subscribe to push notifications
 *     description: Saves the user's push notification subscription
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *                 description: Web Push subscription object
 *                 properties:
 *                   endpoint:
 *                     type: string
 *                     format: uri
 *                   keys:
 *                     type: object
 *                     properties:
 *                       p256dh:
 *                         type: string
 *                       auth:
 *                         type: string
 *     responses:
 *       200:
 *         description: Subscription saved successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Subscription saved"
 *       401:
 *         description: Unauthorized
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */
export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session?.userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const { subscription } = await request.json();

		await connectDB();

		await User.findOneAndUpdate(
			{ clerkId: session.userId },
			{
				$set: { pushSubscription: subscription },
			},
			{ upsert: true }
		);

		return new NextResponse('Subscription saved', { status: 200 });
	} catch (error) {
		console.error('Error saving push subscription:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

/**
 * @swagger
 * /api/notifications/push:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Unsubscribe from push notifications
 *     description: Removes the user's push notification subscription
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Subscription deleted successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Subscription deleted"
 *       401:
 *         description: Unauthorized
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */
export async function DELETE() {
	try {
		const session = await auth();
		if (!session?.userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await connectDB();

		await User.findOneAndUpdate(
			{ clerkId: session.userId },
			{
				$unset: { pushSubscription: 1 },
			}
		);

		return new NextResponse('Subscription deleted', { status: 200 });
	} catch (error) {
		console.error('Error deleting push subscription:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}
