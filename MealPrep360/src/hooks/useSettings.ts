'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export function useSettings() {
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchSettings = useCallback(async () => {
		try {
			const response = await fetch('/api/settings');
			if (!response.ok) {
				throw new Error('Failed to fetch settings');
			}
			const data = await response.json();
			setSettings(data as UserSettings);
		} catch (error) {
			console.error('Error fetching settings:', error);
			setSettings(DEFAULT_SETTINGS as UserSettings);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	const updateSettings = async (
		section: keyof Omit<UserSettings, 'id' | 'email' | 'name'>,
		key: string,
		value: unknown
	) => {
		try {
			const currentSettings = settings ?? DEFAULT_SETTINGS;
			const updatedSettings = {
				...currentSettings,
				[section]:
					key === ''
						? value
						: {
								...(currentSettings[section] as Record<string, unknown>),
								[key]: value,
							},
			};

			const response = await fetch('/api/settings', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatedSettings),
			});

			if (!response.ok) {
				throw new Error('Failed to update settings');
			}

			const data = await response.json();
			setSettings(data as UserSettings);
			return { success: true };
		} catch (error) {
			console.error('Error updating settings:', error);
			return { success: false, error };
		}
	};

	return { settings, isLoading, updateSettings };
}
