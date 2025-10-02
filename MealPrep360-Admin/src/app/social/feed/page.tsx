'use client';

import { useEffect, useState } from 'react';
import {
	Box,
	Container,
	Typography,
	Card,
	CardContent,
	CardActions,
	IconButton,
	TextField,
	Button,
} from '@mui/material';
import { ThumbUp, Comment, Share, EmojiEmotions } from '@mui/icons-material';
import { socialService } from '@/lib/socialService';
import { SocialPost, SocialFeedFilters } from '@/types/social';

export default function SocialFeed() {
	const [posts, setPosts] = useState<SocialPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState<SocialFeedFilters>({
		sortBy: 'recent',
	});

	useEffect(() => {
		loadPosts();
	}, [filters]);

	const loadPosts = async () => {
		try {
			const feedPosts = await socialService.getSocialFeed(filters);
			setPosts(feedPosts);
		} catch (error) {
			console.error('Failed to load posts:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleReaction = async (
		postId: string,
		type: 'like' | 'freeze' | 'heart' | 'salad'
	) => {
		try {
			await socialService.addReaction(postId, {
				userId: 'current-user-id', // This should come from your auth context
				type,
			});
			loadPosts(); // Reload to get updated reactions
		} catch (error) {
			console.error('Failed to add reaction:', error);
		}
	};

	const handleComment = async (postId: string, content: string) => {
		try {
			await socialService.addComment(postId, {
				userId: 'current-user-id', // This should come from your auth context
				content,
			});
			loadPosts(); // Reload to get updated comments
		} catch (error) {
			console.error('Failed to add comment:', error);
		}
	};

	if (loading) {
		return (
			<Container>
				<Typography>Loading...</Typography>
			</Container>
		);
	}

	return (
		<Container
			maxWidth='md'
			sx={{ py: 4 }}
		>
			<Box sx={{ mb: 4 }}>
				<Typography
					variant='h4'
					component='h1'
					gutterBottom
				>
					Social Feed
				</Typography>
				<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
					<Button
						variant={filters.sortBy === 'recent' ? 'contained' : 'outlined'}
						onClick={() => setFilters({ ...filters, sortBy: 'recent' })}
					>
						Recent
					</Button>
					<Button
						variant={filters.sortBy === 'popular' ? 'contained' : 'outlined'}
						onClick={() => setFilters({ ...filters, sortBy: 'popular' })}
					>
						Popular
					</Button>
				</Box>
			</Box>

			{posts.map((post) => (
				<Card
					key={post.id}
					sx={{ mb: 3 }}
				>
					<CardContent>
						<Typography
							variant='h6'
							gutterBottom
						>
							{post.type === 'recipe' ? 'Recipe Share' : 'Meal Plan Share'}
						</Typography>
						<Typography variant='body1'>{post.caption}</Typography>
					</CardContent>
					<CardActions>
						<IconButton onClick={() => handleReaction(post.id, 'like')}>
							<ThumbUp />
						</IconButton>
						<IconButton onClick={() => handleReaction(post.id, 'freeze')}>
							<EmojiEmotions />
						</IconButton>
						<IconButton>
							<Comment />
						</IconButton>
						<IconButton>
							<Share />
						</IconButton>
					</CardActions>
					<Box sx={{ p: 2 }}>
						<TextField
							fullWidth
							placeholder='Add a comment...'
							variant='outlined'
							size='small'
							onKeyPress={(e) => {
								if (e.key === 'Enter') {
									handleComment(post.id, (e.target as HTMLInputElement).value);
									(e.target as HTMLInputElement).value = '';
								}
							}}
						/>
					</Box>
				</Card>
			))}
		</Container>
	);
}
