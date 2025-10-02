export interface OpenAIConfig {
	apiKey: string;
	organization?: string;
	maxRetries?: number;
	timeout?: number;
}

export interface OpenAIModerationResponse {
	id: string;
	model: string;
	results: Array<{
		flagged: boolean;
		categories: {
			hate: boolean;
			'hate/threatening': boolean;
			'self-harm': boolean;
			sexual: boolean;
			'sexual/minors': boolean;
			violence: boolean;
			'violence/graphic': boolean;
		};
		category_scores: {
			hate: number;
			'hate/threatening': number;
			'self-harm': number;
			sexual: number;
			'sexual/minors': number;
			violence: number;
			'violence/graphic': number;
		};
	}>;
}
