'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '../../components/ui/snackbar';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Restaurant as RecipeIcon } from '@mui/icons-material';
import { PageHeader } from '../../components/shared/page-header';

interface Recipe {
	id: string;
	title: string;
	description: string;
	image: string;
	servings: number;
	prepTime: number;
	cookTime: number;
}

export default function MyRecipesPage() {
	const { userId, isLoaded, isSignedIn } = useAuth();
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isLoaded) return;

		if (!isSignedIn) {
			router.push('/sign-in');
			return;
		}

		fetchRecipes();
	}, [isLoaded, isSignedIn, router]);

	const fetchRecipes = async () => {
		try {
			const response = await fetch('/api/recipes');
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to fetch recipes');
			}
			const data = await response.json();
			setRecipes(data);
		} catch (err) {
			console.error('Error fetching recipes:', err);
			setError(err instanceof Error ? err.message : 'Failed to load recipes');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteRecipe = async (recipeId: string) => {
		try {
			const response = await fetch(`/api/recipes/${recipeId}`, {
				method: 'DELETE',
			});
			if (!response.ok) throw new Error('Failed to delete recipe');
			// Refresh the recipes list
			window.location.reload();
		} catch (error) {
			console.error('Error deleting recipe:', error);
		}
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
			>
				<Typography color='error'>{error}</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<PageHeader
				title='My Recipes'
				description='Your personal collection of favorite recipes'
				backgroundColor='linear-gradient(45deg, #2196F3 30%, #03A9F4 90%)'
				icon={<RecipeIcon sx={{ fontSize: 180 }} />}
			/>

			{recipes.length === 0 ? (
				<Box sx={{ textAlign: 'center', mt: 4 }}>
					<Typography
						variant='h6'
						color='text.secondary'
					>
						No recipes yet
					</Typography>
				</Box>
			) : (
				<Box sx={{ mt: 2 }}>
					{recipes.map((recipe) => (
						<Box
							key={recipe.id}
							sx={{
								p: 2,
								mb: 2,
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 1,
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<Box>
								<Typography variant='h6'>{recipe.title}</Typography>
								<Typography
									variant='body2'
									color='text.secondary'
								>
									{recipe.description}
								</Typography>
							</Box>
							<Button
								variant='outlined'
								color='error'
								onClick={() => handleDeleteRecipe(recipe.id)}
							>
								Delete
							</Button>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
}
