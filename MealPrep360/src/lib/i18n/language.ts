import { cookies } from 'next/headers';
import { translations } from './translations';

const LANGUAGE_COOKIE = 'preferred_language';

export type SupportedLanguage = keyof typeof translations;

export function getLanguage(): SupportedLanguage {
	const cookieStore = cookies();
	const language = cookieStore.get(LANGUAGE_COOKIE)?.value as SupportedLanguage;

	// Validate that the language is supported
	if (language && language in translations) {
		return language;
	}

	return 'en'; // Default to English
}

export function setLanguage(language: SupportedLanguage) {
	const cookieStore = cookies();
	cookieStore.set(LANGUAGE_COOKIE, language, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 365, // 1 year
	});
}
