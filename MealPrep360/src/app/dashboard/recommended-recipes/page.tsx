'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '../../components/ui/snackbar';
import { useSettings } from '@/hooks/use-settings';
import {
	Box,
	Typography,
	CircularProgress,
	Grid,
	TextField,
	InputAdornment,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Chip,
	Stack,
	Paper,
	Pagination,
	SelectChangeEvent,
	Skeleton,
	Tabs,
	Tab,
	Button,
	Card,
	CardContent,
	CardMedia,
	IconButton,
	Snackbar,
	Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuBook from '@mui/icons-material/MenuBook';
import SortIcon from '@mui/icons-material/Sort';
import FlagIcon from '@mui/icons-material/Flag';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { SavedRecipeCard } from '../../components/shared/saved-recipe-card';
import { PageHeader } from '../../components/shared/page-header';
import { RecipeSkeleton } from '../../components/shared/recipe-skeleton';
import { FiltersSkeleton } from '../../components/shared/filters-skeleton';
import { useTranslations } from '@/hooks/use-translations';

interface Recipe {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	imageBase64: string;
	ingredients: string[];
	instructions: string;
	prepInstructions: string;
	cookingInstructions: string;
	defrostInstructions: string;
	servingInstructions: string;
	storageTime: string;
	containerSuggestions: string;
	tags: string[];
	servings: number;
	prepTime: number;
	cookTime: number;
	freezerPrep: string;
	isPublic: boolean;
	hasImage: boolean;
	createdAt: string;
	updatedAt: string;
	isSaved?: boolean;
}

interface PaginationData {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role='tabpanel'
			hidden={value !== index}
			id={`recipes-tabpanel-${index}`}
			aria-labelledby={`recipes-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `recipes-tab-${index}`,
		'aria-controls': `recipes-tabpanel-${index}`,
	};
}

export default function DashboardRecipesPage() {
	const { isLoaded, isSignedIn, getToken } = useAuth();
	const { user } = useUser();
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const { settings, updateSettings } = useSettings();
	const translations = useTranslations();

	const [mounted, setMounted] = useState(false);
	const [tabValue, setTabValue] = useState(0);

	// Recommended Recipes State
	const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
	const [recommendedLoading, setRecommendedLoading] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
	const [recommendedPage, setRecommendedPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [totalRecommended, setTotalRecommended] = useState(0);

	// All Recipes State
	const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
	const [allRecipesLoading, setAllRecipesLoading] = useState(true);
	const [allRecipesError, setAllRecipesError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [availableTags, setAvailableTags] = useState<string[]>([]);
	const [pagination, setPagination] = useState<PaginationData>({
		total: 0,
		page: 1,
		limit: 9,
		totalPages: 1,
	});
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState('desc');
	const [prepTimeFilter, setPrepTimeFilter] = useState('all');

	// Snackbar State
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: 'success' | 'error' | 'info' | 'warning';
	}>({
		open: false,
		message: '',
		severity: 'info',
	});

	useEffect(() => {
		setMounted(true);
	}, []);

	// Fetch Recommended Recipes
	const fetchRecommendedRecipes = async () => {
		if (!mounted || !isLoaded || !isSignedIn) {
			setRecommendedLoading(false);
			return;
		}

		const abortController = new AbortController();
		setRecommendedLoading(true);

		try {
			const token = await getToken();
			const response = await fetch(
				`/api/recipes/recommended?page=${recommendedPage}&limit=20`,
				{
					signal: abortController.signal,
					credentials: 'include',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				}
			);

			if (response.status === 503) {
				if (!abortController.signal.aborted) {
					setRecommendedRecipes([]);
					setHasMore(false);
					setTotalRecommended(0);
				}
				return;
			}

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			if (!abortController.signal.aborted) {
				// Handle the flat API response structure and missing recipes array
				const recipesArray = Array.isArray(data.recipes) ? data.recipes : [];
				const recipesWithSavedStatus = recipesArray.map((recipe: any) => ({
					...recipe,
					isSaved: recipe.saved || false,
				}));

				setRecommendedRecipes((prevRecipes) =>
					recommendedPage === 1
						? recipesWithSavedStatus
						: [...prevRecipes, ...recipesWithSavedStatus]
				);

				// Handle the flat API response structure
				// Safely extract values with fallbacks for missing properties
				const totalRecipes = typeof data.total === 'number' ? data.total : 0;
				const currentPage = typeof data.page === 'number' ? data.page : 1;
				const limit = typeof data.limit === 'number' ? data.limit : 20;
				const loadedRecipes =
					recipesWithSavedStatus.length +
					(recommendedPage === 1 ? 0 : recommendedRecipes.length);

				// Only show "Load More" if there are actually more recipes to load
				setHasMore(totalRecipes > 0 && loadedRecipes < totalRecipes);
				setTotalRecommended(totalRecipes);

				// If no recipes are available and there's a message, it could indicate external API issues
				if (recipesArray.length === 0 && data.message) {
					console.info('Recommended recipes API response:', data.message);
				}
			}
		} catch (error) {
			console.error('Error fetching recommended recipes:', error);
			setSnackbar({
				open: true,
				message: 'Failed to load recommended recipes',
				severity: 'error',
			});
		} finally {
			setRecommendedLoading(false);
		}
	};

	// Fetch All Recipes
	const fetchAllRecipes = async () => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000);

		try {
			const token = await getToken();
			const response = await fetch(
				`/api/recipes?page=${pagination.page}&limit=${
					pagination.limit
				}&search=${searchQuery}&tags=${selectedTags.join(
					','
				)}&sortBy=${sortBy}&sortOrder=${sortOrder}&prepTime=${prepTimeFilter}`,
				{
					signal: controller.signal,
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					cache: 'no-store',
				}
			);

			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			if (!response.ok) {
				const errorData = await response.json();
				if (response.status === 401) {
					router.push('/sign-in');
					return;
				}
				throw new Error(errorData.error || 'Failed to fetch recipes');
			}

			const data = await response.json();

			if (!data.recipes || !Array.isArray(data.recipes)) {
				throw new Error('Invalid response format');
			}

			const transformedRecipes = data.recipes.map((recipe: any) => ({
				...recipe,
				id: recipe.id || recipe._id,
				imageUrl: recipe.image || recipe.imageUrl,
				imageBase64: recipe.images?.main || recipe.imageBase64,
				prepTime: recipe.readyInMinutes || recipe.prepTime || 0,
				cookTime: recipe.cookTime || 0,
				description: recipe.summary || recipe.description,
				tags: recipe.tags || [],
				ingredients: recipe.ingredients || [],
				instructions: recipe.instructions || '',
				prepInstructions: recipe.prepInstructions || '',
				cookingInstructions: recipe.cookingInstructions || '',
				defrostInstructions: recipe.defrostInstructions || '',
				servingInstructions: recipe.servingInstructions || '',
				storageTime: recipe.storageTime || '',
				containerSuggestions: recipe.containerSuggestions || '',
				freezerPrep: recipe.freezerPrep || '',
				isPublic: recipe.isPublic || false,
				hasImage: recipe.hasImage || false,
				createdAt: recipe.createdAt || new Date().toISOString(),
				updatedAt: recipe.updatedAt || new Date().toISOString(),
			}));

			setAllRecipes(transformedRecipes);

			if (data.pagination) {
				setPagination({
					total: data.pagination.total || 0,
					page: data.pagination.page || 1,
					limit: data.pagination.limit || 9,
					totalPages: data.pagination.totalPages || 1,
				});
			}
		} catch (err) {
			console.error(
				'[RECIPES] Error:',
				err instanceof Error ? err.message : 'Failed to load recipes'
			);
			if (err instanceof Error && err.name === 'AbortError') {
				setAllRecipesError('Request timed out. Please try again.');
				setTimeout(() => {
					fetchAllRecipes();
				}, 2000);
			} else {
				setAllRecipesError(
					err instanceof Error ? err.message : 'Failed to load recipes'
				);
			}
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			setAllRecipesLoading(false);
		}
	};

	// Fetch Tags
	const fetchTags = async (retryCount = 0) => {
		const MAX_RETRIES = 3;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		try {
			const token = await getToken();
			const response = await fetch('/api/recipes/tags', {
				signal: controller.signal,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				cache: 'no-store',
			});

			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to fetch tags');
			}

			const data = await response.json();

			if (Array.isArray(data)) {
				setAvailableTags(data);
			} else if (data && typeof data === 'object') {
				setAvailableTags(data.tags || []);
			} else {
				setAvailableTags([]);
			}
		} catch (err) {
			console.error(
				'[RECIPES] Tags error:',
				err instanceof Error ? err.message : 'Failed to fetch tags'
			);

			if (err instanceof Error && err.name === 'AbortError') {
				if (retryCount < MAX_RETRIES) {
					setTimeout(
						() => {
							fetchTags(retryCount + 1);
						},
						1000 * (retryCount + 1)
					);
				} else {
					console.error('[RECIPES] Max retries reached for tags fetch');
					setAllRecipesError(
						'Failed to load tags after multiple attempts. Please refresh the page.'
					);
				}
			} else {
				setAvailableTags([]);
			}
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		}
	};

	// Effects
	useEffect(() => {
		if (!isLoaded) return;

		if (!isSignedIn) {
			router.push('/sign-in');
			return;
		}

		if (tabValue === 0) {
			fetchRecommendedRecipes();
		} else if (tabValue === 1) {
			fetchAllRecipes();
			fetchTags();
		}
	}, [
		isLoaded,
		isSignedIn,
		router,
		tabValue,
		recommendedPage,
		pagination.page,
		pagination.limit,
		searchQuery,
		selectedTags,
		sortBy,
		sortOrder,
		prepTimeFilter,
	]);

	// Handlers
	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	const handleSaveRecipe = async (recipeId: string) => {
		if (!isSignedIn) {
			showSnackbar('Please sign in to save recipes', 'error');
			return;
		}

		setSavingRecipeId(recipeId);
		try {
			const token = await getToken();
			const response = await fetch('/api/user/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ recipeId }),
			});

			if (response.ok) {
				// Update the saved status in both lists
				setRecommendedRecipes((prev) =>
					prev.map((recipe) =>
						recipe.id === recipeId ? { ...recipe, isSaved: true } : recipe
					)
				);
				setAllRecipes((prev) =>
					prev.map((recipe) =>
						recipe.id === recipeId ? { ...recipe, isSaved: true } : recipe
					)
				);
				setSnackbar({
					open: true,
					message: 'Recipe saved to your collection!',
					severity: 'success',
				});
			} else {
				setSnackbar({
					open: true,
					message: 'Failed to save recipe. Please try again.',
					severity: 'error',
				});
			}
		} catch (error) {
			console.error('Error saving recipe:', error);
			setSnackbar({
				open: true,
				message: 'An error occurred while saving the recipe',
				severity: 'error',
			});
		} finally {
			setSavingRecipeId(null);
		}
	};

	const handleReportImage = async (e: React.MouseEvent, recipeId: string) => {
		e.stopPropagation();
		try {
			const token = await getToken();
			const response = await fetch(`/api/recipes/${recipeId}/report-image`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				credentials: 'include',
			});
			const data = await response.json();
			if (response.ok) {
				setSnackbar({
					open: true,
					message: data.message || 'Image reported. Thank you!',
					severity: 'success',
				});
			} else {
				setSnackbar({
					open: true,
					message: data.error || data.message || 'Failed to report image',
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

	const handleRecipeClick = (recipeId: string) => {
		router.push(`/recipe/${recipeId}`);
	};

	const handleDelete = async (recipeId: string) => {
		try {
			const token = await getToken();
			const response = await fetch(`/api/recipes/${recipeId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await response.json();

			if (!response.ok) {
				if (data.message) {
					showSnackbar(data.message, 'error');
					return;
				}
				throw new Error('Failed to delete recipe');
			}

			setAllRecipes((prevRecipes) =>
				prevRecipes.filter((recipe) => recipe.id !== recipeId)
			);
		} catch (err) {
			setAllRecipesError(
				err instanceof Error ? err.message : 'Failed to delete recipe'
			);
		}
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(event.target.value);
		setPagination((prev) => ({ ...prev, page: 1 }));
	};

	const handleTagChange = (event: React.ChangeEvent<{ value: unknown }>) => {
		setSelectedTags(event.target.value as string[]);
		setPagination((prev) => ({ ...prev, page: 1 }));
	};

	const handleSortChange = (event: SelectChangeEvent) => {
		const [newSortBy, newSortOrder] = (event.target.value as string).split('-');
		setSortBy(newSortBy);
		setSortOrder(newSortOrder);
		setPagination((prev) => ({ ...prev, page: 1 }));
	};

	const handlePrepTimeChange = (event: SelectChangeEvent) => {
		setPrepTimeFilter(event.target.value);
		setPagination((prev) => ({ ...prev, page: 1 }));
	};

	const handlePageSizeChange = (event: SelectChangeEvent) => {
		const newLimit = Number(event.target.value);
		setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
	};

	const handlePrev = () => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
	};

	const handleNext = () => {
		setCurrentIndex((prev) =>
			prev < recommendedRecipes.length - 1 ? prev + 1 : prev
		);
	};

	const loadMore = () => {
		if (!recommendedLoading && hasMore) {
			setRecommendedPage((prev) => prev + 1);
		}
	};

	if (!mounted || !isLoaded) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					p: 4,
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (!isSignedIn) {
		router.push('/sign-in');
		return null;
	}

	return (
		<Box sx={{ p: 3 }}>
			<PageHeader
				title='Recommended Recipes'
				description='Discover new recipes and manage your collection'
				backgroundColor='linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)'
				icon={<MenuBook />}
			/>

			<Paper
				elevation={0}
				sx={{
					borderRadius: 2,
					backgroundColor: 'background.paper',
					border: '1px solid',
					borderColor: 'divider',
					mb: 3,
				}}
			>
				<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						aria-label='recipes tabs'
						sx={{
							'& .MuiTabs-indicator': {
								backgroundColor: 'primary.main',
							},
						}}
					>
						<Tab
							label='Recommended'
							{...a11yProps(0)}
							sx={{
								textTransform: 'none',
								fontSize: '1rem',
								fontWeight: tabValue === 0 ? 600 : 400,
							}}
						/>
						<Tab
							label='Browse All'
							{...a11yProps(1)}
							sx={{
								textTransform: 'none',
								fontSize: '1rem',
								fontWeight: tabValue === 1 ? 600 : 400,
							}}
						/>
					</Tabs>
				</Box>

				<TabPanel
					value={tabValue}
					index={0}
				>
					{/* Recommended Recipes Tab */}
					{recommendedLoading && recommendedPage === 1 ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
							<CircularProgress />
						</Box>
					) : !recommendedRecipes.length ? (
						<Paper sx={{ p: 3, textAlign: 'center' }}>
							<Typography>No recommended recipes found</Typography>
						</Paper>
					) : (
						<>
							<Box sx={{ width: '100%', position: 'relative' }}>
								<Typography
									variant='h5'
									sx={{ mb: 2 }}
								>
									{translations.common?.recommendedRecipes ||
										'Recommended Recipes'}
								</Typography>
								<Box
									sx={{
										position: 'relative',
										height: '320px',
										overflow: 'hidden',
									}}
								>
									<Box
										sx={{
											display: 'flex',
											position: 'absolute',
											transition: 'transform 0.3s ease-in-out',
											transform: `translateX(-${currentIndex * 320}px)`,
											gap: 2,
											px: 5,
										}}
									>
										{recommendedRecipes.map((recipe, idx) => (
											<Card
												key={recipe.id ?? idx}
												sx={{
													width: 300,
													flexShrink: 0,
													cursor: 'pointer',
													position: 'relative',
													'&:hover .report-image-btn': { opacity: 1 },
													'&:hover': {
														'& .recipe-overlay': { opacity: 1 },
														'& .recipe-title': { opacity: 0 },
														'& .recipe-title-overlay': { opacity: 1 },
													},
												}}
												onClick={() => handleRecipeClick(recipe.id)}
											>
												<Box sx={{ position: 'relative' }}>
													<IconButton
														className='report-image-btn'
														onClick={(e) => handleReportImage(e, recipe.id)}
														sx={{
															position: 'absolute',
															top: 8,
															right: 8,
															zIndex: 2,
															backgroundColor: 'rgba(255,255,255,0.9)',
															'&:hover': {
																backgroundColor: 'rgba(255,255,255,1)',
															},
															opacity: 0,
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
														height='200'
														image={
															recipe.imageBase64 ||
															recipe.imageUrl ||
															'/images/recipe-placeholder.png'
														}
														alt={recipe.title}
														sx={{
															objectFit: 'cover',
															width: '100%',
															height: '200px',
															backgroundColor: 'grey.200',
														}}
														onError={(e: any) => {
															e.target.src = '/images/recipe-placeholder.png';
														}}
													/>
												</Box>
												<CardContent
													className='recipe-title'
													sx={{
														p: 2,
														pr: 5,
														transition: 'opacity 0.3s ease-in-out',
														maxWidth: '70%',
													}}
												>
													<Typography
														variant='h6'
														component='div'
														sx={{
															fontSize: '1rem',
															lineHeight: 1.2,
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															display: '-webkit-box',
															WebkitLineClamp: 2,
															WebkitBoxOrient: 'vertical',
														}}
													>
														{recipe.title}
													</Typography>
												</CardContent>
												<Box
													className='recipe-overlay'
													sx={{
														position: 'absolute',
														top: 0,
														left: 0,
														right: 0,
														bottom: 0,
														backgroundColor: 'rgba(0, 0, 0, 0.7)',
														opacity: 0,
														transition: 'opacity 0.3s ease-in-out',
														display: 'flex',
														flexDirection: 'column',
														justifyContent: 'flex-start',
														p: 2,
													}}
												>
													<Typography
														variant='h6'
														component='div'
														className='recipe-title-overlay'
														sx={{
															fontSize: '1rem',
															lineHeight: 1.2,
															mb: 2,
															mt: 4,
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															display: '-webkit-box',
															WebkitLineClamp: 2,
															WebkitBoxOrient: 'vertical',
															opacity: 0,
															transition: 'opacity 0.3s ease-in-out',
															color: 'white',
														}}
													>
														{recipe.title}
													</Typography>
													<Typography
														variant='body2'
														sx={{ color: 'white', fontSize: '0.875rem' }}
													>
														Prep Time: {recipe.prepTime} minutes
													</Typography>
													<Typography
														variant='body2'
														sx={{
															color: 'white',
															fontSize: '0.875rem',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															display: '-webkit-box',
															WebkitLineClamp: 3,
															WebkitBoxOrient: 'vertical',
															mt: 1,
														}}
													>
														{recipe.description}
													</Typography>
													{!recipe.isSaved && (
														<Button
															variant='contained'
															size='small'
															onClick={(e) => {
																e.stopPropagation();
																handleSaveRecipe(recipe.id);
															}}
															disabled={savingRecipeId === recipe.id}
															sx={{
																mt: 'auto',
																mb: 1,
																backgroundColor: 'primary.main',
																'&:hover': {
																	backgroundColor: 'primary.dark',
																},
															}}
														>
															{savingRecipeId === recipe.id
																? 'Saving...'
																: 'Save Recipe'}
														</Button>
													)}
												</Box>
											</Card>
										))}
									</Box>
								</Box>
								{recommendedRecipes.length > 1 && (
									<>
										<IconButton
											onClick={handlePrev}
											disabled={currentIndex === 0}
											sx={{
												position: 'absolute',
												left: 0,
												top: '50%',
												transform: 'translateY(-50%)',
												backgroundColor: 'rgba(255,255,255,0.9)',
												'&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
											}}
										>
											<NavigateBeforeIcon />
										</IconButton>
										<IconButton
											onClick={handleNext}
											disabled={currentIndex >= recommendedRecipes.length - 1}
											sx={{
												position: 'absolute',
												right: 0,
												top: '50%',
												transform: 'translateY(-50%)',
												backgroundColor: 'rgba(255,255,255,0.9)',
												'&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
											}}
										>
											<NavigateNextIcon />
										</IconButton>
									</>
								)}
							</Box>
							{hasMore && (
								<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
									<Button
										onClick={loadMore}
										disabled={recommendedLoading}
										variant='outlined'
									>
										{recommendedLoading ? 'Loading...' : 'Load More'}
									</Button>
								</Box>
							)}
						</>
					)}
				</TabPanel>

				<TabPanel
					value={tabValue}
					index={1}
				>
					{/* Browse All Recipes Tab */}
					{allRecipesLoading ? (
						<FiltersSkeleton />
					) : (
						<Paper
							elevation={0}
							sx={{
								p: 3,
								mb: 4,
								borderRadius: 2,
								backgroundColor: 'background.paper',
								border: '1px solid',
								borderColor: 'divider',
							}}
						>
							<Grid
								container
								spacing={3}
							>
								{/* Search Field */}
								<Grid
									item
									xs={12}
									md={6}
								>
									<TextField
										fullWidth
										variant='outlined'
										placeholder='Search recipes...'
										value={searchQuery}
										onChange={handleSearchChange}
										InputProps={{
											startAdornment: (
												<InputAdornment position='start'>
													<SearchIcon color='action' />
												</InputAdornment>
											),
										}}
										sx={{
											'& .MuiOutlinedInput-root': {
												borderRadius: 2,
											},
										}}
									/>
								</Grid>

								{/* Sort By */}
								<Grid
									item
									xs={12}
									md={3}
								>
									<FormControl
										fullWidth
										variant='outlined'
									>
										<InputLabel>Sort By</InputLabel>
										<Select
											value={`${sortBy}-${sortOrder}`}
											onChange={handleSortChange}
											label='Sort By'
											startAdornment={
												<SortIcon sx={{ mr: 1, color: 'action.active' }} />
											}
											sx={{
												borderRadius: 2,
											}}
										>
											<MenuItem value='createdAt-desc'>Newest First</MenuItem>
											<MenuItem value='createdAt-asc'>Oldest First</MenuItem>
											<MenuItem value='title-asc'>Title A-Z</MenuItem>
											<MenuItem value='title-desc'>Title Z-A</MenuItem>
											<MenuItem value='prepTime-asc'>Prep Time (Low)</MenuItem>
											<MenuItem value='prepTime-desc'>
												Prep Time (High)
											</MenuItem>
										</Select>
									</FormControl>
								</Grid>

								{/* Prep Time Filter */}
								<Grid
									item
									xs={12}
									md={3}
								>
									<FormControl
										fullWidth
										variant='outlined'
									>
										<InputLabel>Prep Time</InputLabel>
										<Select
											value={prepTimeFilter}
											onChange={handlePrepTimeChange}
											label='Prep Time'
											sx={{
												borderRadius: 2,
											}}
										>
											<MenuItem value='all'>All Times</MenuItem>
											<MenuItem value='quick'>Quick (≤ 30 min)</MenuItem>
											<MenuItem value='medium'>Medium (30-60 min)</MenuItem>
											<MenuItem value='long'>Long (&gt; 60 min)</MenuItem>
										</Select>
									</FormControl>
								</Grid>

								{/* Page Size */}
								<Grid
									item
									xs={12}
									md={6}
								>
									<FormControl
										variant='outlined'
										sx={{ minWidth: 120 }}
									>
										<InputLabel>Per Page</InputLabel>
										<Select
											value={pagination.limit.toString()}
											onChange={handlePageSizeChange}
											label='Per Page'
											sx={{
												borderRadius: 2,
											}}
										>
											<MenuItem value='6'>6 per page</MenuItem>
											<MenuItem value='9'>9 per page</MenuItem>
											<MenuItem value='12'>12 per page</MenuItem>
											<MenuItem value='18'>18 per page</MenuItem>
										</Select>
									</FormControl>
								</Grid>

								{/* Tags Filter */}
								{availableTags.length > 0 && (
									<Grid
										item
										xs={12}
										md={6}
									>
										<Typography
											variant='subtitle2'
											sx={{ mb: 1, color: 'text.secondary' }}
										>
											Filter by Tags
										</Typography>
										<Stack
											direction='row'
											spacing={1}
											sx={{ flexWrap: 'wrap', gap: 1 }}
										>
											{availableTags.slice(0, 8).map((tag) => (
												<Chip
													key={tag}
													label={tag}
													clickable
													color={
														selectedTags.includes(tag) ? 'primary' : 'default'
													}
													variant={
														selectedTags.includes(tag) ? 'filled' : 'outlined'
													}
													onClick={() => {
														setSelectedTags((prev) =>
															prev.includes(tag)
																? prev.filter((t) => t !== tag)
																: [...prev, tag]
														);
														setPagination((prev) => ({ ...prev, page: 1 }));
													}}
													sx={{
														borderRadius: 2,
														'&:hover': {
															backgroundColor: selectedTags.includes(tag)
																? 'primary.dark'
																: 'action.hover',
														},
													}}
												/>
											))}
										</Stack>
									</Grid>
								)}
							</Grid>
						</Paper>
					)}

					{/* Handle error state */}
					{allRecipesError ? (
						<Box sx={{ p: 3 }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									minHeight: '60vh',
									width: '100%',
								}}
							>
								<Typography color='error'>{allRecipesError}</Typography>
							</Box>
						</Box>
					) : allRecipesLoading ? (
						<RecipeSkeleton count={pagination.limit} />
					) : allRecipes.length === 0 ? (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								p: 4,
							}}
						>
							<Typography
								variant='h6'
								color='text.secondary'
							>
								No recipes found
							</Typography>
						</Box>
					) : (
						<>
							<Grid
								container
								spacing={3}
							>
								{allRecipes.map((recipe) => (
									<Grid
										item
										xs={12}
										sm={6}
										md={4}
										key={recipe.id}
									>
										<SavedRecipeCard
											recipe={recipe}
											onDelete={handleDelete}
											layout='grid'
										/>
									</Grid>
								))}
							</Grid>

							{/* Pagination */}
							{pagination && pagination.totalPages > 1 && (
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'center',
										mt: 4,
										mb: 2,
									}}
								>
									<Pagination
										count={pagination.totalPages}
										page={pagination.page}
										onChange={(_, page) => {
											setPagination((prev) => ({ ...prev, page }));
										}}
										color='primary'
										size='large'
										showFirstButton
										showLastButton
									/>
								</Box>
							)}
						</>
					)}
				</TabPanel>
			</Paper>

			{/* Snackbar */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					severity={snackbar.severity}
					variant='filled'
					sx={{ width: '100%' }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}
