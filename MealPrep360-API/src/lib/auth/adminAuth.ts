import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { AdminUser } from '@/lib/mongodb/schemas';

export interface IAdminUser {
	clerkId: string;
	email: string;
	displayName: string;
	role: 'admin' | 'moderator';
	permissions: {
		canManageUsers: boolean;
		canModerateContent: boolean;
		canViewAnalytics: boolean;
		canManageSystem: boolean;
	};
	lastLogin: Date;
	createdAt: Date;
}

export async function adminAuth(
	requiredPermission?: keyof IAdminUser['permissions']
) {
	try {
		const { userId } = await auth();

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

/**
 * Middleware to check if user is admin (any role)
 */
export async function requireAdmin() {
	return adminAuth();
}

/**
 * Middleware to check if user has specific permission
 */
export async function requirePermission(
	permission: keyof IAdminUser['permissions']
) {
	return adminAuth(permission);
}

/**
 * Get current admin user details
 */
export async function getCurrentAdmin() {
	try {
		const { userId } = await auth();
		if (!userId) return null;

		await connectDB();
		const adminUser = await AdminUser.findOne({ clerkId: userId });
		return adminUser;
	} catch (error) {
		console.error('Error getting current admin:', error);
		return null;
	}
}
