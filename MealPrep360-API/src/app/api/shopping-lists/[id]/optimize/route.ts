import { NextRequest, NextResponse } from 'next/server';
import { Container } from '@/lib/container/Container';
import { IShoppingListService } from '@/lib/shopping/interfaces/IShoppingListService';
import { ErrorService } from '@/lib/core/errors/ErrorService';
import { auth } from '@clerk/nextjs/server';
import { UnauthorizedError } from '@/lib/core/errors/ServiceError';

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			throw new UnauthorizedError();
		}

		const container = await Container.getInstance();
		const shoppingListService = container.getService<IShoppingListService>(
			'shoppingListService'
		);

		const options = await request.json();
		const optimizedList = await shoppingListService.optimizeList(
			params.id,
			userId,
			options
		);

		return NextResponse.json(optimizedList);
	} catch (error) {
		return ErrorService.handle(error as Error);
	}
}
