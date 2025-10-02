import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User, TwoFactorAuth } from '@/lib/mongodb/schemas';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * @swagger
 * /api/security/2fa:
 *   post:
 *     tags:
 *       - Security
 *     summary: Manage two-factor authentication
 *     description: Setup, verify, or disable two-factor authentication for the user
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [setup, verify, disable]
 *                 description: Action to perform
 *               token:
 *                 type: string
 *                 description: TOTP token (required for verify action)
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Action completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     secret:
 *                       type: string
 *                       description: Base32 secret for setup
 *                     qrCode:
 *                       type: string
 *                       description: QR code data URL for setup
 *                   description: Response for setup action
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                   description: Response for verify/disable actions
 *       400:
 *         description: Bad request
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               enum:
 *                 - "2FA not set up"
 *                 - "Invalid token"
 *                 - "Invalid action"
 *       401:
 *         description: Unauthorized
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unauthorized"
 *       404:
 *         description: User not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */
export async function POST(request: NextRequest) {
	try {
		const { userId } = getAuth(request);
		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await connectDB();
		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return new NextResponse('User not found', { status: 404 });
		}

		const { action, token } = await request.json();

		switch (action) {
			case 'setup':
				// Generate a new secret
				const secret = speakeasy.generateSecret({
					name: `MealPrep360:${userId}`,
				});

				// Store the secret temporarily
				await TwoFactorAuth.findOneAndUpdate(
					{ userId: user._id },
					{
						secret: secret.base32,
						verified: false,
						updatedAt: new Date(),
					},
					{ upsert: true, new: true }
				);

				// Generate QR code
				const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

				return NextResponse.json({
					secret: secret.base32,
					qrCode,
				});

			case 'verify':
				const twoFactorAuth = await TwoFactorAuth.findOne({ userId: user._id });

				if (!twoFactorAuth) {
					return new NextResponse('2FA not set up', { status: 400 });
				}

				const verified = speakeasy.totp.verify({
					secret: twoFactorAuth.secret,
					encoding: 'base32',
					token,
				});

				if (verified) {
					await TwoFactorAuth.findByIdAndUpdate(twoFactorAuth._id, {
						verified: true,
						updatedAt: new Date(),
					});
					return NextResponse.json({ success: true });
				} else {
					return new NextResponse('Invalid token', { status: 400 });
				}

			case 'disable':
				await TwoFactorAuth.findOneAndDelete({ userId: user._id });
				return NextResponse.json({ success: true });

			default:
				return new NextResponse('Invalid action', { status: 400 });
		}
	} catch (error) {
		console.error('Error managing 2FA:', error);
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export const dynamic = 'force-dynamic';
