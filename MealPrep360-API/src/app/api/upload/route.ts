import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Reduced from 300 to 60 seconds

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

/**
 * @swagger
 * /api/upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload an image file
 *     description: Uploads an image file to the server with size and type validation
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB, images only)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL of the uploaded image
 *                   example: "/uploads/upload-1234567890.png"
 *       400:
 *         description: Invalid file or missing file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   enum:
 *                     - "File is required"
 *                     - "File size must be less than 5MB"
 *                     - "File must be an image"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to upload image"
 *                 details:
 *                   type: string
 *                   description: Error details
 */
export async function POST(req: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await req.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'File is required' }, { status: 400 });
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: 'File size must be less than 5MB' },
				{ status: 400 }
			);
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			return NextResponse.json(
				{ error: 'File must be an image' },
				{ status: 400 }
			);
		}

		// Create a unique filename
		const timestamp = Date.now();
		const extension = file.type.split('/')[1] || 'png';
		const filename = `upload-${timestamp}.${extension}`;

		// Ensure the uploads directory exists
		const uploadsDir = join(process.cwd(), 'public', 'uploads');
		await mkdir(uploadsDir, { recursive: true });

		// Save the file to the public/uploads directory
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		const path = join(uploadsDir, filename);

		// Write file with timeout
		await Promise.race([
			writeFile(path, buffer),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('File upload timed out')), 50000)
			),
		]);

		// Return the image URL
		const imageUrl = `/uploads/${filename}`;
		return NextResponse.json({ url: imageUrl });
	} catch (error) {
		console.error('Error uploading image:', error);
		return NextResponse.json(
			{
				error: 'Failed to upload image',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
