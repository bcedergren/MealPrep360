import mongoose, { Schema, model, models } from 'mongoose';

// Social Profile Schema
const socialProfileSchema = new Schema({
	userId: { type: String, required: true, unique: true }, // Clerk user ID
	displayName: { type: String, required: true },
	bio: { type: String, maxlength: 500 },
	avatar: { type: String },
	following: [{ type: Schema.Types.ObjectId, ref: 'SocialProfile' }],
	followers: [{ type: Schema.Types.ObjectId, ref: 'SocialProfile' }],
	postsCount: { type: Number, default: 0 },
	followersCount: { type: Number, default: 0 },
	followingCount: { type: Number, default: 0 },
	isPrivate: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Follow Relationship Schema
const followSchema = new Schema({
	followerId: {
		type: Schema.Types.ObjectId,
		ref: 'SocialProfile',
		required: true,
	},
	followingId: {
		type: Schema.Types.ObjectId,
		ref: 'SocialProfile',
		required: true,
	},
	createdAt: { type: Date, default: Date.now },
});

// Add compound index to prevent duplicate follows
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Social Post Schema
const socialPostSchema = new Schema({
	authorId: {
		type: Schema.Types.ObjectId,
		ref: 'SocialProfile',
		required: true,
	},
	content: { type: String, required: true, maxlength: 1000 },
	images: [{ type: String }], // URLs to images
	recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe' }, // Optional recipe reference
	likes: [{ type: Schema.Types.ObjectId, ref: 'SocialProfile' }],
	likesCount: { type: Number, default: 0 },
	commentsCount: { type: Number, default: 0 },
	isPublic: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Social Comment Schema
const socialCommentSchema = new Schema({
	postId: { type: Schema.Types.ObjectId, ref: 'SocialPost', required: true },
	authorId: {
		type: Schema.Types.ObjectId,
		ref: 'SocialProfile',
		required: true,
	},
	content: { type: String, required: true, maxlength: 500 },
	likes: [{ type: Schema.Types.ObjectId, ref: 'SocialProfile' }],
	likesCount: { type: Number, default: 0 },
	parentId: { type: Schema.Types.ObjectId, ref: 'SocialComment' }, // For nested comments
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Group Prep Session Schema
const groupPrepSessionSchema = new Schema({
	title: { type: String, required: true },
	description: { type: String },
	hostId: { type: Schema.Types.ObjectId, ref: 'SocialProfile', required: true },
	participants: [{ type: Schema.Types.ObjectId, ref: 'SocialProfile' }],
	maxParticipants: { type: Number, default: 10 },
	startTime: { type: Date, required: true },
	endTime: { type: Date, required: true },
	status: {
		type: String,
		enum: ['scheduled', 'active', 'completed', 'cancelled'],
		default: 'scheduled',
	},
	tasks: [
		{
			title: { type: String, required: true },
			description: { type: String },
			assignedTo: [{ type: Schema.Types.ObjectId, ref: 'SocialProfile' }],
			status: {
				type: String,
				enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
				default: 'PENDING',
			},
			createdAt: { type: Date, default: Date.now },
			updatedAt: { type: Date, default: Date.now },
		},
	],
	isPrivate: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Notification Schema
const notificationSchema = new Schema({
	userId: { type: String, required: true, index: true }, // Clerk user ID
	type: {
		type: String,
		required: true,
		enum: [
			'message',
			'mention',
			'like',
			'comment',
			'follow',
			'recipe_share',
			'recipe_update',
			'meal_plan_reminder',
			'shopping_list_reminder',
			'system_announcement',
			'admin_message',
		],
	},
	title: { type: String, required: true },
	content: { type: String, required: true },
	read: { type: Boolean, default: false },
	priority: {
		type: String,
		enum: ['low', 'medium', 'high', 'urgent'],
		default: 'medium',
	},
	data: {
		senderId: String,
		postId: String,
		recipeId: String,
		commentId: String,
		mealPlanId: String,
		shoppingListId: String,
		version: Number,
		actionUrl: String,
	},
	scheduledFor: { type: Date }, // For scheduled notifications
	sentAt: { type: Date }, // When the notification was actually sent
	expiresAt: { type: Date }, // When the notification expires
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });

// Export models
export const SocialProfile =
	mongoose.models.SocialProfile || model('SocialProfile', socialProfileSchema);
export const Follow = mongoose.models.Follow || model('Follow', followSchema);
export const SocialPost =
	mongoose.models.SocialPost || model('SocialPost', socialPostSchema);
export const SocialComment =
	mongoose.models.SocialComment || model('SocialComment', socialCommentSchema);
export const GroupPrepSession =
	mongoose.models.GroupPrepSession ||
	model('GroupPrepSession', groupPrepSessionSchema);
// Message Schema
const messageSchema = new Schema({
	senderId: { type: String, required: true }, // Clerk user ID
	receiverId: { type: String, required: true }, // Clerk user ID or 'system' for admin messages
	conversationId: { type: String, required: true, index: true },
	content: { type: String, required: true },
	messageType: {
		type: String,
		enum: [
			'text',
			'image',
			'recipe_share',
			'meal_plan_share',
			'system_message',
		],
		default: 'text',
	},
	attachments: [
		{
			type: { type: String, enum: ['image', 'recipe', 'meal_plan'] },
			url: String,
			metadata: Schema.Types.Mixed,
		},
	],
	read: { type: Boolean, default: false },
	readAt: { type: Date },
	priority: {
		type: String,
		enum: ['low', 'medium', 'high'],
		default: 'medium',
	},
	isSystemMessage: { type: Boolean, default: false },
	moderationStatus: {
		type: String,
		enum: ['approved', 'pending', 'flagged', 'removed'],
		default: 'approved',
	},
	moderatedAt: { type: Date },
	moderationReason: { type: String },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, read: 1 });
messageSchema.index({ moderationStatus: 1 });

// Conversation Schema
const conversationSchema = new Schema({
	participants: [{ type: String, required: true }], // Clerk user IDs
	type: {
		type: String,
		enum: ['direct', 'group', 'support'],
		default: 'direct',
	},
	title: { type: String }, // For group conversations
	lastMessage: {
		content: String,
		senderId: String,
		timestamp: Date,
	},
	lastActivity: { type: Date, default: Date.now },
	isActive: { type: Boolean, default: true },
	metadata: {
		supportTicketId: String,
		category: String,
		priority: String,
	},
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Indexes for efficient querying
conversationSchema.index({ participants: 1, lastActivity: -1 });
conversationSchema.index({ type: 1, isActive: 1 });

export const Notification =
	mongoose.models.Notification || model('Notification', notificationSchema);
export const Message =
	mongoose.models.Message || model('Message', messageSchema);
export const Conversation =
	mongoose.models.Conversation || model('Conversation', conversationSchema);
