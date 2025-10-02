'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Stack,
	Typography,
	Snackbar,
	Alert,
	CardMedia,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import { Button } from '@mui/material';
import { RecipePlainObject } from '@/types/recipe';
import { styled } from '@mui/material/styles';

interface RecipeCardProps {
	recipe: RecipePlainObject;
	isMyRecipesPage?: boolean;
}

const PLACEHOLDER_IMAGE = '/images/recipe-placeholder.png';

const StyledCard = styled('div')(({ theme }) => ({
	background: theme.palette.background.paper,
	borderRadius: 8,
	boxShadow: theme.shadows[1],
	overflow: 'hidden',
	position: 'relative',
	transition: 'box-shadow 0.2s',
	'&:hover': {
		boxShadow: theme.shadows[4],
	},
}));

export default function RecipeCard({
	recipe,
	isMyRecipesPage = false,
}: RecipeCardProps) {
	const [openDialog, setOpenDialog] = useState(false);
	const [imgSrc, setImgSrc] = useState(
		recipe.images?.main || PLACEHOLDER_IMAGE
	);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		severity: 'success' as 'success' | 'error',
	});
	const router = useRouter();

	const handleDelete = async () => {
		try {
			const response = await fetch(`/api/recipes/${recipe._id}`, {
				method: 'DELETE',
			});

			if (response.status === 204) {
				router.refresh();
				setOpenDialog(false);
				setSnackbar({
					open: true,
					message: 'Recipe deleted successfully',
					severity: 'success',
				});
			} else {
				console.error('Failed to delete recipe:', response.status);
				setSnackbar({
					open: true,
					message: 'Failed to delete recipe',
					severity: 'error',
				});
			}
		} catch (error) {
			console.error('Error deleting recipe:', error);
			setSnackbar({
				open: true,
				message:
					'An error occurred while deleting the recipe. Please try again.',
				severity: 'error',
			});
		}
	};

	const handleReportImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		try {
			const response = await fetch('/api/images/report', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					imageUrl: recipe.images?.main,
				}),
			});

			if (response.ok) {
				setSnackbar({
					open: true,
					message: 'Image reported. Thank you!',
					severity: 'success',
				});
			} else {
				setSnackbar({
					open: true,
					message: 'Failed to report image',
					severity: 'error',
				});
			}
		} catch (err) {
			setSnackbar({
				open: true,
				message: 'Failed to report image',
				severity: 'error',
			});
		}
	};

	return (
		<>
			<Link href={`/recipe/${recipe._id}`}>
				<div
					style={{ textDecoration: 'none', color: 'inherit' }}
					onClick={(e: React.MouseEvent) => {
						if (openDialog) {
							e.preventDefault();
						}
					}}
				>
					<StyledCard>
						<Box sx={{ position: 'relative', width: '100%', pt: '56.25%' }}>
							<div
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									zIndex: 1000,
									background: 'red',
									width: 40,
									height: 40,
								}}
							>
								TEST
							</div>
							<IconButton
								className='report-image-button'
								onClick={handleReportImage}
								sx={{
									position: 'absolute',
									top: 8,
									left: 8,
									zIndex: 10,
									backgroundColor: 'rgba(255, 255, 255, 0.9)',
									'&:hover': {
										backgroundColor: 'rgba(255, 255, 255, 1)',
									},
									opacity: 1,
									transition: 'opacity 0.2s',
								}}
							>
								<FlagIcon
									color='warning'
									fontSize='small'
								/>
							</IconButton>
							<CardMedia
								component='img'
								height='140'
								image={recipe.images?.main || PLACEHOLDER_IMAGE}
								alt={recipe.title}
								sx={{
									height: 200,
									objectFit: 'cover',
								}}
								onError={(e: any) => {
									e.target.src = PLACEHOLDER_IMAGE;
								}}
							/>
						</Box>
						{isMyRecipesPage && (
							<IconButton
								className='delete-button'
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setOpenDialog(true);
								}}
								sx={{
									position: 'absolute',
									top: 8,
									right: 8,
									opacity: 0,
									transition: 'opacity 0.2s',
									backgroundColor: 'rgba(255, 255, 255, 0.9)',
									'&:hover': {
										backgroundColor: 'rgba(255, 255, 255, 1)',
									},
									zIndex: 2,
								}}
							>
								<DeleteIcon color='error' />
							</IconButton>
						)}
						<CardContent>
							<Typography
								gutterBottom
								variant='h6'
								component='div'
							>
								{recipe.title}
							</Typography>
							{recipe.description && (
								<Typography
									variant='body2'
									color='text.secondary'
									noWrap
								>
									{recipe.description}
								</Typography>
							)}
							<Stack
								direction='row'
								spacing={1}
								flexWrap='wrap'
								gap={1}
								sx={{ mt: 1 }}
							>
								{recipe.tags.map((tag: string, index: number) => (
									<Chip
										key={index}
										label={tag}
										size='small'
										color='primary'
										sx={{
											backgroundColor: 'primary.light',
											color: 'primary.dark',
										}}
									/>
								))}
							</Stack>
						</CardContent>
					</StyledCard>
				</div>
			</Link>

			<Dialog
				open={openDialog}
				onClose={() => setOpenDialog(false)}
			>
				<DialogTitle>Delete Recipe</DialogTitle>
				<DialogContent>
					Are you sure you want to delete &quot;{recipe.title}&quot;?
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenDialog(false)}>Cancel</Button>
					<Button
						onClick={handleDelete}
						color='error'
						variant='contained'
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
			>
				<Alert severity={snackbar.severity}>{snackbar.message}</Alert>
			</Snackbar>
		</>
	);
}
