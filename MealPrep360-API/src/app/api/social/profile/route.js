import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SocialProfile } from '@/models';

// GET /api/social/profile
export async function GET(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const profile = await SocialProfile.findOne({ userId });
		if (!profile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		return NextResponse.json(profile);
	} catch (error) {
		console.error('Error fetching profile:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// PUT /api/social/profile
export async function PUT(req) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const { bio, location, website, socialLinks, privacySettings } = body;

		const profile = await SocialProfile.findOneAndUpdate(
			{ userId },
			{
				bio,
				location,
				website,
				socialLinks,
				privacySettings,
			},
			{ new: true, upsert: true }
		);

		return NextResponse.json(profile);
	} catch (error) {
		console.error('Error updating profile:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
