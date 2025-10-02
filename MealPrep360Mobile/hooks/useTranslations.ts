import { useMemo } from 'react';

// Basic translations object - can be expanded for full i18n support
const translations = {
	en: {
		// Common
		loading: 'Loading...',
		error: 'Error',
		retry: 'Retry',
		cancel: 'Cancel',
		save: 'Save',
		delete: 'Delete',
		edit: 'Edit',

		// Navigation
		home: 'Home',
		recipes: 'Recipes',
		mealPlan: 'Meal Plan',
		shopping: 'Shopping',
		profile: 'Profile',

		// Recipe related
		ingredients: 'Ingredients',
		instructions: 'Instructions',
		cookTime: 'Cook Time',
		prepTime: 'Prep Time',
		servings: 'Servings',

		// Meal planning
		breakfast: 'Breakfast',
		lunch: 'Lunch',
		dinner: 'Dinner',
		snack: 'Snack',
	},
};

type Language = keyof typeof translations;
type TranslationKey = keyof typeof translations.en;

export const useTranslations = (language: Language = 'en') => {
	const t = useMemo(() => {
		return (key: TranslationKey): string => {
			return translations[language]?.[key] || key;
		};
	}, [language]);

	return { t, language };
};
