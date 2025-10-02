export type SocialPost = {
	id: string;
	userId: string;
	type: 'recipe' | 'mealPlan';
	referenceId: string;
	caption?: string;
	createdAt: Date;
	likes: number;
	comments: Comment[];
	reactions: Reaction[];
};

export type Comment = {
	id: string;
	userId: string;
	content: string;
	createdAt: Date;
	likes: number;
};

export type Reaction = {
	id: string;
	userId: string;
	type: 'like' | 'freeze' | 'heart' | 'salad';
	createdAt: Date;
};

export type UserProfile = {
	id: string;
	displayName: string;
	bio?: string;
	profilePicture?: string;
	badges: Badge[];
	privacySettings: PrivacySettings;
	stats: UserStats;
};

export type Badge = {
	id: string;
	name: string;
	description: string;
	icon: string;
	earnedAt: Date;
};

export type PrivacySettings = {
	isProfilePublic: boolean;
	isMealPlanPublic: boolean;
	allowComments: boolean;
	allowReactions: boolean;
};

export type UserStats = {
	followersCount: number;
	followingCount: number;
	mealsPreppedCount: number;
	recipesSharedCount: number;
};

export type SocialFeedFilters = {
	sortBy: 'popular' | 'recent';
	dietType?: string[];
	cookTime?: number;
	freezerFriendly?: boolean;
};
