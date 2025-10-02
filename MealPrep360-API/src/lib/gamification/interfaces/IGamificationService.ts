export interface Achievement {
	id: string;
	name: string;
	description: string;
	type: string;
	category: string;
	points: number;
	requirements: Array<{
		type: string;
		value: number;
		operator: string;
	}>;
	rewards: Array<{
		type: string;
		value: any;
		metadata?: Record<string, any>;
	}>;
	status: 'active' | 'inactive' | 'archived';
	metadata?: {
		difficulty?: string;
		estimatedTime?: number;
		prerequisites?: string[];
		[key: string]: any;
	};
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Challenge {
	id: string;
	name: string;
	description: string;
	type: string;
	startDate: Date;
	endDate: Date;
	requirements: Array<{
		type: string;
		value: number;
		operator: string;
	}>;
	rewards: Array<{
		type: string;
		value: any;
		metadata?: Record<string, any>;
	}>;
	status: 'upcoming' | 'active' | 'completed' | 'cancelled';
	participants: Array<{
		userId: string;
		joinedAt: Date;
		progress: number;
		completed?: Date;
	}>;
	metadata?: {
		difficulty?: string;
		category?: string;
		tags?: string[];
		[key: string]: any;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface Level {
	id: string;
	number: number;
	name: string;
	description: string;
	pointsRequired: number;
	rewards: Array<{
		type: string;
		value: any;
		metadata?: Record<string, any>;
	}>;
	metadata?: {
		icon?: string;
		color?: string;
		[key: string]: any;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface Progress {
	userId: string;
	currentLevel: number;
	totalPoints: number;
	achievements: Array<{
		id: string;
		completedAt: Date;
		metadata?: Record<string, any>;
	}>;
	challenges: Array<{
		id: string;
		progress: number;
		startedAt: Date;
		completedAt?: Date;
	}>;
	stats: {
		totalAchievements: number;
		completedChallenges: number;
		winStreak: number;
		lastActive: Date;
	};
	metadata?: Record<string, any>;
	updatedAt: Date;
}

export interface Leaderboard {
	id: string;
	name: string;
	type: string;
	timeframe: string;
	entries: Array<{
		rank: number;
		userId: string;
		score: number;
		metadata?: Record<string, any>;
	}>;
	metadata?: {
		category?: string;
		rules?: string[];
		[key: string]: any;
	};
	updatedAt: Date;
}

export interface IGamificationService {
	// Achievement Management
	createAchievement(achievement: Omit<Achievement, 'id'>): Promise<Achievement>;

	getAchievement(achievementId: string): Promise<Achievement>;

	listAchievements(filters?: {
		userId?: string;
		type?: string;
		status?: string;
	}): Promise<Achievement[]>;

	updateAchievement(
		achievementId: string,
		updates: Partial<Achievement>
	): Promise<Achievement>;

	deleteAchievement(achievementId: string): Promise<void>;

	// Challenge Management
	createChallenge(challenge: Omit<Challenge, 'id'>): Promise<Challenge>;

	getChallenge(challengeId: string): Promise<Challenge>;

	listChallenges(filters?: {
		status?: string;
		type?: string;
		userId?: string;
	}): Promise<Challenge[]>;

	updateChallenge(
		challengeId: string,
		updates: Partial<Challenge>
	): Promise<Challenge>;

	deleteChallenge(challengeId: string): Promise<void>;

	joinChallenge(params: { challengeId: string; userId: string }): Promise<void>;

	leaveChallenge(params: {
		challengeId: string;
		userId: string;
	}): Promise<void>;

	// Level Management
	createLevel(level: Omit<Level, 'id'>): Promise<Level>;

	getLevel(levelId: string): Promise<Level>;

	listLevels(): Promise<Level[]>;

	updateLevel(levelId: string, updates: Partial<Level>): Promise<Level>;

	deleteLevel(levelId: string): Promise<void>;

	// Progress Tracking
	getUserProgress(userId: string): Promise<Progress>;

	updateProgress(params: {
		userId: string;
		type: string;
		value: number;
		metadata?: Record<string, any>;
	}): Promise<Progress>;

	awardPoints(params: {
		userId: string;
		points: number;
		reason: string;
		metadata?: Record<string, any>;
	}): Promise<Progress>;

	// Leaderboard Management
	createLeaderboard(leaderboard: Omit<Leaderboard, 'id'>): Promise<Leaderboard>;

	getLeaderboard(leaderboardId: string): Promise<Leaderboard>;

	listLeaderboards(filters?: {
		type?: string;
		timeframe?: string;
	}): Promise<Leaderboard[]>;

	updateLeaderboard(
		leaderboardId: string,
		updates: Partial<Leaderboard>
	): Promise<Leaderboard>;

	deleteLeaderboard(leaderboardId: string): Promise<void>;

	getLeaderboardRanking(params: {
		leaderboardId: string;
		userId: string;
	}): Promise<{
		rank: number;
		score: number;
		total: number;
	}>;

	// Analytics & Insights
	getEngagementMetrics(params: {
		startDate: Date;
		endDate: Date;
		type?: string;
	}): Promise<{
		activeUsers: number;
		completionRate: number;
		averagePoints: number;
		topAchievements: Array<{
			id: string;
			name: string;
			completions: number;
		}>;
		challengeParticipation: Array<{
			id: string;
			name: string;
			participants: number;
			completions: number;
		}>;
	}>;

	getUserStats(userId: string): Promise<{
		achievements: {
			total: number;
			completed: number;
			inProgress: number;
			byCategory: Record<string, number>;
		};
		challenges: {
			participated: number;
			completed: number;
			avgCompletion: number;
			winRate: number;
		};
		points: {
			total: number;
			thisWeek: number;
			thisMonth: number;
			history: Array<{
				date: string;
				points: number;
			}>;
		};
		rankings: Array<{
			leaderboard: string;
			rank: number;
			total: number;
		}>;
	}>;

	// Rewards & Notifications
	claimReward(params: {
		userId: string;
		rewardId: string;
		type: string;
	}): Promise<{
		success: boolean;
		reward: {
			type: string;
			value: any;
			metadata?: Record<string, any>;
		};
		transaction: {
			id: string;
			timestamp: Date;
			status: string;
		};
	}>;

	getRewardHistory(userId: string): Promise<
		Array<{
			id: string;
			type: string;
			value: any;
			source: {
				type: string;
				id: string;
				name: string;
			};
			claimedAt: Date;
			status: string;
			metadata?: Record<string, any>;
		}>
	>;

	// Configuration & Rules
	updateRules(params: {
		type: string;
		rules: Array<{
			condition: string;
			points: number;
			metadata?: Record<string, any>;
		}>;
	}): Promise<void>;

	getRules(type: string): Promise<
		Array<{
			condition: string;
			points: number;
			metadata?: Record<string, any>;
		}>
	>;

	validateAction(params: {
		userId: string;
		type: string;
		value: any;
	}): Promise<{
		valid: boolean;
		points?: number;
		achievements?: string[];
		errors?: string[];
	}>;
}
