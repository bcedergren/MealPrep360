'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import {
	Box,
	Typography,
	Paper,
	CircularProgress,
	Button,
	ButtonGroup,
	Container,
	Tooltip,
	Snackbar,
	Alert,
} from '@mui/material';
import {
	Restaurant as RecipeIcon,
	CalendarMonth as PlannerIcon,
	ShoppingCart as ShoppingIcon,
	Kitchen as FreezerIcon,
	Dashboard as DashboardIcon,
	Home as HomeIcon,
	Help as HelpIcon,
} from '@mui/icons-material';
import { RecommendedRecipes } from '../components/shared/recommended-recipes';
import MealPlanner from '../components/shared/meal-planner';
import { ShoppingList } from '../components/shared/ShoppingList';
import FreezerPage from '@/app/dashboard/freezer/page';
import { useTranslations } from '@/hooks/use-translations';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { PageHeader } from '../components/shared/page-header';
import { OnboardingTutorial } from '../components/shared/onboarding-tutorial';
import { useSettings } from '@/contexts/settings-context';
import { useSubscription } from '@/contexts/subscription-context';
import {
	ShoppingListLoadingOverlay,
	shoppingListLoaderStyles,
} from '../components/shared/ShoppingListLoadingOverlay';

interface MealPlanData {
	id: string;
	date: Date;
	recipeId: string | null;
	recipe?: {
		title: string;
		servings: number;
		ingredients: string;
	} | null;
	servings: number;
	status: 'PLANNED' | 'COOKED' | 'FROZEN' | 'CONSUMED' | 'SKIPPED';
	createdAt: Date;
}

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

export default function DashboardPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { user } = useUser();
	const { currentPlan } = useSubscription();
	const router = useRouter();
	const [activeSection, setActiveSection] = useState('recipes');
	const [mounted, setMounted] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentShoppingList, setCurrentShoppingList] =
		useState<ShoppingListData | null>(null);
	const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
	const translations = useTranslations();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: 'success' | 'error' | 'info' | 'warning';
	}>({
		open: false,
		message: '',
		severity: 'success',
	});
	const [showOnboarding, setShowOnboarding] = useState(false);
	const {
		settings,
		updateSettings,
		isLoading: settingsLoading,
	} = useSettings();

	// Check if user has access to freezer features
	const hasFreezerAccess = currentPlan && currentPlan !== 'FREE';
	const [hasAutoShownTutorial, setHasAutoShownTutorial] = useState(false);
	const [tutorialShowTimeout, setTutorialShowTimeout] =
		useState<NodeJS.Timeout | null>(null);
	const [shoppingListKey, setShoppingListKey] = useState(0);
	const { getMealPlanDurationLimit } = useSubscription();

	useEffect(() => {
		setMounted(true);
	}, []);

	// Track when settings are fully initialized
	useEffect(() => {
		if (settings && !settingsLoading) {
			// Settings are ready when we have settings data and loading is complete
		}
	}, [settings, settingsLoading]);

	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const fetchCurrentShoppingList = async () => {
		try {
			// Add cache-busting parameter to ensure fresh data
			const response = await fetch(`/api/shopping-lists?t=${Date.now()}`, {
				credentials: 'include', // Include cookies for authentication
			});

			console.log('🛒 Frontend: Response status:', response.status);
			console.log('🛒 Frontend: Response ok:', response.ok);

			if (!response.ok) {
				const errorText = await response.text();
				console.log('🛒 Frontend: Error response:', errorText);
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

	// Check if user is new and should see onboarding
	useEffect(() => {
		// Don't do anything if settings are still loading or not initialized
		if (!isLoaded || !isSignedIn || !user || !settings || settingsLoading) {
			setShowOnboarding(false);
			return;
		}

		// Clear any existing timeout
		if (tutorialShowTimeout) {
			clearTimeout(tutorialShowTimeout);
			setTutorialShowTimeout(null);
		}

		// Ensure we have a valid settings object with onboarding property
		if (!settings.onboarding) {
			setShowOnboarding(false);
			return;
		}

		const hasSeenOnboarding = settings.onboarding.tutorialCompleted === true;

		// If user has already completed tutorial, ensure it doesn't show
		if (hasSeenOnboarding) {
			setShowOnboarding(false);
			setHasAutoShownTutorial(true);
			return;
		}

		// Only auto-show tutorial if user hasn't seen it AND we haven't already auto-shown it this session
		if (!hasAutoShownTutorial && !showOnboarding) {
			// Show onboarding after a short delay for better UX
			const timeout = setTimeout(() => {
				// Double-check the settings haven't changed during the delay
				if (settings?.onboarding?.tutorialCompleted !== true) {
					setShowOnboarding(true);
					setHasAutoShownTutorial(true);
				}
				setTutorialShowTimeout(null);
			}, 1000);
			setTutorialShowTimeout(timeout);
		}
	}, [
		isLoaded,
		isSignedIn,
		user,
		settings,
		settingsLoading,
		hasAutoShownTutorial,
		showOnboarding,
	]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (tutorialShowTimeout) {
				clearTimeout(tutorialShowTimeout);
			}
		};
	}, [tutorialShowTimeout]);

	const handleOnboardingComplete = async () => {
		// Immediately close the tutorial to prevent it from showing again
		setShowOnboarding(false);

		if (user && settings) {
			try {
				// Only update the onboarding field, not the entire settings
				await updateSettings({
					onboarding: {
						tutorialCompleted: true,
					},
				});
			} catch (error) {
				console.error('Error updating tutorial completion status:', error);
			}
		}
	};

	const handleTutorialClose = () => {
		setShowOnboarding(false);
		// Mark tutorial as completed when user closes it manually
		handleOnboardingComplete();
	};

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
				setSnackbar({
					open: true,
					message: 'No active meal plan found',
					severity: 'warning',
				});
				return;
			}

			// Use the first meal plan found
			const currentMealPlan = data[0];

			const daysWithRecipes =
				currentMealPlan.days?.filter((day: any) => day.recipeId || day.recipe)
					?.length || 0;

			// Check if meal plan has recipes before generating shopping list
			if (daysWithRecipes === 0) {
				setSnackbar({
					open: true,
					message:
						'No recipes found in your meal plan. Please add recipes to your meal plan before generating a shopping list.',
					severity: 'warning',
				});
				return;
			}

			// Generate shopping list with the meal plan ID and date range
			const generateResponse = await fetch(`/api/shopping-lists/generate`, {
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

				if (generateData.type === 'SERVICE_UNAVAILABLE') {
					throw new Error(
						'Shopping list service is temporarily unavailable. Please try again in a few minutes.'
					);
				}

				throw new Error(errorMessage);
			}

			// Update the current shopping list with the generated data
			// Handle different response structures from the API
			let shoppingListData;
			if (generateData.shoppingList) {
				// New API format: { shoppingList: { items: [...] } }
				shoppingListData = generateData.shoppingList;
			} else if (generateData.items) {
				// Direct format: { items: [...] }
				shoppingListData = generateData;
			} else {
				throw new Error('Invalid shopping list response structure');
			}

			setCurrentShoppingList(shoppingListData);

			// Create message based on subscription tier
			let message = 'Shopping list generated from meal plan!';
			if (durationLimit !== -1) {
				const weeks = Math.ceil(durationLimit / 7);
				message = `Shopping list generated for ${weeks} week${
					weeks > 1 ? 's' : ''
				} based on your subscription plan.`;
			}

			setSnackbar({
				open: true,
				message,
				severity: 'success',
			});
		} catch (error) {
			console.error('Detailed error:', error);
			setSnackbar({
				open: true,
				message:
					error instanceof Error
						? error.message
						: 'Failed to generate shopping list',
				severity: 'error',
			});
		} finally {
			setIsGenerating(false);
		}
	};

	const handleTestAuth = async () => {
		try {
			const response = await fetch('/api/test-auth');
			const data = await response.json();

			if (response.ok) {
				alert('Authentication test successful! Check console for details.');
			} else {
				console.error('❌ Authentication test failed:', data);
				alert(
					`Authentication test failed: ${data.error}\nCheck console for details.`
				);
			}
		} catch (error) {
			console.error('❌ Authentication test error:', error);
			alert('Authentication test error! Check console for details.');
		}
	};

	const handleTestConnection = async () => {
		try {
			const response = await fetch('/api/test-connection', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ test: 'external-api' }),
			});
			const data = await response.json();

			if (response.ok) {
				const basicTest = data.externalApiTest;
				const mealPlannerTest = data.mealPlannerTest;

				let message = `External API test completed!\n\nBasic Test:\nSuccess: ${basicTest?.success}\nStatus: ${basicTest?.status}\nError: ${basicTest?.error || 'None'}`;

				if (mealPlannerTest) {
					message += `\n\nMeal Planner Test:\nSuccess: ${mealPlannerTest.success}\nStatus: ${mealPlannerTest.status}\nError: ${mealPlannerTest.error || 'None'}`;

					if (mealPlannerTest.params) {
						message += `\n\nParameters:\nstartDate: ${mealPlannerTest.params.startDate}\nendDate: ${mealPlannerTest.params.endDate}`;
					}
				}

				message += '\n\nCheck console for details.';

				alert(message);
			} else {
				console.error('❌ External API test failed:', data);
				alert(
					`External API test failed: ${data.message}\nCheck console for details.`
				);
			}
		} catch (error) {
			console.error('❌ External API test error:', error);
			alert('External API test error! Check console for details.');
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
			<Container
				maxWidth={false}
				sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}
			>
				<PageHeader
					title='Dashboard'
					description={`Welcome back, ${
						user?.firstName || 'Chef'
					}! Your meal planning journey starts here.`}
					backgroundColor='linear-gradient(45deg, #FF5722 30%, #FF9800 90%)'
					icon={<HomeIcon />}
					rightAction={
						<Box sx={{ display: 'flex', gap: 1 }}>
							{!isMobile && (
								<Tooltip
									title='Show Tutorial'
									arrow
								>
									<Button
										variant='outlined'
										size='small'
										onClick={() => setShowOnboarding(true)}
										sx={{
											color: 'white',
											borderColor: 'rgba(255, 255, 255, 0.6)',
											fontWeight: 'bold',
											fontSize: { xs: '0.75rem', sm: '0.875rem' },
											padding: { xs: '4px 8px', sm: '6px 16px' },
											minWidth: { xs: 'auto', sm: 'fit-content' },
											'&:hover': {
												borderColor: '#81C784',
												backgroundColor: 'rgba(129, 199, 132, 0.15)',
												color: '#E8F5E8',
												transform: 'translateY(-1px)',
											},
											transition: 'all 0.3s ease',
										}}
										startIcon={<HelpIcon />}
									>
										Tutorial
									</Button>
								</Tooltip>
							)}
						</Box>
					}
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
									: 'Upgrade to Premium to access Freezer features'
							}
							arrow
						>
							<span style={{ display: 'flex', flex: 1 }}>
								<Button
									aria-label={translations.common.freezer}
									onClick={() => {
										if (hasFreezerAccess) {
											setActiveSection('freezer');
										} else {
											// Show upgrade popup or redirect to pricing
											setSnackbar({
												open: true,
												message:
													'Upgrade to Premium to access Freezer features!',
												severity: 'info',
											});
										}
									}}
									disabled={!hasFreezerAccess}
									sx={{
										...getButtonStyle('freezer'),
										width: '100%',
										opacity: hasFreezerAccess ? 1 : 0.6,
										'&:disabled': {
											background:
												'linear-gradient(45deg, #9E9E9E 30%, #BDBDBD 90%)',
											color: 'rgba(255, 255, 255, 0.7)',
										},
									}}
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
									</Box>
								</Button>
							</span>
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
										onUpdate={async (deleted?: boolean) => {
											console.log(
												'🔍 onUpdate callback called, deleted:',
												deleted
											);

											if (deleted) {
												// Shopping list was deleted, immediately clear it from state
												console.log(
													'🔍 Shopping list deleted - clearing from state'
												);
												setCurrentShoppingList(null);
												setShoppingListKey((prev) => prev + 1);
												return;
											}

											// For other updates (item changes), fetch latest data
											await fetchCurrentShoppingList();
											setShoppingListKey((prev) => prev + 1);
											console.log('🔍 Shopping list key incremented');
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

				<Snackbar
					open={snackbar.open}
					autoHideDuration={6000}
					onClose={handleCloseSnackbar}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				>
					<Alert
						onClose={handleCloseSnackbar}
						severity={snackbar.severity}
						sx={{ width: '100%' }}
					>
						{snackbar.message}
					</Alert>
				</Snackbar>

				{/* Onboarding Tutorial - Only show if settings are loaded and tutorial hasn't been completed */}
				{!settingsLoading && settings && (
					<OnboardingTutorial
						open={
							showOnboarding && settings.onboarding?.tutorialCompleted !== true
						}
						onClose={handleTutorialClose}
						onComplete={handleOnboardingComplete}
					/>
				)}
			</Container>
		</>
	);
}
