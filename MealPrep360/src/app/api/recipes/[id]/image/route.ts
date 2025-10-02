import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/firebase/config';
import {
	ref,
	uploadBytes,
	getDownloadURL,
	deleteObject,
} from 'firebase/storage';
import connectDB from '@/lib/mongodb/connection';
import { Recipe } from '@/lib/mongodb/schemas';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// POST /api/recipes/[id]/image - Upload recipe image
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get the form data from the request
		const formData = await request.formData();
		const image = formData.get('image') as File;

		if (!image) {
			return NextResponse.json({ error: 'No image provided' }, { status: 400 });
		}

		// Validate file type
		const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!validTypes.includes(image.type)) {
			return NextResponse.json(
				{
					error:
						'Invalid file type. Only JPEG, PNG and WebP images are allowed.',
				},
				{ status: 400 }
			);
		}

		// Validate file size (5MB limit)
		const maxSize = 5 * 1024 * 1024; // 5MB in bytes
		if (image.size > maxSize) {
			return NextResponse.json(
				{ error: 'File too large. Maximum size is 5MB.' },
				{ status: 400 }
			);
		}

		try {
			await connectDB();

			// Find recipe by ID
			const recipe = await Recipe.findById(params.id);
			if (!recipe) {
				return NextResponse.json(
					{ error: 'Recipe not found' },
					{ status: 404 }
				);
			}

			// Delete old image if it exists
			if (recipe.imageStoragePath) {
				try {
					const oldImageRef = ref(storage, recipe.imageStoragePath);
					await deleteObject(oldImageRef);
				} catch (error) {
					console.error('Error deleting old image:', error);
					// Continue even if old image deletion fails
				}
			}

			// Generate unique storage path
			const timestamp = Date.now();
			const extension = image.name.split('.').pop();
			const storagePath = `recipes/${userId}/${params.id}/${timestamp}.${extension}`;

			// Upload new image
			const imageRef = ref(storage, storagePath);
			const arrayBuffer = await image.arrayBuffer();
			const bytes = new Uint8Array(arrayBuffer);
			await uploadBytes(imageRef, bytes, {
				contentType: image.type,
			});

			// Get download URL
			const downloadUrl = await getDownloadURL(imageRef);

			// Update recipe with new image info
			recipe.imageUrl = downloadUrl;
			recipe.imageStoragePath = storagePath;
			recipe.imageType = 'uploaded';
			recipe.hasImage = true;
			recipe.updatedAt = new Date();
			await recipe.save();

			return NextResponse.json({
				imageUrl: downloadUrl,
				message: 'Image uploaded successfully',
			});
		} catch (dbError) {
			console.error('Database operation failed:', dbError);
			return NextResponse.json(
				{ error: 'Failed to update recipe image' },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Error uploading image:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// DELETE /api/recipes/[id]/image - Delete recipe image
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		try {
			await connectDB();

			// Find recipe by ID
			const recipe = await Recipe.findById(params.id);
			if (!recipe) {
				return NextResponse.json(
					{ error: 'Recipe not found' },
					{ status: 404 }
				);
			}

			// Delete image from storage if it exists
			if (recipe.imageStoragePath) {
				try {
					const imageRef = ref(storage, recipe.imageStoragePath);
					await deleteObject(imageRef);
				} catch (error) {
					console.error('Error deleting image from storage:', error);
					// Continue even if storage deletion fails
				}
			}

			// Update recipe
			recipe.imageUrl = '';
			recipe.imageStoragePath = '';
			recipe.imageType = 'url';
			recipe.hasImage = false;
			recipe.updatedAt = new Date();
			await recipe.save();

			return NextResponse.json({
				message: 'Image deleted successfully',
			});
		} catch (dbError) {
			console.error('Database operation failed:', dbError);
			return NextResponse.json(
				{ error: 'Failed to delete recipe image' },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Error deleting image:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
