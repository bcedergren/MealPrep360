'use client';

import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
	useCallback,
} from 'react';
import { useUser } from '@clerk/nextjs';

export interface UserSettings {
	theme: {
		mode: 'light' | 'dark' | 'system';
		contrast: boolean;
		animations: boolean;
	};
	display: {
		recipeLayout: 'grid' | 'list';
		fontSize: 'small' | 'medium' | 'large';
		imageQuality: 'low' | 'medium' | 'high';
	};
	language: {
		preferred:
			| 'en'
			| 'es'
			| 'fr'
			| 'de'
			| 'it'
			| 'pt'
			| 'zh'
			| 'ja'
			| 'ko'
			| 'ru';
		measurementSystem: 'metric' | 'imperial';
	};
	notifications: {
		email: boolean;
		push: boolean;
		mealPlanReminders: boolean;
		shoppingListReminders: boolean;
		quietHours: {
			enabled: boolean;
			start: string;
			end: string;
		};
	};
	privacy: {
		profileVisibility: 'public' | 'private';
		shareRecipes: boolean;
		showCookingHistory: boolean;
	};
	security: {
		twoFactorAuth: boolean;
	};
	mealPlanning: {
		weeklyPlanningEnabled: boolean;
		shoppingListEnabled: boolean;
		nutritionTrackingEnabled: boolean;
		defaultDuration: string;
		defaultServings: number;
	};
	integrations: {
		calendar: 'none' | 'google' | 'outlook' | 'apple';
		shoppingList: 'none' | 'anylist' | 'walmart' | 'amazon';
	};
	preferences: {
		dietaryPreferences: string[];
		allergies: string[];
		cookingSkill: string;
		cookingTime: string;
		cuisines: string[];
		kidFriendly: boolean;
		quickMeals: boolean;
		healthy: boolean;
	};
	onboarding: {
		tutorialCompleted: boolean;
	};
}

interface SettingsContextType {
	settings: UserSettings | null;
	updateSettings: (
		newSettings: Partial<UserSettings>
	) => Promise<{ success: boolean; error?: unknown }>;
	isLoading: boolean;
}

const defaultSettings: UserSettings = {
	theme: {
		mode: 'light',
		contrast: false,
		animations: true,
	},
	display: {
		recipeLayout: 'grid',
		fontSize: 'medium',
		imageQuality: 'medium',
	},
	language: {
		preferred: 'en',
		measurementSystem: 'metric',
	},
	notifications: {
		email: true,
		push: false,
		mealPlanReminders: true,
		shoppingListReminders: true,
		quietHours: {
			enabled: false,
			start: '22:00',
			end: '08:00',
		},
	},
	privacy: {
		profileVisibility: 'private',
		shareRecipes: false,
		showCookingHistory: false,
	},
	security: {
		twoFactorAuth: false,
	},
	mealPlanning: {
		weeklyPlanningEnabled: true,
		shoppingListEnabled: true,
		nutritionTrackingEnabled: true,
		defaultDuration: '30 minutes',
		defaultServings: 2,
	},
	integrations: {
		calendar: 'none',
		shoppingList: 'none',
	},
	preferences: {
		dietaryPreferences: [],
		allergies: [],
		cookingSkill: 'Intermediate',
		cookingTime: 'Moderate (30-60 min)',
		cuisines: [],
		kidFriendly: false,
		quickMeals: false,
		healthy: false,
	},
	onboarding: {
		tutorialCompleted: false,
	},
};

const SettingsContext = createContext<SettingsContextType>({
	settings: defaultSettings,
	updateSettings: async () => ({ success: false }),
	isLoading: false,
});

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
	children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
	const { user } = useUser();
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchSettings = useCallback(async () => {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

			const response = await fetch('/api/settings', {
				signal: controller.signal,
				headers: {
					'Content-Type': 'application/json',
				},
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorText = await response.text();

				throw new Error(
					`Failed to fetch settings: ${response.status} ${response.statusText} - ${errorText}`
				);
			}

			const data = await response.json();

			// The API now returns the settings directly, not wrapped in an object
			setSettings(data);
			setIsLoading(false);
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
				} else if (
					error.name === 'TypeError' &&
					error.message.includes('Failed to fetch')
				) {
				}
			}
			// Always set default settings on error
			setSettings(defaultSettings);
			setIsLoading(false);
		}
	}, []); // Empty dependency array since this function doesn't depend on any props or state

	useEffect(() => {
		if (user) {
			// Only fetch settings if user is authenticated
			fetchSettings();
		} else {
			setSettings(defaultSettings);
			setIsLoading(false);
		}
	}, [fetchSettings, user]);

	const updateSettings = useCallback(
		async (newSettings: Partial<UserSettings>) => {
			if (!user) return { success: false, error: 'User not authenticated' };

			try {
				// Get current settings to merge with new ones
				const currentSettings = settings || defaultSettings;

				// Deep merge function for nested objects
				const deepMerge = (target: any, source: any) => {
					for (const key in source) {
						if (source[key] instanceof Object && !Array.isArray(source[key])) {
							if (!target[key]) Object.assign(target, { [key]: {} });
							deepMerge(target[key], source[key]);
						} else {
							Object.assign(target, { [key]: source[key] });
						}
					}
					return target;
				};

				// Create a complete settings object by deep merging current settings with new ones
				const completeSettings = deepMerge(
					deepMerge({}, currentSettings),
					newSettings
				);

				// Optimistically update the local state
				setSettings(completeSettings);

				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000);

				const response = await fetch('/api/settings', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': 'no-cache',
						Pragma: 'no-cache',
					},
					body: JSON.stringify(completeSettings),
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`Failed to update settings: ${response.statusText}`);
				}

				const data = await response.json();

				// Update with the complete settings from the server
				setSettings(data);
				return { success: true };
			} catch (error) {
				// Revert the optimistic update on error
				fetchSettings();
				return { success: false, error };
			}
		},
		[user, settings, fetchSettings]
	);

	return (
		<SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
			{children}
		</SettingsContext.Provider>
	);
}
