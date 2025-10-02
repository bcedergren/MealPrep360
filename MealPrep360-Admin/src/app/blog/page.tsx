'use client';

import { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Button,
	IconButton,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	CircularProgress,
	Alert,
} from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Add as AddIcon,
	Star,
	StarBorder,
	Visibility,
	VisibilityOff,
} from '@mui/icons-material';
import BlogPostForm from '@/app/_components/blog/blog-post-form';
import { useAuth } from '@clerk/nextjs';
import { clientAdminApiClient } from '@/lib/apiClient';

const categories = [
	'Technology',
	'Health',
	'Food',
	'Travel',
	'Lifestyle',
	'Other',
];

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
	featuredAt: string;
}

export default function AdminBlogPostsPage() {
	const { getToken, isSignedIn } = useAuth();
	const [posts, setPosts] = useState<BlogPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const fetchPosts = useCallback(async () => {
		try {
			setLoading(true);
			const data = await clientAdminApiClient.getBlogPosts({ admin: 'true' });
			setPosts(data);
		} catch (error) {
			setError('Failed to load blog posts');
			console.error('Error fetching posts:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPosts();
	}, [fetchPosts]);

	const handleEdit = (post: BlogPost) => {
		setSelectedPost(post);
		setIsEditModalOpen(true);
	};

	const handleCloseEditModal = () => {
		setIsEditModalOpen(false);
		setSelectedPost(null);
	};

	const handleSubmitEdit = async (
		formData: {
			title: string;
			content: string;
			excerpt: string;
			category: string;
			tags: string[];
			imageUrl: string;
			featured: boolean;
			published: boolean;
		} | null
	) => {
		if (formData === null) {
			handleCloseEditModal();
			return;
		}

		try {
			setIsSaving(true);
			const updatedPost = await clientAdminApiClient.updateBlogPost(
				selectedPost?.id!,
				{
					...formData,
					id: selectedPost?.id,
					author: selectedPost?.author,
					publishedAt: selectedPost?.publishedAt,
					readTime: selectedPost?.readTime,
					views: selectedPost?.views,
					likes: selectedPost?.likes,
					featuredAt: selectedPost?.featuredAt,
				}
			);
			setPosts(
				posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
			);
			handleCloseEditModal();
		} catch (error) {
			setError(
				error instanceof Error ? error.message : 'Failed to update post'
			);
			console.error('Error updating post:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this post?')) return;

		try {
			await clientAdminApiClient.deleteBlogPost(id);
			setPosts(posts.filter((post) => post.id !== id));
		} catch (error) {
			console.error('Error deleting post:', error);
		}
	};

	const handleToggleFeatured = async (post: BlogPost) => {
		try {
			const updatedPost = await clientAdminApiClient.updateBlogPost(post.id, {
				...post,
				featured: !post.featured,
			});
			setPosts(posts.map((p) => (p.id === post.id ? updatedPost : p)));
		} catch (error) {
			setError('Failed to update featured status');
			console.error(error);
		}
	};

	const handleTogglePublished = async (post: BlogPost) => {
		try {
			const updatedPost = await clientAdminApiClient.updateBlogPost(post.id, {
				...post,
				published: !post.published,
			});
			setPosts(posts.map((p) => (p.id === post.id ? updatedPost : p)));
		} catch (error) {
			setError('Failed to update published status');
			console.error(error);
		}
	};

	if (!isSignedIn) {
		return (
			<Box sx={{ p: 4 }}>
				<Alert severity='error'>Please sign in to access this page</Alert>
			</Box>
		);
	}

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 4 }}>
				<Alert severity='error'>{error}</Alert>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 4 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
				<Typography variant='h4'>Blog Posts</Typography>
				<Button
					variant='contained'
					startIcon={<AddIcon />}
					onClick={() => {
						setSelectedPost(null);
						setIsEditModalOpen(true);
					}}
				>
					New Post
				</Button>
			</Box>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Title</TableCell>
							<TableCell>Category</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Published</TableCell>
							<TableCell align='center'>Featured</TableCell>
							<TableCell align='center'>Published</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{posts.map((post) => (
							<TableRow key={post.id}>
								<TableCell>{post.title}</TableCell>
								<TableCell>{post.category}</TableCell>
								<TableCell>{post.published ? 'Published' : 'Draft'}</TableCell>
								<TableCell>
									{new Date(post.publishedAt).toLocaleDateString()}
								</TableCell>
								<TableCell align='center'>
									<Tooltip title={post.featured ? 'Featured' : 'Not Featured'}>
										<IconButton
											onClick={() => handleToggleFeatured(post)}
											color={post.featured ? 'primary' : 'default'}
											size='small'
										>
											{post.featured ? <Star /> : <StarBorder />}
										</IconButton>
									</Tooltip>
									{post.featured && post.featuredAt && (
										<span
											style={{ marginLeft: 4, fontSize: 12, color: '#888' }}
										>
											({new Date(post.featuredAt).toLocaleDateString()})
										</span>
									)}
								</TableCell>
								<TableCell align='center'>
									<Tooltip title={post.published ? 'Published' : 'Draft'}>
										<IconButton
											onClick={() => handleTogglePublished(post)}
											color={post.published ? 'primary' : 'default'}
											size='small'
										>
											{post.published ? <Visibility /> : <VisibilityOff />}
										</IconButton>
									</Tooltip>
									{post.published && post.publishedAt && (
										<span
											style={{ marginLeft: 4, fontSize: 12, color: '#888' }}
										>
											({new Date(post.publishedAt).toLocaleDateString()})
										</span>
									)}
								</TableCell>
								<TableCell>
									<Tooltip title='Edit'>
										<IconButton
											onClick={() => handleEdit(post)}
											size='small'
										>
											<EditIcon />
										</IconButton>
									</Tooltip>
									<Tooltip title='Delete'>
										<IconButton
											onClick={() => handleDelete(post.id)}
											size='small'
										>
											<DeleteIcon />
										</IconButton>
									</Tooltip>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			<Dialog
				open={isEditModalOpen}
				onClose={handleCloseEditModal}
				maxWidth='md'
				fullWidth
			>
				<DialogTitle
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					{selectedPost ? 'Edit Blog Post' : 'Create New Blog Post'}
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Tooltip
							title={selectedPost?.featured ? 'Featured' : 'Not Featured'}
						>
							<IconButton
								onClick={() =>
									setSelectedPost((prev) =>
										prev ? { ...prev, featured: !prev.featured } : null
									)
								}
								color={selectedPost?.featured ? 'primary' : 'default'}
							>
								{selectedPost?.featured ? <Star /> : <StarBorder />}
							</IconButton>
						</Tooltip>

						<Tooltip title={selectedPost?.published ? 'Published' : 'Draft'}>
							<IconButton
								onClick={() =>
									setSelectedPost((prev) =>
										prev ? { ...prev, published: !prev.published } : null
									)
								}
								color={selectedPost?.published ? 'primary' : 'default'}
							>
								{selectedPost?.published ? <Visibility /> : <VisibilityOff />}
							</IconButton>
						</Tooltip>
					</Box>
				</DialogTitle>
				<DialogContent>
					<BlogPostForm
						initialData={selectedPost || undefined}
						onSubmit={handleSubmitEdit}
						categories={categories}
						isLoading={isSaving}
					/>
				</DialogContent>
			</Dialog>
		</Box>
	);
}
