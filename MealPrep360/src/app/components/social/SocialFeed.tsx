'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Post {
	id: string;
	type: 'recipe' | 'mealPlan' | 'achievement' | 'text';
	content: string;
	mediaUrls: string[];
	hashtags: string[];
	createdAt: string;
	profile: {
		user: {
			name: string;
			image: string;
		};
	};
	_count: {
		likes: number;
		comments: number;
	};
}

interface FeedResponse {
	posts: Post[];
	total: number;
	hasMore: boolean;
}

export default function SocialFeed() {
	const [ref, inView] = useInView();
	const [page, setPage] = useState(1);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery<FeedResponse>({
			queryKey: ['social-feed'],
			queryFn: async ({ pageParam = 1 }) => {
				const res = await fetch(`/api/social/posts?page=${pageParam}&limit=10`);
				const data = await res.json();
				return data;
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.hasMore) {
					return lastPage.posts.length / 10 + 1;
				}
				return undefined;
			},
		});

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	if (status === 'pending') {
		return <div className='flex justify-center p-8'>Loading...</div>;
	}

	if (status === 'error') {
		return (
			<div className='flex justify-center p-8 text-red-500'>
				Error loading feed
			</div>
		);
	}

	return (
		<div className='max-w-2xl mx-auto p-4'>
			{data?.pages.map((page, i) => (
				<div
					key={i}
					className='space-y-6'
				>
					{page.posts.map((post: Post) => (
						<div
							key={post.id}
							className='bg-white rounded-lg shadow p-4'
						>
							<div className='flex items-center space-x-3 mb-4'>
								<Image
									src={post.profile.user.image || '/default-avatar.png'}
									alt={post.profile.user.name || 'User'}
									width={40}
									height={40}
									className='rounded-full'
								/>
								<div>
									<p className='font-semibold'>{post.profile.user.name}</p>
									<p className='text-sm text-gray-500'>
										{formatDistanceToNow(new Date(post.createdAt), {
											addSuffix: true,
										})}
									</p>
								</div>
							</div>

							<div className='mb-4'>
								<p className='text-gray-800'>{post.content}</p>
								{post.mediaUrls.length > 0 && (
									<div className='mt-2 grid grid-cols-2 gap-2'>
										{post.mediaUrls.map((url, i) => (
											<Image
												key={i}
												src={url}
												alt={`Post media ${i + 1}`}
												width={300}
												height={300}
												className='rounded-lg object-cover'
											/>
										))}
									</div>
								)}
								{post.hashtags.length > 0 && (
									<div className='mt-2 flex flex-wrap gap-2'>
										{post.hashtags.map((tag) => (
											<Link
												key={tag}
												href={`/social/tags/${tag}`}
												className='text-blue-500 hover:underline'
											>
												#{tag}
											</Link>
										))}
									</div>
								)}
							</div>

							<div className='flex items-center space-x-6 text-gray-500'>
								<button className='flex items-center space-x-1 hover:text-red-500'>
									<Heart className='w-5 h-5' />
									<span>{post._count.likes}</span>
								</button>
								<button className='flex items-center space-x-1 hover:text-blue-500'>
									<MessageCircle className='w-5 h-5' />
									<span>{post._count.comments}</span>
								</button>
								<button className='flex items-center space-x-1 hover:text-green-500'>
									<Share2 className='w-5 h-5' />
								</button>
							</div>
						</div>
					))}
				</div>
			))}

			<div
				ref={ref}
				className='h-10'
			>
				{isFetchingNextPage && (
					<div className='flex justify-center p-4'>Loading more...</div>
				)}
			</div>
		</div>
	);
}
