'use client';

import React, { useState } from 'react';
import {
	Box,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormHelperText,
	Autocomplete,
	Chip,
	CircularProgress,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from '@mui/material';
import BlogEditor from './blog-editor';
import { clientAdminApiClient } from '@/lib/apiClient';

interface BlogPostFormProps {
	initialData?: {
		title: string;
		content: string;
		excerpt: string;
		category: string;
		tags: string[];
		imageUrl: string;
		featured: boolean;
		published: boolean;
	};
	onSubmit: (
		data: {
			title: string;
			content: string;
			excerpt: string;
			category: string;
			tags: string[];
			imageUrl: string;
			featured: boolean;
			published: boolean;
		} | null
	) => void;
	categories: string[];
	isLoading?: boolean;
}

export default function BlogPostForm({
	initialData,
	onSubmit,
	categories,
	isLoading = false,
}: BlogPostFormProps) {
	const [title, setTitle] = useState(initialData?.title || '');
	const [content, setContent] = useState(initialData?.content || '');
	const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
	const [category, setCategory] = useState(initialData?.category || '');
	const [tags, setTags] = useState<string[]>(initialData?.tags || []);
	const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
	const [featured, setFeatured] = useState(initialData?.featured || false);
	const [published, setPublished] = useState(initialData?.published || false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [aiContentLoading, setAiContentLoading] = useState(false);
	const [aiImageLoading, setAiImageLoading] = useState(false);
	const [aiContentError, setAiContentError] = useState<string | null>(null);
	const [aiImageError, setAiImageError] = useState<string | null>(null);
	const batchPrepCategories = [
		'Meal Planning',
		'Batch Cooking',
		'Storage Tips',
		'Nutrition',
		'Budgeting',
		'Family Meals',
		'Vegetarian',
		'Quick Meals',
	];
	const [aiDialogOpen, setAiDialogOpen] = useState(false);
	const [aiQ1, setAiQ1] = useState(''); // Main challenge
	const [aiQ3, setAiQ3] = useState(''); // Tips or focus

	const validate = () => {
		const newErrors: Record<string, string> = {};

		if (!title) {
			newErrors.title = 'Title is required';
		}
		if (!content) {
			newErrors.content = 'Content is required';
		}
		if (!category) {
			newErrors.category = 'Category is required';
		}
		if (!excerpt) {
			newErrors.excerpt = 'Excerpt is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (validate()) {
			onSubmit({
				title,
				content,
				excerpt,
				category,
				tags,
				imageUrl,
				featured,
				published,
			});
		}
	};

	const handleGenerateContent = async () => {
		setAiDialogOpen(true);
	};

	const handleAIGenerateSubmit = async () => {
		setAiContentLoading(true);
		setAiContentError(null);
		setAiDialogOpen(false);
		try {
			const data = await clientAdminApiClient.generateBlogPost({
				category,
				challenge: aiQ1,
				tips: aiQ3,
				...(title ? { title } : {}),
				...(excerpt ? { excerpt } : {}),
			});
			let aiContent = data.content || '';
			let newTitle = '';
			let newContent = aiContent;
			const titleMatch = aiContent.match(/^Title:\s*(.*)$/m);
			if (titleMatch) {
				newTitle = titleMatch[1].trim();
				newContent = aiContent.replace(/^Title:.*\n?/, '').trim();
			}
			if (newTitle) setTitle(newTitle);
			setContent(newContent);
		} catch (e) {
			setAiContentError(
				e instanceof Error ? e.message : 'Failed to generate content'
			);
		} finally {
			setAiContentLoading(false);
			setAiQ1('');
			setAiQ3('');
		}
	};

	const handleGenerateImage = async () => {
		setAiImageLoading(true);
		setAiImageError(null);
		try {
			const data = await clientAdminApiClient.generateBlogImage({
				title,
				excerpt,
			});
			setImageUrl(data.imageUrl || '');
		} catch (e) {
			setAiImageError(
				e instanceof Error ? e.message : 'Failed to generate image'
			);
		} finally {
			setAiImageLoading(false);
		}
	};

	return (
		<Box
			component='form'
			onSubmit={handleSubmit}
			sx={{
				maxWidth: '100%',
				width: '100%',
				p: 2,
				'& .MuiTextField-root, & .MuiFormControl-root': {
					mb: 2,
				},
			}}
		>
			<TextField
				fullWidth
				label='Title'
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				error={!!errors.title}
				helperText={errors.title}
				sx={{ mb: 2 }}
			/>

			<FormControl
				fullWidth
				error={!!errors.category}
				sx={{ mb: 2 }}
			>
				<InputLabel>Category</InputLabel>
				<Select
					value={category}
					label='Category'
					onChange={(e) => setCategory(e.target.value)}
				>
					{batchPrepCategories.map((cat) => (
						<MenuItem
							key={cat}
							value={cat}
						>
							{cat}
						</MenuItem>
					))}
				</Select>
				{errors.category && <FormHelperText>{errors.category}</FormHelperText>}
			</FormControl>

			<TextField
				fullWidth
				label='Excerpt'
				value={excerpt}
				onChange={(e) => setExcerpt(e.target.value)}
				error={!!errors.excerpt}
				helperText={errors.excerpt}
				multiline
				rows={3}
				sx={{ mb: 2 }}
			/>

			<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
				<Button
					variant='outlined'
					onClick={handleGenerateContent}
					disabled={aiContentLoading || !category}
					startIcon={aiContentLoading ? <CircularProgress size={18} /> : null}
				>
					Generate Blog with AI
				</Button>
				<Button
					variant='outlined'
					onClick={handleGenerateImage}
					disabled={aiImageLoading || !title}
					startIcon={aiImageLoading ? <CircularProgress size={18} /> : null}
				>
					Generate Image with AI
				</Button>
			</Box>
			{aiContentError && (
				<Alert
					severity='error'
					sx={{ mb: 2 }}
				>
					{aiContentError}
				</Alert>
			)}
			{aiImageError && (
				<Alert
					severity='error'
					sx={{ mb: 2 }}
				>
					{aiImageError}
				</Alert>
			)}

			<Box sx={{ mb: 2 }}>
				<BlogEditor
					content={content}
					onChange={setContent}
				/>
				{errors.content && (
					<FormHelperText error>{errors.content}</FormHelperText>
				)}
			</Box>

			<Autocomplete
				multiple
				freeSolo
				value={tags}
				onChange={(_, newValue) => setTags(newValue)}
				options={[]}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<Chip
							label={option}
							{...getTagProps({ index })}
							key={option}
						/>
					))
				}
				renderInput={(params) => (
					<TextField
						{...params}
						label='Tags'
						placeholder='Add tags'
						sx={{ mb: 2 }}
					/>
				)}
			/>

			<TextField
				fullWidth
				label='Featured Image URL'
				value={imageUrl}
				onChange={(e) => setImageUrl(e.target.value)}
				sx={{ mb: 2 }}
			/>

			<Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
				<Button
					variant='outlined'
					onClick={() => onSubmit(null)}
					fullWidth
				>
					Cancel
				</Button>
				<Button
					type='submit'
					variant='contained'
					size='large'
					disabled={isLoading}
					fullWidth
				>
					{isLoading
						? 'Saving...'
						: initialData
						? 'Update Post'
						: 'Create Post'}
				</Button>
			</Box>

			<Dialog
				open={aiDialogOpen}
				onClose={() => setAiDialogOpen(false)}
			>
				<DialogTitle>Focus Your Blog Post (optional)</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						label='Anything specific you want this post to cover? (optional)'
						value={aiQ1}
						onChange={(e) => setAiQ1(e.target.value)}
						sx={{ mb: 2 }}
						InputLabelProps={{ sx: { mt: 1 } }}
					/>
					<TextField
						fullWidth
						label='Any tips, ideas, or details to include? (optional)'
						value={aiQ3}
						onChange={(e) => setAiQ3(e.target.value)}
						InputLabelProps={{ sx: { mt: 1 } }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setAiDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleAIGenerateSubmit}
						variant='contained'
						disabled={aiContentLoading || !category}
					>
						Generate
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
