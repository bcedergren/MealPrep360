import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GroupPrepSession, SocialProfile } from '@/models';

// POST /api/social/group-prep/[sessionId]/tasks
export async function POST(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionId = req.url.split('/').slice(-2)[0];
		const { title, description, assignedTo } = await req.json();

		if (!title) {
			return NextResponse.json(
				{ error: 'Task title is required' },
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
				{ error: 'Only the host can add tasks' },
				{ status: 403 }
			);
		}

		// Validate assigned users
		if (assignedTo && assignedTo.length > 0) {
			const assignedProfiles = await SocialProfile.find({
				userId: { $in: assignedTo },
			});
			const invalidAssignments = assignedTo.filter(
				(id) => !assignedProfiles.some((profile) => profile.userId === id)
			);

			if (invalidAssignments.length > 0) {
				return NextResponse.json(
					{ error: 'Invalid user assignments' },
					{ status: 400 }
				);
			}

			// Check if all assigned users are participants
			const assignedParticipantIds = assignedProfiles.map(
				(profile) => profile._id
			);
			const invalidParticipants = assignedParticipantIds.filter(
				(id) => !session.participants.includes(id)
			);

			if (invalidParticipants.length > 0) {
				return NextResponse.json(
					{ error: 'All assigned users must be session participants' },
					{ status: 400 }
				);
			}
		}

		// Add the task
		session.tasks.push({
			title,
			description,
			assignedTo: assignedTo
				? await SocialProfile.find({ userId: { $in: assignedTo } }).select(
						'_id'
				  )
				: [],
			status: 'PENDING',
		});

		await session.save();

		// Populate the updated session
		await session.populate('hostId', 'userId displayName avatar');
		await session.populate('participants', 'userId displayName avatar');
		await session.populate('tasks.assignedTo', 'userId displayName avatar');

		return NextResponse.json(session);
	} catch (error) {
		console.error('Error adding task:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// PUT /api/social/group-prep/[sessionId]/tasks
export async function PUT(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionId = req.url.split('/').slice(-2)[0];
		const { taskId, updates } = await req.json();

		if (!taskId || !updates) {
			return NextResponse.json(
				{ error: 'Task ID and updates are required' },
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

		// Find the task
		const taskIndex = session.tasks.findIndex(
			(task) => task._id.toString() === taskId
		);
		if (taskIndex === -1) {
			return NextResponse.json({ error: 'Task not found' }, { status: 404 });
		}

		// Check if user is the host or assigned to the task
		const isHost = session.hostId.toString() === userProfile._id.toString();
		const isAssigned = session.tasks[taskIndex].assignedTo.some(
			(id) => id.toString() === userProfile._id.toString()
		);

		if (!isHost && !isAssigned) {
			return NextResponse.json(
				{ error: 'Not authorized to update this task' },
				{ status: 403 }
			);
		}

		// Update the task
		const task = session.tasks[taskIndex];
		Object.assign(task, updates);

		// If updating assigned users, validate them
		if (updates.assignedTo) {
			const assignedProfiles = await SocialProfile.find({
				userId: { $in: updates.assignedTo },
			});
			const invalidAssignments = updates.assignedTo.filter(
				(id) => !assignedProfiles.some((profile) => profile.userId === id)
			);

			if (invalidAssignments.length > 0) {
				return NextResponse.json(
					{ error: 'Invalid user assignments' },
					{ status: 400 }
				);
			}

			// Check if all assigned users are participants
			const assignedParticipantIds = assignedProfiles.map(
				(profile) => profile._id
			);
			const invalidParticipants = assignedParticipantIds.filter(
				(id) => !session.participants.includes(id)
			);

			if (invalidParticipants.length > 0) {
				return NextResponse.json(
					{ error: 'All assigned users must be session participants' },
					{ status: 400 }
				);
			}

			task.assignedTo = assignedProfiles.map((profile) => profile._id);
		}

		await session.save();

		// Populate the updated session
		await session.populate('hostId', 'userId displayName avatar');
		await session.populate('participants', 'userId displayName avatar');
		await session.populate('tasks.assignedTo', 'userId displayName avatar');

		return NextResponse.json(session);
	} catch (error) {
		console.error('Error updating task:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/social/group-prep/[sessionId]/tasks
export async function DELETE(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionId = req.url.split('/').slice(-2)[0];
		const { taskId } = await req.json();

		if (!taskId) {
			return NextResponse.json(
				{ error: 'Task ID is required' },
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
				{ error: 'Only the host can delete tasks' },
				{ status: 403 }
			);
		}

		// Remove the task
		session.tasks = session.tasks.filter(
			(task) => task._id.toString() !== taskId
		);
		await session.save();

		// Populate the updated session
		await session.populate('hostId', 'userId displayName avatar');
		await session.populate('participants', 'userId displayName avatar');
		await session.populate('tasks.assignedTo', 'userId displayName avatar');

		return NextResponse.json(session);
	} catch (error) {
		console.error('Error deleting task:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
