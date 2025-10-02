import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

/**
 * @swagger
 * /api/admin/media/files:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List uploaded media files (Admin only)
 *     description: Retrieves a list of all uploaded media files with metadata
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, images, documents]
 *         description: Filter by file type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, size, date]
 *           default: date
 *         description: Sort files by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of files per page
 *     responses:
 *       200:
 *         description: Media files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       path:
 *                         type: string
 *                       url:
 *                         type: string
 *                       size:
 *                         type: number
 *                       type:
 *                         type: string
 *                       lastModified:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     current:
 *                       type: number
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: number
 *                     totalSize:
 *                       type: number
 *                     imageFiles:
 *                       type: number
 *                     documentFiles:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: Request) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get('type') || 'all';
		const sortBy = searchParams.get('sortBy') || 'date';
		const sortOrder = searchParams.get('sortOrder') || 'desc';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '50');
		const skip = (page - 1) * limit;

		const uploadsDir = join(process.cwd(), 'public', 'uploads');

		try {
			const fileNames = await readdir(uploadsDir);
			const filePromises = fileNames.map(async (fileName) => {
				const filePath = join(uploadsDir, fileName);
				const stats = await stat(filePath);

				const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
				const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
				const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'csv'];

				let fileType = 'other';
				if (imageExtensions.includes(fileExtension)) {
					fileType = 'image';
				} else if (documentExtensions.includes(fileExtension)) {
					fileType = 'document';
				}

				return {
					name: fileName,
					path: filePath,
					url: `/uploads/${fileName}`,
					size: stats.size,
					type: fileType,
					extension: fileExtension,
					lastModified: stats.mtime.toISOString(),
					isFile: stats.isFile(),
				};
			});

			let files = await Promise.all(filePromises);

			// Filter out directories
			files = files.filter((file) => file.isFile);

			// Filter by type
			if (type !== 'all') {
				if (type === 'images') {
					files = files.filter((file) => file.type === 'image');
				} else if (type === 'documents') {
					files = files.filter((file) => file.type === 'document');
				}
			}

			// Sort files
			files.sort((a, b) => {
				let aVal, bVal;
				switch (sortBy) {
					case 'name':
						aVal = a.name.toLowerCase();
						bVal = b.name.toLowerCase();
						break;
					case 'size':
						aVal = a.size;
						bVal = b.size;
						break;
					case 'date':
					default:
						aVal = new Date(a.lastModified).getTime();
						bVal = new Date(b.lastModified).getTime();
						break;
				}

				if (sortOrder === 'desc') {
					return bVal > aVal ? 1 : -1;
				}
				return aVal > bVal ? 1 : -1;
			});

			// Calculate stats
			const stats = {
				totalFiles: files.length,
				totalSize: files.reduce((sum, file) => sum + file.size, 0),
				imageFiles: files.filter((file) => file.type === 'image').length,
				documentFiles: files.filter((file) => file.type === 'document').length,
				otherFiles: files.filter((file) => file.type === 'other').length,
			};

			// Paginate
			const paginatedFiles = files.slice(skip, skip + limit);

			// Remove sensitive path information from response
			const sanitizedFiles = paginatedFiles.map((file) => ({
				name: file.name,
				url: file.url,
				size: file.size,
				type: file.type,
				extension: file.extension,
				lastModified: file.lastModified,
			}));

			console.log(
				`[Admin] Retrieved ${sanitizedFiles.length} media files (${type})`
			);
			return NextResponse.json({
				files: sanitizedFiles,
				pagination: {
					total: files.length,
					pages: Math.ceil(files.length / limit),
					current: page,
				},
				stats,
			});
		} catch (dirError) {
			// If uploads directory doesn't exist, return empty results
			if ((dirError as any).code === 'ENOENT') {
				return NextResponse.json({
					files: [],
					pagination: {
						total: 0,
						pages: 0,
						current: 1,
					},
					stats: {
						totalFiles: 0,
						totalSize: 0,
						imageFiles: 0,
						documentFiles: 0,
						otherFiles: 0,
					},
				});
			}
			throw dirError;
		}
	} catch (error) {
		console.error('Error listing media files:', error);
		return NextResponse.json(
			{ error: 'Failed to list media files' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/media/files:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete multiple media files (Admin only)
 *     description: Deletes multiple media files from the server
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file names to delete
 *     responses:
 *       200:
 *         description: Files deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deleted:
 *                   type: array
 *                   items:
 *                     type: string
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       file:
 *                         type: string
 *                       error:
 *                         type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request: Request) {
	const authCheck = await adminAuth('canManageSystem');
	if (authCheck) return authCheck;

	try {
		const body = await request.json();
		const { files } = body;

		if (!Array.isArray(files) || files.length === 0) {
			return NextResponse.json(
				{ error: 'Files array is required' },
				{ status: 400 }
			);
		}

		const uploadsDir = join(process.cwd(), 'public', 'uploads');
		const deleted: string[] = [];
		const failed: Array<{ file: string; error: string }> = [];

		for (const fileName of files) {
			try {
				// Validate filename to prevent directory traversal
				if (
					fileName.includes('..') ||
					fileName.includes('/') ||
					fileName.includes('\\')
				) {
					failed.push({ file: fileName, error: 'Invalid filename' });
					continue;
				}

				const filePath = join(uploadsDir, fileName);
				await unlink(filePath);
				deleted.push(fileName);
			} catch (error) {
				failed.push({
					file: fileName,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		console.log(
			`[Admin] Deleted ${deleted.length} media files, ${failed.length} failed`
		);
		return NextResponse.json({
			success: true,
			deleted,
			failed,
			message: `Successfully deleted ${deleted.length} file(s)${
				failed.length > 0 ? `, ${failed.length} failed` : ''
			}`,
		});
	} catch (error) {
		console.error('Error deleting media files:', error);
		return NextResponse.json(
			{ error: 'Failed to delete media files' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
