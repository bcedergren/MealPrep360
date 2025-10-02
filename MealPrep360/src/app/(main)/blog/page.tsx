'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container, Typography, Grid } from '@mui/material';
import BlogPostCard from '../../components/blog/blog-post-card';
import { LoadingBlogPosts } from '../../components/blog/loading-blog-posts';

interface Category {
	name: string;
	count: number;
}

interface Tag {
	name: string;
	count: number;
}

interface BlogPost {
	id: string;
	title: string;
	excerpt: string;
	category: string;
	tags: string[];
	imageUrl: string;
	author: {
		name: string;
		image: string;
	};
	publishedAt: string;
	readTime: number;
	views: number;
	likes: number;
}

// Mock data for now - replace with actual data fetching
const posts: BlogPost[] = [
	{
		id: '1',
		title: 'Getting Started with Meal Prep',
		excerpt: 'Learn the basics of meal preparation and how to get started...',
		category: 'Food',
		tags: ['meal prep', 'cooking', 'beginners'],
		imageUrl: '/images/blog/meal-prep-basics.jpg',
		author: {
			name: 'John Doe',
			image: '/images/authors/john-doe.jpg',
		},
		publishedAt: '2024-03-20',
		readTime: 5,
		views: 120,
		likes: 15,
	},
	// Add more mock posts as needed
];

export default function BlogPage() {
	const handleLike = (postId: string) => {
		// Implement like functionality
	};

	const handleShare = (postId: string) => {
		// Implement share functionality
	};

	return (
		<Container
			maxWidth='lg'
			sx={{ py: 4 }}
		>
			<Typography
				variant='h2'
				component='h1'
				gutterBottom
			>
				Blog
			</Typography>
			<Suspense fallback={<LoadingBlogPosts />}>
				<Grid
					container
					spacing={4}
				>
					{posts.map((post) => (
						<Grid
							item
							xs={12}
							md={6}
							lg={4}
							key={post.id}
						>
							<BlogPostCard
								post={post}
								onLike={() => handleLike(post.id)}
								onShare={() => handleShare(post.id)}
							/>
						</Grid>
					))}
				</Grid>
			</Suspense>
		</Container>
	);
}
