'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import BlogPostForm from './blog-post-form';
import {
	Box,
	Typography,
	Avatar,
	IconButton,
	Menu,
	MenuItem,
	Chip,
	Button,
	Divider,
	TextField,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
} from '@mui/material';
import {
	MoreVert,
	Favorite,
	FavoriteBorder,
	Share,
	Reply,
} from '@mui/icons-material';

// Define categories if not imported from elsewhere
const categories = ['Category 1', 'Category 2', 'Category 3'];

interface Comment {
	id: string;
	content: string;
	createdAt: string;
	author: {
		name: string;
		image: string;
	};
	replies?: Comment[];
}

interface BlogPostViewerProps {
	post: {
		id: string;
		title: string;
		content: string;
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
		featured: boolean;
		published: boolean;
	};
	comments: Comment[];
	onLike: () => void;
	onComment: (content: string, parentId?: string) => void;
	onShare: () => void;
	isLiked?: boolean;
	isAuthor?: boolean;
	onEdit?: (data: any) => void;
	onDelete?: () => void;
}

export default function BlogPostViewer({
	post,
	comments,
	onLike,
	onComment,
	onShare,
	isLiked = false,
	isAuthor = false,
	onEdit,
	onDelete,
}: BlogPostViewerProps) {
	const [comment, setComment] = useState('');
	const [replyTo, setReplyTo] = useState<string | null>(null);
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const handleComment = (e: React.FormEvent) => {
		e.preventDefault();
		if (comment.trim()) {
			onComment(comment, replyTo || undefined);
			setComment('');
			setReplyTo(null);
		}
	};

	const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
		setMenuAnchor(e.currentTarget);
	};

	const handleMenuClose = () => {
		setMenuAnchor(null);
	};

	const handleEditClick = () => {
		handleMenuClose();
	};

	const handleCloseEditModal = () => {
		setIsEditModalOpen(false);
	};

	const handleSubmitEdit = (data: any) => {
		if (!data) return;
		onEdit?.(data);
		setIsEditModalOpen(false);
	};

	const handleReply = (commentId: string) => {
		setReplyTo(commentId);
	};

	return (
		<Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
			{/* Header */}
			<Box sx={{ mb: 4 }}>
				<Typography
					variant='h3'
					component='h1'
					gutterBottom
				>
					{post.title}
				</Typography>

				<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
					<Avatar
						src={post.author.image}
						alt={post.author.name}
						sx={{ mr: 2 }}
					/>
					<Box>
						<Typography variant='subtitle1'>{post.author.name}</Typography>
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
					{isAuthor && (
						<>
							<IconButton
								onClick={handleMenuOpen}
								sx={{ ml: 'auto' }}
							>
								<MoreVert />
							</IconButton>
							<Menu
								anchorEl={menuAnchor}
								open={Boolean(menuAnchor)}
								onClose={handleMenuClose}
							>
								<MenuItem onClick={handleEditClick}>Edit</MenuItem>
								<MenuItem onClick={onDelete}>Delete</MenuItem>
							</Menu>
						</>
					)}
				</Box>

				<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
					<Chip
						label={post.category}
						color='primary'
					/>
					{post.tags.map((tag) => (
						<Chip
							key={tag}
							label={tag}
							variant='outlined'
						/>
					))}
				</Box>
			</Box>

			{/* Featured Image */}
			{post.imageUrl && (
				<Box
					component='img'
					src={post.imageUrl}
					alt={post.title}
					sx={{
						width: '100%',
						height: 400,
						objectFit: 'cover',
						borderRadius: 2,
						mb: 4,
					}}
				/>
			)}

			{/* Content */}
			<Box
				sx={{
					'& img': {
						maxWidth: '100%',
						height: 'auto',
						borderRadius: 1,
						my: 2,
					},
					'& p': {
						mb: 2,
						lineHeight: 1.8,
					},
					'& h2': {
						mt: 4,
						mb: 2,
					},
					'& h3': {
						mt: 3,
						mb: 2,
					},
					'& ul, & ol': {
						mb: 2,
						pl: 4,
					},
					'& blockquote': {
						borderLeft: 4,
						borderColor: 'primary.main',
						pl: 2,
						py: 1,
						my: 2,
						bgcolor: 'action.hover',
					},
				}}
				dangerouslySetInnerHTML={{ __html: post.content }}
			/>

			{/* Actions */}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 4 }}>
				<Button
					startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
					onClick={onLike}
					color={isLiked ? 'primary' : 'inherit'}
				>
					{post.likes}
				</Button>
				<Button
					startIcon={<Share />}
					onClick={onShare}
				>
					Share
				</Button>
			</Box>

			<Divider sx={{ my: 4 }} />

			{/* Comments */}
			<Box>
				<Typography
					variant='h5'
					gutterBottom
				>
					Comments
				</Typography>

				<Box
					component='form'
					onSubmit={handleComment}
					sx={{ mb: 4 }}
				>
					<TextField
						fullWidth
						multiline
						rows={3}
						placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						sx={{ mb: 2 }}
					/>
					<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
						{replyTo && (
							<Button onClick={() => setReplyTo(null)}>Cancel Reply</Button>
						)}
						<Button
							type='submit'
							variant='contained'
							disabled={!comment.trim()}
						>
							{replyTo ? 'Reply' : 'Comment'}
						</Button>
					</Box>
				</Box>

				{comments.map((comment) => (
					<Paper
						key={comment.id}
						sx={{ p: 2, mb: 2 }}
					>
						<Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
							<Avatar
								src={comment.author.image}
								alt={comment.author.name}
							/>
							<Box sx={{ ml: 2, flex: 1 }}>
								<Typography variant='subtitle2'>
									{comment.author.name}
								</Typography>
								<Typography
									variant='body2'
									color='text.secondary'
								>
									{formatDistanceToNow(new Date(comment.createdAt), {
										addSuffix: true,
									})}
								</Typography>
							</Box>
							<IconButton
								size='small'
								onClick={() => handleReply(comment.id)}
							>
								<Reply />
							</IconButton>
						</Box>
						<Typography
							variant='body1'
							sx={{ mb: 2 }}
						>
							{comment.content}
						</Typography>

						{comment.replies?.map((reply) => (
							<Paper
								key={reply.id}
								variant='outlined'
								sx={{ p: 2, ml: 4, mb: 2 }}
							>
								<Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
									<Avatar
										src={reply.author.image}
										alt={reply.author.name}
										sx={{ width: 24, height: 24 }}
									/>
									<Box sx={{ ml: 2, flex: 1 }}>
										<Typography variant='subtitle2'>
											{reply.author.name}
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
										>
											{formatDistanceToNow(new Date(reply.createdAt), {
												addSuffix: true,
											})}
										</Typography>
									</Box>
								</Box>
								<Typography
									variant='body2'
									sx={{ mt: 1 }}
								>
									{reply.content}
								</Typography>
							</Paper>
						))}
					</Paper>
				))}
			</Box>

			<Dialog
				open={isEditModalOpen}
				onClose={handleCloseEditModal}
				maxWidth='md'
				fullWidth
			>
				<DialogTitle>Edit Blog Post</DialogTitle>
				<DialogContent>
					<BlogPostForm
						initialData={post}
						onSubmit={handleSubmitEdit}
						categories={categories}
					/>
				</DialogContent>
			</Dialog>
		</Box>
	);
}
