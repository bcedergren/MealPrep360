'use client';

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { useSettings } from './settings-context';
import { en } from '@/translations/en';
import { es } from '@/translations/es';
import { fr } from '@/translations/fr';
import { de } from '@/translations/de';
import { it } from '@/translations/it';
import { pt } from '@/translations/pt';
import { zh } from '@/translations/zh';
import { ja } from '@/translations/ja';
import { ko } from '@/translations/ko';
import { ru } from '@/translations/ru';

type Translations = typeof en;

interface LanguageContextType {
	translations: Translations;
	currentLanguage: string;
}

const LanguageContext = createContext<LanguageContextType>({
	translations: en,
	currentLanguage: 'en',
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
	children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
	const { settings } = useSettings();
	const [translations, setTranslations] = useState<Translations>(en);
	const [currentLanguage, setCurrentLanguage] = useState('en');

	useEffect(() => {
		if (settings?.language?.preferred) {
			setCurrentLanguage(settings.language.preferred);
			switch (settings.language.preferred) {
				case 'es':
					setTranslations(es);
					break;
				case 'fr':
					setTranslations(fr);
					break;
				case 'de':
					setTranslations(de);
					break;
				case 'it':
					setTranslations(it);
					break;
				case 'pt':
					setTranslations(pt);
					break;
				case 'zh':
					setTranslations(zh);
					break;
				case 'ja':
					setTranslations(ja);
					break;
				case 'ko':
					setTranslations(ko);
					break;
				case 'ru':
					setTranslations(ru);
					break;
				default:
					setTranslations(en);
			}
		}
	}, [settings?.language?.preferred]);

	return (
		<LanguageContext.Provider value={{ translations, currentLanguage }}>
			{children}
		</LanguageContext.Provider>
	);
}
