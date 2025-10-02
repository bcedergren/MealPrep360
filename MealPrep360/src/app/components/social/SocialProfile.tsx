'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { Edit2, MapPin, Globe, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SocialProfileProps {
	userId?: string;
}

export default function SocialProfile({ userId }: SocialProfileProps) {
	const { user } = useUser();
	const queryClient = useQueryClient();
	const [isEditing, setIsEditing] = useState(false);
	const [profile, setProfile] = useState({
		bio: '',
		location: '',
		website: '',
		socialLinks: {},
		privacySettings: {
			profileVisibility: 'public',
			showMealPlans: false,
			showSavedRecipes: false,
		},
	});

	const { data, isLoading } = useQuery({
		queryKey: ['social-profile', userId || user?.id],
		queryFn: async () => {
			const res = await fetch(`/api/social/profile?id=${userId || user?.id}`);
			const data = await res.json();
			setProfile(data);
			return data;
		},
		enabled: !!user,
	});

	const updateProfileMutation = useMutation({
		mutationFn: async (updatedProfile: typeof profile) => {
			const res = await fetch('/api/social/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedProfile),
			});
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['social-profile', userId || user?.id],
			});
			setIsEditing(false);
		},
	});

	const followMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch('/api/social/follow', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetUserId: userId }),
			});
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['social-profile', userId || user?.id],
			});
		},
	});

	const unfollowMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/social/follow?targetUserId=${userId}`, {
				method: 'DELETE',
			});
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['social-profile', userId || user?.id],
			});
		},
	});

	if (isLoading || !data) {
		return <div className='flex justify-center p-8'>Loading...</div>;
	}

	const isOwnProfile = !userId || userId === user?.id;

	return (
		<div className='max-w-2xl mx-auto p-4'>
			<div className='bg-white rounded-lg shadow p-6'>
				<div className='flex items-start justify-between mb-6'>
					<div className='flex items-center space-x-4'>
						<Image
							src={data.user.image || '/default-avatar.png'}
							alt={data.user.name || 'User'}
							width={96}
							height={96}
							className='rounded-full'
						/>
						<div>
							<h1 className='text-2xl font-bold'>{data.user.name}</h1>
							{isOwnProfile ? (
								<button
									onClick={() => setIsEditing(!isEditing)}
									className='text-blue-500 hover:text-blue-600 flex items-center space-x-1'
								>
									<Edit2 className='w-4 h-4' />
									<span>Edit Profile</span>
								</button>
							) : (
								<button
									onClick={() =>
										data.isFollowing
											? unfollowMutation.mutate()
											: followMutation.mutate()
									}
									className={`px-4 py-2 rounded ${
										data.isFollowing
											? 'bg-gray-200 hover:bg-gray-300'
											: 'bg-blue-500 text-white hover:bg-blue-600'
									}`}
								>
									{data.isFollowing ? 'Unfollow' : 'Follow'}
								</button>
							)}
						</div>
					</div>
				</div>

				{isEditing ? (
					<div className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Bio
							</label>
							<textarea
								value={profile.bio}
								onChange={(e) =>
									setProfile({ ...profile, bio: e.target.value })
								}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
								rows={3}
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Location
							</label>
							<input
								type='text'
								value={profile.location}
								onChange={(e) =>
									setProfile({ ...profile, location: e.target.value })
								}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Website
							</label>
							<input
								type='url'
								value={profile.website}
								onChange={(e) =>
									setProfile({ ...profile, website: e.target.value })
								}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
							/>
						</div>
						<div className='flex justify-end space-x-2'>
							<button
								onClick={() => setIsEditing(false)}
								className='px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200'
							>
								Cancel
							</button>
							<button
								onClick={() => updateProfileMutation.mutate(profile)}
								className='px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600'
							>
								Save Changes
							</button>
						</div>
					</div>
				) : (
					<div className='space-y-4'>
						{profile.bio && <p className='text-gray-700'>{profile.bio}</p>}
						<div className='flex flex-wrap gap-4 text-sm text-gray-500'>
							{profile.location && (
								<div className='flex items-center space-x-1'>
									<MapPin className='w-4 h-4' />
									<span>{profile.location}</span>
								</div>
							)}
							{profile.website && (
								<div className='flex items-center space-x-1'>
									<Globe className='w-4 h-4' />
									<a
										href={profile.website}
										target='_blank'
										rel='noopener noreferrer'
										className='hover:text-blue-500'
									>
										{profile.website}
									</a>
								</div>
							)}
							{Object.entries(profile.socialLinks || {}).map(
								([platform, url]) => (
									<div
										key={platform}
										className='flex items-center space-x-1'
									>
										<LinkIcon className='w-4 h-4' />
										<a
											href={url as string}
											target='_blank'
											rel='noopener noreferrer'
											className='hover:text-blue-500'
										>
											{platform}
										</a>
									</div>
								)
							)}
						</div>
					</div>
				)}

				<div className='mt-6 pt-6 border-t'>
					<div className='grid grid-cols-3 gap-4 text-center'>
						<div>
							<p className='text-2xl font-bold'>{data._count.posts}</p>
							<p className='text-gray-500'>Posts</p>
						</div>
						<div>
							<p className='text-2xl font-bold'>{data._count.followers}</p>
							<p className='text-gray-500'>Followers</p>
						</div>
						<div>
							<p className='text-2xl font-bold'>{data._count.following}</p>
							<p className='text-gray-500'>Following</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
