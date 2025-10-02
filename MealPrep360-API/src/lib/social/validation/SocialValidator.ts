import { RequestValidator } from '../../core/validation/RequestValidator';

export class UserProfileValidator extends RequestValidator<{
	userId: string;
	displayName: string;
	bio?: string;
	avatar?: string;
	preferences?: {
		visibility: 'public' | 'private' | 'friends';
		notifications: {
			comments: boolean;
			likes: boolean;
			follows: boolean;
			mentions: boolean;
		};
	};
	social?: {
		website?: string;
		twitter?: string;
		instagram?: string;
		facebook?: string;
	};
}> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => typeof data.userId === 'string',
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) =>
				typeof data.displayName === 'string' && data.displayName.length >= 2,
			message: 'Display name must be at least 2 characters long',
		});

		this.addRule({
			validate: (data) => !data.bio || typeof data.bio === 'string',
			message: 'Bio must be a string if provided',
		});

		this.addRule({
			validate: (data) => !data.avatar || typeof data.avatar === 'string',
			message: 'Avatar must be a URL string if provided',
		});

		this.addRule({
			validate: (data) =>
				!data.preferences ||
				(typeof data.preferences === 'object' &&
					['public', 'private', 'friends'].includes(
						data.preferences.visibility
					) &&
					typeof data.preferences.notifications === 'object'),
			message: 'Invalid preferences configuration',
		});

		this.addRule({
			validate: (data) =>
				!data.social ||
				(typeof data.social === 'object' &&
					(!data.social.website || typeof data.social.website === 'string') &&
					(!data.social.twitter || typeof data.social.twitter === 'string') &&
					(!data.social.instagram ||
						typeof data.social.instagram === 'string') &&
					(!data.social.facebook || typeof data.social.facebook === 'string')),
			message: 'Invalid social links configuration',
		});
	}
}

export class SocialInteractionValidator extends RequestValidator<{
	type: 'like' | 'share' | 'follow' | 'block';
	targetId: string;
	targetType: 'user' | 'recipe' | 'comment' | 'post';
	metadata?: Record<string, any>;
}> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				['like', 'share', 'follow', 'block'].includes(data.type),
			message: 'Invalid interaction type',
		});

		this.addRule({
			validate: (data) => typeof data.targetId === 'string',
			message: 'Target ID is required',
		});

		this.addRule({
			validate: (data) =>
				['user', 'recipe', 'comment', 'post'].includes(data.targetType),
			message: 'Invalid target type',
		});

		this.addRule({
			validate: (data) =>
				!data.metadata ||
				(typeof data.metadata === 'object' && data.metadata !== null),
			message: 'Metadata must be an object if provided',
		});
	}
}

export class SocialCommentValidator extends RequestValidator<{
	content: string;
	targetId: string;
	targetType: 'recipe' | 'post' | 'comment';
	parentId?: string;
	attachments?: Array<{
		type: 'image' | 'video' | 'link';
		url: string;
		metadata?: Record<string, any>;
	}>;
}> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.content === 'string' && data.content.length >= 1,
			message: 'Content is required',
		});

		this.addRule({
			validate: (data) => typeof data.targetId === 'string',
			message: 'Target ID is required',
		});

		this.addRule({
			validate: (data) =>
				['recipe', 'post', 'comment'].includes(data.targetType),
			message: 'Invalid target type',
		});

		this.addRule({
			validate: (data) => !data.parentId || typeof data.parentId === 'string',
			message: 'Parent ID must be a string if provided',
		});

		this.addRule({
			validate: (data) =>
				!data.attachments ||
				(Array.isArray(data.attachments) &&
					data.attachments.every(
						(a) =>
							['image', 'video', 'link'].includes(a.type) &&
							typeof a.url === 'string' &&
							(!a.metadata ||
								(typeof a.metadata === 'object' && a.metadata !== null))
					)),
			message: 'Invalid attachments configuration',
		});
	}
}
