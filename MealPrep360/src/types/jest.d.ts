import '@testing-library/jest-dom';

declare global {
	var describe: (name: string, fn: () => void) => void;
	var it: (name: string, fn: () => void) => void;
	var expect: any;
	var jest: any;
	var beforeEach: (fn: () => void) => void;
	var afterEach: (fn: () => void) => void;
	var beforeAll: (fn: () => void) => void;
	var afterAll: (fn: () => void) => void;

	var testUtils: {
		createMockUser: () => any;
		createMockRecipe: () => any;
		createMockMealPlan: () => any;
		renderWithProviders: (ui: any, options?: any) => any;
	};
}

export {};
