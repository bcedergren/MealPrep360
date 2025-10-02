import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GroupPrepSession, SocialProfile } from '../../../../../../models';

// POST /api/social/group-prep/[sessionId]/participants
export async function POST(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionId = req.url.split('/').slice(-2)[0];
		const { participantId } = await req.json();

		if (!participantId) {
			return NextResponse.json(
				{ error: 'Participant ID is required' },
				{ status: 400 }
			);
		}

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
				{ error: 'Only the host can add participants' },
				{ status: 403 }
			);
		}

		// Get the participant's profile
		const participantProfile = await SocialProfile.findOne({
			userId: participantId,
		});
		if (!participantProfile) {
			return NextResponse.json(
				{ error: 'Participant profile not found' },
				{ status: 404 }
			);
		}

		// Check if already a participant
		if (session.participants.includes(participantProfile._id)) {
			return NextResponse.json(
				{ error: 'User is already a participant' },
				{ status: 400 }
			);
		}

		// Check if session is full
		if (session.participants.length >= session.maxParticipants) {
			return NextResponse.json({ error: 'Session is full' }, { status: 400 });
		}

		// Add participant
		session.participants.push(participantProfile._id);
		await session.save();

		// Populate the updated session
		await session.populate('hostId', 'userId displayName avatar');
		await session.populate('participants', 'userId displayName avatar');
		await session.populate('tasks.assignedTo', 'userId displayName avatar');

		return NextResponse.json(session);
	} catch (error) {
		console.error('Error adding participant:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/social/group-prep/[sessionId]/participants
export async function DELETE(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionId = req.url.split('/').slice(-2)[0];
		const { participantId } = await req.json();

		if (!participantId) {
			return NextResponse.json(
				{ error: 'Participant ID is required' },
				{ status: 400 }
			);
		}

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

		// Check if user is the host or the participant being removed
		if (
			session.hostId.toString() !== userProfile._id.toString() &&
			userId !== participantId
		) {
			return NextResponse.json(
				{ error: 'Not authorized to remove this participant' },
				{ status: 403 }
			);
		}

		// Get the participant's profile
		const participantProfile = await SocialProfile.findOne({
			userId: participantId,
		});
		if (!participantProfile) {
			return NextResponse.json(
				{ error: 'Participant profile not found' },
				{ status: 404 }
			);
		}

		// Check if participant is in the session
		if (!session.participants.includes(participantProfile._id)) {
			return NextResponse.json(
				{ error: 'User is not a participant' },
				{ status: 400 }
			);
		}

		// Remove participant
		session.participants = session.participants.filter(
			(id) => id.toString() !== participantProfile._id.toString()
		);

		// Remove participant from assigned tasks
		session.tasks = session.tasks.map((task) => ({
			...task,
			assignedTo: task.assignedTo.filter(
				(id) => id.toString() !== participantProfile._id.toString()
			),
		}));

		await session.save();

		// Populate the updated session
		await session.populate('hostId', 'userId displayName avatar');
		await session.populate('participants', 'userId displayName avatar');
		await session.populate('tasks.assignedTo', 'userId displayName avatar');

		return NextResponse.json(session);
	} catch (error) {
		console.error('Error removing participant:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
