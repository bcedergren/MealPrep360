import { NextResponse, NextRequest } from 'next/server';
import { Recipe } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Validate ObjectId format before attempting to query
		const objectIdPattern = /^[0-9a-fA-F]{24}$/;
		if (!objectIdPattern.test(params.id)) {
			return NextResponse.json({
				imageUrl: '/images/recipe-placeholder.png',
			});
		}

		await connectDB();

		// Only fetch the image fields
		const recipe: any = await Recipe.findById(params.id)
			.select('imageUrl images.main')
			.lean();

		const imageUrl =
			recipe?.imageUrl ||
			recipe?.images?.main ||
			'/images/recipe-placeholder.png';

		// Return JSON response with image URL instead of redirect
		const response = NextResponse.json({ imageUrl });

		// Set appropriate cache headers
		response.headers.set(
			'Cache-Control',
			'public, max-age=3600, stale-while-revalidate=7200'
		);

		return response;
	} catch (error) {
		console.error('Error fetching recipe image:', error);

		// Return placeholder on error
		return NextResponse.json({
			imageUrl: '/images/recipe-placeholder.png',
		});
	}
}
