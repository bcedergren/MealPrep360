import {
	checkInappropriateLanguage,
	checkContentLength,
	checkSpamPatterns,
	moderateContent,
} from '@/lib/moderation';

describe('Moderation Functions', () => {
	describe('checkInappropriateLanguage', () => {
		it('should return appropriate for clean content', () => {
			const result = checkInappropriateLanguage('This is a clean message');
			expect(result.isAppropriate).toBe(true);
			expect(result.confidence).toBe(1);
		});

		it('should detect inappropriate language', () => {
			const result = checkInappropriateLanguage('bad word here');
			expect(result.isAppropriate).toBe(false);
			expect(result.reason).toBe('Contains inappropriate language');
		});
	});

	describe('checkContentLength', () => {
		it('should validate content within length limits', () => {
			const result = checkContentLength('This is a valid length message');
			expect(result.isAppropriate).toBe(true);
		});

		it('should reject content that is too short', () => {
			const result = checkContentLength('Too short');
			expect(result.isAppropriate).toBe(false);
			expect(result.reason).toContain('Content length must be between');
		});

		it('should reject content that is too long', () => {
			const longContent = 'a'.repeat(1001);
			const result = checkContentLength(longContent);
			expect(result.isAppropriate).toBe(false);
			expect(result.reason).toContain('Content length must be between');
		});
	});

	describe('checkSpamPatterns', () => {
		it('should detect repeated characters', () => {
			const result = checkSpamPatterns('Helloooooooo');
			expect(result.isAppropriate).toBe(false);
			expect(result.reason).toBe('Contains spam patterns');
		});

		it('should detect email addresses', () => {
			const result = checkSpamPatterns('Contact me at test@example.com');
			expect(result.isAppropriate).toBe(false);
		});

		it('should detect URLs', () => {
			const result = checkSpamPatterns('Visit https://example.com');
			expect(result.isAppropriate).toBe(false);
		});

		it('should detect phone numbers', () => {
			const result = checkSpamPatterns('Call me at 123-456-7890');
			expect(result.isAppropriate).toBe(false);
		});
	});

	describe('moderateContent', () => {
		it('should pass clean content', () => {
			const result = moderateContent('This is a clean, appropriate message');
			expect(result.isAppropriate).toBe(true);
			expect(result.confidence).toBe(1);
		});

		it('should fail content with multiple issues', () => {
			const result = moderateContent('bad word https://spam.com');
			expect(result.isAppropriate).toBe(false);
			expect(result.reason).toContain('Contains inappropriate language');
			expect(result.reason).toContain('Contains spam patterns');
		});
	});
});
