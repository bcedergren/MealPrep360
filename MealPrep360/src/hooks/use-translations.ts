import { useLanguage } from '@/contexts/language-context';

export function useTranslations() {
	const { translations } = useLanguage();
	return translations;
}
