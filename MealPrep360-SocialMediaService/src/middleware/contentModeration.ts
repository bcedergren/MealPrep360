import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { moderateContent } from '@/lib/moderation';

export async function contentModerationMiddleware(
	request: NextRequest
): Promise<NextResponse | null> {
	// Only check POST and PUT requests
	if (!['POST', 'PUT'].includes(request.method)) {
		return null;
	}

	// Only check specific content types
	const contentType = request.headers.get('content-type');
	if (!contentType?.includes('application/json')) {
		return null;
	}

	try {
		const body = await request.clone().json();

		// Check content fields that need moderation
		const contentFields = ['content', 'description', 'title', 'comment'];
		const contentToModerate = contentFields
			.map((field) => body[field])
			.filter(Boolean)
			.join(' ');

		if (!contentToModerate) {
			return null;
		}

		const moderationResult = moderateContent(contentToModerate);

		if (!moderationResult.isAppropriate) {
			return NextResponse.json(
				{
					error: 'Content moderation failed',
					reason: moderationResult.reason,
				},
				{ status: 400 }
			);
		}

		return null;
	} catch (error) {
		console.error('Content moderation error:', error);
		return null;
	}
}
