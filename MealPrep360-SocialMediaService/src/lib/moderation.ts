import { ENV_CONFIG } from './vercelConfig';

// List of common inappropriate words (simplified example)
const INAPPROPRIATE_WORDS: string[] = [
	// Add your list of inappropriate words here
];

// Content moderation configuration
const MODERATION_CONFIG = {
	maxReportsBeforeReview: 3,
	autoModerationEnabled: ENV_CONFIG.isProduction,
	inappropriateWordThreshold: 0.1, // 10% of content contains inappropriate words
};

export interface ModerationResult {
	isAppropriate: boolean;
	reason?: string;
	confidence: number;
}

/**
 * Check if content contains inappropriate language
 */
export function checkInappropriateLanguage(content: string): ModerationResult {
	if (!MODERATION_CONFIG.autoModerationEnabled) {
		return { isAppropriate: true, confidence: 1 };
	}

	const words = content.toLowerCase().split(/\s+/);
	const inappropriateCount = words.filter((word) =>
		INAPPROPRIATE_WORDS.includes(word)
	).length;

	const ratio = inappropriateCount / words.length;
	const isAppropriate = ratio < MODERATION_CONFIG.inappropriateWordThreshold;

	return {
		isAppropriate,
		reason: !isAppropriate ? 'Contains inappropriate language' : undefined,
		confidence: 1 - ratio,
	};
}

/**
 * Check if content meets length requirements
 */
export function checkContentLength(
	content: string,
	minLength: number = 10,
	maxLength: number = 1000
): ModerationResult {
	const length = content.trim().length;
	const isAppropriate = length >= minLength && length <= maxLength;

	return {
		isAppropriate,
		reason: !isAppropriate
			? `Content length must be between ${minLength} and ${maxLength} characters`
			: undefined,
		confidence: 1,
	};
}

/**
 * Check if content contains spam patterns
 */
export function checkSpamPatterns(content: string): ModerationResult {
	if (!MODERATION_CONFIG.autoModerationEnabled) {
		return { isAppropriate: true, confidence: 1 };
	}

	const spamPatterns = [
		/(.)\1{4,}/, // Repeated characters
		/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, // Email addresses
		/(https?:\/\/[^\s]+)/, // URLs
		/(?:^|\s)(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x\d+)?(?:\s|$)/, // Phone numbers
	];

	const hasSpamPattern = spamPatterns.some((pattern) => pattern.test(content));

	return {
		isAppropriate: !hasSpamPattern,
		reason: hasSpamPattern ? 'Contains spam patterns' : undefined,
		confidence: hasSpamPattern ? 0.8 : 1,
	};
}

/**
 * Comprehensive content moderation check
 */
export function moderateContent(content: string): ModerationResult {
	const languageCheck = checkInappropriateLanguage(content);
	const lengthCheck = checkContentLength(content);
	const spamCheck = checkSpamPatterns(content);

	const isAppropriate =
		languageCheck.isAppropriate &&
		lengthCheck.isAppropriate &&
		spamCheck.isAppropriate;

	const reason = !isAppropriate
		? [languageCheck.reason, lengthCheck.reason, spamCheck.reason]
				.filter(Boolean)
				.join(', ')
		: undefined;

	const confidence = Math.min(
		languageCheck.confidence,
		lengthCheck.confidence,
		spamCheck.confidence
	);

	return {
		isAppropriate,
		reason,
		confidence,
	};
}
