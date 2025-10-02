'use client';

import {
	Card,
	CardContent,
	CardMedia,
	Typography,
	Box,
	Chip,
	Avatar,
	IconButton,
	CardActionArea,
} from '@mui/material';
import { Favorite, FavoriteBorder, Share } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface BlogPostCardProps {
	post: {
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
	};
	onLike: () => void;
	onShare: () => void;
	isLiked?: boolean;
}

export default function BlogPostCard({
	post,
	onLike,
	onShare,
	isLiked = false,
}: BlogPostCardProps) {
	return (
		<Card
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				transition: 'transform 0.2s',
				'&:hover': {
					transform: 'translateY(-4px)',
				},
			}}
		>
			<CardActionArea
				component={Link}
				href={`/blog/${post.id}`}
				sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
			>
				<CardMedia
					component='img'
					height={200}
					image={post.imageUrl}
					alt={post.title}
					sx={{ objectFit: 'cover' }}
				/>
				<CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
					<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
						<Chip
							label={post.category}
							color='primary'
							size='small'
						/>
						{post.tags.slice(0, 2).map((tag) => (
							<Chip
								key={tag}
								label={tag}
								variant='outlined'
								size='small'
							/>
						))}
					</Box>

					<Typography
						variant='h6'
						component='h2'
						gutterBottom
						sx={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
						}}
					>
						{post.title}
					</Typography>

					<Typography
						variant='body2'
						color='text.secondary'
						sx={{
							mb: 2,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							display: '-webkit-box',
							WebkitLineClamp: 3,
							WebkitBoxOrient: 'vertical',
						}}
					>
						{post.excerpt}
					</Typography>

					<Box
						sx={{
							mt: 'auto',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Avatar
								src={post.author.image}
								alt={post.author.name}
								sx={{ width: 24, height: 24 }}
							/>
							<Typography
								variant='body2'
								color='text.secondary'
							>
								{post.author.name}
							</Typography>
						</Box>

						<Typography
							variant='body2'
							color='text.secondary'
						>
							{formatDistanceToNow(new Date(post.publishedAt), {
								addSuffix: true,
							})}
							{' • '}
							{post.readTime} min read
						</Typography>
					</Box>
				</CardContent>
			</CardActionArea>

			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					p: 1,
					borderTop: 1,
					borderColor: 'divider',
				}}
			>
				<IconButton
					size='small'
					onClick={onLike}
					color={isLiked ? 'primary' : 'default'}
				>
					{isLiked ? <Favorite /> : <FavoriteBorder />}
				</IconButton>
				<Typography
					variant='body2'
					color='text.secondary'
				>
					{post.likes}
				</Typography>

				<IconButton
					size='small'
					onClick={onShare}
				>
					<Share />
				</IconButton>
			</Box>
		</Card>
	);
}
