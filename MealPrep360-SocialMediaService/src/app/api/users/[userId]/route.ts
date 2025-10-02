import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { UserProfile } from '@/models/UserProfile';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     description: Get user profile by Clerk userId
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile object
 *   patch:
 *     description: Update user profile by Clerk userId
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated user profile object
 */

export async function GET(
	request: Request,
	context: { params: Promise<{ userId: string }> }
) {
	try {
		await connectDB();
		const params = await context.params;
		const { userId } = params;

		const profile = await UserProfile.findOne({ clerkId: userId });

		if (!profile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		return NextResponse.json(profile);
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: Request,
	context: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId } = await auth();
		const params = await context.params;
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (userId !== params.userId) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		await connectDB();
		const body = await request.json();
		const updatedProfile = await UserProfile.findOneAndUpdate(
			{ clerkId: userId },
			{ $set: body },
			{ new: true }
		);
		if (!updatedProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}
		return NextResponse.json(updatedProfile);
	} catch (error) {
		console.error('Error updating user profile:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
