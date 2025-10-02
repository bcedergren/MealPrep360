'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
	Box,
	CircularProgress,
	Container,
	Paper,
	Typography,
	Button,
	Grid,
	Chip,
	CardMedia,
	CardContent,
	Tooltip,
	Stack,
} from '@mui/material';
import { motion } from 'framer-motion';
import { alpha } from '@mui/material/styles';
import {
	Timer,
	Restaurant,
	People,
	Speed,
	LocalDining,
	AccessTime,
	Scale,
	TrendingUp,
	Warning,
	BookmarkAdd,
	BookmarkAdded,
	Print,
	Kitchen,
	Inventory,
	AcUnit,
	RestaurantMenu,
	Tag,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { MainNav } from '@/app/components/shared/navigation/main-nav';
import { Footer } from '@/app/components/shared/navigation/footer';

interface RecipePageProps {
	params: Promise<{
		id: string;
	}>;
}

interface Recipe {
	_id: string;
	id?: string;
	title: string;
	description: string;
	ingredients: {
		name: string;
		amount: number;
		unit: string;
		quantity?: number;
	}[];
	instructions: string[];
	prepInstructions: string[];
	prepTime: number;
	cookTime: number;
	servings: number;
	difficulty: 'easy' | 'medium' | 'hard';
	tags: string[];
	season?: string;
	storageTime?: number;
	allergenInfo?: string[];
	dietaryInfo?: string[];
	cookingInstructions?: string[];
	freezerPrep?: string[];
	containerSuggestions?: string[];
	defrostInstructions?: string[];
	servingInstructions?: string[];
	images?: {
		main?: string;
		thumbnail?: string;
		additional: string[];
	};
	isPublic: boolean;
	updatedAt: string;
}

export default function RecipePage({ params }: RecipePageProps) {
	const router = useRouter();
	const { isLoaded, isSignedIn } = useAuth();
	const { user } = useUser();
	const [recipe, setRecipe] = useState<Recipe | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Fetch recipe details
	const fetchRecipe = useCallback(async () => {
		try {
			const { id } = await params;
			const response = await fetch(`/api/recipes/${id}`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 404) {
					toast.error('Recipe not found');
					router.push('/dashboard');
					return;
				} else if (response.status === 401) {
					toast.error('Please sign in to view this recipe');
					router.push('/sign-in');
					return;
				} else {
					const errorMessage =
						errorData.error || `Failed to fetch recipe (${response.status})`;
					toast.error(errorMessage);
					router.push('/dashboard');
					return;
				}
			}
			const data = await response.json();

			// Ensure arrays are initialized and data is properly transformed
			const processedData: Recipe = {
				...data,
				_id: data.id || data._id,
				ingredients: Array.isArray(data.ingredients)
					? data.ingredients
					: typeof data.ingredients === 'string'
						? data.ingredients.split('\n').map((line: string) => {
								const [amount, unit, ...nameParts] = line.trim().split(' ');
								const ingredient = {
									name: nameParts.join(' '),
									amount: parseFloat(amount) || 0,
									unit: unit || '',
								};
								return ingredient;
							})
						: [],
				instructions: Array.isArray(data.instructions)
					? data.instructions
					: typeof data.instructions === 'string'
						? data.instructions.split('\n')
						: [],
				prepInstructions: Array.isArray(data.prepInstructions)
					? data.prepInstructions
					: typeof data.prepInstructions === 'string'
						? data.prepInstructions.split('\n')
						: [],
				tags: Array.isArray(data.tags) ? data.tags : [],
				freezerPrep: Array.isArray(data.freezerPrep) ? data.freezerPrep : [],
				cookingInstructions: Array.isArray(data.cookingInstructions)
					? data.cookingInstructions
					: [],
				containerSuggestions: Array.isArray(data.containerSuggestions)
					? data.containerSuggestions
					: [],
				defrostInstructions: Array.isArray(data.defrostInstructions)
					? data.defrostInstructions
					: [],
				servingInstructions: Array.isArray(data.servingInstructions)
					? data.servingInstructions
					: [],
				allergenInfo: Array.isArray(data.allergenInfo) ? data.allergenInfo : [],
				dietaryInfo: Array.isArray(data.dietaryInfo) ? data.dietaryInfo : [],
				prepTime: data.prepTime || 0,
				cookTime: data.cookTime || 0,
				servings: data.servings || 4,
				difficulty: data.difficulty || 'medium',
				season: data.season || '',
				storageTime: data.storageTime || 0,
				images: {
					main: data.images?.main || data.imageUrl || '',
					thumbnail: data.images?.thumbnail || data.imageUrl || '',
					additional: Array.isArray(data.images?.additional)
						? data.images.additional
						: [],
				},
			};

			setRecipe(processedData);

			if (isSignedIn && user?.emailAddresses?.[0]?.emailAddress) {
				// Check if the recipe is already saved in user's collection
				const savedResponse = await fetch(`/api/recipes/${id}/saved`);
				const savedData = await savedResponse.json();
				setIsSaved(savedData.saved);
			} else {
				setIsSaved(false);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'An unexpected error occurred';
			toast.error(`Error: ${errorMessage}`);
			router.push('/dashboard');
		} finally {
			setIsLoading(false);
		}
	}, [params, router, isSignedIn, user?.emailAddresses]);

	// Save recipe to user's collection
	const handleSave = async () => {
		if (!isSignedIn) {
			toast.error('Please sign in to save recipes');
			return;
		}

		setIsSaving(true);
		try {
			const { id } = await params;
			const response = await fetch(`/api/recipes/${id}/saved`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();
			if (response.ok) {
				setIsSaved(true);
				toast.success('Recipe has been added to your collection.');
			} else {
				toast.error(data.error || 'Failed to save recipe. Please try again.');
			}
		} catch (error) {
			toast.error('An unexpected error occurred. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	// Check saved status when auth state changes
	useEffect(() => {
		if (isSignedIn && recipe?._id) {
			fetch(`/api/recipes/${recipe._id}/saved`)
				.then((response) => response.json())
				.then((data) => {
					setIsSaved(data.saved);
				})
				.catch((error) => {
					setIsSaved(false);
				});
		} else {
			setIsSaved(false);
		}
	}, [isSignedIn, recipe?._id]);

	// Effect to fetch recipe on mount
	useEffect(() => {
		if (isLoaded) {
			fetchRecipe();
		}
	}, [isLoaded, fetchRecipe]);

	if (!isLoaded || isLoading) {
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

	if (!recipe) return null;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
			<MainNav />
			<Box
				component='main'
				sx={{ flexGrow: 1 }}
			>
				<Container
					maxWidth='lg'
					sx={{ mt: 4, mb: 8 }}
				>
					{/* Recipe Title */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								mb: 3,
								px: 2,
							}}
						>
							<Typography
								variant='h2'
								component='h1'
								sx={{
									fontSize: { xs: '2rem', md: '2.5rem' },
									fontWeight: 700,
									lineHeight: 1.2,
									color: 'text.primary',
									flex: 1,
								}}
							>
								{recipe.title}
							</Typography>
							{isSignedIn && (
								<Box
									sx={{
										display: 'flex',
										gap: 1,
										ml: 2,
									}}
								>
									<Button
										variant='contained'
										startIcon={isSaved ? <BookmarkAdded /> : <BookmarkAdd />}
										onClick={handleSave}
										disabled={isSaving || isSaved}
										sx={{
											backgroundColor: 'primary.main',
											color: 'white',
											px: 3,
											py: 1.5,
											borderRadius: '12px',
											'&:hover': {
												backgroundColor: 'primary.dark',
												transform: 'translateY(-2px)',
												boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
											},
											'&:disabled': {
												backgroundColor: 'grey.300',
												color: 'grey.500',
											},
											transition: 'all 0.3s ease',
										}}
									>
										{isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save Recipe'}
									</Button>
									<Button
										variant='contained'
										startIcon={<Print />}
										onClick={() => window.print()}
										sx={{
											backgroundColor: '#4CAF50',
											color: 'white',
											px: 3,
											py: 1.5,
											borderRadius: '12px',
											'&:hover': {
												backgroundColor: '#388E3C',
												transform: 'translateY(-2px)',
												boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
											},
											transition: 'all 0.3s ease',
										}}
									>
										Print
									</Button>
								</Box>
							)}
						</Box>
					</motion.div>

					{/* Header Section */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
					>
						<Paper
							elevation={3}
							sx={{
								p: 4,
								mb: 4,
								borderRadius: '16px',
								background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
								boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
							}}
						>
							<Grid
								container
								spacing={4}
								sx={{ mb: 4 }}
							>
								<Grid
									item
									xs={12}
									md={5}
								>
									<Box sx={{ width: '100%' }}>
										<Box
											sx={{
												position: 'relative',
												borderRadius: '16px',
												overflow: 'hidden',
												boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
												'&:hover': {
													'& img': {
														transform: 'scale(1.02)',
													},
												},
											}}
										>
											<CardMedia
												component='img'
												height={450}
												image={
													recipe.images?.main ||
													'/images/recipe-placeholder.png'
												}
												alt={recipe.title}
												sx={{
													width: '100%',
													height: '450px',
													borderRadius: '16px',
													transition: 'transform 0.3s ease-in-out',
													objectFit: 'cover',
												}}
												onError={(e: any) => {
													e.target.src = '/images/recipe-placeholder.png';
												}}
											/>
										</Box>
									</Box>
								</Grid>
								<Grid
									item
									xs={12}
									md={7}
								>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											gap: 3,
										}}
									>
										<Typography
											variant='body1'
											sx={{
												color: 'text.secondary',
												lineHeight: 1.7,
												fontSize: '1.1rem',
											}}
										>
											{recipe.description}
										</Typography>

										{/* Recipe Details Badges */}
										<Box
											sx={{
												display: 'flex',
												flexWrap: 'wrap',
												gap: 2,
												mb: 3,
											}}
										>
											{recipe.prepTime > 0 && (
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 1,
														backgroundColor: alpha('#E91E63', 0.1),
														padding: '8px 12px',
														borderRadius: 2,
													}}
												>
													<Timer sx={{ color: 'primary.main', fontSize: 20 }} />
													<Typography
														sx={{
															color: 'primary.main',
															fontWeight: 500,
															fontSize: '0.9rem',
														}}
													>
														{recipe.prepTime} min prep
													</Typography>
												</Box>
											)}
											{recipe.cookTime > 0 && (
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 1,
														backgroundColor: alpha('#E91E63', 0.1),
														padding: '8px 12px',
														borderRadius: 2,
													}}
												>
													<Restaurant
														sx={{ color: 'primary.main', fontSize: 20 }}
													/>
													<Typography
														sx={{
															color: 'primary.main',
															fontWeight: 500,
															fontSize: '0.9rem',
														}}
													>
														{recipe.cookTime} min cook
													</Typography>
												</Box>
											)}
											{recipe.servings > 0 && (
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 1,
														backgroundColor: alpha('#E91E63', 0.1),
														padding: '8px 12px',
														borderRadius: 2,
													}}
												>
													<People
														sx={{ color: 'primary.main', fontSize: 20 }}
													/>
													<Typography
														sx={{
															color: 'primary.main',
															fontWeight: 500,
															fontSize: '0.9rem',
														}}
													>
														{recipe.servings} servings
													</Typography>
												</Box>
											)}
											{recipe.difficulty && (
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 1,
														backgroundColor: alpha('#E91E63', 0.1),
														padding: '8px 12px',
														borderRadius: 2,
													}}
												>
													<Speed sx={{ color: 'primary.main', fontSize: 20 }} />
													<Typography
														sx={{
															color: 'primary.main',
															fontWeight: 500,
															fontSize: '0.9rem',
														}}
													>
														{recipe.difficulty}
													</Typography>
												</Box>
											)}
										</Box>

										{/* Additional metadata badges */}
										{(recipe.season ||
											recipe.storageTime ||
											(recipe.allergenInfo && recipe.allergenInfo.length > 0) ||
											(recipe.dietaryInfo &&
												recipe.dietaryInfo.length > 0)) && (
											<Box
												sx={{
													display: 'flex',
													flexWrap: 'wrap',
													gap: 2,
													pt: 3,
													borderTop: '1px solid',
													borderColor: 'divider',
												}}
											>
												{recipe.season && recipe.season.trim() !== '' && (
													<Tooltip title='Seasonal availability'>
														<Box
															sx={{
																display: 'flex',
																alignItems: 'center',
																gap: 1,
																backgroundColor: alpha('#FF5722', 0.1),
																padding: '8px 12px',
																borderRadius: 2,
																cursor: 'help',
															}}
														>
															<AccessTime
																sx={{ color: 'primary.main', fontSize: 20 }}
															/>
															<Typography
																sx={{
																	color: 'primary.main',
																	fontWeight: 500,
																	fontSize: '0.9rem',
																}}
															>
																{recipe.season}
															</Typography>
														</Box>
													</Tooltip>
												)}
												{recipe.storageTime && recipe.storageTime > 0 && (
													<Tooltip title='Recommended storage duration'>
														<Box
															sx={{
																display: 'flex',
																alignItems: 'center',
																gap: 1,
																backgroundColor: alpha('#FF5722', 0.1),
																padding: '8px 12px',
																borderRadius: 2,
																cursor: 'help',
															}}
														>
															<Scale
																sx={{ color: 'primary.main', fontSize: 20 }}
															/>
															<Typography
																sx={{
																	color: 'primary.main',
																	fontWeight: 500,
																	fontSize: '0.9rem',
																}}
															>
																{`${recipe.storageTime} days`}
															</Typography>
														</Box>
													</Tooltip>
												)}
												{recipe.allergenInfo &&
													recipe.allergenInfo.length > 0 &&
													recipe.allergenInfo.some(
														(info) => info && info.trim() !== ''
													) && (
														<Tooltip title='Contains allergens'>
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 1,
																	backgroundColor: alpha('#FF5722', 0.1),
																	padding: '8px 12px',
																	borderRadius: 2,
																	cursor: 'help',
																}}
															>
																<Warning
																	sx={{ color: 'primary.main', fontSize: 20 }}
																/>
																<Typography
																	sx={{
																		color: 'primary.main',
																		fontWeight: 500,
																		fontSize: '0.9rem',
																	}}
																>
																	{recipe.allergenInfo
																		.filter(
																			(info) => info && info.trim() !== ''
																		)
																		.join(', ')}
																</Typography>
															</Box>
														</Tooltip>
													)}
												{recipe.dietaryInfo &&
													recipe.dietaryInfo.length > 0 &&
													recipe.dietaryInfo.some(
														(info) => info && info.trim() !== ''
													) && (
														<Tooltip title='Dietary restrictions and preferences'>
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 1,
																	backgroundColor: alpha('#FF5722', 0.1),
																	padding: '8px 12px',
																	borderRadius: 2,
																	cursor: 'help',
																}}
															>
																<Restaurant
																	sx={{ color: 'primary.main', fontSize: 20 }}
																/>
																<Box
																	sx={{
																		display: 'flex',
																		flexWrap: 'wrap',
																		gap: 1,
																	}}
																>
																	{recipe.dietaryInfo
																		.filter(
																			(info) => info && info.trim() !== ''
																		)
																		.map((info, index) => (
																			<Chip
																				key={index}
																				label={info}
																				size='small'
																				sx={{
																					backgroundColor: alpha(
																						'#FF5722',
																						0.2
																					),
																					color: 'primary.main',
																					fontWeight: 500,
																				}}
																			/>
																		))}
																</Box>
															</Box>
														</Tooltip>
													)}
											</Box>
										)}
									</Box>
								</Grid>
							</Grid>
						</Paper>
					</motion.div>

					{/* Ingredients Section */}
					<Grid
						container
						spacing={4}
						sx={{ mb: 4 }}
					>
						<Grid
							item
							xs={12}
							md={12}
						>
							<motion.div
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.5, delay: 0.2 }}
							>
								<Paper
									elevation={3}
									sx={{
										p: 4,
										height: '100%',
										borderRadius: '16px',
										background:
											'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
										boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
										position: 'relative',
										overflow: 'hidden',
										'&:before': {
											content: '""',
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											height: '4px',
											background: 'linear-gradient(90deg, #FF5722, #FF9800)',
										},
									}}
								>
									<Typography
										variant='h5'
										sx={{
											mb: 4,
											fontWeight: 700,
											color: 'primary.main',
											display: 'flex',
											alignItems: 'center',
											gap: 1,
										}}
									>
										<Restaurant sx={{ fontSize: 28 }} />
										Ingredients
									</Typography>
									<Box
										component='ul'
										sx={{
											pl: 2,
											listStyleType: 'none',
											display: 'grid',
											gridTemplateColumns: {
												xs: '1fr',
												sm: '1fr 1fr',
												md: '1fr 1fr 1fr',
											},
											gap: 2,
										}}
									>
										{recipe.ingredients.map((ingredient, index) => (
											<Box
												key={index}
												component='li'
												sx={{
													display: 'flex',
													alignItems: 'center',
													p: 1.5,
													borderRadius: '8px',
													backgroundColor: 'rgba(0,0,0,0.02)',
													transition: 'all 0.2s ease',
													'&:hover': {
														backgroundColor: 'rgba(0,0,0,0.04)',
														transform: 'translateX(4px)',
													},
												}}
											>
												<Typography
													variant='body1'
													sx={{
														color: 'text.primary',
														display: 'flex',
														alignItems: 'center',
														gap: 1,
													}}
												>
													<span
														style={{ fontWeight: 600, color: 'primary.main' }}
													>
														{ingredient.amount}
													</span>
													{ingredient.unit && (
														<span style={{ color: 'text.secondary' }}>
															{ingredient.unit}
														</span>
													)}
													<span>{ingredient.name}</span>
												</Typography>
											</Box>
										))}
									</Box>
								</Paper>
							</motion.div>
						</Grid>
					</Grid>

					{/* Additional Instructions Sections */}
					<Grid
						container
						spacing={4}
						sx={{ mb: 4 }}
					>
						{/* Prep Instructions */}
						{recipe.prepInstructions?.length > 0 && (
							<Grid
								item
								xs={12}
								md={6}
							>
								<Paper
									elevation={3}
									sx={{
										p: 4,
										height: '100%',
										borderRadius: '16px',
										background:
											'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
										boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
										position: 'relative',
										overflow: 'hidden',
										'&:before': {
											content: '""',
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											height: '4px',
											background: 'linear-gradient(90deg, #FF5722, #FF9800)',
										},
									}}
								>
									<Typography
										variant='h5'
										sx={{
											mb: 4,
											fontWeight: 700,
											color: 'primary.main',
											display: 'flex',
											alignItems: 'center',
											gap: 1,
										}}
									>
										<AccessTime sx={{ fontSize: 28 }} />
										Prep Instructions
									</Typography>
									<Box
										component='ol'
										sx={{
											pl: 2,
											listStyleType: 'none',
											counterReset: 'step-counter',
											display: 'grid',
											gridTemplateColumns: {
												xs: '1fr',
												sm: '1fr 1fr 1fr',
											},
											gap: 2,
										}}
									>
										{recipe.prepInstructions.map((instruction, index) => (
											<Box
												key={index}
												component='li'
												sx={{
													display: 'flex',
													gap: 2,
													p: 2,
													borderRadius: '12px',
													backgroundColor: 'rgba(0,0,0,0.02)',
													gridColumn: '1 / -1', // Make each item span all columns
													'&:before': {
														counterIncrement: 'step-counter',
														content: 'counter(step-counter)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														width: '32px',
														height: '32px',
														borderRadius: '50%',
														backgroundColor: 'primary.main',
														color: 'white',
														fontWeight: 600,
														flexShrink: 0,
													},
												}}
											>
												<Typography variant='body1'>{instruction}</Typography>
											</Box>
										))}
									</Box>
								</Paper>
							</Grid>
						)}

						{/* Cooking Instructions */}
						{Array.isArray(recipe.cookingInstructions) &&
							recipe.cookingInstructions.length > 0 && (
								<Grid
									item
									xs={12}
									md={6}
								>
									<motion.div
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.5, delay: 0.4 }}
									>
										<Paper
											elevation={3}
											sx={{
												p: 4,
												height: '100%',
												borderRadius: '16px',
												background:
													'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
												boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
												position: 'relative',
												overflow: 'hidden',
												'&:before': {
													content: '""',
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													height: '4px',
													background:
														'linear-gradient(90deg, #FF9800, #FFC107)',
												},
											}}
										>
											<Typography
												variant='h5'
												sx={{
													mb: 4,
													fontWeight: 700,
													color: 'warning.main',
													display: 'flex',
													alignItems: 'center',
													gap: 1,
												}}
											>
												<LocalDining sx={{ fontSize: 28 }} />
												Cooking Instructions
											</Typography>
											<Box
												component='ol'
												sx={{
													pl: 2,
													listStyleType: 'none',
													counterReset: 'step-counter',
													display: 'flex',
													flexDirection: 'column',
													gap: 2,
												}}
											>
												{recipe.cookingInstructions?.map(
													(instruction, index) => (
														<Box
															key={index}
															component='li'
															sx={{
																display: 'flex',
																gap: 2,
																p: 2,
																borderRadius: '12px',
																backgroundColor: 'rgba(0,0,0,0.02)',
																transition: 'all 0.2s ease',
																'&:hover': {
																	backgroundColor: 'rgba(0,0,0,0.04)',
																	transform: 'translateX(4px)',
																},
																'&:before': {
																	counterIncrement: 'step-counter',
																	content: 'counter(step-counter)',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																	width: '32px',
																	height: '32px',
																	borderRadius: '50%',
																	backgroundColor: 'warning.main',
																	color: 'white',
																	fontWeight: 600,
																	flexShrink: 0,
																},
															}}
														>
															<Typography
																variant='body1'
																sx={{
																	color: 'text.primary',
																	lineHeight: 1.7,
																}}
															>
																{instruction}
															</Typography>
														</Box>
													)
												)}
											</Box>
										</Paper>
									</motion.div>
								</Grid>
							)}

						{/* Freezer Prep */}
						{(recipe.freezerPrep?.length ?? 0) > 0 && (
							<Grid
								item
								xs={12}
								md={4}
							>
								<Paper
									elevation={3}
									sx={{
										p: 4,
										height: '100%',
										borderRadius: '16px',
										background:
											'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
										boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
										position: 'relative',
										overflow: 'hidden',
										'&:before': {
											content: '""',
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											height: '4px',
											background: 'linear-gradient(90deg, #2196F3, #03A9F4)',
										},
									}}
								>
									<Typography
										variant='h5'
										sx={{
											mb: 4,
											fontWeight: 700,
											color: 'info.main',
											display: 'flex',
											alignItems: 'center',
											gap: 1,
										}}
									>
										<Kitchen sx={{ fontSize: 28 }} />
										Freezer Prep
									</Typography>
									<Box
										component='ol'
										sx={{
											pl: 2,
											listStyleType: 'none',
											counterReset: 'step-counter',
											display: 'flex',
											flexDirection: 'column',
											gap: 2,
										}}
									>
										{recipe.freezerPrep?.map((instruction, index) => (
											<Box
												key={index}
												component='li'
												sx={{
													display: 'flex',
													gap: 2,
													p: 2,
													borderRadius: '12px',
													backgroundColor: 'rgba(0,0,0,0.02)',
													'&:before': {
														counterIncrement: 'step-counter',
														content: 'counter(step-counter)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														width: '32px',
														height: '32px',
														borderRadius: '50%',
														backgroundColor: 'info.main',
														color: 'white',
														fontWeight: 600,
														flexShrink: 0,
													},
												}}
											>
												<Typography variant='body1'>{instruction}</Typography>
											</Box>
										))}
									</Box>
								</Paper>
							</Grid>
						)}

						{/* Container Suggestions */}
						{(recipe.containerSuggestions?.length ?? 0) > 0 && (
							<Grid
								item
								xs={12}
								md={4}
							>
								<Paper
									elevation={3}
									sx={{
										p: 4,
										height: '100%',
										borderRadius: '16px',
										background:
											'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
										boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
										position: 'relative',
										overflow: 'hidden',
										'&:before': {
											content: '""',
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											height: '4px',
											background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
										},
									}}
								>
									<Typography
										variant='h5'
										sx={{
											mb: 4,
											fontWeight: 700,
											color: 'warning.main',
											display: 'flex',
											alignItems: 'center',
											gap: 1,
										}}
									>
										<Inventory sx={{ fontSize: 28 }} />
										Container Suggestions
									</Typography>
									<Box
										component='ul'
										sx={{
											pl: 2,
											listStyleType: 'disc',
											display: 'flex',
											flexDirection: 'column',
											gap: 2,
										}}
									>
										{recipe.containerSuggestions?.map((suggestion, index) => (
											<Box
												key={index}
												component='li'
												sx={{
													display: 'flex',
													gap: 2,
													p: 2,
													borderRadius: '12px',
													backgroundColor: 'rgba(0,0,0,0.02)',
												}}
											>
												<Typography variant='body1'>{suggestion}</Typography>
											</Box>
										))}
									</Box>
								</Paper>
							</Grid>
						)}

						{/* Defrost Instructions */}
						{(recipe.defrostInstructions?.length ?? 0) > 0 && (
							<Grid
								item
								xs={12}
								md={4}
							>
								<Paper
									elevation={3}
									sx={{
										p: 4,
										height: '100%',
										borderRadius: '16px',
										background:
											'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
										boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
										position: 'relative',
										overflow: 'hidden',
										'&:before': {
											content: '""',
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											height: '4px',
											background: 'linear-gradient(90deg, #9C27B0, #E040FB)',
										},
									}}
								>
									<Typography
										variant='h5'
										sx={{
											mb: 4,
											fontWeight: 700,
											color: 'secondary.main',
											display: 'flex',
											alignItems: 'center',
											gap: 1,
										}}
									>
										<AcUnit sx={{ fontSize: 28 }} />
										Defrost Instructions
									</Typography>
									<Box
										component='ol'
										sx={{
											pl: 2,
											listStyleType: 'none',
											counterReset: 'step-counter',
											display: 'flex',
											flexDirection: 'column',
											gap: 2,
										}}
									>
										{recipe.defrostInstructions?.map((instruction, index) => (
											<Box
												key={index}
												component='li'
												sx={{
													display: 'flex',
													gap: 2,
													p: 2,
													borderRadius: '12px',
													backgroundColor: 'rgba(0,0,0,0.02)',
													'&:before': {
														counterIncrement: 'step-counter',
														content: 'counter(step-counter)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														width: '32px',
														height: '32px',
														borderRadius: '50%',
														backgroundColor: 'secondary.main',
														color: 'white',
														fontWeight: 600,
														flexShrink: 0,
													},
												}}
											>
												<Typography variant='body1'>{instruction}</Typography>
											</Box>
										))}
									</Box>
								</Paper>
							</Grid>
						)}

						{/* Serving Instructions */}
						{(recipe.servingInstructions?.length ?? 0) > 0 && (
							<Grid
								item
								xs={12}
								md={4}
							>
								<Paper
									elevation={3}
									sx={{
										p: 4,
										height: '100%',
										borderRadius: '16px',
										background:
											'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
										boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
										position: 'relative',
										overflow: 'hidden',
										'&:before': {
											content: '""',
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											height: '4px',
											background: 'linear-gradient(90deg, #FF5722, #FF9800)',
										},
									}}
								>
									<Typography
										variant='h5'
										sx={{
											mb: 4,
											fontWeight: 700,
											color: 'error.main',
											display: 'flex',
											alignItems: 'center',
											gap: 1,
										}}
									>
										<Restaurant sx={{ fontSize: 28 }} />
										Serving Instructions
									</Typography>
									<Box
										component='ol'
										sx={{
											pl: 2,
											listStyleType: 'none',
											counterReset: 'step-counter',
											display: 'flex',
											flexDirection: 'column',
											gap: 2,
										}}
									>
										{recipe.servingInstructions?.map((instruction, index) => (
											<Box
												key={index}
												component='li'
												sx={{
													display: 'flex',
													gap: 2,
													p: 2,
													borderRadius: '12px',
													backgroundColor: 'rgba(0,0,0,0.02)',
													'&:before': {
														counterIncrement: 'step-counter',
														content: 'counter(step-counter)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														width: '32px',
														height: '32px',
														borderRadius: '50%',
														backgroundColor: 'error.main',
														color: 'white',
														fontWeight: 600,
														flexShrink: 0,
													},
												}}
											>
												<Typography variant='body1'>{instruction}</Typography>
											</Box>
										))}
									</Box>
								</Paper>
							</Grid>
						)}
					</Grid>

					{/* Allergen and Dietary Information */}
					{((recipe.allergenInfo?.length ?? 0) > 0 ||
						(recipe.dietaryInfo?.length ?? 0) > 0) && (
						<Paper
							elevation={3}
							sx={{ p: 4, mt: 4, borderRadius: '16px' }}
						>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								spacing={4}
							>
								{(recipe.allergenInfo?.length ?? 0) > 0 && (
									<Box flex={1}>
										<Typography
											variant='h5'
											gutterBottom
											sx={{
												mb: 3,
												display: 'flex',
												alignItems: 'center',
												gap: 1,
												color: 'warning.main',
											}}
										>
											<Warning sx={{ fontSize: 28 }} />
											Allergen Information
										</Typography>
										<Stack
											direction='row'
											spacing={1}
											flexWrap='wrap'
											gap={1}
										>
											{recipe.allergenInfo?.map((allergen, index) => (
												<Chip
													key={index}
													label={allergen}
													color='warning'
													variant='outlined'
												/>
											))}
										</Stack>
									</Box>
								)}

								{(recipe.dietaryInfo?.length ?? 0) > 0 && (
									<Box flex={1}>
										<Typography
											variant='h5'
											gutterBottom
											sx={{
												mb: 3,
												display: 'flex',
												alignItems: 'center',
												gap: 1,
												color: 'success.main',
											}}
										>
											<RestaurantMenu sx={{ fontSize: 28 }} />
											Dietary Information
										</Typography>
										<Stack
											direction='row'
											spacing={1}
											flexWrap='wrap'
											gap={1}
										>
											{recipe.dietaryInfo?.map((info, index) => (
												<Chip
													key={index}
													label={info}
													color='success'
													variant='outlined'
												/>
											))}
										</Stack>
									</Box>
								)}
							</Stack>
						</Paper>
					)}
				</Container>
			</Box>
			<Footer />
		</Box>
	);
}
