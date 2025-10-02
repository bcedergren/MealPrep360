'use client';

import { Box, Container, Typography } from '@mui/material';
import { AddRecipeForm } from '../../components/recipes/add-recipe-form';
import { MainNav } from '../../components/shared/navigation/main-nav';
import { Footer } from '../../components/shared/navigation/footer';
import { PageHeader } from '../../components/shared/page-header';
import { Add as AddIcon } from '@mui/icons-material';

export default function AddRecipePage() {
	return (
		<>
			<MainNav />
			<Container
				maxWidth='xl'
				sx={{ py: 4 }}
			>
				<PageHeader
					title='Add Recipe'
					description='Create a new recipe to add to your collection'
					icon={<AddIcon />}
					backgroundColor='linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)'
				/>
				<Box sx={{ mt: 4 }}>
					<AddRecipeForm />
				</Box>
			</Container>
			<Footer />
		</>
	);
}
