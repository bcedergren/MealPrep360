import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GroupPrepSession, SocialProfile } from '../../../../../models';

// GET /api/social/group-prep/[sessionId]
export async function GET(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionId = req.url.split('/').slice(-1)[0];

		// Get user's profile
		const userProfile = await SocialProfile.findOne({ userId });
		if (!userProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Get the session
		const session = await GroupPrepSession.findById(sessionId)
			.populate('hostId', 'userId displayName avatar')
			.populate('participants', 'userId displayName avatar')
			.populate('tasks.assignedTo', 'userId displayName avatar');

		if (!session) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}

		// Check if user is authorized to view the session
		if (
			!session.participants.some(
				(p) => p._id.toString() === userProfile._id.toString()
			)
		) {
			return NextResponse.json(
				{ error: 'Not authorized to view this session' },
				{ status: 403 }
			);
		}

		return NextResponse.json(session);
	} catch (error) {
		console.error('Error fetching group prep session:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// PUT /api/social/group-prep/[sessionId]
export async function PUT(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionId = req.url.split('/').slice(-1)[0];
		const updates = await req.json();

		// Get user's profile
		const userProfile = await SocialProfile.findOne({ userId });
		if (!userProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Get the session
		const session = await GroupPrepSession.findById(sessionId);
		if (!session) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}

		// Check if user is the host
		if (session.hostId.toString() !== userProfile._id.toString()) {
			return NextResponse.json(
				{ error: 'Only the host can update the session' },
				{ status: 403 }
			);
		}

		// Update the session
		const updatedSession = await GroupPrepSession.findByIdAndUpdate(
			sessionId,
			{
				$set: {
					...updates,
					startTime: updates.startTime
						? new Date(updates.startTime)
						: undefined,
					endTime: updates.endTime ? new Date(updates.endTime) : undefined,
				},
			},
			{ new: true }
		)
			.populate('hostId', 'userId displayName avatar')
			.populate('participants', 'userId displayName avatar')
			.populate('tasks.assignedTo', 'userId displayName avatar');

		return NextResponse.json(updatedSession);
	} catch (error) {
		console.error('Error updating group prep session:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/social/group-prep/[sessionId]
export async function DELETE(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionId = req.url.split('/').slice(-1)[0];

		// Get user's profile
		const userProfile = await SocialProfile.findOne({ userId });
		if (!userProfile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		// Get the session
		const session = await GroupPrepSession.findById(sessionId);
		if (!session) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}

		// Check if user is the host
		if (session.hostId.toString() !== userProfile._id.toString()) {
			return NextResponse.json(
				{ error: 'Only the host can delete the session' },
				{ status: 403 }
			);
		}

		// Delete the session
		await GroupPrepSession.deleteOne({ _id: sessionId });

		return NextResponse.json({ message: 'Session deleted successfully' });
	} catch (error) {
		console.error('Error deleting group prep session:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
