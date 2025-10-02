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
} from '@mui/material';
import BlogEditor from './blog-editor';

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
					{categories.map((cat) => (
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
		</Box>
	);
}
