'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '../../components/ui/snackbar';
import {
	Container,
	Typography,
	Paper,
	Grid,
	TextField,
	Button,
} from '@mui/material';

interface RecipeForm {
	title: string;
	description: string;
	ingredients: string;
	instructions: string;
	imageUrl: string;
	freezerPrep: string;
	defrostInstructions: string;
	prepInstructions: string;
}

export default function NewRecipePage() {
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const [formData, setFormData] = useState<RecipeForm>({
		title: '',
		description: '',
		ingredients: '',
		instructions: '',
		imageUrl: '',
		freezerPrep: '',
		defrostInstructions: '',
		prepInstructions: '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const response = await fetch('/api/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				showSnackbar('Recipe created successfully', 'success');
				router.push('/recipes');
			} else {
				const error = await response.json();
				showSnackbar(error.message || 'Failed to create recipe', 'error');
			}
		} catch (error) {
			console.error('Error creating recipe:', error);
			showSnackbar('An unexpected error occurred', 'error');
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev: RecipeForm) => ({ ...prev, [name]: value }));
	};

	return (
		<Container>
			<Typography
				variant='h1'
				gutterBottom
			>
				Create New Recipe
			</Typography>

			<Paper sx={{ p: 3 }}>
				<form onSubmit={handleSubmit}>
					<Grid
						container
						spacing={3}
					>
						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label='Title'
								name='title'
								value={formData.title}
								onChange={handleChange}
								required
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label='Description'
								name='description'
								value={formData.description}
								onChange={handleChange}
								multiline
								rows={2}
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label='Ingredients'
								name='ingredients'
								value={formData.ingredients}
								onChange={handleChange}
								multiline
								rows={4}
								required
								helperText='Enter each ingredient on a new line. Each line will be formatted as a bullet point. Example: "2 cups flour" or "1 tsp salt"'
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label='Prep Instructions'
								name='prepInstructions'
								value={formData.prepInstructions}
								onChange={handleChange}
								multiline
								rows={4}
								required
								helperText='Required: Describe how to prepare the ingredients before cooking'
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label='Cooking Instructions'
								name='instructions'
								value={formData.instructions}
								onChange={handleChange}
								multiline
								rows={6}
								required
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label='Image URL'
								name='imageUrl'
								value={formData.imageUrl}
								onChange={handleChange}
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label='Freezer Prep Instructions'
								name='freezerPrep'
								value={formData.freezerPrep}
								onChange={handleChange}
								multiline
								rows={3}
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<TextField
								fullWidth
								label='Defrost Instructions'
								name='defrostInstructions'
								value={formData.defrostInstructions}
								onChange={handleChange}
								multiline
								rows={3}
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<Button
								type='submit'
								variant='contained'
								color='primary'
							>
								Create Recipe
							</Button>
						</Grid>
					</Grid>
				</form>
			</Paper>
		</Container>
	);
}
