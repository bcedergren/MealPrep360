import { IModerationService } from '../interfaces/services';
import { IBaseRepository } from '../interfaces/repositories';
import { ModerationResult } from '../lib/moderation';
import { OpenAIService } from './OpenAIService';
import { OpenAIConfig } from '../interfaces/ai';
import { IReport } from '../models/Report';
import { BaseService } from './BaseService';

export class ModerationService
	extends BaseService<IReport>
	implements IModerationService
{
	private readonly inappropriateWords: Set<string>;
	private readonly spamPatterns: RegExp[];
	private readonly contentLengthLimits: {
		min: number;
		max: number;
	};
	private readonly openAIService?: OpenAIService;

	constructor(
		repository: IBaseRepository<IReport>,
		openAIConfig?: OpenAIConfig
	) {
		super(repository);
		if (openAIConfig) {
			this.openAIService = new OpenAIService(openAIConfig);
		}

		this.inappropriateWords = new Set([]);
		this.spamPatterns = [
			/(\S+)\1{4,}/i,
			/([A-Za-z0-9])\1{4,}/,
			/\b(buy|sell|discount|offer|click|win|free)\b/i,
		];
		this.contentLengthLimits = { min: 1, max: 5000 };
	}

	async moderateContent(content: string): Promise<ModerationResult> {
		const [basicChecks, aiModeration] = await Promise.all([
			this.runBasicChecks(content),
			this.runAIModeration(content),
		]);

		if (!basicChecks.isAppropriate) return basicChecks;
		if (aiModeration && !aiModeration.isAppropriate) return aiModeration;

		return {
			isAppropriate: true,
			confidence: Math.min(
				basicChecks.confidence,
				aiModeration?.confidence ?? 1.0
			),
		};
	}

	async reportContent(
		contentId: string,
		reporterId: string,
		reason: string
	): Promise<void> {
		await this.repository.create({
			contentId,
			reporterId,
			reason,
			status: 'pending',
			createdAt: new Date(),
		} as IReport);

		const reportCount = await this.repository
			.find({ contentId } as Partial<IReport>)
			.then((reports) => reports.length);
		if (reportCount >= 3) {
			await this.flagContentForReview(contentId);
		}
	}

	async reviewReport(
		reportId: string,
		moderatorId: string,
		action: 'approve' | 'reject'
	): Promise<void> {
		const report = await this.repository.findById(reportId);
		if (!report) throw new Error('Report not found');

		await this.repository.update(reportId, {
			status: action === 'approve' ? 'approved' : 'rejected',
			moderatorId,
			reviewedAt: new Date(),
		} as Partial<IReport>);

		if (action === 'approve') {
			await this.takeActionOnContent(report.contentId);
		}
	}

	private async runBasicChecks(content: string): Promise<ModerationResult> {
		const checks = await Promise.all([
			this.checkInappropriateLanguage(content),
			this.checkSpamPatterns(content),
			this.checkContentLength(content),
		]);

		const failedCheck = checks.find((check) => !check.isAppropriate);
		if (failedCheck) return failedCheck;

		return {
			isAppropriate: true,
			confidence: Math.min(...checks.map((check) => check.confidence)),
		};
	}

	private async runAIModeration(
		content: string
	): Promise<ModerationResult | null> {
		if (!this.openAIService) return null;
		try {
			return await this.openAIService.moderateContent(content);
		} catch (error) {
			console.error('AI moderation failed:', error);
			return null;
		}
	}

	private async checkInappropriateLanguage(
		content: string
	): Promise<ModerationResult> {
		const words = content.toLowerCase().split(/\s+/);
		const inappropriateWordsFound = words.filter((word) =>
			this.inappropriateWords.has(word)
		);

		return {
			isAppropriate: inappropriateWordsFound.length === 0,
			reason:
				inappropriateWordsFound.length > 0
					? 'Content contains inappropriate language'
					: undefined,
			confidence: 0.9,
		};
	}

	private async checkSpamPatterns(content: string): Promise<ModerationResult> {
		const hasSpamPattern = this.spamPatterns.some((pattern) =>
			pattern.test(content)
		);

		return {
			isAppropriate: !hasSpamPattern,
			reason: hasSpamPattern ? 'Content matches spam patterns' : undefined,
			confidence: 0.8,
		};
	}

	private async checkContentLength(content: string): Promise<ModerationResult> {
		const length = content.length;
		const isAppropriate =
			length >= this.contentLengthLimits.min &&
			length <= this.contentLengthLimits.max;

		return {
			isAppropriate,
			reason: !isAppropriate
				? `Content length must be between ${this.contentLengthLimits.min} and ${this.contentLengthLimits.max} characters`
				: undefined,
			confidence: 1.0,
		};
	}

	private async flagContentForReview(contentId: string): Promise<void> {
		await this.repository.update(contentId, {
			status: 'flagged',
			flaggedAt: new Date(),
		} as Partial<IReport>);
	}

	private async takeActionOnContent(contentId: string): Promise<void> {
		await this.repository.update(contentId, {
			status: 'removed',
			removedAt: new Date(),
		} as Partial<IReport>);
	}
}
