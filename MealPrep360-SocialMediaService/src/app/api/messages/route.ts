import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Container } from '../../../di/container';
import { MessageServiceToken } from '../../../di/tokens';
import { AppError } from '../../../lib/errorHandler';

export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { recipientId, content } = await request.json();
		if (!recipientId || !content) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		const messageService = Container.get(MessageServiceToken);
		const message = await messageService.sendMessage(
			userId,
			recipientId,
			content
		);

		return NextResponse.json(message, { status: 201 });
	} catch (error) {
		if (error instanceof AppError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.statusCode }
			);
		}
		console.error('Error sending message:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
