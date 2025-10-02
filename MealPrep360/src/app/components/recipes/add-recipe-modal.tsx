import { useState, useCallback } from 'react';
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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

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

interface AddRecipeModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export function AddRecipeModal({
	open,
	onClose,
	onSuccess,
}: AddRecipeModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [ingredients, setIngredients] = useState<string[]>(['']);
	const [instructions, setInstructions] = useState<string[]>(['']);
	const [tags, setTags] = useState<string[]>([]);
	const [newTag, setNewTag] = useState('');
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
		prepInstructions: '',
		cookingInstructions: '',
		defrostInstructions: '',
		servingInstructions: '',
		storageTime: '',
		containerSuggestions: '',
		freezerPrep: '',
		imageFile: null as File | null,
	});

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

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (file) {
			// Create a preview URL
			const objectUrl = URL.createObjectURL(file);
			setPreviewUrl(objectUrl);
			setFormData((prev) => ({
				...prev,
				imageFile: file,
			}));
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
		},
		maxFiles: 1,
		maxSize: 5242880, // 5MB
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const formDataToSend = new FormData();
			Object.entries(formData).forEach(([key, value]) => {
				if (key === 'imageFile' && value instanceof File) {
					formDataToSend.append('image', value);
				} else if (value !== undefined && value !== null) {
					formDataToSend.append(key, String(value));
				}
			});
			formDataToSend.append(
				'ingredients',
				JSON.stringify(ingredients.filter(Boolean))
			);
			formDataToSend.append(
				'instructions',
				JSON.stringify(instructions.filter(Boolean))
			);
			formDataToSend.append('tags', JSON.stringify(tags));

			const response = await fetch('/api/recipes', {
				method: 'POST',
				body: formDataToSend,
			});

			if (!response.ok) {
				throw new Error('Failed to create recipe');
			}

			toast.success('Recipe created successfully');
			onSuccess();
			onClose();
		} catch (error) {
			toast.error('Failed to create recipe');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth='md'
			fullWidth
			scroll='paper'
		>
			<DialogTitle>Add New Recipe</DialogTitle>
			<DialogContent
				dividers
				sx={{ p: 3, px: 5 }}
			>
				<form onSubmit={handleSubmit}>
					<Grid
						container
						spacing={3}
					>
						<Grid
							item
							xs={12}
						>
							<Typography
								variant='h6'
								gutterBottom
								sx={{
									color: 'primary.main',
									fontWeight: 600,
									mb: 2,
									borderBottom: '2px solid',
									borderColor: 'primary.main',
									pb: 1,
								}}
							>
								Recipe Image
							</Typography>
							<Box
								{...getRootProps()}
								sx={{
									border: '2px dashed',
									borderColor: isDragActive ? 'primary.main' : 'grey.300',
									borderRadius: 2,
									p: 3,
									textAlign: 'center',
									cursor: 'pointer',
									backgroundColor: isDragActive
										? 'action.hover'
										: 'background.paper',
									'&:hover': {
										backgroundColor: 'action.hover',
									},
								}}
							>
								<input {...getInputProps()} />
								{previewUrl ? (
									<Box sx={{ position: 'relative' }}>
										<Box
											component='img'
											src={previewUrl}
											alt='Recipe preview'
											sx={{
												maxHeight: 200,
												maxWidth: '100%',
												objectFit: 'contain',
												mb: 2,
											}}
										/>
										<Button
											variant='outlined'
											color='primary'
											startIcon={<CloudUploadIcon />}
										>
											Change Image
										</Button>
									</Box>
								) : (
									<>
										<CloudUploadIcon
											sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
										/>
										<Typography
											variant='h6'
											gutterBottom
										>
											Drag and drop an image here
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
										>
											or click to select a file
										</Typography>
										<Typography
											variant='caption'
											color='text.secondary'
											sx={{ mt: 1, display: 'block' }}
										>
											Supported formats: JPEG, PNG, WebP (max 5MB)
										</Typography>
									</>
								)}
							</Box>
						</Grid>

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
								variant='outlined'
								sx={{ mb: 2 }}
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
								variant='outlined'
								sx={{ mb: 2 }}
							/>
						</Grid>

						<Grid
							container
							spacing={2}
							sx={{ mb: 3 }}
						>
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
									variant='outlined'
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
									variant='outlined'
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
									variant='outlined'
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
									variant='outlined'
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
								<FormControl
									fullWidth
									required
									variant='outlined'
								>
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
						</Grid>

						<Grid
							item
							xs={12}
						>
							<Typography
								variant='h6'
								gutterBottom
								sx={{
									color: 'primary.main',
									fontWeight: 600,
									mt: 2,
									mb: 2,
									borderBottom: '2px solid',
									borderColor: 'primary.main',
									pb: 1,
								}}
							>
								Ingredients
							</Typography>
							<Stack spacing={2}>
								{ingredients.map((ingredient, index) => (
									<Box
										key={index}
										sx={{ display: 'flex', gap: 1 }}
									>
										<TextField
											fullWidth
											label={`Ingredient ${index + 1}`}
											value={ingredient}
											onChange={(e) =>
												handleIngredientChange(index, e.target.value)
											}
											required
											variant='outlined'
										/>
										<IconButton
											onClick={() => handleRemoveIngredient(index)}
											color='error'
											sx={{ alignSelf: 'center' }}
										>
											<DeleteIcon />
										</IconButton>
									</Box>
								))}
								<Button
									startIcon={<AddIcon />}
									onClick={handleAddIngredient}
									variant='outlined'
									color='primary'
									sx={{ alignSelf: 'flex-start' }}
								>
									Add Ingredient
								</Button>
							</Stack>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<Typography
								variant='h6'
								gutterBottom
								sx={{
									color: 'primary.main',
									fontWeight: 600,
									mt: 3,
									mb: 2,
									borderBottom: '2px solid',
									borderColor: 'primary.main',
									pb: 1,
								}}
							>
								Prep Instructions
							</Typography>
							<TextField
								fullWidth
								label='Prep Instructions'
								name='prepInstructions'
								value={formData.prepInstructions}
								onChange={handleInputChange}
								multiline
								rows={3}
								placeholder='Enter detailed prep instructions...'
								variant='outlined'
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<Typography
								variant='h6'
								gutterBottom
								sx={{
									color: 'primary.main',
									fontWeight: 600,
									mt: 3,
									mb: 2,
									borderBottom: '2px solid',
									borderColor: 'primary.main',
									pb: 1,
								}}
							>
								Cooking Instructions
							</Typography>
							<TextField
								fullWidth
								label='Cooking Instructions'
								name='cookingInstructions'
								value={formData.cookingInstructions}
								onChange={handleInputChange}
								multiline
								rows={3}
								placeholder='Enter detailed cooking instructions...'
								variant='outlined'
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<Typography
								variant='h6'
								gutterBottom
								sx={{
									color: 'primary.main',
									fontWeight: 600,
									mt: 3,
									mb: 2,
									borderBottom: '2px solid',
									borderColor: 'primary.main',
									pb: 1,
								}}
							>
								Freezer Instructions
							</Typography>
							<Stack spacing={2}>
								<TextField
									fullWidth
									label='Freezer Prep Instructions'
									name='freezerPrep'
									value={formData.freezerPrep}
									onChange={handleInputChange}
									multiline
									rows={2}
									placeholder='Enter instructions for preparing the meal for freezing...'
									variant='outlined'
								/>
								<TextField
									fullWidth
									label='Defrost Instructions'
									name='defrostInstructions'
									value={formData.defrostInstructions}
									onChange={handleInputChange}
									multiline
									rows={2}
									placeholder='Enter instructions for defrosting the meal...'
									variant='outlined'
								/>
								<Grid
									container
									spacing={2}
								>
									<Grid
										item
										xs={12}
										md={6}
									>
										<TextField
											fullWidth
											label='Storage Time'
											name='storageTime'
											value={formData.storageTime}
											onChange={handleInputChange}
											placeholder='e.g., 3 months in freezer'
											variant='outlined'
										/>
									</Grid>
									<Grid
										item
										xs={12}
										md={6}
									>
										<TextField
											fullWidth
											label='Container Suggestions'
											name='containerSuggestions'
											value={formData.containerSuggestions}
											onChange={handleInputChange}
											placeholder='e.g., Use 1-quart freezer bags or airtight containers'
											variant='outlined'
										/>
									</Grid>
								</Grid>
							</Stack>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<Typography
								variant='h6'
								gutterBottom
								sx={{
									color: 'primary.main',
									fontWeight: 600,
									mt: 3,
									mb: 2,
									borderBottom: '2px solid',
									borderColor: 'primary.main',
									pb: 1,
								}}
							>
								Serving Instructions
							</Typography>
							<TextField
								fullWidth
								label='Serving Instructions'
								name='servingInstructions'
								value={formData.servingInstructions}
								onChange={handleInputChange}
								multiline
								rows={3}
								placeholder='Enter instructions for serving the meal...'
								variant='outlined'
							/>
						</Grid>

						<Grid
							item
							xs={12}
						>
							<Typography
								variant='h6'
								gutterBottom
								sx={{
									color: 'primary.main',
									fontWeight: 600,
									mt: 3,
									mb: 2,
									borderBottom: '2px solid',
									borderColor: 'primary.main',
									pb: 1,
								}}
							>
								Tags
							</Typography>
							<Box sx={{ mb: 2 }}>
								<Stack
									direction='row'
									spacing={1}
									flexWrap='wrap'
									gap={1}
								>
									{tags.map((tag) => (
										<Chip
											key={tag}
											label={tag}
											onDelete={() => handleRemoveTag(tag)}
											color='primary'
											variant='outlined'
										/>
									))}
								</Stack>
							</Box>
							<Box sx={{ display: 'flex', gap: 1 }}>
								<TextField
									fullWidth
									label='Add Tag'
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleAddTag();
										}
									}}
									variant='outlined'
								/>
								<Button
									onClick={handleAddTag}
									variant='contained'
									color='primary'
								>
									Add
								</Button>
							</Box>
						</Grid>
					</Grid>
				</form>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={onClose}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant='contained'
					disabled={isLoading}
				>
					{isLoading ? 'Creating...' : 'Create Recipe'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
