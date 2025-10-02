import mongoose from 'mongoose';

const groupPrepTaskSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: String,
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SocialProfile',
		},
		status: {
			type: String,
			enum: ['pending', 'in_progress', 'completed'],
			default: 'pending',
		},
	},
	{
		timestamps: true,
	}
);

const groupPrepParticipantSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SocialProfile',
			required: true,
		},
		role: {
			type: String,
			enum: ['host', 'participant'],
			default: 'participant',
		},
		status: {
			type: String,
			enum: ['invited', 'accepted', 'declined'],
			default: 'invited',
		},
	},
	{
		timestamps: true,
	}
);

const groupPrepSessionSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		description: String,
		hostId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SocialProfile',
			required: true,
		},
		startTime: {
			type: Date,
			required: true,
		},
		endTime: {
			type: Date,
			required: true,
		},
		maxParticipants: {
			type: Number,
			default: 4,
		},
		status: {
			type: String,
			enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
			default: 'scheduled',
		},
		participants: [groupPrepParticipantSchema],
		tasks: [groupPrepTaskSchema],
	},
	{
		timestamps: true,
	}
);

// Index for efficient querying
groupPrepSessionSchema.index({ hostId: 1, startTime: 1 });
groupPrepSessionSchema.index({ 'participants.userId': 1 });

// Virtual for current participants count
groupPrepSessionSchema.virtual('currentParticipantsCount').get(function () {
	return this.participants
		? this.participants.filter((p) => p.status === 'accepted').length
		: 0;
});

// Virtual for completed tasks count
groupPrepSessionSchema.virtual('completedTasksCount').get(function () {
	return this.tasks
		? this.tasks.filter((t) => t.status === 'completed').length
		: 0;
});

const GroupPrepSession =
	mongoose.models.GroupPrepSession ||
	mongoose.model('GroupPrepSession', groupPrepSessionSchema);

export default GroupPrepSession;
