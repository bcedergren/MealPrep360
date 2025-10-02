import { NextResponse } from 'next/server';
import {
	getLanguage,
	setLanguage,
	type SupportedLanguage,
} from '@/lib/i18n/language';

export async function GET() {
	try {
		const language = getLanguage();
		return NextResponse.json({ language });
	} catch (error) {
		console.error('Error getting language:', error);
		return NextResponse.json({ language: 'en' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const { language } = await request.json();

		if (!language || typeof language !== 'string') {
			return NextResponse.json(
				{ error: 'Language is required' },
				{ status: 400 }
			);
		}

		setLanguage(language as SupportedLanguage);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error setting language:', error);
		return NextResponse.json(
			{ error: 'Failed to set language' },
			{ status: 500 }
		);
	}
}
