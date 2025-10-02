export type SupportedLanguage =
	| 'en'
	| 'es'
	| 'fr'
	| 'de'
	| 'it'
	| 'pt'
	| 'zh'
	| 'ja'
	| 'ko';

let currentLanguage: SupportedLanguage = 'en';

export function getLanguage(): SupportedLanguage {
	return currentLanguage;
}

export function setLanguage(language: SupportedLanguage): void {
	currentLanguage = language;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
	'en',
	'es',
	'fr',
	'de',
	'it',
	'pt',
	'zh',
	'ja',
	'ko',
];
