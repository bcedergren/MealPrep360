'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
	Box,
	Typography,
	CircularProgress,
	Button,
	ButtonGroup,
	Tooltip,
} from '@mui/material';
import {
	Restaurant as RecipeIcon,
	CalendarMonth as PlannerIcon,
	ShoppingCart as ShoppingIcon,
	Kitchen as FreezerIcon,
	CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { RecommendedRecipes } from '../../components/shared/recommended-recipes';
import MealPlanner from '../../components/shared/meal-planner';
import { ShoppingList } from '../../components/shared/ShoppingList';
import FreezerPage from '../freezer/page';
import { useTranslations } from '@/hooks/use-translations';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { PageHeader } from '../../components/shared/page-header';
import { useSubscription } from '@/contexts/subscription-context';
import {
	ShoppingListLoadingOverlay,
	shoppingListLoaderStyles,
} from '../../components/shared/ShoppingListLoadingOverlay';

interface ShoppingListData {
	_id: string;
	id?: string;
	name: string;
	items: {
		_id: string;
		name: string;
		quantity: number;
		unit: string;
		category: string;
		status: 'PENDING' | 'COMPLETED';
		additionalQuantities?: { quantity: number; unit: string }[];
	}[];
	status: 'ACTIVE' | 'COMPLETED';
	createdAt: Date;
}

export default function MealPlannerPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { user } = useUser();
	const { currentPlan } = useSubscription();
	const router = useRouter();
	const [activeSection, setActiveSection] = useState('planner');
	const [mounted, setMounted] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentShoppingList, setCurrentShoppingList] =
		useState<ShoppingListData | null>(null);
	const translations = useTranslations();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [shoppingListKey, setShoppingListKey] = useState(0);
	const { getMealPlanDurationLimit } = useSubscription();

	// Check if user has access to freezer features
	const hasFreezerAccess = currentPlan && currentPlan !== 'FREE';

	useEffect(() => {
		setMounted(true);
	}, []);

	const fetchCurrentShoppingList = async () => {
		try {
			// Add cache-busting parameter to ensure fresh data
			const response = await fetch(`/api/shopping-lists?t=${Date.now()}`, {
				credentials: 'include',
			});
			if (!response.ok) {
				throw new Error('Failed to fetch shopping list');
			}
			const data = await response.json();

			// Handle both response formats: direct array or object with shoppingLists property
			let shoppingLists: ShoppingListData[];

			if (Array.isArray(data)) {
				// Direct array format (legacy)
				shoppingLists = data;
			} else if (data && Array.isArray(data.shoppingLists)) {
				// New format with shoppingLists property
				shoppingLists = data.shoppingLists;

				// Log any message from the API (e.g., authentication issues)
				if (
					data.message &&
					!data.message.includes('external API authentication required')
				) {
					console.info('Shopping lists API message:', data.message);
				}
			} else {
				console.error('Invalid response format:', data);
				setCurrentShoppingList(null);
				return;
			}

			// Find the most recent active shopping list
			const activeList = shoppingLists.find(
				(list: ShoppingListData) => list.status === 'ACTIVE'
			);

			if (activeList) {
				setCurrentShoppingList(activeList);
			} else {
				setCurrentShoppingList(null);
			}
		} catch (error) {
			console.error('Error fetching shopping list:', error);
			setCurrentShoppingList(null);
		}
	};

	useEffect(() => {
		if (isLoaded && isSignedIn) {
			fetchCurrentShoppingList();
		}
	}, [isLoaded, isSignedIn]);

	// Fetch shopping list when switching to shopping section
	useEffect(() => {
		if (activeSection === 'shopping' && isLoaded && isSignedIn) {
			fetchCurrentShoppingList();
		}
	}, [activeSection, isLoaded, isSignedIn]);

	const generateShoppingList = async () => {
		setIsGenerating(true);
		try {
			// Get meal plan duration limit based on subscription
			const durationLimit = getMealPlanDurationLimit();

			// Calculate date range based on subscription tier
			const today = new Date();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
			startOfWeek.setHours(0, 0, 0, 0); // Start of day

			let endDate = new Date(startOfWeek);
			if (durationLimit === -1) {
				// Unlimited - get all available meal plans (up to 4 weeks for practical purposes)
				endDate.setDate(startOfWeek.getDate() + 27); // 4 weeks - 1 day
			} else {
				// Limited by subscription - get only allowed days
				endDate.setDate(startOfWeek.getDate() + durationLimit - 1);
			}
			endDate.setHours(23, 59, 59, 999); // End of day

			const response = await fetch(
				`/api/meal-plans?startDate=${startOfWeek.toISOString()}&endDate=${endDate.toISOString()}`,
				{
					credentials: 'include',
				}
			);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to get current meal plan');
			}

			if (!data || data.length === 0) {
				alert('No active meal plan found');
				return;
			}

			// Use the first meal plan found
			const currentMealPlan = data[0];

			const daysWithRecipes =
				currentMealPlan.days?.filter((day: any) => day.recipeId || day.recipe)
					?.length || 0;

			// Check if meal plan has recipes before generating shopping list
			if (daysWithRecipes === 0) {
				alert(
					'No recipes found in your meal plan. Please add recipes to your meal plan before generating a shopping list.'
				);
				return;
			}

			// Generate shopping list with the meal plan ID and date range
			const generateResponse = await fetch('/api/shopping-lists/generate', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					mealPlanId: currentMealPlan.id || currentMealPlan._id,
					startDate: startOfWeek.toISOString(),
					endDate: endDate.toISOString(),
					hasDays: !!currentMealPlan.days,
					daysLength: currentMealPlan.days?.length || 0,
					hasRecipes: daysWithRecipes > 0,
					recipeCount: daysWithRecipes,
				}),
			});

			const generateData = await generateResponse.json();

			if (!generateResponse.ok) {
				// Use details field if available for better user experience
				const errorMessage =
					generateData.details ||
					generateData.error ||
					'Failed to generate shopping list';

				// Handle specific error types
				if (generateData.type === 'MEAL_PLAN_NOT_FOUND_EXTERNAL') {
					throw new Error(
						'Your meal plan was not found on the external service. Please regenerate your meal plan and try again.'
					);
				}

				if (generateData.type === 'NO_RECIPES_FOUND') {
					throw new Error(
						'No recipes found in your meal plan. Please add recipes to your meal plan before generating a shopping list.'
					);
				}

				throw new Error(errorMessage);
			}

			// Update the current shopping list with the generated data
			setCurrentShoppingList(generateData);
			alert('Shopping list generated successfully!');
		} catch (error) {
			console.error('Error generating shopping list:', error);
			alert('Failed to generate shopping list');
		} finally {
			setIsGenerating(false);
		}
	};

	if (!mounted || !isLoaded) {
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

	if (!isSignedIn) {
		router.push('/sign-in');
		return null;
	}

	const getButtonStyle = (section: string) => {
		const isActive = section === activeSection;
		return {
			background: isActive
				? 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)'
				: 'linear-gradient(45deg, #2196F3 30%, #03A9F4 90%)',
			'&:hover': {
				background: isActive
					? 'linear-gradient(45deg, #388E3C 30%, #66BB6A 90%)'
					: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
			},
		};
	};

	return (
		<>
			<style>{shoppingListLoaderStyles}</style>
			<Box sx={{ p: 3 }}>
				<PageHeader
					title='Dashboard'
					description={`Welcome back, ${
						user?.firstName || 'Chef'
					}! Your meal planning journey starts here.`}
					backgroundColor='linear-gradient(45deg, #FF5722 30%, #FF9800 90%)'
					icon={<CalendarIcon />}
				/>

				{/* Section switcher below welcome box */}
				<Box
					sx={{
						overflowX: isMobile ? 'auto' : 'visible',
						whiteSpace: isMobile ? 'nowrap' : 'normal',
						mb: 0,
						mt: 0,
					}}
				>
					<ButtonGroup
						variant='contained'
						color='primary'
						aria-label='dashboard section switcher'
						fullWidth
						sx={{
							boxShadow: 2,
							borderRadius: 2,
							width: '100%',
							'& .MuiButton-root': {
								flex: 1,
								minWidth: 0,
								fontSize: { xs: '1.5rem', sm: '1.75rem' },
								px: 0,
								py: 2.5,
							},
						}}
					>
						<Tooltip
							title={translations.common.recommendedRecipes}
							arrow
						>
							<Button
								aria-label={translations.common.recommendedRecipes}
								onClick={() => setActiveSection('recipes')}
								sx={getButtonStyle('recipes')}
							>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
									}}
								>
									<RecipeIcon />
									{!isMobile && (
										<Typography
											variant='caption'
											sx={{ mt: 0.5 }}
										>
											{translations.common.recommendedRecipes}
										</Typography>
									)}
								</Box>
							</Button>
						</Tooltip>
						<Tooltip
							title={translations.common.mealPlan}
							arrow
						>
							<Button
								aria-label={translations.common.mealPlan}
								onClick={() => setActiveSection('planner')}
								sx={getButtonStyle('planner')}
							>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
									}}
								>
									<PlannerIcon />
									{!isMobile && (
										<Typography
											variant='caption'
											sx={{ mt: 0.5 }}
										>
											{translations.common.mealPlan}
										</Typography>
									)}
								</Box>
							</Button>
						</Tooltip>
						<Tooltip
							title={translations.common.shoppingList}
							arrow
						>
							<Button
								aria-label={translations.common.shoppingList}
								onClick={() => setActiveSection('shopping')}
								sx={getButtonStyle('shopping')}
							>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
									}}
								>
									<ShoppingIcon />
									{!isMobile && (
										<Typography
											variant='caption'
											sx={{ mt: 0.5 }}
										>
											{translations.common.shoppingList}
										</Typography>
									)}
								</Box>
							</Button>
						</Tooltip>
						<Tooltip
							title={
								hasFreezerAccess
									? translations.common.freezer
									: `${translations.common.freezer} (Upgrade required)`
							}
							arrow
						>
							<Button
								aria-label={translations.common.freezer}
								onClick={() => setActiveSection('freezer')}
								sx={getButtonStyle('freezer')}
							>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
									}}
								>
									<FreezerIcon />
									{!isMobile && (
										<Typography
											variant='caption'
											sx={{ mt: 0.5 }}
										>
											{translations.common.freezer}
										</Typography>
									)}
									{!hasFreezerAccess && (
										<Typography
											variant='caption'
											color='error'
											sx={{ mt: 0.25 }}
										>
											Free Plan
										</Typography>
									)}
								</Box>
							</Button>
						</Tooltip>
					</ButtonGroup>
				</Box>

				<Box
					component='main'
					sx={{
						flexGrow: 1,
						p: 0,
						mt: 0,
						mb: 4,
					}}
				>
					{activeSection === 'recipes' && (
						<Box>
							<RecommendedRecipes />
						</Box>
					)}

					{activeSection === 'planner' && (
						<Box
							sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
						>
							<MealPlanner
								onAddMeal={(date, mealType) => {
									// Handle adding a meal
								}}
							/>
						</Box>
					)}

					{activeSection === 'shopping' && (
						<Box key={shoppingListKey}>
							{isGenerating && (
								<Box
									sx={{
										position: 'fixed',
										top: '50%',
										left: '50%',
										transform: 'translate(-50%, -50%)',
										zIndex: 1300,
									}}
								>
									<ShoppingListLoadingOverlay />
								</Box>
							)}

							<Box
								sx={{
									filter: isGenerating ? 'blur(3px)' : 'none',
									transition: 'filter 0.3s ease',
									opacity: isGenerating ? 0.6 : 1,
								}}
							>
								{currentShoppingList ? (
									<ShoppingList
										shoppingList={currentShoppingList}
										onUpdate={async () => {
											await fetchCurrentShoppingList();
											// Force re-render if the shopping list was deleted
											setShoppingListKey((prev) => prev + 1);
										}}
									/>
								) : (
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: 2,
											py: { xs: 2, sm: 4 },
											px: { xs: 1, sm: 2 },
											textAlign: 'center',
										}}
									>
										<Typography
											variant='h6'
											color='text.secondary'
											sx={{
												fontSize: { xs: '1rem', sm: '1.25rem' },
												mb: { xs: 1, sm: 2 },
											}}
										>
											No active shopping list
										</Typography>
										{(() => {
											const limit = getMealPlanDurationLimit();
											const weeks =
												limit === -1 ? 'unlimited' : Math.ceil(limit / 7);
											return (
												<>
													{limit !== -1 && (
														<Typography
															variant='body2'
															color='text.secondary'
															sx={{ mb: 2 }}
														>
															Your plan allows shopping lists for up to {weeks}{' '}
															week
															{weeks === 1 ? '' : 's'} of meal plans
														</Typography>
													)}
													<Button
														variant='contained'
														onClick={generateShoppingList}
														disabled={isGenerating}
														startIcon={<ShoppingIcon />}
														sx={{
															width: { xs: '100%', sm: 'auto' },
															maxWidth: { xs: '280px', sm: 'none' },
															py: { xs: 1.5, sm: 1 },
															px: { xs: 2, sm: 3 },
															fontSize: { xs: '0.9rem', sm: '1rem' },
														}}
													>
														{isGenerating
															? 'Generating...'
															: 'Generate from Meal Plan'}
													</Button>
												</>
											);
										})()}
									</Box>
								)}
							</Box>
						</Box>
					)}

					{activeSection === 'freezer' && (
						<Box>
							<FreezerPage />
						</Box>
					)}
				</Box>
			</Box>
		</>
	);
}
