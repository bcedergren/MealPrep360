'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
	Box,
	Container,
	Typography,
	Avatar,
	Button,
	Grid,
	Card,
	CardContent,
	Chip,
	Divider,
} from '@mui/material';
import { socialService } from '@/lib/socialService';
import { UserProfile } from '@/types/social';

export default function UserProfilePage() {
	const { userId } = useParams();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [isFollowing, setIsFollowing] = useState(false);

	useEffect(() => {
		loadProfile();
	}, [userId]);

	const loadProfile = async () => {
		try {
			const userProfile = await socialService.getUserProfile(userId as string);
			setProfile(userProfile);
			// TODO: Check if current user is following this user
			setIsFollowing(false);
		} catch (error) {
			console.error('Failed to load profile:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleFollowToggle = async () => {
		if (!profile) return;

		try {
			if (isFollowing) {
				await socialService.unfollowUser('current-user-id', profile.id);
			} else {
				await socialService.followUser('current-user-id', profile.id);
			}
			setIsFollowing(!isFollowing);
			loadProfile(); // Reload to get updated follower count
		} catch (error) {
			console.error('Failed to toggle follow:', error);
		}
	};

	if (loading) {
		return (
			<Container>
				<Typography>Loading...</Typography>
			</Container>
		);
	}

	if (!profile) {
		return (
			<Container>
				<Typography>Profile not found</Typography>
			</Container>
		);
	}

	return (
		<Container
			maxWidth='md'
			sx={{ py: 4 }}
		>
			<Box sx={{ mb: 4 }}>
				<Grid
					container
					spacing={3}
					alignItems='center'
				>
					<Grid item>
						<Avatar
							src={profile.profilePicture}
							alt={profile.displayName}
							sx={{ width: 120, height: 120 }}
						/>
					</Grid>
					<Grid
						item
						xs
					>
						<Typography
							variant='h4'
							component='h1'
							gutterBottom
						>
							{profile.displayName}
						</Typography>
						<Typography
							variant='body1'
							color='text.secondary'
							paragraph
						>
							{profile.bio}
						</Typography>
						<Button
							variant={isFollowing ? 'outlined' : 'contained'}
							onClick={handleFollowToggle}
						>
							{isFollowing ? 'Unfollow' : 'Follow'}
						</Button>
					</Grid>
				</Grid>
			</Box>

			<Grid
				container
				spacing={3}
				sx={{ mb: 4 }}
			>
				<Grid
					item
					xs={12}
					sm={4}
				>
					<Card>
						<CardContent>
							<Typography
								variant='h6'
								gutterBottom
							>
								Stats
							</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								<Typography>
									Followers: {profile.stats.followersCount}
								</Typography>
								<Typography>
									Following: {profile.stats.followingCount}
								</Typography>
								<Typography>
									Meals Prepped: {profile.stats.mealsPreppedCount}
								</Typography>
								<Typography>
									Recipes Shared: {profile.stats.recipesSharedCount}
								</Typography>
							</Box>
						</CardContent>
					</Card>
				</Grid>

				<Grid
					item
					xs={12}
					sm={8}
				>
					<Card>
						<CardContent>
							<Typography
								variant='h6'
								gutterBottom
							>
								Badges
							</Typography>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
								{profile.badges.map((badge) => (
									<Chip
										key={badge.id}
										label={badge.name}
										title={badge.description}
										sx={{ m: 0.5 }}
									/>
								))}
							</Box>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			<Divider sx={{ my: 4 }} />

			<Typography
				variant='h5'
				gutterBottom
			>
				Privacy Settings
			</Typography>
			<Grid
				container
				spacing={2}
			>
				<Grid
					item
					xs={12}
					sm={6}
				>
					<Card>
						<CardContent>
							<Typography
								variant='subtitle1'
								gutterBottom
							>
								Profile Visibility
							</Typography>
							<Typography
								variant='body2'
								color='text.secondary'
							>
								{profile.privacySettings.isProfilePublic
									? 'Public Profile'
									: 'Private Profile'}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
				>
					<Card>
						<CardContent>
							<Typography
								variant='subtitle1'
								gutterBottom
							>
								Meal Plan Sharing
							</Typography>
							<Typography
								variant='body2'
								color='text.secondary'
							>
								{profile.privacySettings.isMealPlanPublic
									? 'Public Meal Plans'
									: 'Private Meal Plans'}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Container>
	);
}
