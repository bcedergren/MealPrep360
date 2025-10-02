'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '../components/ui/snackbar';
import { Container, Typography, Box, CircularProgress } from '@mui/material';

export default function SnapPage() {
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const [isLoading, setIsLoading] = useState(true);
	const [image, setImage] = useState<string | null>(null);
	const [recipe, setRecipe] = useState<any>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
			showSnackbar('Your recipe has been saved!', 'success');
			router.push('/my-recipes');
		}, 2000);

		return () => clearTimeout(timer);
	}, [router, showSnackbar]);

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImage(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleAnalyze = () => {
		// Simulate AI analysis
		setTimeout(() => {
			setRecipe({
				title: 'Chicken Curry',
				ingredients: [
					'2 chicken breasts',
					'1 onion',
					'2 cloves garlic',
					'1 can coconut milk',
					'2 tbsp curry powder',
				],
				instructions: [
					'Chop the chicken and vegetables',
					'Sauté onions and garlic',
					'Add chicken and cook until browned',
					'Add coconut milk and curry powder',
					'Simmer for 20 minutes',
				],
			});
		}, 2000);
	};

	return (
		<div className='container mx-auto py-8'>
			<Container maxWidth='sm'>
				<Box
					display='flex'
					flexDirection='column'
					alignItems='center'
					justifyContent='center'
					minHeight='60vh'
				>
					{isLoading ? (
						<>
							<CircularProgress size={60} />
							<Typography
								variant='h6'
								sx={{ mt: 2 }}
							>
								Saving your recipe...
							</Typography>
						</>
					) : (
						<Typography variant='h6'>Redirecting to your recipes...</Typography>
					)}
				</Box>
			</Container>
		</div>
	);
}
