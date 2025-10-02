import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface Language {
	code: string;
	name: string;
	nativeName: string;
}

export function useLanguage() {
	const { userId } = useAuth();
	const [language, setLanguage] = useState<Language | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!userId) {
			setLanguage(null);
			setLoading(false);
			return;
		}

		const fetchLanguage = async () => {
			try {
				const response = await fetch('/api/language');
				if (!response.ok) {
					throw new Error('Failed to fetch language settings');
				}
				const data = await response.json();
				setLanguage(data);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: 'Failed to fetch language settings'
				);
			} finally {
				setLoading(false);
			}
		};

		fetchLanguage();
	}, [userId]);

	const updateLanguage = async (newLanguage: string) => {
		if (!userId) return;

		try {
			const response = await fetch('/api/language', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ language: newLanguage }),
			});

			if (!response.ok) {
				throw new Error('Failed to update language settings');
			}

			const data = await response.json();
			setLanguage(data);
			return data;
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Failed to update language settings'
			);
			throw err;
		}
	};

	return {
		language,
		loading,
		error,
		updateLanguage,
	};
}
