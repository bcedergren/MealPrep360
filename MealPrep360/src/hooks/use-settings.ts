import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface Settings {
	theme: 'light' | 'dark' | 'system';
	displayDensity: 'comfortable' | 'compact';
	notifications: boolean;
	emailNotifications: boolean;
	privacy: {
		profileVisibility: 'public' | 'private';
		showEmail: boolean;
	};
}

export function useSettings() {
	const { userId, isLoaded } = useAuth();
	const [settings, setSettings] = useState<Settings | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		if (!userId) {
			setSettings(null);
			setLoading(false);
			return;
		}

		const fetchSettings = async () => {
			try {
				const response = await fetch('/api/settings');
				if (!response.ok) {
					throw new Error('Failed to fetch settings');
				}
				const data = await response.json();
				setSettings(data);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Failed to fetch settings'
				);
			} finally {
				setLoading(false);
			}
		};

		fetchSettings();
	}, [isLoaded, userId]);

	const updateSettings = async (newSettings: Partial<Settings>) => {
		if (!userId) return;

		try {
			const response = await fetch('/api/settings', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newSettings),
			});

			if (!response.ok) {
				throw new Error('Failed to update settings');
			}

			const data = await response.json();
			setSettings(data);
			return data;
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to update settings'
			);
			throw err;
		}
	};

	return {
		settings,
		loading,
		error,
		updateSettings,
	};
}
