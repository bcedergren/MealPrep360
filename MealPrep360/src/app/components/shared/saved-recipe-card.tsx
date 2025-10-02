import { useState } from 'react';
import {
	Card,
	CardContent,
	CardMedia,
	Typography,
	Box,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import Chip from '@mui/material/Chip';
import { useSnackbar } from '../ui/snackbar';

interface Recipe {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	tags: string[];
	servings: number;
	prepTime: number;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
	// Optional fields for detailed views
	ingredients?: string[];
	instructions?: string;
	prepInstructions?: string;
	cookingInstructions?: string;
	defrostInstructions?: string;
	servingInstructions?: string;
	storageTime?: string;
	containerSuggestions?: string;
	cookTime?: number;
	freezerPrep?: string;
	hasImage?: boolean;
	imageBase64?: string;
}

interface SavedRecipeCardProps {
	recipe: Recipe;
	onDelete: (id: string) => Promise<void>;
	layout?: 'grid' | 'list';
}

export function SavedRecipeCard({
	recipe,
	onDelete,
	layout = 'grid',
}: SavedRecipeCardProps) {
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [imageError, setImageError] = useState(false);

	const handleCardClick = () => {
		router.push(`/recipe/${recipe.id}`);
	};

	const handleDeleteClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowDeleteDialog(true);
	};

	const handleImageError = () => {
		setImageError(true);
	};

	const handleConfirmDelete = async () => {
		if (!recipe.id) return;

		setIsDeleting(true);
		try {
			await onDelete(recipe.id);
			showSnackbar('The recipe has been successfully deleted.', 'success');
		} catch (error) {
			showSnackbar('Failed to delete recipe. Please try again.', 'error');
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const isListLayout = layout === 'list';

	return (
		<>
			<Card
				sx={{
					height: '100%',
					display: 'flex',
					flexDirection: isListLayout ? 'row' : 'column',
					cursor: 'pointer',
					position: 'relative',
					mb: isListLayout ? 1 : 0,
					'&:hover': {
						boxShadow: 6,
						'& .delete-button': {
							opacity: 1,
						},
					},
				}}
				onClick={handleCardClick}
			>
				<Box
					sx={{
						position: 'relative',
						width: isListLayout ? '200px' : '100%',
						flexShrink: 0,
						backgroundColor: 'grey.100',
					}}
				>
					<CardMedia
						component='img'
						height={isListLayout ? '100%' : '140'}
						image={
							imageError
								? '/images/recipe-placeholder.png'
								: recipe.imageBase64 ||
									recipe.imageUrl ||
									'/images/recipe-placeholder.png'
						}
						alt={recipe.title}
						sx={{
							height: isListLayout ? '200px' : '140px',
							objectFit: 'cover',
						}}
						onError={handleImageError}
					/>
					<IconButton
						className='delete-button'
						sx={{
							position: 'absolute',
							top: 4,
							right: 4,
							backgroundColor: 'rgba(255, 255, 255, 0.8)',
							opacity: 0,
							transition: 'opacity 0.2s ease-in-out',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.9)',
							},
						}}
						onClick={handleDeleteClick}
						disabled={isDeleting}
					>
						<DeleteIcon color='error' />
					</IconButton>
				</Box>
				<CardContent
					sx={{
						flexGrow: 1,
						display: 'flex',
						flexDirection: isListLayout ? 'row' : 'column',
						justifyContent: isListLayout ? 'space-between' : 'flex-start',
						p: isListLayout ? 1 : 2,
						gap: isListLayout ? 1 : 0,
					}}
				>
					<Box sx={{ flex: 1 }}>
						<Typography
							gutterBottom
							variant='h6'
							component='h2'
							noWrap
							sx={{ mb: 0.25 }}
						>
							{recipe.title}
						</Typography>
						<Typography
							variant='body2'
							color='text.secondary'
							sx={{
								display: '-webkit-box',
								WebkitLineClamp: isListLayout ? 1 : 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
								mb: isListLayout ? 0.5 : 1,
							}}
						>
							{recipe.description}
						</Typography>
						{recipe.tags && recipe.tags.length > 0 && (
							<Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap', mb: 1 }}>
								{recipe.tags
									.filter((tag) => tag !== 'freezer-friendly')
									.map((tag) => (
										<Chip
											key={tag}
											label={tag}
											size='small'
											variant='outlined'
										/>
									))}
							</Box>
						)}
						{isListLayout && (
							<Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
									<AccessTimeIcon fontSize='small' />
									<Typography variant='body2'>
										{recipe.prepTime || 0} min
									</Typography>
								</Box>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
									<RestaurantIcon fontSize='small' />
									<Typography variant='body2'>
										{recipe.servings} servings
									</Typography>
								</Box>
							</Box>
						)}
					</Box>
					{isListLayout && (
						<Box sx={{ width: '200px', height: '160px', overflow: 'auto' }}>
							{recipe.ingredients && (
								<Box
									component='ul'
									sx={{
										m: 0,
										pl: 2,
										listStyleType: 'disc',
										'& li': {
											typography: 'body2',
											color: 'text.secondary',
											mb: 0.25,
										},
									}}
								>
									{recipe.ingredients.slice(0, 3).map((ingredient) => (
										<Box
											component='li'
											key={ingredient}
										>
											{ingredient}
										</Box>
									))}
								</Box>
							)}
						</Box>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
			>
				<DialogTitle>Delete Recipe</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete &quot;{recipe.title}&quot;? This
						action cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setShowDeleteDialog(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmDelete}
						color='error'
						disabled={isDeleting}
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
