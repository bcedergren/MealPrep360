'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
	Box,
	Container,
	Typography,
	Grid,
	CircularProgress,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
} from '@mui/material';
import BlogPostViewer from '../../../components/blog/blog-post-viewer';
import BlogPostCard from '../../../components/blog/blog-post-card';
import BlogPostForm from '../../../components/blog/blog-post-form';
import { useAuth } from '@clerk/nextjs';

interface BlogPost {
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
}

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

const categories = [
	'Technology',
	'Health',
	'Food',
	'Travel',
	'Lifestyle',
	'Other',
];

export default function BlogPostPage() {
	const params = useParams();
	const router = useRouter();
	const { getToken } = useAuth();
	const [post, setPost] = useState<BlogPost | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isLiked, setIsLiked] = useState(false);
	const [isAuthor, setIsAuthor] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		fetchPost();
		fetchComments();
	}, [params.id]);

	const fetchPost = async () => {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/blog/posts/${params.id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch post');
			}
			const data = await response.json();
			setPost(data.post);
			setRelatedPosts(data.relatedPosts);
			setIsLiked(data.isLiked);
			setIsAuthor(data.isAuthor);
		} catch (error) {
			setError('Failed to load blog post');
			console.error('Error fetching post:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchComments = async () => {
		try {
			const response = await fetch(`/api/blog/comments?postId=${params.id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch comments');
			}
			const data = await response.json();
			setComments(data);
		} catch (error) {
			console.error('Error fetching comments:', error);
		}
	};

	const handleLike = async () => {
		try {
			const response = await fetch(`/api/blog/posts/${params.id}/like`, {
				method: 'POST',
			});
			if (!response.ok) {
				throw new Error('Failed to like post');
			}
			setIsLiked(!isLiked);
			if (post) {
				setPost({
					...post,
					likes: isLiked ? post.likes - 1 : post.likes + 1,
				});
			}
		} catch (error) {
			console.error('Error liking post:', error);
		}
	};

	const handleComment = async (content: string, parentId?: string) => {
		try {
			const response = await fetch(`/api/blog/comments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					postId: params.id,
					content,
					parentId,
				}),
			});
			if (!response.ok) {
				throw new Error('Failed to add comment');
			}
			const newComment = await response.json();
			if (parentId) {
				setComments(
					comments.map((comment) =>
						comment.id === parentId
							? {
									...comment,
									replies: [...(comment.replies || []), newComment],
								}
							: comment
					)
				);
			} else {
				setComments([...comments, newComment]);
			}
		} catch (error) {
			console.error('Error adding comment:', error);
		}
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: post?.title,
				text: post?.excerpt,
				url: window.location.href,
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
			alert('Link copied to clipboard!');
		}
	};

	const handleEdit = () => {
		setIsEditModalOpen(true);
	};

	const handleCloseEditModal = () => {
		setIsEditModalOpen(false);
	};

	const handleSubmitEdit = async (data: any) => {
		try {
			setIsSaving(true);
			const token = await getToken();
			const response = await fetch(`/api/blog/posts/${params.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update post');
			}

			const updatedPost = await response.json();
			setPost(updatedPost);
			setIsEditModalOpen(false);
		} catch (error) {
			setError((error as Error).message);
			console.error('Error updating post:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm('Are you sure you want to delete this post?')) return;

		try {
			const response = await fetch(`/api/blog/posts/${params.id}`, {
				method: 'DELETE',
			});
			if (!response.ok) {
				throw new Error('Failed to delete post');
			}
			router.push('/blog');
		} catch (error) {
			console.error('Error deleting post:', error);
		}
	};

	if (isLoading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '60vh',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !post) {
		return (
			<Container
				maxWidth='lg'
				sx={{ py: 8 }}
			>
				<Alert severity='error'>{error || 'Post not found'}</Alert>
			</Container>
		);
	}

	return (
		<Container
			maxWidth='lg'
			sx={{ py: 8 }}
		>
			<BlogPostViewer
				post={post}
				comments={comments}
				onLike={handleLike}
				onComment={handleComment}
				onShare={handleShare}
				isLiked={isLiked}
				isAuthor={isAuthor}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>

			{relatedPosts.length > 0 && (
				<Box sx={{ mt: 8 }}>
					<Typography
						variant='h4'
						gutterBottom
					>
						Related Posts
					</Typography>
					<Grid
						container
						spacing={4}
					>
						{relatedPosts.map((relatedPost) => (
							<Grid
								item
								xs={12}
								sm={6}
								md={4}
								key={relatedPost.id}
							>
								<BlogPostCard
									post={relatedPost}
									onLike={() => {}}
									onShare={() => {}}
								/>
							</Grid>
						))}
					</Grid>
				</Box>
			)}

			<Dialog
				open={isEditModalOpen}
				onClose={handleCloseEditModal}
				maxWidth='md'
				fullWidth
			>
				<DialogTitle>Edit Blog Post</DialogTitle>
				<DialogContent>
					{post && (
						<BlogPostForm
							initialData={post}
							onSubmit={handleSubmitEdit}
							categories={categories}
							isLoading={isSaving}
						/>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseEditModal}>Cancel</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
}
