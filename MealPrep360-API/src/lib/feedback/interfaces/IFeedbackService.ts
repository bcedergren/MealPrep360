export interface Feedback {
	id: string;
	userId: string;
	type: 'bug' | 'feature' | 'improvement' | 'other';
	category: string;
	priority: 'low' | 'medium' | 'high' | 'critical';
	status: 'open' | 'in_progress' | 'resolved' | 'closed';
	title: string;
	description: string;
	attachments?: Array<{
		type: string;
		url: string;
		name: string;
		size: number;
	}>;
	metadata?: {
		browser?: string;
		os?: string;
		device?: string;
		appVersion?: string;
		[key: string]: any;
	};
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
	resolvedAt?: Date;
	assignedTo?: string;
	resolution?: {
		type: string;
		description: string;
		committedAt?: Date;
		deployedAt?: Date;
	};
}

export interface FeedbackResponse {
	id: string;
	feedbackId: string;
	userId: string;
	content: string;
	attachments?: Array<{
		type: string;
		url: string;
		name: string;
		size: number;
	}>;
	createdAt: Date;
	updatedAt: Date;
	isInternal: boolean;
	metadata?: Record<string, any>;
}

export interface FeedbackStats {
	total: number;
	byStatus: Record<string, number>;
	byType: Record<string, number>;
	byPriority: Record<string, number>;
	averageResolutionTime: number;
	responseRate: number;
	trends: Array<{
		period: string;
		count: number;
		resolved: number;
	}>;
}

export interface IFeedbackService {
	// Feedback Management
	createFeedback(feedback: Omit<Feedback, 'id'>): Promise<Feedback>;

	getFeedback(feedbackId: string): Promise<Feedback>;

	listFeedback(filters?: {
		userId?: string;
		type?: string;
		category?: string;
		priority?: string;
		status?: string;
		startDate?: Date;
		endDate?: Date;
		assignedTo?: string;
		tags?: string[];
	}): Promise<Feedback[]>;

	updateFeedback(
		feedbackId: string,
		updates: Partial<Feedback>
	): Promise<Feedback>;

	deleteFeedback(feedbackId: string): Promise<void>;

	// Response Management
	createResponse(
		response: Omit<FeedbackResponse, 'id'>
	): Promise<FeedbackResponse>;

	getResponse(responseId: string): Promise<FeedbackResponse>;

	listResponses(feedbackId: string): Promise<FeedbackResponse[]>;

	updateResponse(
		responseId: string,
		updates: Partial<FeedbackResponse>
	): Promise<FeedbackResponse>;

	deleteResponse(responseId: string): Promise<void>;

	// Analytics & Reporting
	getFeedbackStats(filters?: {
		startDate?: Date;
		endDate?: Date;
		type?: string;
		category?: string;
	}): Promise<FeedbackStats>;

	getTopIssues(params: { timeframe: string; limit?: number }): Promise<
		Array<{
			category: string;
			count: number;
			impact: number;
			examples: string[];
		}>
	>;

	getSentimentAnalysis(feedbackId: string): Promise<{
		score: number;
		aspects: Array<{
			topic: string;
			sentiment: number;
			keywords: string[];
		}>;
		trends: Array<{
			period: string;
			sentiment: number;
		}>;
	}>;

	// Workflow Management
	assignFeedback(params: {
		feedbackId: string;
		userId: string;
		note?: string;
	}): Promise<Feedback>;

	changeFeedbackStatus(params: {
		feedbackId: string;
		status: string;
		resolution?: {
			type: string;
			description: string;
		};
	}): Promise<Feedback>;

	mergeFeedback(params: {
		sourceId: string;
		targetId: string;
		note?: string;
	}): Promise<Feedback>;

	linkFeedback(params: {
		feedbackId: string;
		relatedId: string;
		type: 'duplicate' | 'related' | 'blocks' | 'blocked_by';
	}): Promise<void>;

	// Notifications
	subscribeFeedback(params: {
		feedbackId: string;
		userId: string;
		preferences?: {
			email?: boolean;
			push?: boolean;
			inApp?: boolean;
		};
	}): Promise<void>;

	unsubscribeFeedback(params: {
		feedbackId: string;
		userId: string;
	}): Promise<void>;

	// Export & Integration
	exportFeedback(params: {
		format: 'csv' | 'json' | 'pdf';
		filters?: Record<string, any>;
		fields?: string[];
	}): Promise<{
		url: string;
		expiresAt: Date;
		metadata: {
			size: number;
			format: string;
			rows: number;
		};
	}>;

	syncFeedback(params: {
		system: string;
		direction: 'import' | 'export' | 'bidirectional';
		filters?: Record<string, any>;
		mappings?: Record<string, string>;
	}): Promise<{
		status: string;
		processed: number;
		errors: Array<{
			item: string;
			error: string;
		}>;
		summary: {
			created: number;
			updated: number;
			skipped: number;
			failed: number;
		};
	}>;
}
