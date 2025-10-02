'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '../components/ui/snackbar';
import { useSettings } from '@/hooks/use-settings';
import {
	Box,
	Typography,
	CircularProgress,
	Grid,
	Container,
	Button,
	Pagination,
	TextField,
	InputAdornment,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Chip,
	Stack,
	Paper,
	Divider,
	SelectChangeEvent,
	Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuBook from '@mui/icons-material/MenuBook';
import SortIcon from '@mui/icons-material/Sort';
import { SavedRecipeCard } from '../components/shared/saved-recipe-card';
import { PageHeader } from '../components/shared/page-header';
import { Restaurant as RecipeIcon, Add as AddIcon } from '@mui/icons-material';
import { MainNav } from '../components/shared/navigation/main-nav';
import { Footer } from '../components/shared/navigation/footer';
import { AddRecipeModal } from '../components/recipes/add-recipe-modal';
import { RecipeSkeleton } from '../components/shared/recipe-skeleton';
import { FiltersSkeleton } from '../components/shared/filters-skeleton';

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
}

interface PaginationData {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export default function MyRecipesPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { user } = useUser();
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const { settings, updateSettings } = useSettings();

	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
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
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	const fetchRecipes = async () => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000);

		try {
			const response = await fetch(
				`/api/user/recipes/saved?page=${pagination.page}&limit=${
					pagination.limit
				}&search=${searchQuery}&tags=${selectedTags.join(
					','
				)}&sortBy=${sortBy}&sortOrder=${sortOrder}&prepTime=${prepTimeFilter}`,
				{
					signal: controller.signal,
					headers: {
						'Content-Type': 'application/json',
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

			const transformedRecipes = data.recipes.map((recipe: any) => {
				// Only keep the fields we actually use in the UI
				const transformed = {
					id: recipe._id || recipe.id,
					title: recipe.title,
					description: recipe.description,
					imageUrl: recipe.imageUrl,
					prepTime: recipe.prepTime || 0,
					tags: recipe.tags || [],
					servings: recipe.servings || 4,
					isPublic: recipe.isPublic || false,
					createdAt: recipe.createdAt || new Date().toISOString(),
					updatedAt: recipe.updatedAt || new Date().toISOString(),
				};
				return transformed;
			});

			setRecipes(transformedRecipes);

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
				'[MY_RECIPES] Error:',
				err instanceof Error ? err.message : 'Failed to load recipes'
			);
			if (err instanceof Error && err.name === 'AbortError') {
				setError('Request timed out. Please try again.');
				setTimeout(() => {
					fetchRecipes();
				}, 2000);
			} else {
				setError(err instanceof Error ? err.message : 'Failed to load recipes');
			}
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			setIsLoading(false);
		}
	};

	const fetchTags = async (retryCount = 0) => {
		const MAX_RETRIES = 3;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		try {
			const response = await fetch('/api/recipes/tags', {
				signal: controller.signal,
				headers: {
					'Content-Type': 'application/json',
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
				'[MY_RECIPES] Tags error:',
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
					console.error('[MY_RECIPES] Max retries reached for tags fetch');
					setError(
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

	useEffect(() => {
		if (!isLoaded) return;

		if (!isSignedIn) {
			router.push('/sign-in');
			return;
		}

		fetchRecipes();
		fetchTags();
	}, [
		isLoaded,
		isSignedIn,
		router,
		pagination.page,
		pagination.limit,
		searchQuery,
		selectedTags,
		sortBy,
		sortOrder,
		prepTimeFilter,
	]);

	const handleDelete = async (recipeId: string) => {
		try {
			const response = await fetch(`/api/recipes/${recipeId}`, {
				method: 'DELETE',
			});
			const data = await response.json();

			if (!response.ok) {
				if (data.message) {
					showSnackbar(data.message, 'error');
					return;
				}
				throw new Error('Failed to delete recipe');
			}

			setRecipes((prevRecipes) =>
				prevRecipes.filter((recipe) => recipe.id !== recipeId)
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete recipe');
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

	const handleAddSuccess = () => {
		fetchRecipes();
		fetchTags();
	};

	if (!isLoaded) {
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

	// Handle error state
	if (error) {
		return (
			<>
				<MainNav />
				<Container
					maxWidth='xl'
					sx={{ py: 4 }}
				>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							minHeight: '60vh',
							width: '100%',
						}}
					>
						<Typography color='error'>{error}</Typography>
					</Box>
				</Container>
				<Footer />
			</>
		);
	}

	const renderRecipes = () => {
		// Show skeleton while loading
		if (isLoading) {
			return <RecipeSkeleton count={pagination.limit} />;
		}

		// Show empty state when no recipes found
		if (recipes.length === 0) {
			return (
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
			);
		}

		// Show actual recipes
		return (
			<Grid
				container
				spacing={3}
			>
				{recipes.map((recipe) => (
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
		);
	};

	const renderPagination = () => {
		// Show skeleton pagination while loading
		if (isLoading) {
			return (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
					<Skeleton
						variant='rectangular'
						width={300}
						height={32}
						sx={{ borderRadius: 2 }}
						animation='wave'
					/>
				</Box>
			);
		}

		// Don't show pagination if not needed
		if (!pagination || pagination.totalPages <= 1) {
			return null;
		}

		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
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
		);
	};

	return (
		<>
			<MainNav />
			<Container
				maxWidth='xl'
				sx={{ py: 4 }}
			>
				<Box sx={{ mb: 3 }}>
					<PageHeader
						title='My Recipes'
						description='Manage and organize your personal recipe collection'
						backgroundColor='linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)'
						icon={<RecipeIcon />}
					/>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
						<Button
							variant='contained'
							color='primary'
							startIcon={<AddIcon />}
							onClick={() => setIsAddModalOpen(true)}
						>
							Add Recipe
						</Button>
					</Box>
				</Box>

				{/* Search and Filters Section */}
				{isLoading ? (
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
									placeholder='Search recipes by title or description...'
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

							{/* Sort and Prep Time Filters */}
							<Grid
								item
								xs={12}
								md={6}
							>
								<Grid
									container
									spacing={2}
								>
									<Grid
										item
										xs={12}
										sm={6}
									>
										<FormControl fullWidth>
											<InputLabel>Sort By</InputLabel>
											<Select
												value={`${sortBy}-${sortOrder}`}
												onChange={handleSortChange}
												label='Sort By'
												sx={{
													borderRadius: 2,
												}}
											>
												<MenuItem value='createdAt-desc'>Newest First</MenuItem>
												<MenuItem value='createdAt-asc'>Oldest First</MenuItem>
												<MenuItem value='title-asc'>Title (A-Z)</MenuItem>
												<MenuItem value='title-desc'>Title (Z-A)</MenuItem>
												<MenuItem value='prepTime-asc'>
													Prep Time (Low to High)
												</MenuItem>
												<MenuItem value='prepTime-desc'>
													Prep Time (High to Low)
												</MenuItem>
											</Select>
										</FormControl>
									</Grid>
									<Grid
										item
										xs={12}
										sm={6}
									>
										<FormControl fullWidth>
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
												<MenuItem value='quick'>Quick (0-30 min)</MenuItem>
												<MenuItem value='medium'>Medium (31-60 min)</MenuItem>
												<MenuItem value='long'>Long (60+ min)</MenuItem>
											</Select>
										</FormControl>
									</Grid>
								</Grid>
							</Grid>

							{/* Tags Filter */}
							<Grid
								item
								xs={12}
							>
								<Divider sx={{ my: 1 }} />

								{/* Desktop Layout: Show dropdown and tags side by side */}
								<Box
									sx={{
										display: { xs: 'none', sm: 'flex' },
										justifyContent: 'flex-start',
										alignItems: 'center',
										gap: 2,
									}}
								>
									<FormControl sx={{ minWidth: 120 }}>
										<InputLabel>Show</InputLabel>
										<Select
											value={pagination.limit.toString()}
											onChange={handlePageSizeChange}
											label='Show'
											size='small'
											sx={{ borderRadius: 2 }}
										>
											<MenuItem value='9'>9 per page</MenuItem>
											<MenuItem value='18'>18 per page</MenuItem>
											<MenuItem value='27'>27 per page</MenuItem>
											<MenuItem value='36'>36 per page</MenuItem>
										</Select>
									</FormControl>
									<Stack
										direction='row'
										spacing={1}
										flexWrap='wrap'
										useFlexGap
										sx={{
											flex: 1,
											'& .MuiChip-root': {
												borderRadius: 1.5,
												transition: 'all 0.2s',
												'&:hover': {
													transform: 'translateY(-1px)',
												},
											},
										}}
									>
										{Array.isArray(availableTags) &&
											availableTags
												.filter(
													(tag) =>
														!['batch-prep', 'freezer-friendly'].includes(
															tag.toLowerCase()
														)
												)
												.map((tag) => (
													<Chip
														key={tag}
														label={tag}
														onClick={() => {
															setSelectedTags((prev) =>
																prev.includes(tag)
																	? prev.filter((t) => t !== tag)
																	: [...prev, tag]
															);
														}}
														color={
															selectedTags.includes(tag) ? 'primary' : 'default'
														}
														variant={
															selectedTags.includes(tag) ? 'filled' : 'outlined'
														}
														sx={{
															m: 0.5,
															'&.MuiChip-filled': {
																backgroundColor: 'primary.main',
																color: 'primary.contrastText',
															},
														}}
													/>
												))}
									</Stack>
								</Box>

								{/* Mobile Layout: Tags first, then dropdown underneath */}
								<Box sx={{ display: { xs: 'block', sm: 'none' } }}>
									{/* Tags Section */}
									<Stack
										direction='row'
										spacing={1}
										flexWrap='wrap'
										useFlexGap
										sx={{
											mb: 2,
											'& .MuiChip-root': {
												borderRadius: 1.5,
												transition: 'all 0.2s',
												'&:hover': {
													transform: 'translateY(-1px)',
												},
											},
										}}
									>
										{Array.isArray(availableTags) &&
											availableTags
												.filter(
													(tag) =>
														!['batch-prep', 'freezer-friendly'].includes(
															tag.toLowerCase()
														)
												)
												.map((tag) => (
													<Chip
														key={tag}
														label={tag}
														onClick={() => {
															setSelectedTags((prev) =>
																prev.includes(tag)
																	? prev.filter((t) => t !== tag)
																	: [...prev, tag]
															);
														}}
														color={
															selectedTags.includes(tag) ? 'primary' : 'default'
														}
														variant={
															selectedTags.includes(tag) ? 'filled' : 'outlined'
														}
														sx={{
															m: 0.5,
															'&.MuiChip-filled': {
																backgroundColor: 'primary.main',
																color: 'primary.contrastText',
															},
														}}
													/>
												))}
									</Stack>

									{/* Show Dropdown */}
									<Box sx={{ display: 'flex', justifyContent: 'center' }}>
										<FormControl sx={{ minWidth: 140 }}>
											<InputLabel>Show</InputLabel>
											<Select
												value={pagination.limit.toString()}
												onChange={handlePageSizeChange}
												label='Show'
												size='small'
												sx={{ borderRadius: 2 }}
											>
												<MenuItem value='9'>9 per page</MenuItem>
												<MenuItem value='18'>18 per page</MenuItem>
												<MenuItem value='27'>27 per page</MenuItem>
												<MenuItem value='36'>36 per page</MenuItem>
											</Select>
										</FormControl>
									</Box>
								</Box>
							</Grid>
						</Grid>
					</Paper>
				)}

				<Box sx={{ p: 3 }}>
					{renderRecipes()}
					{renderPagination()}
				</Box>
			</Container>
			<Footer />
			<AddRecipeModal
				open={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSuccess={handleAddSuccess}
			/>
		</>
	);
}
