import { OpenAIConfig, OpenAIModerationResponse } from '../interfaces/ai';
import { ModerationResult } from '../lib/moderation';

export class OpenAIService {
	private readonly apiKey: string;
	private readonly organization?: string;
	private readonly maxRetries: number;
	private readonly timeout: number;

	constructor(config: OpenAIConfig) {
		this.apiKey = config.apiKey;
		this.organization = config.organization;
		this.maxRetries = config.maxRetries || 3;
		this.timeout = config.timeout || 10000; // 10 seconds default
	}

	async moderateContent(content: string): Promise<ModerationResult> {
		let retries = 0;

		while (retries < this.maxRetries) {
			try {
				const response = await this.callModerationAPI(content);
				return this.processModerationResponse(response);
			} catch (error) {
				retries++;
				if (retries === this.maxRetries) {
					console.error('OpenRouter moderation API failed:', error);
					// Return a safe default if AI moderation fails
					return {
						isAppropriate: true,
						confidence: 0.5,
						reason: 'AI moderation unavailable',
					};
				}
				// Wait before retrying (exponential backoff)
				await new Promise((resolve) =>
					setTimeout(resolve, Math.pow(2, retries) * 1000)
				);
			}
		}

		// This should never be reached due to the return in the catch block
		return {
			isAppropriate: true,
			confidence: 0.5,
			reason: 'AI moderation error',
		};
	}

	private async callModerationAPI(
		content: string
	): Promise<OpenAIModerationResponse> {
		const response = await fetch('https://openrouter.ai/api/v1/moderations', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
				...(this.organization && { 'OpenAI-Organization': this.organization }),
			},
			body: JSON.stringify({ input: content }),
			signal: AbortSignal.timeout(this.timeout),
		});

		if (!response.ok) {
			throw new Error(`OpenRouter API error: ${response.statusText}`);
		}

		return response.json();
	}

	private processModerationResponse(
		response: OpenAIModerationResponse
	): ModerationResult {
		const result = response.results[0];
		const categories = result.categories;
		const scores = result.category_scores;

		// Get the highest category score
		const maxScore = Math.max(...Object.values(scores));

		// Get the categories that were flagged
		const flaggedCategories = Object.entries(categories)
			.filter(([_, flagged]) => flagged)
			.map(([category]) => this.formatCategory(category));

		return {
			isAppropriate: !result.flagged,
			confidence: 1 - maxScore, // Convert score to confidence (1 = safe, 0 = unsafe)
			reason:
				flaggedCategories.length > 0
					? `Content flagged for: ${flaggedCategories.join(', ')}`
					: undefined,
		};
	}

	private formatCategory(category: string): string {
		return category
			.split('/')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join('/');
	}
}
