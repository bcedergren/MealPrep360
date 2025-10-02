import { Document } from 'mongoose';
import {
	Achievement,
	Challenge,
	Level,
	UserProgress,
	Leaderboard,
	GamificationEvent,
	GamificationRule,
	GamificationMetrics,
	AchievementType,
	RewardType,
	ProgressionType,
	ChallengeStatus,
} from './index';

export interface IAchievementDocument
	extends Document,
		Omit<Achievement, 'id'> {
	tracking: {
		started?: Date;
		milestones: Array<{
			value: number;
			reached: Date;
		}>;
		history: Array<{
			timestamp: Date;
			value: number;
			event: string;
		}>;
	};
	analytics: {
		completion_rate: number;
		average_time: number;
		difficulty_rating: number;
		popularity: number;
	};
	dependencies: {
		requires?: string[];
		unlocks?: string[];
		related?: string[];
	};
	notifications: {
		progress?: boolean;
		completion?: boolean;
		reminders?: {
			enabled: boolean;
			frequency: string;
			lastSent?: Date;
		};
	};
}

export interface IChallengeDocument extends Document, Omit<Challenge, 'id'> {
	progression: {
		stages: Array<{
			order: number;
			name: string;
			requirements: Record<string, any>;
			rewards: Array<{
				type: RewardType;
				value: number | string;
			}>;
		}>;
		checkpoints: Array<{
			value: number;
			rewards: Array<{
				type: RewardType;
				value: number | string;
			}>;
		}>;
	};
	analytics: {
		participation_rate: number;
		completion_rate: number;
		average_duration: number;
		engagement_metrics: Record<string, number>;
	};
	moderation: {
		reported: boolean;
		reviewed: boolean;
		moderator_notes?: string[];
		last_review?: Date;
	};
	communication: {
		announcements: Array<{
			date: Date;
			message: string;
			type: string;
		}>;
		discussions: Array<{
			userId: string;
			message: string;
			timestamp: Date;
		}>;
	};
}

export interface ILevelDocument extends Document, Omit<Level, 'id'> {
	progression: {
		path: ProgressionType;
		branches?: Array<{
			id: string;
			name: string;
			requirements: Record<string, any>;
		}>;
		milestones: Array<{
			xp: number;
			rewards: Array<{
				type: RewardType;
				value: number | string;
			}>;
		}>;
	};
	analytics: {
		users_reached: number;
		average_time: number;
		completion_rate: number;
		difficulty_rating: number;
	};
	content: {
		tutorials?: Array<{
			type: string;
			url: string;
			required: boolean;
		}>;
		challenges?: string[];
		achievements?: string[];
	};
	balancing: {
		xp_multiplier: number;
		difficulty_curve: number;
		reward_scaling: number;
	};
}

export interface IUserProgressDocument
	extends Document,
		Omit<UserProgress, 'id'> {
	history: {
		levels: Array<{
			level: number;
			reached: Date;
			duration: number;
		}>;
		xp: Array<{
			amount: number;
			source: string;
			timestamp: Date;
		}>;
		rewards: Array<{
			type: RewardType;
			value: number | string;
			source: string;
			timestamp: Date;
		}>;
	};
	preferences: {
		notifications: {
			achievements: boolean;
			levels: boolean;
			challenges: boolean;
			rewards: boolean;
		};
		privacy: {
			show_level: boolean;
			show_achievements: boolean;
			show_stats: boolean;
		};
		display: {
			title?: string;
			badge?: string;
			theme?: string;
		};
	};
	analytics: {
		engagement_score: number;
		activity_patterns: Array<{
			day: number;
			hour: number;
			frequency: number;
		}>;
		progression_rate: number;
		favorite_activities: string[];
	};
	social: {
		followers: number;
		following: number;
		influence_score: number;
		recent_activities: Array<{
			type: string;
			timestamp: Date;
			visibility: string;
		}>;
	};
}

export interface ILeaderboardDocument
	extends Document,
		Omit<Leaderboard, 'id'> {
	configuration: {
		scoring: {
			algorithm: string;
			weights: Record<string, number>;
			bonuses: Array<{
				condition: string;
				multiplier: number;
			}>;
		};
		display: {
			limit: number;
			grouping?: string;
			sorting: string[];
		};
		updates: {
			frequency: string;
			retention: number;
			history: boolean;
		};
	};
	segments: Array<{
		name: string;
		criteria: Record<string, any>;
		rankings: Array<{
			rank: number;
			userId: string;
			score: number;
		}>;
	}>;
	analytics: {
		participation: {
			total: number;
			active: number;
			new: number;
		};
		scores: {
			highest: number;
			average: number;
			distribution: Record<string, number>;
		};
		trends: Array<{
			timestamp: Date;
			metrics: Record<string, number>;
		}>;
	};
	archive: {
		snapshots: Array<{
			timestamp: Date;
			top_ranks: Array<{
				rank: number;
				userId: string;
				score: number;
			}>;
			statistics: Record<string, number>;
		}>;
	};
}

export interface IGamificationEventDocument
	extends Document,
		Omit<GamificationEvent, 'id'> {
	processing: {
		status: string;
		attempts: number;
		completed: boolean;
		error?: string;
	};
	impact: {
		xp_gained: number;
		achievements_affected: string[];
		level_progress: number;
		rewards_triggered: Array<{
			type: RewardType;
			value: number | string;
		}>;
	};
	context: {
		session_id?: string;
		platform?: string;
		location?: {
			type: string;
			coordinates: number[];
		};
		device_info?: Record<string, any>;
	};
	validation: {
		rules_applied: string[];
		conditions_met: boolean;
		verification_status: string;
	};
}

export interface IGamificationRuleDocument
	extends Document,
		Omit<GamificationRule, 'id'> {
	execution: {
		triggers: Array<{
			event: string;
			conditions: Record<string, any>;
		}>;
		actions: Array<{
			type: string;
			parameters: Record<string, any>;
			order: number;
		}>;
		constraints: {
			rate_limit?: {
				max: number;
				window: string;
			};
			dependencies?: string[];
			exclusions?: string[];
		};
	};
	validation: {
		schema: Record<string, any>;
		required_fields: string[];
		custom_validators?: Array<{
			name: string;
			function: string;
		}>;
	};
	monitoring: {
		usage: {
			total_triggers: number;
			successful_executions: number;
			failed_executions: number;
		};
		performance: {
			average_execution_time: number;
			error_rate: number;
			last_execution?: Date;
		};
		alerts: Array<{
			type: string;
			message: string;
			timestamp: Date;
		}>;
	};
}

export interface IGamificationMetricsDocument
	extends Document,
		GamificationMetrics {
	analysis: {
		trends: Array<{
			metric: string;
			values: Array<{
				timestamp: Date;
				value: number;
			}>;
			insights: Array<{
				type: string;
				description: string;
				significance: number;
			}>;
		}>;
		correlations: Array<{
			metrics: string[];
			strength: number;
			direction: string;
		}>;
		predictions: Array<{
			metric: string;
			forecast: Array<{
				timestamp: Date;
				value: number;
				confidence: number;
			}>;
		}>;
	};
	segments: Array<{
		name: string;
		criteria: Record<string, any>;
		metrics: Record<string, number>;
		insights: Array<{
			type: string;
			description: string;
			value: any;
		}>;
	}>;
	benchmarks: {
		internal: Record<
			string,
			{
				current: number;
				previous: number;
				change: number;
			}
		>;
		external?: Record<
			string,
			{
				industry: number;
				percentile: number;
			}
		>;
	};
}
