'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Typography,
	Paper,
	Chip,
	Stack,
	IconButton,
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];
const CUISINES = [
	'American',
	'Italian',
	'Mexican',
	'Chinese',
	'Indian',
	'Japanese',
	'Thai',
	'Mediterranean',
	'French',
	'Greek',
];

export function AddRecipeForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [ingredients, setIngredients] = useState<string[]>(['']);
	const [instructions, setInstructions] = useState<string[]>(['']);
	const [tags, setTags] = useState<string[]>([]);
	const [newTag, setNewTag] = useState('');

	const [formData, setFormData] = useState({
		title: '',
		description: '',
		prepTime: '',
		cookTime: '',
		servings: '',
		difficulty: '',
		cuisine: '',
		imageUrl: '',
		isPublic: false,
	});
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSelectChange = (e: any) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleAddIngredient = () => {
		setIngredients([...ingredients, '']);
	};

	const handleRemoveIngredient = (index: number) => {
		setIngredients(ingredients.filter((_, i) => i !== index));
	};

	const handleIngredientChange = (index: number, value: string) => {
		const newIngredients = [...ingredients];
		newIngredients[index] = value;
		setIngredients(newIngredients);
	};

	const handleAddInstruction = () => {
		setInstructions([...instructions, '']);
	};

	const handleRemoveInstruction = (index: number) => {
		setInstructions(instructions.filter((_, i) => i !== index));
	};

	const handleInstructionChange = (index: number, value: string) => {
		const newInstructions = [...instructions];
		newInstructions[index] = value;
		setInstructions(newInstructions);
	};

	const handleAddTag = () => {
		if (newTag && !tags.includes(newTag)) {
			setTags([...tags, newTag]);
			setNewTag('');
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// First create the recipe
			const response = await fetch('/api/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...formData,
					ingredients: ingredients.filter(Boolean),
					instructions: instructions.filter(Boolean),
					tags,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to create recipe');
			}

			const recipe = await response.json();

			// If there's a selected image, upload it
			if (selectedImage) {
				setIsUploadingImage(true);
				const formData = new FormData();
				formData.append('image', selectedImage);

				const uploadResponse = await fetch(`/api/recipes/${recipe.id}/image`, {
					method: 'POST',
					body: formData,
				});

				if (!uploadResponse.ok) {
					throw new Error('Failed to upload image');
				}
			}

			toast.success('Recipe created successfully');
			router.push('/my-recipes');
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to create recipe'
			);
		} finally {
			setIsLoading(false);
			setIsUploadingImage(false);
		}
	};

	return (
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
							label='Recipe Title'
							name='title'
							value={formData.title}
							onChange={handleInputChange}
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
							onChange={handleInputChange}
							multiline
							rows={3}
							required
						/>
					</Grid>

					<Grid
						item
						xs={12}
						md={6}
					>
						<TextField
							fullWidth
							label='Prep Time (minutes)'
							name='prepTime'
							type='number'
							value={formData.prepTime}
							onChange={handleInputChange}
							required
						/>
					</Grid>

					<Grid
						item
						xs={12}
						md={6}
					>
						<TextField
							fullWidth
							label='Cook Time (minutes)'
							name='cookTime'
							type='number'
							value={formData.cookTime}
							onChange={handleInputChange}
							required
						/>
					</Grid>

					<Grid
						item
						xs={12}
						md={6}
					>
						<TextField
							fullWidth
							label='Servings'
							name='servings'
							type='number'
							value={formData.servings}
							onChange={handleInputChange}
							required
						/>
					</Grid>

					<Grid
						item
						xs={12}
						md={6}
					>
						<FormControl
							fullWidth
							required
						>
							<InputLabel>Difficulty</InputLabel>
							<Select
								name='difficulty'
								value={formData.difficulty}
								onChange={handleSelectChange}
								label='Difficulty'
							>
								{DIFFICULTY_LEVELS.map((level) => (
									<MenuItem
										key={level}
										value={level}
									>
										{level}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>

					<Grid
						item
						xs={12}
						md={6}
					>
						<FormControl fullWidth>
							<InputLabel>Cuisine</InputLabel>
							<Select
								name='cuisine'
								value={formData.cuisine}
								onChange={handleSelectChange}
								label='Cuisine'
							>
								{CUISINES.map((cuisine) => (
									<MenuItem
										key={cuisine}
										value={cuisine}
									>
										{cuisine}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>

					<Grid
						item
						xs={12}
						md={6}
					>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<TextField
								fullWidth
								label='Image URL'
								name='imageUrl'
								value={formData.imageUrl}
								onChange={handleInputChange}
								placeholder='https://example.com/image.jpg'
								disabled={!!selectedImage}
								helperText={
									selectedImage
										? 'Clear uploaded image to use URL instead'
										: 'Enter an image URL or upload an image'
								}
							/>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 2,
								}}
							>
								<input
									accept='image/jpeg,image/png,image/webp'
									style={{ display: 'none' }}
									id='recipe-image-upload'
									type='file'
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											setSelectedImage(file);
											setFormData((prev) => ({ ...prev, imageUrl: '' }));
											const reader = new FileReader();
											reader.onloadend = () => {
												setImagePreview(reader.result as string);
											};
											reader.readAsDataURL(file);
										}
									}}
								/>
								<label htmlFor='recipe-image-upload'>
									<Button
										component='span'
										variant='contained'
										startIcon={<CloudUploadIcon />}
										disabled={isUploadingImage}
									>
										{isUploadingImage ? 'Uploading...' : 'Upload Image'}
									</Button>
								</label>
								{imagePreview && (
									<Box
										sx={{ position: 'relative', width: '100%', maxWidth: 300 }}
									>
										<img
											src={imagePreview}
											alt='Recipe preview'
											style={{
												width: '100%',
												height: 'auto',
												borderRadius: '8px',
											}}
										/>
										<IconButton
											onClick={() => {
												setSelectedImage(null);
												setImagePreview('');
											}}
											sx={{
												position: 'absolute',
												top: 8,
												right: 8,
												backgroundColor: 'rgba(255,255,255,0.8)',
												'&:hover': {
													backgroundColor: 'rgba(255,255,255,0.9)',
												},
											}}
										>
											<DeleteIcon />
										</IconButton>
									</Box>
								)}
							</Box>
						</Box>
					</Grid>

					<Grid
						item
						xs={12}
					>
						<Typography
							variant='h6'
							gutterBottom
						>
							Ingredients
						</Typography>
						{ingredients.map((ingredient, index) => (
							<Box
								key={index}
								sx={{ display: 'flex', gap: 1, mb: 1 }}
							>
								<TextField
									fullWidth
									label={`Ingredient ${index + 1}`}
									value={ingredient}
									onChange={(e) =>
										handleIngredientChange(index, e.target.value)
									}
									required
								/>
								{ingredients.length > 1 && (
									<IconButton
										onClick={() => handleRemoveIngredient(index)}
										color='error'
									>
										<DeleteIcon />
									</IconButton>
								)}
							</Box>
						))}
						<Button
							startIcon={<AddIcon />}
							onClick={handleAddIngredient}
							sx={{ mt: 1 }}
						>
							Add Ingredient
						</Button>
					</Grid>

					<Grid
						item
						xs={12}
					>
						<Typography
							variant='h6'
							gutterBottom
						>
							Instructions
						</Typography>
						{instructions.map((instruction, index) => (
							<Box
								key={index}
								sx={{ display: 'flex', gap: 1, mb: 1 }}
							>
								<TextField
									fullWidth
									label={`Step ${index + 1}`}
									value={instruction}
									onChange={(e) =>
										handleInstructionChange(index, e.target.value)
									}
									multiline
									rows={2}
									required
								/>
								{instructions.length > 1 && (
									<IconButton
										onClick={() => handleRemoveInstruction(index)}
										color='error'
									>
										<DeleteIcon />
									</IconButton>
								)}
							</Box>
						))}
						<Button
							startIcon={<AddIcon />}
							onClick={handleAddInstruction}
							sx={{ mt: 1 }}
						>
							Add Step
						</Button>
					</Grid>

					<Grid
						item
						xs={12}
					>
						<Typography
							variant='h6'
							gutterBottom
						>
							Tags
						</Typography>
						<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
							<TextField
								label='Add Tag'
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAddTag();
									}
								}}
							/>
							<Button onClick={handleAddTag}>Add</Button>
						</Box>
						<Stack
							direction='row'
							spacing={1}
							flexWrap='wrap'
							useFlexGap
						>
							{tags.map((tag) => (
								<Chip
									key={tag}
									label={tag}
									onDelete={() => handleRemoveTag(tag)}
									sx={{ m: 0.5 }}
								/>
							))}
						</Stack>
					</Grid>

					<Grid
						item
						xs={12}
					>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
							<Button
								variant='outlined'
								onClick={() => router.back()}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								variant='contained'
								disabled={isLoading}
							>
								{isLoading ? 'Creating...' : 'Create Recipe'}
							</Button>
						</Box>
					</Grid>
				</Grid>
			</form>
		</Paper>
	);
}
