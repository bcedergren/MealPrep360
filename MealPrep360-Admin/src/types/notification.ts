export type NotificationType =
	| 'new_follower'
	| 'new_comment'
	| 'new_reaction'
	| 'new_share'
	| 'meal_prep_invite'
	| 'challenge_completed';

export type Notification = {
	id: string;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	referenceId?: string; // ID of the related post, user, or challenge
	createdAt: Date;
	read: boolean;
	data?: Record<string, any>; // Additional data specific to the notification type
};

export type NotificationPreferences = {
	email: boolean;
	push: boolean;
	inApp: boolean;
	types: {
		[key in NotificationType]: boolean;
	};
};
