'use client';

import {
	Box,
	Typography,
	Paper,
	Button,
	Grid,
	CircularProgress,
	Alert,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Pagination,
	IconButton,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	TextField,
	FormControlLabel,
	Switch,
	Stack,
	SelectChangeEvent,
	Snackbar,
	DialogContentText,
} from '@mui/material';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState, useCallback } from 'react';
import {
	CloudUpload as CloudUploadIcon,
	Image as ImageIcon,
	Visibility as VisibilityIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	VisibilityOff as VisibilityOffIcon,
	Refresh as RefreshIcon,
	Add as AddIcon,
	AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { clientAdminApiClient } from '@/lib/apiClient';

interface Recipe {
	_id: string;
	id?: string;
	title: string;
	imageUrl: string | null;
	hasImage: boolean;
	isPlaceholder?: boolean;
	description: string;
	servings: number;
	isPublic: boolean;
	prepTime: number;
	cookTime: number;
	ingredients: string;
	instructions: string;
	categories: string[];
	tags: string[];
	prepInstructions: string;
	cookingInstructions: string;
	freezerPrep: string;
	containerSuggestions: string;
	storageTime: string;
	defrostInstructions: string;
	servingInstructions: string;
	images?: {
		main?: string;
		thumbnail?: string;
		[key: string]: string | undefined;
	};
}

interface ImageReport {
	id: string;
	recipeId: string;
	reason: string;
	status: 'pending' | 'resolved';
	createdAt: string;
	updatedAt: string;
	imageUrl: string;
	reporterId: string;
	reporterName: string;
	reporterEmail: string;
	recipe?: Recipe;
}

interface RecipeResponse {
	recipes: Recipe[];
	pagination?: {
		totalPages: number;
	};
}

export default function RecipeManagementPage() {
	const { userId } = useAuth();
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [totalRecipes, setTotalRecipes] = useState(0);
	const [totalCustomImages, setTotalCustomImages] = useState(0);
	const [totalPlaceholders, setTotalPlaceholders] = useState(0);
	const [totalNoImages, setTotalNoImages] = useState(0);
	const [activeImageStatus, setActiveImageStatus] = useState<
		'all' | 'custom' | 'placeholder' | 'none'
	>('all');
	const [isEnsuringImages, setIsEnsuringImages] = useState(false);
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [viewImageDialogOpen, setViewImageDialogOpen] = useState(false);
	const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
	const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
	const [makeAllPublicDialogOpen, setMakeAllPublicDialogOpen] = useState(false);
	const [reportedImages, setReportedImages] = useState<ImageReport[]>([]);
	const [reportDialogOpen, setReportDialogOpen] = useState(false);
	const [selectedReport, setSelectedReport] = useState<ImageReport | null>(
		null
	);
	const [generatingImage, setGeneratingImage] = useState(false);
	const [generatingImageId, setGeneratingImageId] = useState<string | null>(
		null
	);
	const [error, setError] = useState<string | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: 'success' | 'error' | 'info' | 'warning';
	}>({
		open: false,
		message: '',
		severity: 'success',
	});

	const checkImageValidity = async (
		imageUrl: string | null
	): Promise<{ isValid: boolean; isPlaceholder: boolean }> => {
		if (!imageUrl) {
			return { isValid: false, isPlaceholder: false };
		}

		// Check for placeholder URLs
		const placeholderPatterns = [
			'placehold.co',
			'placeholder',
			'recipe-placeholder',
			'default-recipe',
			'no-image',
			'image-not-found',
		];

		const isPlaceholder = placeholderPatterns.some((pattern) =>
			imageUrl.toLowerCase().includes(pattern.toLowerCase())
		);

		if (isPlaceholder) {
			return { isValid: true, isPlaceholder: true };
		}

		try {
			// Check if the imageUrl is a Base64 string
			const isBase64 = imageUrl.startsWith('data:image/');

			if (isBase64) {
				return { isValid: true, isPlaceholder: false };
			}

			// For non-Base64 URLs, try to validate using an Image object
			const isValid = await new Promise<boolean>((resolve) => {
				const img = document.createElement('img');
				img.onload = () => {
					resolve(true);
				};
				img.onerror = () => {
					resolve(false);
				};
				img.src = imageUrl;
			});

			return { isValid, isPlaceholder: false };
		} catch (error) {
			console.error('Error checking image validity:', error);
			return { isValid: false, isPlaceholder: false };
		}
	};

	const fetchRecipes = useCallback(
		async (pageNum = 1) => {
			try {
				// Set loading state based on whether we're changing filters or loading more
				if (pageNum === 1) {
					setLoading(true);
				} else {
					setLoadingMore(true);
				}

				let params: Record<string, string> = {};
				if (activeImageStatus === 'all') {
					params = {
						page: pageNum.toString(),
						limit: pageSize.toString(),
						imageFilter: 'all',
					};
				} else {
					// Fetch all recipes for the selected filter (no pagination)
					params = { limit: '1000', imageFilter: activeImageStatus };
				}

				const data = await clientAdminApiClient.getRecipes(params);
				const recipesArray = Array.isArray(data.recipes) ? data.recipes : [];

				const recipesWithValidation = await Promise.all(
					recipesArray.map(async (recipe: Recipe) => {
						const { isValid, isPlaceholder } = await checkImageValidity(
							recipe.imageUrl
						);
						const validatedRecipe = {
							...recipe,
							hasImage: isValid,
							isPlaceholder,
							isPublic: recipe.isPublic || false,
						};
						return validatedRecipe;
					})
				);

				// Update recipes based on whether we're loading more or changing filters
				if (pageNum > 1 && activeImageStatus === 'all') {
					setRecipes((prev) => [...prev, ...recipesWithValidation]);
				} else {
					setRecipes(recipesWithValidation);
				}
				setTotalPages(data.pagination?.totalPages || 1);
			} catch (error) {
				console.error('Frontend: Error fetching recipes:', error);
				setError('Failed to fetch recipes. Please try again.');
				setRecipes([]);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[activeImageStatus, pageSize]
	);

	const fetchReportedImages = useCallback(async () => {
		try {
			const data = await clientAdminApiClient.getReportedImages();
			setReportedImages(data.reports || []);
		} catch (err) {
			setError('Failed to fetch reported images. Please try again.');
			setReportedImages([]);
			console.error('Error fetching reported images:', err);
		}
	}, []);

	const fetchTotalCounts = useCallback(async () => {
		try {
			const recipesData = await clientAdminApiClient.getRecipes({
				limit: '1000',
			});
			const recipes = recipesData.recipes || [];

			let customImages = 0;
			let placeholders = 0;
			let noImages = 0;

			recipes.forEach((recipe: Recipe) => {
				if (isCustomImage(recipe)) {
					customImages++;
				} else if (
					recipe.images &&
					recipe.images.main &&
					isPlaceholderImage(recipe.images.main)
				) {
					placeholders++;
				} else {
					noImages++;
				}
			});

			setTotalRecipes(recipes.length);
			setTotalCustomImages(customImages);
			setTotalPlaceholders(placeholders);
			setTotalNoImages(noImages);
		} catch (error) {
			console.error('Error fetching recipe counts:', error);
		}
	}, []);

	useEffect(() => {
		const checkAdminStatus = async () => {
			try {
				setLoading(true);
				const data = await clientAdminApiClient.checkStatus();
				setIsAdmin(data.isAdmin);
			} catch (error) {
				console.error('Error checking admin status:', error);
			} finally {
				setLoading(false);
			}
		};

		if (userId) {
			checkAdminStatus();
			fetchRecipes(page);
			fetchReportedImages();
			fetchTotalCounts();
		}
	}, [userId, page, fetchRecipes, fetchReportedImages, fetchTotalCounts]);

	// Add a separate loading state for initial load
	const [initialLoading, setInitialLoading] = useState(true);

	useEffect(() => {
		if (userId) {
			setInitialLoading(false);
		}
	}, [userId]);

	const handleEnsureImages = async () => {
		try {
			setIsEnsuringImages(true);
			setError(null);

			const data = await clientAdminApiClient.ensureRecipeImages({});

			// Show appropriate message based on the response
			if (data.updatedCount === 0) {
				showSnackbar('All recipes already have images', 'info');
			} else {
				const message = `Generated images for ${data.updatedCount} recipe${
					data.updatedCount === 1 ? '' : 's'
				}`;
				if (data.failedCount > 0) {
					showSnackbar(`${message} (${data.failedCount} failed)`, 'warning');
				} else {
					showSnackbar(message, 'success');
				}
			}

			await fetchRecipes(page);
		} catch (error) {
			console.error('Error generating recipe images:', error);
			showSnackbar(
				error instanceof Error
					? error.message
					: 'Failed to generate recipe images',
				'error'
			);
		} finally {
			setIsEnsuringImages(false);
		}
	};

	const handleViewImage = (recipe: Recipe) => {
		const isPlaceholder =
			recipe.imageUrl?.includes('placehold.co') ||
			recipe.imageUrl?.includes('placeholder') ||
			recipe.imageUrl?.includes('recipe-placeholder') ||
			false;

		const recipeWithStatus = {
			...recipe,
			hasImage: Boolean(recipe.imageUrl),
			isPlaceholder,
		};
		setViewingRecipe(recipeWithStatus);
		setViewImageDialogOpen(true);
	};

	const handleEditClick = (recipe: Recipe) => {
		setEditingRecipe(recipe);
		setEditDialogOpen(true);
	};

	const handleUploadClick = (recipe: Recipe) => {
		setSelectedRecipe(recipe);
		setUploadDialogOpen(true);
		setUploadError(null);
	};

	const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !selectedRecipe) return;
		try {
			setUploading(true);
			setUploadError(null);
			const formData = new FormData();
			if (!selectedRecipe._id) throw new Error('Recipe ID is required');
			formData.append('recipeId', selectedRecipe._id);
			formData.append('image', file);
			const data = await clientAdminApiClient.uploadRecipeImage(formData);
			setRecipes((prevRecipes) =>
				Array.isArray(prevRecipes)
					? prevRecipes.map((recipe) =>
							recipe.id === selectedRecipe.id
								? { ...recipe, imageUrl: data.imageUrl, hasImage: true }
								: recipe
					  )
					: []
			);
			setUploadDialogOpen(false);
		} catch (error) {
			setUploadError('Failed to upload image. Please try again.');
			console.error('Error uploading image:', error);
		} finally {
			setUploading(false);
		}
	};

	const handleImageFilterChange = (
		filter: 'all' | 'custom' | 'placeholder' | 'none'
	) => {
		setActiveImageStatus(filter);
		setPage(1); // Reset to first page when changing filter
	};

	const handlePageChange = (
		event: React.ChangeEvent<unknown>,
		value: number
	) => {
		setPage(value);
		fetchRecipes(value);
	};

	const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
		const newPageSize = Number(event.target.value);
		setPageSize(newPageSize);
		setPage(1);
	};

	const handleSaveRecipe = async () => {
		try {
			if (!editingRecipe) return;

			const recipeToSave = {
				...editingRecipe,
				id: editingRecipe._id,
				imageUrl: editingRecipe.imageUrl || null,
				isPublic: editingRecipe.isPublic || false,
			};

			const data = await clientAdminApiClient.updateRecipes(recipeToSave);

			// If this is a new recipe, add it to the list
			if (!editingRecipe._id) {
				setRecipes((prevRecipes) => [...prevRecipes, data]);
			} else {
				// If editing, update the existing recipe
				setRecipes((prevRecipes) =>
					prevRecipes.map((recipe) =>
						recipe._id === editingRecipe._id ? data : recipe
					)
				);
			}

			setEditDialogOpen(false);
			setEditingRecipe(null);

			await new Promise((resolve) => setTimeout(resolve, 500));
			await fetchRecipes(page);
			showSnackbar(
				editingRecipe._id
					? 'Recipe updated successfully'
					: 'Recipe added successfully'
			);
		} catch (error) {
			console.error('Error saving recipe:', error);
			showSnackbar(
				error instanceof Error ? error.message : 'Failed to save recipe',
				'error'
			);
		}
	};

	const handleDeleteClick = (recipe: Recipe) => {
		setRecipeToDelete(recipe);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!recipeToDelete) return;

		try {
			await clientAdminApiClient.deleteRecipe(recipeToDelete._id);

			// Update the recipes list
			setRecipes((prevRecipes) =>
				prevRecipes.filter((recipe) => recipe._id !== recipeToDelete._id)
			);

			// Update counts
			await fetchTotalCounts();

			setDeleteDialogOpen(false);
			setRecipeToDelete(null);
			showSnackbar('Recipe deleted successfully');
		} catch (error) {
			console.error('Error deleting recipe:', error);
			showSnackbar('Failed to delete recipe', 'error');
		}
	};

	const handleVisibilityToggle = async (recipe: Recipe) => {
		try {
			const updateData = {
				id: recipe._id,
				isPublic: !recipe.isPublic,
				title: recipe.title,
				description: recipe.description,
				servings: recipe.servings,
				prepTime: recipe.prepTime,
				cookTime: recipe.cookTime,
				ingredients: recipe.ingredients,
				instructions: recipe.instructions,
				tags: recipe.tags,
				prepInstructions: recipe.prepInstructions,
				cookingInstructions: recipe.cookingInstructions,
				freezerPrep: recipe.freezerPrep,
				containerSuggestions: recipe.containerSuggestions,
				storageTime: recipe.storageTime,
				defrostInstructions: recipe.defrostInstructions,
				servingInstructions: recipe.servingInstructions,
				imageUrl: recipe.imageUrl,
			};

			const updatedRecipe = await clientAdminApiClient.updateRecipes(
				updateData
			);

			setRecipes((prevRecipes) =>
				prevRecipes.map((r) =>
					r._id === recipe._id ? { ...r, isPublic: !recipe.isPublic } : r
				)
			);

			showSnackbar(`Recipe is now ${!recipe.isPublic ? 'public' : 'private'}`);
		} catch (error) {
			console.error('Error updating recipe visibility:', error);
			showSnackbar('Failed to update recipe visibility', 'error');
		}
	};

	const handleResolveReport = async (reportId: string) => {
		try {
			await clientAdminApiClient.updateReportedImages({
				reportId,
				status: 'resolved',
			});
			showSnackbar('Report marked as resolved');
			fetchReportedImages();
		} catch (err) {
			showSnackbar('Failed to resolve report', 'error');
		}
	};

	const handleDeleteAllConfirm = async () => {
		try {
			await clientAdminApiClient.deleteAllRecipes();

			// Clear the recipes list
			setRecipes([]);

			// Reset counts
			setTotalRecipes(0);
			setTotalCustomImages(0);
			setTotalPlaceholders(0);
			setTotalNoImages(0);

			setDeleteAllDialogOpen(false);
			showSnackbar('All recipes deleted successfully');
		} catch (error) {
			console.error('Error deleting all recipes:', error);
			showSnackbar('Failed to delete all recipes', 'error');
		}
	};

	async function pollImageJobStatus(
		recipeId: string,
		onSuccess: (image: string) => void,
		onError: (errMsg: string) => void,
		maxAttempts = 60,
		interval = 2000
	) {
		let attempts = 0;
		while (attempts < maxAttempts) {
			try {
				const data = await clientAdminApiClient.getRecipeImageStatus(recipeId);

				// Check for error state
				if (data.error) {
					onError(data.error);
					return;
				}

				// Check for completed state with image
				if (data.image && data.image.startsWith('data:image/')) {
					onSuccess(data.image);
					return;
				}

				// Check for failed state
				if (data.status === 'failed') {
					onError(data.error || 'Image generation failed');
					return;
				}

				// Check for completed state without image
				if (data.status === 'completed' && !data.image) {
					onError('Image generation completed but no image was returned');
					return;
				}

				// Track progress updates
				if (data.progress !== undefined && data.total !== undefined) {
					// Progress tracking for UI updates if needed
				}
			} catch (err) {
				console.error('Error polling image status:', err);
				// Don't return on error, just continue polling
			}
			await new Promise((resolve) => setTimeout(resolve, interval));
			attempts++;
		}
		onError('Image generation timed out after 2 minutes.');
	}

	const handleGenerateImage = async (recipe: Recipe) => {
		try {
			setGeneratingImage(true);
			setGeneratingImageId(recipe._id);
			const data = await clientAdminApiClient.generateRecipeImage({
				recipeId: recipe._id,
			});
			if (data.imageUrl) {
				// Immediate image
				setRecipes((prevRecipes) =>
					prevRecipes.map((r) =>
						r._id === recipe._id
							? {
									...r,
									imageUrl: data.imageUrl,
									hasImage: true,
									isPlaceholder: false,
							  }
							: r
					)
				);
				if (viewingRecipe?._id === recipe._id) {
					setViewingRecipe((prev) => ({
						...prev!,
						imageUrl: data.imageUrl,
						hasImage: true,
						isPlaceholder: false,
					}));
				}
				await fetchRecipes(page);
				showSnackbar('Image generated successfully');
			} else if (data.jobId) {
				// Job-based async image generation
				showSnackbar(
					'Image generation started. Waiting for completion...',
					'info'
				);
				await pollImageJobStatus(
					data.jobId,
					(image: string) => {
						setRecipes((prevRecipes) =>
							prevRecipes.map((r) =>
								r._id === recipe._id
									? {
											...r,
											imageUrl: image,
											hasImage: true,
											isPlaceholder: false,
									  }
									: r
							)
						);
						if (viewingRecipe?._id === recipe._id) {
							setViewingRecipe((prev) => ({
								...prev!,
								imageUrl: image,
								hasImage: true,
								isPlaceholder: false,
							}));
						}
						fetchRecipes(page);
						showSnackbar('Image generated successfully');
					},
					(errMsg: string) => {
						showSnackbar(errMsg, 'error');
					}
				);
			} else {
				throw new Error('No image URL or jobId returned from recipe service');
			}
		} catch (error) {
			console.error('Error generating image:', error);
			showSnackbar(
				error instanceof Error ? error.message : 'Failed to generate image',
				'error'
			);
		} finally {
			setGeneratingImage(false);
			setGeneratingImageId(null);
		}
	};

	const handleUploadReportImage = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file || !selectedReport) return;

		try {
			setUploading(true);
			const formData = new FormData();
			formData.append('recipeId', selectedReport.recipeId);
			formData.append('image', file);

			const data = await clientAdminApiClient.uploadRecipeImage(formData);

			// Update the recipe in the list
			setRecipes((prevRecipes) =>
				prevRecipes.map((recipe) =>
					recipe.id === selectedReport.recipeId
						? { ...recipe, imageUrl: data.imageUrl, hasImage: true }
						: recipe
				)
			);

			// Resolve the report
			await handleResolveReport(selectedReport.id);
			setReportDialogOpen(false);
			showSnackbar('Image uploaded successfully');
		} catch (error) {
			console.error('Error uploading image:', error);
			showSnackbar('Failed to upload image', 'error');
		} finally {
			setUploading(false);
		}
	};

	const handleMakeAllPublic = async () => {
		try {
			await clientAdminApiClient.makeAllRecipesPublic();

			await fetchRecipes(page);
			setMakeAllPublicDialogOpen(false);
			showSnackbar('All recipes are now public');
		} catch (error) {
			console.error('Error making all recipes public:', error);
			showSnackbar('Failed to make all recipes public', 'error');
		}
	};

	const showSnackbar = (
		message: string,
		severity: 'success' | 'error' | 'info' | 'warning' = 'success'
	) => {
		setSnackbar({ open: true, message, severity });
	};

	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	// Helper to check for a custom image
	function isCustomImage(recipe: Recipe) {
		return (
			recipe.images &&
			typeof recipe.images.main === 'string' &&
			recipe.images.main.startsWith('data:image/') &&
			!isPlaceholderImage(recipe.images.main)
		);
	}
	// Helper to check for a placeholder image
	function isPlaceholderImage(image: string | undefined) {
		if (!image) return false;
		const placeholderPatterns = [
			'placehold.co',
			'placeholder',
			'recipe-placeholder',
			'default-recipe',
			'no-image',
			'image-not-found',
		];
		return placeholderPatterns.some((pattern) =>
			image.toLowerCase().includes(pattern)
		);
	}

	if (initialLoading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '200px',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (!isAdmin) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography
					variant='h4'
					color='error'
					gutterBottom
				>
					Access Denied
				</Typography>
				<Typography>You do not have permission to access this page.</Typography>
			</Box>
		);
	}

	// Filter recipes before rendering the list
	const filteredRecipes = recipes.filter((recipe) => {
		if (activeImageStatus === 'all') return true;
		if (activeImageStatus === 'custom') return isCustomImage(recipe);
		if (activeImageStatus === 'placeholder')
			return (
				recipe.images &&
				recipe.images.main &&
				isPlaceholderImage(recipe.images.main)
			);
		if (activeImageStatus === 'none')
			return (
				!isCustomImage(recipe) &&
				!(
					recipe.images &&
					recipe.images.main &&
					isPlaceholderImage(recipe.images.main)
				)
			);
		return true;
	});

	return (
		<Box sx={{ p: { xs: 2, md: 4 } }}>
			<Typography
				variant='h4'
				component='h1'
				gutterBottom
				sx={{
					fontWeight: 800,
					letterSpacing: 1,
					mb: 4,
					fontSize: {
						xs: '1.5rem',
						sm: '1.875rem',
						md: '2.25rem',
					},
				}}
			>
				Recipe Management
			</Typography>

			<Paper
				elevation={3}
				sx={{ p: 4, mb: 4 }}
			>
				<Typography
					variant='body1'
					color='text.secondary'
					sx={{ mb: 4 }}
				>
					Manage and edit recipes in the system.
				</Typography>

				<Box sx={{ mb: 4 }}>
					<Grid
						container
						spacing={2}
						sx={{ mb: 2 }}
						key='action-buttons-container'
					>
						<Grid
							item
							xs={6}
							sm={3}
							md={2}
							key='fetch-images-button'
						>
							<Button
								variant='contained'
								fullWidth
								onClick={handleEnsureImages}
								disabled={isEnsuringImages}
								startIcon={
									isEnsuringImages ? (
										<CircularProgress
											size={20}
											color='inherit'
										/>
									) : (
										<AutoAwesomeIcon />
									)
								}
								sx={{ height: { xs: '48px', md: 'auto' } }}
							>
								{isEnsuringImages ? 'Generating...' : 'Generate Images'}
							</Button>
						</Grid>
						<Grid
							item
							xs={6}
							sm={3}
							md={2}
							key='add-recipe-button'
						>
							<Button
								variant='contained'
								fullWidth
								onClick={() => {
									setEditingRecipe({
										_id: '',
										title: '',
										description: '',
										servings: 0,
										prepTime: 0,
										cookTime: 0,
										ingredients: '',
										instructions: '',
										categories: [],
										tags: [],
										prepInstructions: '',
										cookingInstructions: '',
										freezerPrep: '',
										containerSuggestions: '',
										storageTime: '',
										defrostInstructions: '',
										servingInstructions: '',
										imageUrl: null,
										hasImage: false,
										isPublic: false,
									});
									setEditDialogOpen(true);
								}}
								startIcon={<AddIcon />}
								sx={{ height: { xs: '48px', md: 'auto' } }}
							>
								Add Recipe
							</Button>
						</Grid>
						<Grid
							item
							xs={6}
							sm={3}
							md={2}
							key='generate-recipes-button'
						>
							<Button
								variant='contained'
								fullWidth
								href='/recipes/generate'
								startIcon={<AutoAwesomeIcon />}
								sx={{ height: { xs: '48px', md: 'auto' } }}
							>
								Generate Recipes
							</Button>
						</Grid>
						<Grid
							item
							xs={6}
							sm={3}
							md={2}
							key='reports-button'
						>
							<Button
								variant='outlined'
								fullWidth
								onClick={fetchReportedImages}
								startIcon={<RefreshIcon />}
								color={reportedImages.length > 0 ? 'warning' : 'primary'}
								sx={{ height: { xs: '48px', md: 'auto' } }}
							>
								{reportedImages.length > 0
									? `${reportedImages.length} Reports`
									: 'No Reports'}
							</Button>
						</Grid>
						<Grid
							item
							xs={6}
							sm={3}
							md={2}
							key='make-all-public-button'
						>
							<Button
								variant='outlined'
								fullWidth
								onClick={() => setMakeAllPublicDialogOpen(true)}
								color='success'
								startIcon={<VisibilityIcon />}
								sx={{ height: { xs: '48px', md: 'auto' } }}
							>
								Make All Public
							</Button>
						</Grid>
						<Grid
							item
							xs={6}
							sm={3}
							md={2}
							key='delete-all-button'
						>
							<Button
								variant='outlined'
								fullWidth
								onClick={() => setDeleteAllDialogOpen(true)}
								color='error'
								startIcon={<DeleteIcon />}
								sx={{ height: { xs: '48px', md: 'auto' } }}
							>
								Delete All
							</Button>
						</Grid>
					</Grid>

					<Box sx={{ mb: 3 }}>
						<Stack
							direction='row'
							spacing={1}
							alignItems='center'
						>
							<Chip
								label={`All (${totalRecipes})`}
								onClick={() => setActiveImageStatus('all')}
								color='primary'
								variant='filled'
								sx={{
									fontWeight: 'bold',
									cursor: 'pointer',
									transform:
										activeImageStatus === 'all' ? 'scale(1.08)' : 'scale(1)',
									border:
										activeImageStatus === 'all' ? '2px solid #1976d2' : 'none',
									transition: 'transform 0.2s, border 0.2s',
								}}
							/>
							<Chip
								label={`Custom Images (${totalCustomImages})`}
								onClick={() => setActiveImageStatus('custom')}
								color='success'
								variant='filled'
								sx={{
									fontWeight: 'bold',
									cursor: 'pointer',
									transform:
										activeImageStatus === 'custom' ? 'scale(1.08)' : 'scale(1)',
									border:
										activeImageStatus === 'custom'
											? '2px solid #388e3c'
											: 'none',
									transition: 'transform 0.2s, border 0.2s',
								}}
							/>
							<Chip
								label={`Placeholders (${totalPlaceholders})`}
								onClick={() => setActiveImageStatus('placeholder')}
								color='warning'
								variant='filled'
								sx={{
									fontWeight: 'bold',
									cursor: 'pointer',
									transform:
										activeImageStatus === 'placeholder'
											? 'scale(1.08)'
											: 'scale(1)',
									border:
										activeImageStatus === 'placeholder'
											? '2px solid #f57c00'
											: 'none',
									transition: 'transform 0.2s, border 0.2s',
								}}
							/>
							<Chip
								label={`No Images (${totalNoImages})`}
								onClick={() => setActiveImageStatus('none')}
								color='error'
								variant='filled'
								sx={{
									fontWeight: 'bold',
									cursor: 'pointer',
									transform:
										activeImageStatus === 'none' ? 'scale(1.08)' : 'scale(1)',
									border:
										activeImageStatus === 'none' ? '2px solid #d32f2f' : 'none',
									transition: 'transform 0.2s, border 0.2s',
								}}
							/>
						</Stack>
					</Box>
				</Box>

				<Grid
					container
					spacing={2}
					key='recipe-list-container'
				>
					{/* Show loading skeleton for initial load only */}
					{loading &&
						recipes.length === 0 &&
						Array.from(new Array(3)).map((_, index) => (
							<Grid
								item
								xs={12}
								key={`skeleton-${index}`}
							>
								<Paper
									elevation={0}
									sx={{
										p: 2,
										borderRadius: 2,
										border: '1px solid',
										borderColor: 'divider',
										background: 'rgba(0, 0, 0, 0.02)',
									}}
								>
									<Grid
										container
										spacing={2}
										alignItems='center'
									>
										<Grid
											item
											xs={12}
											sm={6}
										>
											<Box
												sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
											>
												<Box
													sx={{
														width: '60%',
														height: 24,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
												<Box
													sx={{
														width: 40,
														height: 40,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
											</Box>
										</Grid>
										<Grid
											item
											xs={12}
											sm={3}
										>
											<Box
												sx={{
													width: '100%',
													height: 32,
													bgcolor: 'rgba(0, 0, 0, 0.08)',
													borderRadius: 1,
													animation: 'pulse 1.5s ease-in-out infinite',
												}}
											/>
										</Grid>
										<Grid
											item
											xs={12}
											sm={3}
										>
											<Box sx={{ display: 'flex', gap: 1 }}>
												<Box
													sx={{
														flex: 1,
														height: 36,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
												<Box
													sx={{
														flex: 1,
														height: 36,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
												<Box
													sx={{
														flex: 1,
														height: 36,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
											</Box>
										</Grid>
									</Grid>
								</Paper>
							</Grid>
						))}

					{/* Show existing recipes */}
					{filteredRecipes.map((recipe) => (
						<Grid
							item
							xs={12}
							key={recipe._id || recipe.id}
						>
							<Paper
								key={`${recipe._id || recipe.id}-paper`}
								elevation={0}
								sx={{
									p: 2,
									borderRadius: 2,
									border: '1px solid',
									borderColor: isCustomImage(recipe)
										? 'success.light'
										: recipe.images &&
										  recipe.images.main &&
										  isPlaceholderImage(recipe.images.main)
										? 'warning.light'
										: 'error.light',
									background: isCustomImage(recipe)
										? 'rgba(76, 175, 80, 0.08)'
										: recipe.images &&
										  recipe.images.main &&
										  isPlaceholderImage(recipe.images.main)
										? 'rgba(255, 193, 7, 0.08)'
										: 'rgba(244, 67, 54, 0.08)',
									transition: 'all 0.2s ease-in-out',
									'&:hover': {
										transform: 'translateY(-2px)',
										boxShadow: 2,
									},
								}}
							>
								<Grid
									container
									spacing={2}
									alignItems='center'
									key={`${recipe._id || recipe.id}-container`}
								>
									<Grid
										item
										xs={12}
										sm={6}
										key={`${recipe._id || recipe.id}-title`}
									>
										<Box
											key={`${recipe._id || recipe.id}-title-box`}
											sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
										>
											<Typography
												variant='subtitle1'
												sx={{
													fontWeight: 600,
													color: isCustomImage(recipe)
														? 'success.main'
														: recipe.images &&
														  recipe.images.main &&
														  isPlaceholderImage(recipe.images.main)
														? 'warning.main'
														: 'error.main',
												}}
											>
												{recipe.title}
											</Typography>
											<IconButton
												key={`${recipe._id || recipe.id}-visibility-toggle`}
												onClick={() => handleVisibilityToggle(recipe)}
												size='small'
												title={
													recipe.isPublic ? 'Public Recipe' : 'Private Recipe'
												}
											>
												{recipe.isPublic ? (
													<VisibilityIcon color='primary' />
												) : (
													<VisibilityOffIcon color='disabled' />
												)}
											</IconButton>
										</Box>
									</Grid>
									<Grid
										item
										xs={12}
										sm={3}
										key={`${recipe._id || recipe.id}-status`}
									>
										<Chip
											label={
												isCustomImage(recipe)
													? 'CUSTOM IMAGE'
													: recipe.images &&
													  recipe.images.main &&
													  isPlaceholderImage(recipe.images.main)
													? 'PLACEHOLDER'
													: 'NO IMAGE'
											}
											color={
												isCustomImage(recipe)
													? 'success'
													: recipe.images &&
													  recipe.images.main &&
													  isPlaceholderImage(recipe.images.main)
													? 'warning'
													: 'error'
											}
											sx={{
												width: '100%',
												fontWeight: 600,
												'& .MuiChip-label': {
													px: 2,
												},
											}}
										/>
									</Grid>
									<Grid
										item
										xs={12}
										sm={3}
										key={`${recipe._id || recipe.id}-actions`}
									>
										<Box
											key={`${recipe._id || recipe.id}-actions-box`}
											sx={{ display: 'flex', gap: 1 }}
										>
											<Button
												key={`${recipe._id || recipe.id}-view-button`}
												variant='outlined'
												size='small'
												onClick={() => handleViewImage(recipe)}
												sx={{
													flex: 1,
													borderRadius: 2,
													textTransform: 'none',
													fontWeight: 600,
													borderColor: recipe.hasImage
														? recipe.isPlaceholder
															? 'warning.main'
															: 'success.main'
														: 'error.main',
													color: recipe.hasImage
														? recipe.isPlaceholder
															? 'warning.main'
															: 'success.main'
														: 'error.main',
													'&:hover': {
														backgroundColor: recipe.hasImage
															? recipe.isPlaceholder
																? 'warning.main'
																: 'success.main'
															: 'error.main',
														borderColor: 'inherit',
														color: 'white',
													},
												}}
												startIcon={<VisibilityIcon />}
											>
												View
											</Button>
											<Button
												key={`${recipe._id || recipe.id}-edit-button`}
												variant='outlined'
												size='small'
												onClick={() => handleEditClick(recipe)}
												sx={{
													flex: 1,
													borderRadius: 2,
													textTransform: 'none',
													fontWeight: 600,
													borderColor: 'primary.main',
													color: 'primary.main',
													'&:hover': {
														backgroundColor: 'primary.main',
														borderColor: 'inherit',
														color: 'white',
													},
												}}
												startIcon={<EditIcon />}
											>
												Edit
											</Button>
											<Button
												key={`${recipe._id || recipe.id}-delete-button`}
												variant='outlined'
												size='small'
												onClick={() => handleDeleteClick(recipe)}
												sx={{
													flex: 1,
													borderRadius: 2,
													textTransform: 'none',
													fontWeight: 600,
													borderColor: 'error.main',
													color: 'error.main',
													'&:hover': {
														backgroundColor: 'error.main',
														borderColor: 'inherit',
														color: 'white',
													},
												}}
												startIcon={<DeleteIcon />}
											>
												Delete
											</Button>
										</Box>
									</Grid>
								</Grid>
							</Paper>
						</Grid>
					))}

					{/* Show loading skeleton for loading more or filter changes */}
					{(loading || loadingMore) &&
						recipes.length > 0 &&
						Array.from(new Array(3)).map((_, index) => (
							<Grid
								item
								xs={12}
								key={`skeleton-more-${index}`}
							>
								<Paper
									elevation={0}
									sx={{
										p: 2,
										borderRadius: 2,
										border: '1px solid',
										borderColor: 'divider',
										background: 'rgba(0, 0, 0, 0.02)',
									}}
								>
									<Grid
										container
										spacing={2}
										alignItems='center'
									>
										<Grid
											item
											xs={12}
											sm={6}
										>
											<Box
												sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
											>
												<Box
													sx={{
														width: '60%',
														height: 24,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
												<Box
													sx={{
														width: 40,
														height: 40,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
											</Box>
										</Grid>
										<Grid
											item
											xs={12}
											sm={3}
										>
											<Box
												sx={{
													width: '100%',
													height: 32,
													bgcolor: 'rgba(0, 0, 0, 0.08)',
													borderRadius: 1,
													animation: 'pulse 1.5s ease-in-out infinite',
												}}
											/>
										</Grid>
										<Grid
											item
											xs={12}
											sm={3}
										>
											<Box sx={{ display: 'flex', gap: 1 }}>
												<Box
													sx={{
														flex: 1,
														height: 36,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
												<Box
													sx={{
														flex: 1,
														height: 36,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
												<Box
													sx={{
														flex: 1,
														height: 36,
														bgcolor: 'rgba(0, 0, 0, 0.08)',
														borderRadius: 1,
														animation: 'pulse 1.5s ease-in-out infinite',
													}}
												/>
											</Box>
										</Grid>
									</Grid>
								</Paper>
							</Grid>
						))}
				</Grid>
			</Paper>

			{/* View Image Dialog */}
			<Dialog
				open={viewImageDialogOpen}
				onClose={() => setViewImageDialogOpen(false)}
				maxWidth='md'
				fullWidth
			>
				<DialogTitle>{viewingRecipe?.title} - Image Preview</DialogTitle>
				<DialogContent>
					<Box
						sx={{ position: 'relative', width: '100%', height: '400px', mt: 2 }}
					>
						{viewingRecipe?.images?.main ? (
							<Image
								src={viewingRecipe.images.main}
								alt={viewingRecipe.title}
								fill
								style={{ objectFit: 'contain' }}
							/>
						) : (
							<Box
								sx={{
									width: '100%',
									height: '100%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: 'grey.100',
								}}
							>
								<Typography color='text.secondary'>
									No image available
								</Typography>
							</Box>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					{viewingRecipe && (
						<>
							<Button
								onClick={() => handleUploadClick(viewingRecipe)}
								startIcon={<CloudUploadIcon />}
							>
								Upload New Image
							</Button>
							{(!viewingRecipe.hasImage || viewingRecipe.isPlaceholder) && (
								<Button
									onClick={() => handleGenerateImage(viewingRecipe)}
									disabled={
										generatingImage && generatingImageId === viewingRecipe._id
									}
									startIcon={
										generatingImage &&
										generatingImageId === viewingRecipe._id ? (
											<CircularProgress size={20} />
										) : (
											<AutoAwesomeIcon />
										)
									}
									color='primary'
								>
									{generatingImage && generatingImageId === viewingRecipe._id
										? 'Generating...'
										: 'Generate Image'}
								</Button>
							)}
						</>
					)}
					<Button onClick={() => setViewImageDialogOpen(false)}>Close</Button>
				</DialogActions>
			</Dialog>

			{/* Edit/Add Recipe Dialog */}
			<Dialog
				open={editDialogOpen}
				onClose={() => {
					setEditDialogOpen(false);
					setEditingRecipe(null);
				}}
				maxWidth='md'
				fullWidth
			>
				<DialogTitle>
					{editingRecipe?._id ? 'Edit Recipe' : 'Add New Recipe'}
				</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
						<TextField
							label='Title'
							fullWidth
							required
							value={editingRecipe?.title || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									title: e.target.value,
								}))
							}
						/>
						<TextField
							label='Description'
							fullWidth
							multiline
							rows={3}
							value={editingRecipe?.description || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									description: e.target.value,
								}))
							}
						/>
						<Grid
							container
							spacing={2}
						>
							<Grid
								item
								xs={12}
								sm={4}
							>
								<TextField
									label='Servings'
									type='number'
									fullWidth
									value={editingRecipe?.servings || ''}
									onChange={(e) =>
										setEditingRecipe((prev) => ({
											...prev!,
											servings: parseInt(e.target.value) || 0,
										}))
									}
								/>
							</Grid>
							<Grid
								item
								xs={12}
								sm={4}
							>
								<TextField
									label='Prep Time (minutes)'
									type='number'
									fullWidth
									value={editingRecipe?.prepTime || ''}
									onChange={(e) =>
										setEditingRecipe((prev) => ({
											...prev!,
											prepTime: parseInt(e.target.value) || 0,
										}))
									}
								/>
							</Grid>
							<Grid
								item
								xs={12}
								sm={4}
							>
								<TextField
									label='Cook Time (minutes)'
									type='number'
									fullWidth
									value={editingRecipe?.cookTime || ''}
									onChange={(e) =>
										setEditingRecipe((prev) => ({
											...prev!,
											cookTime: parseInt(e.target.value) || 0,
										}))
									}
								/>
							</Grid>
						</Grid>
						<TextField
							label='Ingredients'
							fullWidth
							multiline
							rows={4}
							value={editingRecipe?.ingredients || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									ingredients: e.target.value,
								}))
							}
							helperText='Enter each ingredient on a new line'
						/>
						<TextField
							label='Instructions'
							fullWidth
							multiline
							rows={4}
							value={editingRecipe?.instructions || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									instructions: e.target.value,
								}))
							}
							helperText='Enter each step on a new line'
						/>
						<TextField
							label='Categories'
							fullWidth
							value={editingRecipe?.categories?.join(', ') || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									categories: e.target.value
										.split(',')
										.map((cat) => cat.trim())
										.filter(Boolean),
								}))
							}
							helperText='Enter categories separated by commas'
						/>
						<TextField
							label='Tags'
							fullWidth
							value={editingRecipe?.tags?.join(', ') || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									tags: e.target.value
										.split(',')
										.map((tag) => tag.trim())
										.filter(Boolean),
								}))
							}
							helperText='Enter tags separated by commas'
						/>
						<TextField
							label='Prep Instructions'
							fullWidth
							multiline
							rows={3}
							value={editingRecipe?.prepInstructions || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									prepInstructions: e.target.value,
								}))
							}
						/>
						<TextField
							label='Cooking Instructions'
							fullWidth
							multiline
							rows={3}
							value={editingRecipe?.cookingInstructions || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									cookingInstructions: e.target.value,
								}))
							}
						/>
						<TextField
							label='Freezer Prep'
							fullWidth
							multiline
							rows={2}
							value={editingRecipe?.freezerPrep || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									freezerPrep: e.target.value,
								}))
							}
						/>
						<TextField
							label='Container Suggestions'
							fullWidth
							multiline
							rows={2}
							value={editingRecipe?.containerSuggestions || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									containerSuggestions: e.target.value,
								}))
							}
						/>
						<TextField
							label='Storage Time'
							fullWidth
							value={editingRecipe?.storageTime || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									storageTime: e.target.value,
								}))
							}
						/>
						<TextField
							label='Defrost Instructions'
							fullWidth
							multiline
							rows={2}
							value={editingRecipe?.defrostInstructions || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									defrostInstructions: e.target.value,
								}))
							}
						/>
						<TextField
							label='Serving Instructions'
							fullWidth
							multiline
							rows={2}
							value={editingRecipe?.servingInstructions || ''}
							onChange={(e) =>
								setEditingRecipe((prev) => ({
									...prev!,
									servingInstructions: e.target.value,
								}))
							}
						/>
						<FormControlLabel
							control={
								<Switch
									checked={editingRecipe?.isPublic || false}
									onChange={(e) =>
										setEditingRecipe((prev) => ({
											...prev!,
											isPublic: e.target.checked,
										}))
									}
								/>
							}
							label='Public Recipe'
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setEditDialogOpen(false);
							setEditingRecipe(null);
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSaveRecipe}
						variant='contained'
						color='primary'
					>
						{editingRecipe?._id ? 'Save Changes' : 'Add Recipe'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
			>
				<DialogTitle>Delete Recipe</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete &quot;{recipeToDelete?.title}&quot;?
						This action cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleDeleteConfirm}
						color='error'
						variant='contained'
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete All Confirmation Dialog */}
			<Dialog
				open={deleteAllDialogOpen}
				onClose={() => setDeleteAllDialogOpen(false)}
			>
				<DialogTitle>Delete All Recipes</DialogTitle>
				<DialogContent>
					<Typography
						color='error'
						sx={{ mb: 2 }}
					>
						Warning: This action cannot be undone!
					</Typography>
					<Typography>
						Are you sure you want to delete all recipes? This will permanently
						remove all recipes from the system.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleDeleteAllConfirm}
						color='error'
						variant='contained'
					>
						Delete All
					</Button>
				</DialogActions>
			</Dialog>

			{/* Make All Public Confirmation Dialog */}
			<Dialog
				open={makeAllPublicDialogOpen}
				onClose={() => setMakeAllPublicDialogOpen(false)}
			>
				<DialogTitle>Make All Recipes Public</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to make all recipes public? This action cannot
						be undone.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setMakeAllPublicDialogOpen(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleMakeAllPublic}
						color='success'
						variant='contained'
					>
						Make Public
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar for notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: '100%' }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>

			{/* Pagination */}
			{activeImageStatus === 'all' && totalPages > 1 && (
				<Pagination
					count={totalPages}
					page={page}
					onChange={handlePageChange}
					sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
				/>
			)}
		</Box>
	);
}
