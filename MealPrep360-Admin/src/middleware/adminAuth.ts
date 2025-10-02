import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { AdminUser, IAdminUser } from '@/models/AdminUser';
import connectDB from '@/lib/db';

export async function adminAuth(
	requiredPermission?: keyof IAdminUser['permissions']
) {
	try {
		const { userId } = auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const adminUser = await AdminUser.findOne({ clerkId: userId });

		if (!adminUser) {
			return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
		}

		if (requiredPermission && !adminUser.hasPermission(requiredPermission)) {
			return NextResponse.json(
				{ error: 'Insufficient permissions' },
				{ status: 403 }
			);
		}

		// Update last login
		await adminUser.updateLastLogin();

		return null; // Continue with the request
	} catch (error) {
		console.error('Admin auth error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
