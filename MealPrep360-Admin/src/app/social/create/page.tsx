'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Container,
	Typography,
	TextField,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Paper,
} from '@mui/material';
import { socialService } from '@/lib/socialService';
import { SocialPost } from '@/types/social';

export default function CreatePost() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState<{
		type: 'recipe' | 'mealPlan';
		referenceId: string;
		caption: string;
	}>({
		type: 'recipe',
		referenceId: '',
		caption: '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await socialService.createPost({
				userId: 'current-user-id', // TODO: Get from auth context
				...formData,
			});
			router.push('/social/feed');
		} catch (error) {
			console.error('Failed to create post:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container
			maxWidth='md'
			sx={{ py: 4 }}
		>
			<Paper sx={{ p: 4 }}>
				<Typography
					variant='h4'
					component='h1'
					gutterBottom
				>
					Create New Post
				</Typography>

				<Box
					component='form'
					onSubmit={handleSubmit}
					sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
				>
					<FormControl fullWidth>
						<InputLabel>Post Type</InputLabel>
						<Select
							value={formData.type}
							label='Post Type'
							onChange={(e) =>
								setFormData({
									...formData,
									type: e.target.value as 'recipe' | 'mealPlan',
								})
							}
						>
							<MenuItem value='recipe'>Recipe</MenuItem>
							<MenuItem value='mealPlan'>Meal Plan</MenuItem>
						</Select>
					</FormControl>

					<TextField
						fullWidth
						label='Reference ID'
						value={formData.referenceId}
						onChange={(e) =>
							setFormData({ ...formData, referenceId: e.target.value })
						}
						helperText='Enter the ID of the recipe or meal plan you want to share'
					/>

					<TextField
						fullWidth
						label='Caption'
						multiline
						rows={4}
						value={formData.caption}
						onChange={(e) =>
							setFormData({ ...formData, caption: e.target.value })
						}
						helperText='Add a description or message to your post'
					/>

					<Button
						type='submit'
						variant='contained'
						size='large'
						disabled={loading}
					>
						{loading ? 'Creating...' : 'Create Post'}
					</Button>
				</Box>
			</Paper>
		</Container>
	);
}
