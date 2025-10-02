export type AchievementType =
	| 'recipe_created'
	| 'recipe_liked'
	| 'meal_plan_completed'
	| 'shopping_list_generated'
	| 'streak_maintained'
	| 'social_interaction'
	| 'healthy_choice'
	| 'challenge_completed';

export type RewardType =
	| 'points'
	| 'badge'
	| 'level_up'
	| 'unlock_feature'
	| 'special_status'
	| 'discount'
	| 'premium_content';

export type ProgressionType =
	| 'linear'
	| 'branching'
	| 'milestone'
	| 'seasonal'
	| 'challenge';

export type ChallengeStatus =
	| 'not_started'
	| 'in_progress'
	| 'completed'
	| 'failed'
	| 'expired';

export interface Achievement {
	id: string;
	userId: string;
	type: AchievementType;
	title: string;
	description: string;
	criteria: {
		type: string;
		value: number;
		operator?: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
		timeframe?: {
			duration: number;
			unit: 'hour' | 'day' | 'week' | 'month';
		};
		conditions?: Array<{
			field: string;
			value: any;
			operator: string;
		}>;
	};
	rewards: Array<{
		type: RewardType;
		value: number | string;
		metadata?: Record<string, any>;
	}>;
	progress: {
		current: number;
		target: number;
		percentage: number;
		lastUpdated: Date;
	};
	status: 'locked' | 'in_progress' | 'completed';
	completedAt?: Date;
	metadata?: {
		difficulty?: 'easy' | 'medium' | 'hard';
		category?: string;
		tags?: string[];
		[key: string]: any;
	};
}

export interface Challenge {
	id: string;
	title: string;
	description: string;
	type: string;
	startDate: Date;
	endDate: Date;
	status: ChallengeStatus;
	participants: Array<{
		userId: string;
		joinedAt: Date;
		progress: number;
		status: ChallengeStatus;
		achievements?: string[];
	}>;
	requirements: {
		minLevel?: number;
		prerequisites?: string[];
		maxParticipants?: number;
	};
	rewards: Array<{
		type: RewardType;
		value: number | string;
		rank?: number;
		metadata?: Record<string, any>;
	}>;
	leaderboard?: {
		enabled: boolean;
		criteria: string[];
		updateFrequency: string;
	};
	metadata?: {
		difficulty: string;
		category: string;
		tags: string[];
		[key: string]: any;
	};
}

export interface Level {
	id: string;
	number: number;
	title: string;
	description?: string;
	requiredXP: number;
	rewards: Array<{
		type: RewardType;
		value: number | string;
		metadata?: Record<string, any>;
	}>;
	unlocks?: Array<{
		type: string;
		id: string;
		description: string;
	}>;
	metadata?: {
		icon?: string;
		color?: string;
		theme?: string;
		[key: string]: any;
	};
}

export interface UserProgress {
	id: string;
	userId: string;
	level: number;
	currentXP: number;
	totalXP: number;
	achievements: Array<{
		id: string;
		completedAt: Date;
		rewards: Array<{
			type: RewardType;
			value: number | string;
		}>;
	}>;
	challenges: Array<{
		id: string;
		status: ChallengeStatus;
		progress: number;
		joinedAt: Date;
		completedAt?: Date;
	}>;
	stats: {
		totalAchievements: number;
		completedChallenges: number;
		currentStreak: number;
		longestStreak: number;
		[key: string]: number;
	};
	inventory: Array<{
		type: string;
		id: string;
		quantity: number;
		acquired: Date;
		expires?: Date;
	}>;
}

export interface Leaderboard {
	id: string;
	type: string;
	period: 'daily' | 'weekly' | 'monthly' | 'all_time';
	startDate?: Date;
	endDate?: Date;
	rankings: Array<{
		rank: number;
		userId: string;
		score: number;
		change?: number;
		achievements?: string[];
	}>;
	metadata?: {
		totalParticipants: number;
		lastUpdated: Date;
		nextUpdate?: Date;
		[key: string]: any;
	};
}

export interface GamificationEvent {
	id: string;
	userId: string;
	type: string;
	action: string;
	timestamp: Date;
	data: {
		value?: number;
		context?: Record<string, any>;
		metadata?: Record<string, any>;
	};
	rewards?: Array<{
		type: RewardType;
		value: number | string;
		reason: string;
	}>;
	achievements?: Array<{
		id: string;
		progress: number;
		completed: boolean;
	}>;
}

export interface GamificationRule {
	id: string;
	name: string;
	description: string;
	eventType: string;
	conditions: Array<{
		field: string;
		operator: string;
		value: any;
		metadata?: Record<string, any>;
	}>;
	rewards: Array<{
		type: RewardType;
		value: number | string;
		metadata?: Record<string, any>;
	}>;
	cooldown?: {
		duration: number;
		unit: 'minute' | 'hour' | 'day' | 'week';
	};
	priority: number;
	status: 'active' | 'inactive' | 'deprecated';
	metadata?: {
		category?: string;
		tags?: string[];
		version?: string;
		[key: string]: any;
	};
}

export interface GamificationMetrics {
	period: {
		start: Date;
		end: Date;
	};
	achievements: {
		total: number;
		completed: number;
		byType: Record<AchievementType, number>;
		completion: {
			rate: number;
			average_time: number;
		};
	};
	challenges: {
		active: number;
		completed: number;
		participation: {
			total: number;
			average: number;
		};
		success_rate: number;
	};
	progression: {
		average_level: number;
		xp_distribution: Record<number, number>;
		level_up_rate: number;
		engagement: {
			daily: number;
			weekly: number;
			monthly: number;
		};
	};
	rewards: {
		distributed: Record<RewardType, number>;
		popular: Array<{
			type: RewardType;
			count: number;
			value: number;
		}>;
		conversion: {
			rate: number;
			by_type: Record<RewardType, number>;
		};
	};
}
