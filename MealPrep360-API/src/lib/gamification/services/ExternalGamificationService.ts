import { BaseExternalService } from '../../core/services/BaseExternalService';
import { IGamificationService } from '../interfaces/IGamificationService';

interface ApiResponse<T> {
	data: {
		data: T;
	};
}
import {
	Achievement,
	Challenge,
	Level,
	Progress,
	Leaderboard,
} from '../interfaces/IGamificationService';
import {
	UserProgress,
	GamificationEvent,
	GamificationRule,
	GamificationMetrics,
	AchievementType,
	RewardType,
	ProgressionType,
	ChallengeStatus,
} from '../types';
import {
	IAchievementDocument,
	IChallengeDocument,
	ILevelDocument,
	IUserProgressDocument,
	ILeaderboardDocument,
	IGamificationEventDocument,
	IGamificationRuleDocument,
	IGamificationMetricsDocument,
} from '../types/gamification';

export class ExternalGamificationService
	extends BaseExternalService
	implements IGamificationService
{
	constructor() {
		super('gamification');
	}

	// Achievement Management
	async createAchievement(
		achievement: Omit<Achievement, 'id'>
	): Promise<Achievement> {
		const response = await this.resilientClient.post<ApiResponse<Achievement>>(
			'/achievements',
			achievement
		);
		return response.data.data;
	}

	async getAchievement(achievementId: string): Promise<Achievement> {
		const response = await this.resilientClient.get<ApiResponse<Achievement>>(
			`/achievements/${achievementId}`
		);
		return response.data.data;
	}

	async listAchievements(filters?: {
		userId?: string;
		type?: string;
		status?: string;
	}): Promise<Achievement[]> {
		const response = await this.resilientClient.get<ApiResponse<Achievement[]>>(
			'/achievements',
			{
				params: filters,
			}
		);
		return response.data.data;
	}

	async updateAchievement(
		achievementId: string,
		updates: Partial<Achievement>
	): Promise<Achievement> {
		const response = await this.resilientClient.put<ApiResponse<Achievement>>(
			`/achievements/${achievementId}`,
			updates
		);
		return response.data.data;
	}

	async deleteAchievement(achievementId: string): Promise<void> {
		await this.resilientClient.delete(`/achievements/${achievementId}`);
	}

	async updateAchievementProgress(
		achievementId: string,
		progress: number
	): Promise<Achievement> {
		const response = await this.resilientClient.put<ApiResponse<Achievement>>(
			`/achievements/${achievementId}/progress`,
			{ progress }
		);
		return response.data.data;
	}

	async completeAchievement(achievementId: string): Promise<Achievement> {
		const response = await this.resilientClient.post<ApiResponse<Achievement>>(
			`/achievements/${achievementId}/complete`
		);
		return response.data.data;
	}

	// Challenge Management
	async createChallenge(challenge: Omit<Challenge, 'id'>): Promise<Challenge> {
		const response = await this.resilientClient.post<ApiResponse<Challenge>>(
			'/challenges',
			challenge
		);
		return response.data.data;
	}

	async getChallenge(challengeId: string): Promise<Challenge> {
		const response = await this.resilientClient.get<ApiResponse<Challenge>>(
			`/challenges/${challengeId}`
		);
		return response.data.data;
	}

	async listChallenges(filters?: {
		status?: string;
		type?: string;
		userId?: string;
	}): Promise<Challenge[]> {
		const response = await this.resilientClient.get<ApiResponse<Challenge[]>>(
			'/challenges',
			{
				params: filters,
			}
		);
		return response.data.data;
	}

	async joinChallenge(params: {
		challengeId: string;
		userId: string;
	}): Promise<void> {
		await this.resilientClient.post(`/challenges/${params.challengeId}/join`, {
			userId: params.userId,
		});
	}

	async updateChallenge(
		challengeId: string,
		updates: Partial<Challenge>
	): Promise<Challenge> {
		const response = await this.resilientClient.put<ApiResponse<Challenge>>(
			`/challenges/${challengeId}`,
			updates
		);
		return response.data.data;
	}

	async deleteChallenge(challengeId: string): Promise<void> {
		await this.resilientClient.delete(`/challenges/${challengeId}`);
	}

	async leaveChallenge(params: {
		challengeId: string;
		userId: string;
	}): Promise<void> {
		await this.resilientClient.post(`/challenges/${params.challengeId}/leave`, {
			userId: params.userId,
		});
	}

	async updateChallengeProgress(
		challengeId: string,
		userId: string,
		progress: number
	): Promise<Challenge> {
		const response = await this.resilientClient.put<ApiResponse<Challenge>>(
			`/challenges/${challengeId}/progress`,
			{ userId, progress }
		);
		return response.data.data;
	}

	async completeChallenge(
		challengeId: string,
		userId: string
	): Promise<Challenge> {
		const response = await this.resilientClient.post<ApiResponse<Challenge>>(
			`/challenges/${challengeId}/complete`,
			{ userId }
		);
		return response.data.data;
	}

	// Level Management
	async createLevel(level: Omit<Level, 'id'>): Promise<Level> {
		const response = await this.resilientClient.post<ApiResponse<Level>>(
			'/levels',
			level
		);
		return response.data.data;
	}

	async getLevel(levelId: string): Promise<Level> {
		const response = await this.resilientClient.get<ApiResponse<Level>>(
			`/levels/${levelId}`
		);
		return response.data.data;
	}

	async listLevels(): Promise<Level[]> {
		const response =
			await this.resilientClient.get<ApiResponse<Level[]>>('/levels');
		return response.data.data;
	}

	async updateLevel(levelId: string, updates: Partial<Level>): Promise<Level> {
		const response = await this.resilientClient.put<ApiResponse<Level>>(
			`/levels/${levelId}`,
			updates
		);
		return response.data.data;
	}

	async deleteLevel(levelId: string): Promise<void> {
		await this.resilientClient.delete(`/levels/${levelId}`);
	}

	async calculateRequiredXP(level: number): Promise<number> {
		const response = await this.resilientClient.get<
			ApiResponse<{ xp: number }>
		>(`/levels/${level}/required-xp`);
		return response.data.data.xp;
	}

	// User Progress Management
	async createUserProgress(
		progress: Omit<UserProgress, 'id'>
	): Promise<Progress> {
		const response = await this.resilientClient.post<ApiResponse<Progress>>(
			'/progress',
			progress
		);
		return response.data.data;
	}

	async getUserProgress(userId: string): Promise<Progress> {
		const response = await this.resilientClient.get<ApiResponse<Progress>>(
			`/progress/${userId}`
		);
		return response.data.data;
	}

	async updateProgress(params: {
		userId: string;
		type: string;
		value: number;
		metadata?: Record<string, any>;
	}): Promise<Progress> {
		const response = await this.resilientClient.put<ApiResponse<Progress>>(
			`/progress/${params.userId}`,
			params
		);
		return response.data.data;
	}

	async awardPoints(params: {
		userId: string;
		points: number;
		reason: string;
		metadata?: Record<string, any>;
	}): Promise<Progress> {
		const response = await this.resilientClient.post<ApiResponse<Progress>>(
			`/progress/${params.userId}/points`,
			params
		);
		return response.data.data;
	}

	async addXP(
		userId: string,
		amount: number,
		source: string
	): Promise<Progress> {
		const response = await this.resilientClient.post<ApiResponse<Progress>>(
			`/progress/${userId}/xp`,
			{
				amount,
				source,
			}
		);
		return response.data.data;
	}

	async checkLevelUp(userId: string): Promise<{
		leveledUp: boolean;
		newLevel?: number;
		rewards?: Array<{
			type: RewardType;
			value: number | string;
		}>;
	}> {
		const response = await this.resilientClient.get<
			ApiResponse<{
				leveledUp: boolean;
				newLevel?: number;
				rewards?: Array<{
					type: RewardType;
					value: number | string;
				}>;
			}>
		>(`/progress/${userId}/level-up`);
		return response.data.data;
	}

	// Leaderboard Management
	async createLeaderboard(
		leaderboard: Omit<Leaderboard, 'id'>
	): Promise<Leaderboard> {
		const response = await this.resilientClient.post<ApiResponse<Leaderboard>>(
			'/leaderboards',
			leaderboard
		);
		return response.data.data;
	}

	async getLeaderboard(leaderboardId: string): Promise<Leaderboard> {
		const response = await this.resilientClient.get<ApiResponse<Leaderboard>>(
			`/leaderboards/${leaderboardId}`
		);
		return response.data.data;
	}

	async listLeaderboards(filters?: {
		type?: string;
		timeframe?: string;
	}): Promise<Leaderboard[]> {
		const response = await this.resilientClient.get<ApiResponse<Leaderboard[]>>(
			'/leaderboards',
			{
				params: filters,
			}
		);
		return response.data.data;
	}

	async updateLeaderboard(
		leaderboardId: string,
		updates: Partial<Leaderboard>
	): Promise<Leaderboard> {
		const response = await this.resilientClient.put<ApiResponse<Leaderboard>>(
			`/leaderboards/${leaderboardId}`,
			updates
		);
		return response.data.data;
	}

	async deleteLeaderboard(leaderboardId: string): Promise<void> {
		await this.resilientClient.delete(`/leaderboards/${leaderboardId}`);
	}

	async getLeaderboardRanking(params: {
		leaderboardId: string;
		userId: string;
	}): Promise<{
		rank: number;
		score: number;
		total: number;
	}> {
		const response = await this.resilientClient.get<
			ApiResponse<{
				rank: number;
				score: number;
				total: number;
			}>
		>(`/leaderboards/${params.leaderboardId}/ranking/${params.userId}`);
		return response.data.data;
	}

	async getRankings(
		leaderboardId: string,
		options?: {
			limit?: number;
			offset?: number;
		}
	): Promise<
		Array<{
			rank: number;
			userId: string;
			score: number;
		}>
	> {
		const response = await this.resilientClient.get<
			ApiResponse<
				Array<{
					rank: number;
					userId: string;
					score: number;
				}>
			>
		>(`/leaderboards/${leaderboardId}/rankings`, {
			params: options,
		});
		return response.data.data;
	}

	async claimReward(params: {
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
	}> {
		const response = await this.resilientClient.post<
			ApiResponse<{
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
			}>
		>('/rewards/claim', params);
		return response.data.data;
	}

	async getRewardHistory(userId: string): Promise<
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
	> {
		const response = await this.resilientClient.get<
			ApiResponse<
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
			>
		>(`/rewards/history/${userId}`);
		return response.data.data;
	}

	// Event Processing
	async processEvent(event: {
		userId: string;
		type: string;
		action: string;
		value?: number;
		context?: Record<string, any>;
		metadata?: Record<string, any>;
	}): Promise<GamificationEvent> {
		const response = await this.resilientClient.post<
			ApiResponse<GamificationEvent>
		>('/events', {
			...event,
			timestamp: new Date(),
			id: '', // Will be replaced by server
			status: 'pending', // Default status
			createdAt: new Date(),
		});
		return response.data.data;
	}

	async getEvent(eventId: string): Promise<GamificationEvent> {
		const response = await this.resilientClient.get<
			ApiResponse<GamificationEvent>
		>(`/events/${eventId}`);
		return response.data.data;
	}

	async listEvents(filters?: {
		userId?: string;
		type?: string;
		startDate?: Date;
		endDate?: Date;
	}): Promise<GamificationEvent[]> {
		const response = await this.resilientClient.get<
			ApiResponse<GamificationEvent[]>
		>('/events', {
			params: {
				...filters,
				startDate: filters?.startDate?.toISOString(),
				endDate: filters?.endDate?.toISOString(),
			},
		});
		return response.data.data;
	}

	async reprocessEvent(eventId: string): Promise<GamificationEvent> {
		const response = await this.resilientClient.post<
			ApiResponse<GamificationEvent>
		>(`/events/${eventId}/reprocess`);
		return response.data.data;
	}

	// Rule Management
	async createRule(
		rule: Omit<GamificationRule, 'id'>
	): Promise<GamificationRule> {
		const response = await this.resilientClient.post<
			ApiResponse<GamificationRule>
		>('/rules', rule);
		return response.data.data;
	}

	async getRule(ruleId: string): Promise<GamificationRule> {
		const response = await this.resilientClient.get<
			ApiResponse<GamificationRule>
		>(`/rules/${ruleId}`);
		return response.data.data;
	}

	async listRules(filters?: {
		eventType?: string;
		status?: string;
	}): Promise<GamificationRule[]> {
		const response = await this.resilientClient.get<
			ApiResponse<GamificationRule[]>
		>('/rules', {
			params: filters,
		});
		return response.data.data;
	}

	async updateRule(
		ruleId: string,
		updates: Partial<GamificationRule>
	): Promise<GamificationRule> {
		const response = await this.resilientClient.put<
			ApiResponse<GamificationRule>
		>(`/rules/${ruleId}`, updates);
		return response.data.data;
	}

	async validateRule(rule: Partial<GamificationRule>): Promise<{
		valid: boolean;
		errors?: string[];
	}> {
		const response = await this.resilientClient.post<
			ApiResponse<{ valid: boolean; errors?: string[] }>
		>('/rules/validate', rule);
		return response.data.data;
	}

	async updateRules(params: {
		type: string;
		rules: Array<{
			condition: string;
			points: number;
			metadata?: Record<string, any>;
		}>;
	}): Promise<void> {
		await this.resilientClient.put('/rules', params);
	}

	async getRules(type: string): Promise<
		Array<{
			condition: string;
			points: number;
			metadata?: Record<string, any>;
		}>
	> {
		const response = await this.resilientClient.get<
			ApiResponse<
				Array<{
					condition: string;
					points: number;
					metadata?: Record<string, any>;
				}>
			>
		>(`/rules/${type}`);
		return response.data.data;
	}

	async validateAction(params: {
		userId: string;
		type: string;
		value: any;
	}): Promise<{
		valid: boolean;
		points?: number;
		achievements?: string[];
		errors?: string[];
	}> {
		const response = await this.resilientClient.post<
			ApiResponse<{
				valid: boolean;
				points?: number;
				achievements?: string[];
				errors?: string[];
			}>
		>('/actions/validate', params);
		return response.data.data;
	}

	// Metrics & Analytics
	async getMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			userId?: string;
			type?: string;
		}
	): Promise<GamificationMetrics> {
		const response = await this.resilientClient.get<
			ApiResponse<GamificationMetrics>
		>('/metrics', {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				...filters,
			},
		});
		return response.data.data;
	}

	async getUserStats(userId: string): Promise<{
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
	}> {
		const response = await this.resilientClient.get<
			ApiResponse<{
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
			}>
		>(`/users/${userId}/stats`);
		return response.data.data;
	}

	async getEngagementMetrics(params: {
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
	}> {
		const response = await this.resilientClient.get<
			ApiResponse<{
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
			}>
		>('/metrics/engagement', {
			params: {
				startDate: params.startDate.toISOString(),
				endDate: params.endDate.toISOString(),
				type: params.type,
			},
		});
		return response.data.data;
	}

	// Utility Functions
	async validateAchievementCompletion(
		achievementId: string,
		userId: string
	): Promise<{
		completed: boolean;
		progress: number;
		remaining?: number;
	}> {
		const response = await this.resilientClient.get<
			ApiResponse<{
				completed: boolean;
				progress: number;
				remaining?: number;
			}>
		>(`/achievements/${achievementId}/validate`, {
			params: { userId },
		});
		return response.data.data;
	}

	async calculateRewards(
		action: string,
		context: Record<string, any>
	): Promise<
		Array<{
			type: RewardType;
			value: number | string;
			reason: string;
		}>
	> {
		const response = await this.resilientClient.post<
			ApiResponse<
				Array<{
					type: RewardType;
					value: number | string;
					reason: string;
				}>
			>
		>('/rewards/calculate', {
			action,
			context,
		});
		return response.data.data;
	}

	async checkEligibility(
		userId: string,
		requirementType: string,
		requirements: Record<string, any>
	): Promise<{
		eligible: boolean;
		missing?: string[];
		alternatives?: string[];
	}> {
		const response = await this.resilientClient.post<
			ApiResponse<{
				eligible: boolean;
				missing?: string[];
				alternatives?: string[];
			}>
		>('/eligibility/check', {
			userId,
			requirementType,
			requirements,
		});
		return response.data.data;
	}

	async simulateProgression(
		userId: string,
		actions: Array<{
			type: string;
			value: number;
		}>
	): Promise<{
		finalLevel: number;
		totalXP: number;
		rewards: Array<{
			type: RewardType;
			value: number | string;
		}>;
		achievements: string[];
	}> {
		const response = await this.resilientClient.post<
			ApiResponse<{
				finalLevel: number;
				totalXP: number;
				rewards: Array<{
					type: RewardType;
					value: number | string;
				}>;
				achievements: string[];
			}>
		>('/progression/simulate', {
			userId,
			actions,
		});
		return response.data.data;
	}
}
