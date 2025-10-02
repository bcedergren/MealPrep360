import { cn, getCurrentSeason } from './utils';

describe('Utils', () => {
	describe('cn function', () => {
		it('should merge class names correctly', () => {
			const result = cn('bg-red-500', 'text-white');
			expect(result).toContain('bg-red-500');
			expect(result).toContain('text-white');
		});

		it('should handle conditional classes', () => {
			const result = cn(
				'base-class',
				true && 'conditional-class',
				false && 'hidden-class'
			);
			expect(result).toContain('base-class');
			expect(result).toContain('conditional-class');
			expect(result).not.toContain('hidden-class');
		});

		it('should handle empty inputs', () => {
			const result = cn();
			expect(result).toBe('');
		});

		it('should handle undefined and null inputs', () => {
			const result = cn('base-class', undefined, null, 'other-class');
			expect(result).toContain('base-class');
			expect(result).toContain('other-class');
		});
	});

	describe('getCurrentSeason function', () => {
		it('should return spring for March, April, May', () => {
			// Mock Date to return March (month index 2)
			const mockDate = new Date(2024, 2, 15); // March 15, 2024
			jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

			expect(getCurrentSeason()).toBe('spring');

			// Test April (month index 3)
			const mockApril = new Date(2024, 3, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockApril);
			expect(getCurrentSeason()).toBe('spring');

			// Test May (month index 4)
			const mockMay = new Date(2024, 4, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockMay);
			expect(getCurrentSeason()).toBe('spring');
		});

		it('should return summer for June, July, August', () => {
			// Test June (month index 5)
			const mockJune = new Date(2024, 5, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockJune);
			expect(getCurrentSeason()).toBe('summer');

			// Test July (month index 6)
			const mockJuly = new Date(2024, 6, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockJuly);
			expect(getCurrentSeason()).toBe('summer');

			// Test August (month index 7)
			const mockAugust = new Date(2024, 7, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockAugust);
			expect(getCurrentSeason()).toBe('summer');
		});

		it('should return fall for September, October, November', () => {
			// Test September (month index 8)
			const mockSeptember = new Date(2024, 8, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockSeptember);
			expect(getCurrentSeason()).toBe('fall');

			// Test October (month index 9)
			const mockOctober = new Date(2024, 9, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockOctober);
			expect(getCurrentSeason()).toBe('fall');

			// Test November (month index 10)
			const mockNovember = new Date(2024, 10, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockNovember);
			expect(getCurrentSeason()).toBe('fall');
		});

		it('should return winter for December, January, February', () => {
			// Test December (month index 11)
			const mockDecember = new Date(2024, 11, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockDecember);
			expect(getCurrentSeason()).toBe('winter');

			// Test January (month index 0)
			const mockJanuary = new Date(2024, 0, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockJanuary);
			expect(getCurrentSeason()).toBe('winter');

			// Test February (month index 1)
			const mockFebruary = new Date(2024, 1, 15);
			jest.spyOn(global, 'Date').mockImplementation(() => mockFebruary);
			expect(getCurrentSeason()).toBe('winter');
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});
	});
});
