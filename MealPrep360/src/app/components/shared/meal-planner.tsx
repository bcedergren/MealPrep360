'use client';

import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from 'react';
import {
	Box,
	Typography,
	Snackbar,
	Alert,
	Button,
	CircularProgress,
} from '@mui/material';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/contexts/subscription-context';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import {
	addDays,
	subDays,
	addMonths,
	startOfDay,
	endOfDay,
	eachDayOfInterval,
	format,
	differenceInCalendarDays,
	startOfMonth,
} from 'date-fns';
import { CalendarMonth } from '@mui/icons-material';

// Import types and utilities
import {
	Day,
	MealStatus,
	DisplayMealPlan,
	MealPlanItem,
	MealPlannerProps,
	UserPreferences,
} from './types/meal-planner';
import { Recipe } from '@/types/recipe';
import {
	parseDate,
	transformMealPlanData,
	organizeMealPlansByDate,
	getSkippedDays,
	fetchSkippedDays as fetchSkippedDaysUtil,
	formatDate,
	getWeekStartDate,
} from './utils/meal-planner-utils';

// Import components
import { LoadingOverlay } from './LoadingOverlay';
import { StatusMenu, StatusChangeMenu } from './MealPlannerMenus';
import {
	DeleteConfirmDialog,
	NoRecipesDialog,
	ErrorDialog,
	OverwriteConfirmationDialog,
} from './MealPlannerDialogs';
import { CalendarNavigation } from './CalendarNavigation';
import { WeekFlex } from './WeekFlex';
import { MealPlannerSkeleton } from './meal-planner-skeleton';

// Add this CSS at the top of your file or in your global styles
const styles = `
	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.1);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 0.8;
		}
	}
`;

// Update MealPlanner component
const MealPlanner: React.FC<MealPlannerProps> = ({ onAddMeal }) => {
	const { userId, getToken } = useAuth();
	const router = useRouter();
	const { currentPlan, getMealPlanDurationLimit } = useSubscription();
	const scrollRef = useRef<HTMLDivElement>(null);
	const menuAnchorRef = useRef<HTMLElement | null>(null);

	// Group all useState hooks together
	const [currentDate, setCurrentDate] = useState(new Date());
	const [plans, setPlans] = useState<DisplayMealPlan[]>([]);
	const [loading, setLoading] = useState(false); // Don't block initial render
	const [recipesLoading, setRecipesLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [pendingGeneration, setPendingGeneration] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [planToDelete, setPlanToDelete] = useState<MealPlanItem | null>(null);
	const [noRecipesModalOpen, setNoRecipesModalOpen] = useState(false);
	const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);
	const [errorModalOpen, setErrorModalOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [skippedDays, setSkippedDays] = useState<string[]>([]);
	const [mealPlansByDate, setMealPlansByDate] = useState<
		Record<string, MealPlanItem[]>
	>({});
	const [refreshKey, setRefreshKey] = useState(0); // Force re-render key

	const [focusedIdx, setFocusedIdx] = useState(0);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: 'success' | 'error' | 'info';
	}>({
		open: false,
		message: '',
		severity: 'success',
	});
	const [skipUnskipInProgress, setSkipUnskipInProgress] = useState(false);
	const [statusUpdateInProgress, setStatusUpdateInProgress] = useState(false);
	const [updatingPlanKey, setUpdatingPlanKey] = useState<string | null>(null);

	// Add userPreferences state
	const [userPreferences, setUserPreferences] = useState<UserPreferences>({
		settings: {
			settings: {
				preferences: {
					dietaryPreferences: [],
					allergies: [],
					cookingSkill: 'Intermediate',
					cookingTime: 'Moderate (30-60 min)',
					cuisines: [],
					kidFriendly: false,
					quickMeals: false,
					healthy: false,
				},
				mealPlanning: {
					weeklyPlanningEnabled: true,
					shoppingListEnabled: true,
					nutritionTrackingEnabled: true,
					defaultDuration: '14',
					defaultServings: 4,
				},
			},
		},
	});

	// Define menu state
	const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	// Add state for status menu
	const [statusMenuAnchorEl, setStatusMenuAnchorEl] =
		useState<HTMLElement | null>(null);
	const [statusSelectedPlan, setStatusSelectedPlan] =
		useState<MealPlanItem | null>(null);

	const handleMenuOpen = useCallback(
		(event: React.MouseEvent<HTMLElement>, date: Date) => {
			setMenuAnchorEl(event.currentTarget);
			// Preserve the local date
			const localDate = new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate()
			);
			setSelectedDate(localDate);
		},
		[]
	);

	const handleMenuClose = useCallback(() => {
		setMenuAnchorEl(null);
		setSelectedDate(null);
	}, []);

	// Add handlers for status menu
	const handleStatusMenuOpen = useCallback(
		(event: React.MouseEvent<HTMLElement>, plan: MealPlanItem) => {
			setStatusMenuAnchorEl(event.currentTarget);
			setStatusSelectedPlan(plan);
		},
		[]
	);

	const handleStatusMenuClose = useCallback(() => {
		setStatusMenuAnchorEl(null);
		setStatusSelectedPlan(null);
	}, []);

	// Helper to anchor 4-week view to first Sunday of active plan month
	const getMonthAnchorStart = useCallback(
		(date: Date) => {
			const activePlan = plans.find((plan) => {
				const planStart = startOfDay(parseDate(plan.startDate));
				const planEnd = endOfDay(parseDate(plan.endDate));
				return planStart <= date && date <= planEnd;
			});
			const anchorBase = activePlan
				? startOfMonth(parseDate(activePlan.startDate))
				: startOfMonth(date);
			return getWeekStartDate(anchorBase);
		},
		[plans]
	);

	// Define fetchMealPlans before it's used
	const fetchMealPlans = useCallback(
		async (skipLoadingState = false, customDate?: Date) => {
			try {
				if (!skipLoadingState) {
					setRecipesLoading(true);
				}

				// Determine planner window and aligned fetch start
				const dateToUse = customDate || currentDate;
				const durationLimit = getMealPlanDurationLimit();
				let fetchDays = 7; // Default to 1 week for FREE plans
				if (durationLimit === -1) {
					fetchDays = 28;
				} else if (durationLimit > 0) {
					fetchDays = durationLimit;
				} else {
					fetchDays = 7;
				}

				const monthAlignedStart = getMonthAnchorStart(dateToUse);
				const weekAlignedStart = getWeekStartDate(dateToUse);
				const fetchStartDate =
					fetchDays >= 28 ? monthAlignedStart : weekAlignedStart;
				const fetchEndDate = endOfDay(addDays(fetchStartDate, fetchDays - 1));

				// Get authentication token
				const token = await getToken();

				// Fetch meal plans with includeRecipes parameter for server-side optimization
				const doFetch = async (start: Date, end: Date) => {
					const res = await fetch(
						`/api/meal-plans?startDate=${start.toISOString()}&endDate=${end.toISOString()}&includeRecipes=true`,
						{
							cache: 'no-store',
							headers: {
								'Cache-Control': 'no-cache',
								...(token && { Authorization: `Bearer ${token}` }),
							},
						}
					);
					if (!res.ok) throw new Error('Failed to fetch meal plans');
					return res.json();
				};

				let data = await doFetch(fetchStartDate, fetchEndDate);
				let transformedData = transformMealPlanData(data);

				// If no days were returned, broaden the window to 28 days centered on current view
				const totalDaysReturned = transformedData.reduce(
					(acc, p) => acc + (Array.isArray(p.days) ? p.days.length : 0),
					0
				);
				if (totalDaysReturned === 0) {
					const broadStart = getWeekStartDate(addDays(dateToUse, -14));
					const broadEnd = endOfDay(addDays(broadStart, 27));
					try {
						const broadData = await doFetch(broadStart, broadEnd);
						const broadTransformed = transformMealPlanData(broadData);
						const broadTotalDays = broadTransformed.reduce(
							(acc, p) => acc + (Array.isArray(p.days) ? p.days.length : 0),
							0
						);
						if (broadTotalDays > 0) {
							transformedData = broadTransformed;
						}
					} catch (e) {
						// Ignore fallback errors; keep original
					}
				}

				// If recipes are not embedded by the backend, batch fetch missing recipe details client-side
				try {
					const recipeIdsToFetch = new Set<string>();
					transformedData.forEach((plan) => {
						plan.days.forEach((day) => {
							if (day.recipeId && !day.recipe) {
								recipeIdsToFetch.add(String(day.recipeId));
							}
						});
					});

					if (recipeIdsToFetch.size > 0) {
						const ids = Array.from(recipeIdsToFetch);
						const res = await fetch('/api/recipes', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ recipeIds: ids }),
						});

						if (res.ok) {
							const recipes = await res.json();
							const recipeMap = new Map<string, any>();
							recipes.forEach((r: any) => {
								const key = String(r.id || r._id);
								recipeMap.set(key, {
									id: r.id || r._id,
									title: r.title || 'Untitled Recipe',
									description: r.description || '',
									mealType: r.mealType || 'dinner',
									imageUrl: r.images?.main || r.imageUrl || '',
								});
							});

							if (recipeMap.size > 0) {
								transformedData = transformedData.map((plan) => ({
									...plan,
									days: plan.days.map((day) => {
										const rid = day.recipeId ? String(day.recipeId) : null;
										if (!day.recipe && rid && recipeMap.has(rid)) {
											return { ...day, recipe: recipeMap.get(rid) };
										}
										return day;
									}),
								}));
							}
						} else {
							console.warn('Batch recipe fetch failed with status', res.status);
						}
					}
				} catch (enrichErr) {
					console.warn('Recipe enrichment failed:', enrichErr);
				}

				// Batch state updates to prevent multiple re-renders
				const organized = organizeMealPlansByDate(transformedData);

				// Use a single state update to prevent race conditions
				setPlans(transformedData);
				setMealPlansByDate(organized);
			} catch (error) {
				console.error('Error fetching meal plans:', error);
				setError(
					error instanceof Error ? error.message : 'Failed to fetch meal plans'
				);
			} finally {
				if (!skipLoadingState) {
					setRecipesLoading(false);
				}
			}
		},
		[currentDate, getToken, getMealPlanDurationLimit]
	);

	// Optimized effect to fetch meal plans and skipped days
	useEffect(() => {
		const abortController = new AbortController();
		let timeoutId: NodeJS.Timeout;

		const fetchData = async () => {
			// Don't fetch data if we're in the middle of a skip/unskip operation
			if (skipUnskipInProgress || abortController.signal.aborted) {
				return;
			}

			try {
				// Align skipped days fetch to planner window start
				const durationLimit = getMealPlanDurationLimit();
				let fetchDays = 7;
				if (durationLimit === -1) fetchDays = 28;
				else if (durationLimit > 0) fetchDays = durationLimit;
				const monthAlignedStart = getMonthAnchorStart(currentDate);
				const weekAlignedStart = getWeekStartDate(currentDate);
				const start = fetchDays >= 28 ? monthAlignedStart : weekAlignedStart;
				const end = endOfDay(addDays(start, fetchDays - 1));

				// Fetch meal plans and skipped days in parallel with abort signal
				const [, skippedDaysData] = await Promise.all([
					fetchMealPlans(),
					fetchSkippedDaysUtil(start, end, getToken),
				]);

				// Only update state if not aborted
				if (!abortController.signal.aborted) {
					setSkippedDays(skippedDaysData);
				}
			} catch (error) {
				if (!abortController.signal.aborted) {
					console.error('Error fetching data:', error);
				}
			}
		};

		// Debounce the fetch to prevent rapid successive calls
		timeoutId = setTimeout(fetchData, 100);

		return () => {
			clearTimeout(timeoutId);
			abortController.abort();
		};
	}, [currentDate, getToken, skipUnskipInProgress, getMealPlanDurationLimit]);

	// Effect to attach scroll listener with throttling
	useEffect(() => {
		let timeoutId: NodeJS.Timeout;

		const handleScroll = () => {
			if (timeoutId) clearTimeout(timeoutId);

			timeoutId = setTimeout(() => {
				if (!scrollRef.current) return;
				const children = Array.from(scrollRef.current.children);
				let minDiff = Infinity;
				let idx = 0;
				children.forEach((child, i) => {
					const rect = (child as HTMLElement).getBoundingClientRect();
					const diff = Math.abs(
						rect.left + rect.width / 2 - window.innerWidth / 2
					);
					if (diff < minDiff) {
						minDiff = diff;
						idx = i;
					}
				});
				setFocusedIdx(idx);
			}, 16); // ~60fps throttling
		};

		const scrollElement = scrollRef.current;
		if (scrollElement) {
			scrollElement.addEventListener('scroll', handleScroll, { passive: true });
			return () => {
				if (timeoutId) clearTimeout(timeoutId);
				scrollElement.removeEventListener('scroll', handleScroll);
			};
		}
	}, []);

	// Fetch user preferences
	useEffect(() => {
		const fetchUserPreferences = async () => {
			try {
				const response = await fetch('/api/user/preferences');
				if (response.ok) {
					const data = await response.json();

					// Ensure the data has the correct structure
					const formattedPreferences: UserPreferences = {
						settings: {
							settings: {
								preferences: {
									dietaryPreferences:
										data.settings?.settings?.preferences?.dietaryPreferences ||
										[],
									allergies:
										data.settings?.settings?.preferences?.allergies || [],
									cookingSkill:
										data.settings?.settings?.preferences?.cookingSkill ||
										'Intermediate',
									cookingTime:
										data.settings?.settings?.preferences?.cookingTime ||
										'Moderate (30-60 min)',
									cuisines:
										data.settings?.settings?.preferences?.cuisines || [],
									kidFriendly:
										data.settings?.settings?.preferences?.kidFriendly || false,
									quickMeals:
										data.settings?.settings?.preferences?.quickMeals || false,
									healthy:
										data.settings?.settings?.preferences?.healthy || false,
								},
								mealPlanning: {
									weeklyPlanningEnabled: true,
									shoppingListEnabled: true,
									nutritionTrackingEnabled: true,
									defaultDuration: '14',
									defaultServings: 4,
								},
							},
						},
					};
					setUserPreferences(formattedPreferences);
				}
			} catch (error) {
				console.error('Error fetching user preferences:', error);
			}
		};

		fetchUserPreferences();
	}, []);

	// Define handleStatusUpdate before it's used
	const handleStatusUpdate = useCallback(
		async (plan: MealPlanItem, status: string) => {
			try {
				// Create a unique key for this specific plan on this specific date
				const planKey = `${plan.id}-${format(plan.date, 'yyyy-MM-dd')}`;

				// Set loading state
				setStatusUpdateInProgress(true);
				setUpdatingPlanKey(planKey);

				// Close the status menu immediately
				handleStatusMenuClose();

				// Always use the main meal plan PATCH endpoint for consistency
				// Validate that we have required fields
				if (!plan.id || plan.dayIndex === undefined || plan.dayIndex === null) {
					console.error('Invalid plan structure:', {
						id: plan.id,
						dayIndex: plan.dayIndex,
						plan,
					});
					throw new Error(
						'Invalid meal plan data. Please refresh and try again.'
					);
				}

				const response = await fetch(
					`/api/meal-plans/${plan.id}/days/${plan.dayIndex}`,
					{
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							recipeId: plan.recipeId,
							status,
						}),
					}
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					console.error('Failed to update meal status:', {
						status: response.status,
						statusText: response.statusText,
						planId: plan.id,
						dayIndex: plan.dayIndex,
						errorData,
					});

					// Handle subscription-related errors
					if (response.status === 403) {
						if (errorData.type === 'SUBSCRIPTION_REQUIRED') {
							throw new Error(
								errorData.error ||
									'This feature requires a paid subscription. Please upgrade your plan.'
							);
						}
						throw new Error(
							errorData.error ||
								'Access denied. Please check your subscription.'
						);
					}

					// Handle external API unavailability
					if (
						response.status === 503 &&
						errorData.type === 'EXTERNAL_API_UNAVAILABLE'
					) {
						throw new Error(
							errorData.error ||
								'External service is currently unavailable. Please try again later.'
						);
					}

					throw new Error(`Failed to update status: ${response.statusText}`);
				}

				const responseData = await response.json();

				// If the status is 'frozen', add to freezer inventory (only for paid plans)
				if (status === 'frozen' && plan.recipe && plan.recipeId) {
					// Check if user has access to freezer features
					const hasFreezerAccess = currentPlan && currentPlan !== 'FREE';

					if (hasFreezerAccess) {
						try {
							const freezerResponse = await fetch('/api/freezer/inventory', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify({
									recipeId: plan.recipeId,
									recipe: plan.recipe,
									quantity: 1,
									dateFrozen: new Date().toISOString(),
									mealPlanDate: format(plan.date, 'yyyy-MM-dd'),
									notes: `Frozen from meal plan for ${format(plan.date, 'MMMM d, yyyy')}`,
								}),
							});

							if (freezerResponse.ok) {
							} else {
								console.warn(
									'⚠️ Failed to add recipe to freezer inventory, but meal status was updated'
								);
							}
						} catch (freezerError) {
							console.warn('⚠️ Freezer inventory update failed:', freezerError);
							// Don't fail the entire operation if freezer update fails
						}
					}
				}

				// Apply optimistic update to UI state immediately

				// Update the specific meal plan item in the state
				const dateKey = format(plan.date, 'yyyy-MM-dd');

				// Batch state updates to prevent multiple re-renders
				setMealPlansByDate((prevState) => {
					const updatedState = { ...prevState };
					if (updatedState[dateKey]) {
						updatedState[dateKey] = updatedState[dateKey].map((p) => {
							if (p.id === plan.id && p.dayIndex === plan.dayIndex) {
								return { ...p, status: status as MealStatus };
							}
							return p;
						});
					}
					return updatedState;
				});

				// Also update the plans array for consistency
				setPlans((prevPlans) =>
					prevPlans.map((planItem) => ({
						...planItem,
						days: planItem.days.map((day) => {
							const dayDateStr = format(new Date(day.date), 'yyyy-MM-dd');
							if (dayDateStr === dateKey && planItem.id === plan.id) {
								return { ...day, status: status as MealStatus };
							}
							return day;
						}),
					}))
				);

				// Refresh the data after a short delay to ensure persistence
				setTimeout(async () => {
					try {
						await fetchMealPlans(true); // Silent refresh
					} catch (error) {
						console.warn('⚠️ Data refresh failed:', error);
					}
				}, 1000); // 1-second delay

				// Show success message
				setSnackbar({
					open: true,
					message: 'Meal status updated successfully!',
					severity: 'success',
				});
			} catch (error) {
				console.error('Error updating meal status:', error);
				setError('Failed to update meal status');
				setSnackbar({
					open: true,
					message:
						error instanceof Error
							? error.message
							: 'Failed to update meal status',
					severity: 'error',
				});
			} finally {
				// Clear loading state
				setStatusUpdateInProgress(false);
				setUpdatingPlanKey(null);
			}
		},
		[handleStatusMenuClose, fetchMealPlans, currentPlan]
	);

	// Define handleDeleteClick before handleDeleteConfirm
	const handleDeleteClick = useCallback(
		async (plan: MealPlanItem) => {
			try {
				const response = await fetch(`/api/meal-plans/${plan.id}`, {
					method: 'DELETE',
				});

				if (!response.ok) {
					throw new Error(`Failed to delete meal plan: ${response.statusText}`);
				}

				await fetchMealPlans(true); // Skip loading state for deletions
				setPlanToDelete(null);
				setDeleteConfirmOpen(false);
			} catch (error) {
				console.error('Error deleting meal plan:', error);
				setError('Failed to delete meal plan');
			}
		},
		[fetchMealPlans]
	);

	// Define handleDeleteConfirm after handleDeleteClick
	const handleDeleteConfirm = useCallback(() => {
		if (planToDelete) {
			handleDeleteClick(planToDelete);
		}
		setDeleteConfirmOpen(false);
	}, [planToDelete, handleDeleteClick]);

	// Navigation step equals the current planner window size (same as displayDays)
	const navStep = useMemo(() => {
		const durationLimit = getMealPlanDurationLimit();
		if (durationLimit === -1) return 28;
		if (durationLimit > 0) return Math.min(durationLimit, 28);
		return 7;
	}, [getMealPlanDurationLimit]);

	const handlePreviousWeek = useCallback(() => {
		if (navStep >= 28) {
			const anchor = getMonthAnchorStart(currentDate);
			setCurrentDate(addMonths(anchor, -1));
		} else {
			setCurrentDate((prevDate) => subDays(prevDate, navStep));
		}
	}, [navStep, getMonthAnchorStart, currentDate]);

	const handleNextWeek = useCallback(() => {
		if (navStep >= 28) {
			const anchor = getMonthAnchorStart(currentDate);
			setCurrentDate(addMonths(anchor, 1));
		} else {
			setCurrentDate((prevDate) => addDays(prevDate, navStep));
		}
	}, [navStep, getMonthAnchorStart, currentDate]);

	const handleGeneratePlan = useCallback(async () => {
		try {
			setIsGenerating(true);
			setErrorMessage('');

			// Check if there are existing meal plans before proceeding
			if (plans.length > 0) {
				console.log('📋 Existing meal plans detected, showing override dialog');
				console.log('📊 Existing plans count:', plans.length);
				console.log(
					'📅 Existing plans date range:',
					plans.map((plan) => ({
						startDate: plan.startDate,
						endDate: plan.endDate,
						daysCount: plan.days?.length || 0,
					}))
				);
				setIsGenerating(false);
				setOverwriteModalOpen(true);
				return;
			}

			// Determine generation window
			let generationStartDate = getWeekStartDate(currentDate);
			let generationDuration = 7; // Default

			// Try to align with the active meal plan that includes the current date
			const activePlan = plans.find((plan) => {
				const planStart = startOfDay(parseDate(plan.startDate));
				const planEnd = endOfDay(parseDate(plan.endDate));
				return planStart <= currentDate && currentDate <= planEnd;
			});

			if (activePlan) {
				const planStart = startOfDay(parseDate(activePlan.startDate));
				const planEnd = endOfDay(parseDate(activePlan.endDate));
				generationStartDate = planStart;
				generationDuration = differenceInCalendarDays(planEnd, planStart) + 1;
			} else {
				// Fall back to subscription-based duration
				const durationLimit = getMealPlanDurationLimit();
				if (durationLimit === -1) {
					const defaultDuration =
						userPreferences?.settings?.settings?.mealPlanning
							?.defaultDuration || '28';
					generationDuration = parseInt(defaultDuration) || 28;
				} else if (durationLimit > 0) {
					generationDuration = durationLimit;
				} else {
					setErrorMessage(
						`Your ${currentPlan} plan doesn't include meal planning. Please upgrade to access this feature.`
					);
					setErrorModalOpen(true);
					return;
				}

				// Align start date to the same anchor used by the calendar/fetch window
				generationStartDate =
					generationDuration >= 28
						? getMonthAnchorStart(currentDate)
						: getWeekStartDate(currentDate);
			}

			if (process.env.NODE_ENV === 'development') {
				console.log(
					`📋 Generating meal plan for ${generationDuration} days (${Math.ceil(generationDuration / 7)} weeks) based on ${currentPlan} subscription`
				);
			}

			// Only pass skipped days within the generation window
			const allSkippedDays = getSkippedDays(mealPlansByDate);
			const generationEndDate = endOfDay(
				addDays(generationStartDate, generationDuration - 1)
			);
			const skippedDays = allSkippedDays.filter((d) => {
				const dt = startOfDay(new Date(d));
				return dt >= generationStartDate && dt <= generationEndDate;
			});

			setSnackbar({
				open: true,
				message: `Generating your ${Math.ceil(generationDuration / 7)}-week meal plan...`,
				severity: 'info',
			});

			const token = await getToken();
			const response = await fetch('/api/meal-plans/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId,
					startDate: generationStartDate.toISOString(),
					duration: generationDuration,
					skippedDays,
					overwrite: false,
					mealsPerDay: 1, // Ensure only one meal per day is generated
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				// Handle specific error types
				if (data.error === 'No saved recipes found') {
					setNoRecipesModalOpen(true);
					return;
				}
				if (response.status === 409) {
					setOverwriteModalOpen(true);
					return;
				}
				if (data.type === 'SUBSCRIPTION_LIMIT_EXCEEDED') {
					setErrorMessage(data.error);
					setErrorModalOpen(true);
					setSnackbar({
						open: true,
						message: 'Upgrade your plan for longer meal plans',
						severity: 'error',
					});
					return;
				}

				// Handle external API errors
				if (
					data.type === 'EXTERNAL_API_UNAVAILABLE' ||
					data.type === 'EXTERNAL_API_CONNECTION_ERROR'
				) {
					const errorMessage =
						data.error || 'External API is currently unavailable';
					const details = data.details ? `\n\nDetails: ${data.details}` : '';
					setErrorMessage(
						`${errorMessage}${details}\n\nPlease try again later or contact support if the issue persists.`
					);
					setErrorModalOpen(true);
					setSnackbar({
						open: true,
						message: 'External service temporarily unavailable',
						severity: 'info',
					});
					return;
				}

				if (data.type === 'EXTERNAL_API_ERROR') {
					const errorMessage = data.error || 'External API error occurred';
					const details = data.details ? `\n\nDetails: ${data.details}` : '';
					setErrorMessage(`${errorMessage}${details}`);
					setErrorModalOpen(true);
					setSnackbar({
						open: true,
						message: 'Failed to generate meal plan',
						severity: 'error',
					});
					return;
				}

				// Handle authentication errors
				if (response.status === 401 || response.status === 403) {
					setErrorMessage(
						'Authentication failed. Please refresh the page and try again.'
					);
					setErrorModalOpen(true);
					setSnackbar({
						open: true,
						message: 'Authentication error',
						severity: 'error',
					});
					return;
				}

				// Handle rate limiting
				if (response.status === 429) {
					setErrorMessage(
						'Too many requests. Please wait a moment and try again.'
					);
					setErrorModalOpen(true);
					setSnackbar({
						open: true,
						message: 'Rate limit exceeded',
						severity: 'info',
					});
					return;
				}

				// Generic error handling
				const errorMessage =
					data.error || data.message || 'Failed to generate meal plan';
				const details = data.details ? `\n\nDetails: ${data.details}` : '';
				setErrorMessage(`${errorMessage}${details}`);
				setErrorModalOpen(true);
				setSnackbar({
					open: true,
					message: 'Failed to generate meal plan',
					severity: 'error',
				});
				return;
			}

			console.log('✅ Meal plan generated successfully');

			// Immediately reflect generated plan in UI to avoid waiting on eventual consistency
			try {
				const extractPlans = (payload: any): any[] => {
					if (!payload) return [];
					if (Array.isArray(payload)) return payload;
					if (Array.isArray(payload.data)) return payload.data;
					if (payload.data && typeof payload.data === 'object')
						return [payload.data];
					if (Array.isArray(payload.plans)) return payload.plans;
					if (Array.isArray(payload.items)) return payload.items;
					if (Array.isArray(payload.results)) return payload.results;
					if (payload.plan) return [payload.plan];
					if (payload.mealPlan) return [payload.mealPlan];
					return [payload];
				};
				const immediatePlans = extractPlans(data);
				let transformedImmediate = transformMealPlanData(immediatePlans);
				const organizedImmediate =
					organizeMealPlansByDate(transformedImmediate);
				setPlans(transformedImmediate);
				setMealPlansByDate(organizedImmediate);
				setRecipesLoading(false);

				// Immediately enrich missing recipe details for the generated plan via batch
				try {
					const missingIds = new Set<string>();
					transformedImmediate.forEach((plan) => {
						plan.days.forEach((day) => {
							if (day.recipeId && !day.recipe) {
								missingIds.add(String(day.recipeId));
							}
						});
					});
					if (missingIds.size > 0) {
						const res = await fetch('/api/recipes', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ recipeIds: Array.from(missingIds) }),
						});
						if (res.ok) {
							const recipes = await res.json();
							const recipeMap = new Map<string, any>();
							recipes.forEach((r: any) => {
								const key = String(r.id || r._id);
								recipeMap.set(key, r);
							});
							transformedImmediate = transformedImmediate.map((plan) => ({
								...plan,
								days: plan.days.map((day) => {
									const rid = day.recipeId ? String(day.recipeId) : null;
									if (!day.recipe && rid && recipeMap.has(rid)) {
										return { ...day, recipe: recipeMap.get(rid) };
									}
									return day;
								}),
							}));
							const organized = organizeMealPlansByDate(transformedImmediate);
							setPlans(transformedImmediate);
							setMealPlansByDate(organized);
						}
					}
				} catch (immEnrichErr) {
					console.warn('Immediate batch enrich failed:', immEnrichErr);
				}
			} catch (e) {
				console.warn(
					'⚠️ Failed immediate state update from generation response',
					e
				);
			}

			// Background refresh to reconcile with external API persistence
			setTimeout(async () => {
				try {
					await fetchMealPlans(true); // Silent refresh
				} catch (e) {
					console.warn('First refresh failed', e);
				}
			}, 500);

			// Second refresh to catch late recipe population
			setTimeout(() => {
				fetchMealPlans(true).catch((e) =>
					console.warn('Second refresh failed', e)
				);
			}, 1500);

			setSnackbar({
				open: true,
				message: 'Meal plan generated successfully!',
				severity: 'success',
			});
		} catch (error) {
			console.error('Error generating meal plan:', error);
			setErrorMessage(
				error instanceof Error ? error.message : 'Failed to generate meal plan'
			);
			setErrorModalOpen(true);
		} finally {
			setIsGenerating(false);
		}
	}, [
		currentDate,
		userId,
		fetchMealPlans,
		mealPlansByDate,
		userPreferences,
		currentPlan,
		getMealPlanDurationLimit,
		plans, // Added plans to dependency array
	]);

	// Add handleOverwriteConfirm
	const handleOverwriteConfirm = useCallback(async () => {
		console.log('🔄 Starting meal plan overwrite generation');
		setOverwriteModalOpen(false);
		// Re-run generation with overwrite flag
		try {
			setIsGenerating(true);

			// Determine generation window (prefer current active plan dates)
			let generationStartDate = getWeekStartDate(currentDate);
			let generationDuration = 7;
			const activePlan = plans.find((plan) => {
				const planStart = startOfDay(parseDate(plan.startDate));
				const planEnd = endOfDay(parseDate(plan.endDate));
				return planStart <= currentDate && currentDate <= planEnd;
			});
			if (activePlan) {
				const planStart = startOfDay(parseDate(activePlan.startDate));
				const planEnd = endOfDay(parseDate(activePlan.endDate));
				generationStartDate = planStart;
				generationDuration = differenceInCalendarDays(planEnd, planStart) + 1;
			} else {
				const durationLimit = getMealPlanDurationLimit();
				if (durationLimit === -1) {
					const defaultDuration =
						userPreferences?.settings?.settings?.mealPlanning
							?.defaultDuration || '28';
					generationDuration = parseInt(defaultDuration) || 28;
				} else if (durationLimit > 0) {
					generationDuration = durationLimit;
				}

				// Align start date to the same anchor used by the calendar/fetch window
				generationStartDate =
					generationDuration >= 28
						? getMonthAnchorStart(currentDate)
						: getWeekStartDate(currentDate);
			}

			if (process.env.NODE_ENV === 'development') {
				console.log(
					`🔄 Overwriting meal plan for ${generationDuration} days (${Math.ceil(generationDuration / 7)} weeks)`
				);
			}

			// Only pass skipped days within the generation window
			const allSkippedDays = getSkippedDays(mealPlansByDate);
			const generationEndDate = endOfDay(
				addDays(generationStartDate, generationDuration - 1)
			);
			const skippedDays = allSkippedDays.filter((d) => {
				const dt = startOfDay(new Date(d));
				return dt >= generationStartDate && dt <= generationEndDate;
			});

			const token = await getToken();
			const response = await fetch('/api/meal-plans/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId,
					startDate: generationStartDate.toISOString(),
					duration: generationDuration,
					skippedDays,
					overwrite: true, // Set overwrite to true
					mealsPerDay: 1, // Ensure only one meal per day is generated
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				// Handle specific error types for overwrite
				if (
					data.type === 'EXTERNAL_API_UNAVAILABLE' ||
					data.type === 'EXTERNAL_API_CONNECTION_ERROR'
				) {
					const errorMessage =
						data.error || 'External API is currently unavailable';
					const details = data.details ? `\n\nDetails: ${data.details}` : '';
					setErrorMessage(
						`${errorMessage}${details}\n\nPlease try again later or contact support if the issue persists.`
					);
					setErrorModalOpen(true);
					setSnackbar({
						open: true,
						message: 'External service temporarily unavailable',
						severity: 'info',
					});
					return;
				}

				if (data.type === 'EXTERNAL_API_ERROR') {
					const errorMessage = data.error || 'External API error occurred';
					const details = data.details ? `\n\nDetails: ${data.details}` : '';
					setErrorMessage(`${errorMessage}${details}`);
					setErrorModalOpen(true);
					setSnackbar({
						open: true,
						message: 'Failed to generate meal plan',
						severity: 'error',
					});
					return;
				}

				// Generic error handling
				const errorMessage =
					data.error || data.message || 'Failed to generate meal plan';
				const details = data.details ? `\n\nDetails: ${data.details}` : '';
				setErrorMessage(`${errorMessage}${details}`);
				setErrorModalOpen(true);
				setSnackbar({
					open: true,
					message: 'Failed to generate meal plan',
					severity: 'error',
				});
				return;
			}

			console.log('✅ Meal plan generated successfully');

			// Immediately reflect generated plan in UI
			try {
				const extractPlans = (payload: any): any[] => {
					if (!payload) return [];
					if (Array.isArray(payload)) return payload;
					if (Array.isArray(payload.data)) return payload.data;
					if (payload.data && typeof payload.data === 'object')
						return [payload.data];
					if (Array.isArray(payload.plans)) return payload.plans;
					if (Array.isArray(payload.items)) return payload.items;
					if (Array.isArray(payload.results)) return payload.results;
					if (payload.plan) return [payload.plan];
					if (payload.mealPlan) return [payload.mealPlan];
					return [payload];
				};
				const immediatePlans = extractPlans(data);
				let transformedImmediate = transformMealPlanData(immediatePlans);
				const organizedImmediate =
					organizeMealPlansByDate(transformedImmediate);
				setPlans(transformedImmediate);
				setMealPlansByDate(organizedImmediate);
				setRecipesLoading(false);

				// Immediately enrich missing recipe details for the generated plan via batch
				try {
					const missingIds = new Set<string>();
					transformedImmediate.forEach((plan) => {
						plan.days.forEach((day) => {
							if (day.recipeId && !day.recipe) {
								missingIds.add(String(day.recipeId));
							}
						});
					});
					if (missingIds.size > 0) {
						const res = await fetch('/api/recipes', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ recipeIds: Array.from(missingIds) }),
						});
						if (res.ok) {
							const recipes = await res.json();
							const recipeMap = new Map<string, any>();
							recipes.forEach((r: any) => {
								const key = String(r.id || r._id);
								recipeMap.set(key, r);
							});
							transformedImmediate = transformedImmediate.map((plan) => ({
								...plan,
								days: plan.days.map((day) => {
									const rid = day.recipeId ? String(day.recipeId) : null;
									if (!day.recipe && rid && recipeMap.has(rid)) {
										return { ...day, recipe: recipeMap.get(rid) };
									}
									return day;
								}),
							}));
							const organized = organizeMealPlansByDate(transformedImmediate);
							setPlans(transformedImmediate);
							setMealPlansByDate(organized);
						}
					}
				} catch (immEnrichErr) {
					console.warn('Immediate batch enrich failed:', immEnrichErr);
				}
			} catch (e) {
				console.warn(
					'⚠️ Failed immediate state update from generation response',
					e
				);
			}

			// Background refreshes
			setTimeout(async () => {
				try {
					await fetchMealPlans(true);
				} catch (e) {
					console.warn('First refresh failed', e);
				}
			}, 500);
			setTimeout(() => {
				fetchMealPlans(true).catch((e) =>
					console.warn('Second refresh failed', e)
				);
			}, 1500);

			setSnackbar({
				open: true,
				message: 'Meal plan generated successfully!',
				severity: 'success',
			});
		} catch (error) {
			console.error('Error generating meal plan:', error);
			setErrorMessage(
				error instanceof Error ? error.message : 'Failed to generate meal plan'
			);
			setErrorModalOpen(true);
		} finally {
			setIsGenerating(false);
		}
	}, [
		currentDate,
		userId,
		fetchMealPlans,
		mealPlansByDate,
		userPreferences,
		currentPlan,
		getMealPlanDurationLimit,
		plans,
	]);

	// Add handleSkipDate function
	const handleSkipDate = useCallback(
		async (date: Date) => {
			// Use the same date handling as handleMenuOpen
			const localDate = new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate()
			);
			const dateStr = format(localDate, 'yyyy-MM-dd');

			// Set loading state for skip/unskip operation
			setSkipUnskipInProgress(true);

			// Show immediate feedback
			setSnackbar({
				open: true,
				message: 'Updating meal plan...',
				severity: 'info',
			});

			// Store original state for potential rollback
			const originalSkippedDays = [...skippedDays];
			const originalMealPlansByDate = { ...mealPlansByDate };
			const originalPlans = [...plans];

			try {
				// Find the meal plan and day index for the selected date
				const plan = plans.find((plan) => {
					const planStart = startOfDay(new Date(plan.startDate));
					const planEnd = endOfDay(new Date(plan.endDate));
					const targetDate = new Date(dateStr);
					return targetDate >= planStart && targetDate <= planEnd;
				});

				// Check if the day is already skipped
				const dayInPlan = plan?.days.find(
					(day) => format(new Date(day.date), 'yyyy-MM-dd') === dateStr
				);
				const isCurrentlySkipped =
					skippedDays.includes(dateStr) || dayInPlan?.status === 'skipped';

				let response;
				if (plan) {
					// If we have a plan, use the skip/unskip endpoint
					const dayIndex = plan.days.findIndex(
						(day) => format(new Date(day.date), 'yyyy-MM-dd') === dateStr
					);

					if (dayIndex === -1) {
						throw new Error('Day not found in meal plan');
					}

					const token = await getToken();
					const apiEndpoint = `/api/meal-plans/${plan.id}/days/${dayIndex}/${
						isCurrentlySkipped ? 'unskip' : 'skip'
					}`;

					response = await fetch(apiEndpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							...(token && { Authorization: `Bearer ${token}` }),
						},
						body: JSON.stringify({
							userId,
						}),
					});
				} else {
					// If no plan exists, handle skip/unskip for locally stored skipped days
					const token = await getToken();
					const action = isCurrentlySkipped ? 'unskip' : 'skip';

					if (action === 'unskip') {
						// For unskip operations on locally stored skipped days,
						// we need to delete the local skip entry
						response = await fetch('/api/meal-plans/skip-date', {
							method: 'DELETE',
						});
					} else {
						// For skip operations, use the existing POST endpoint
						response = await fetch('/api/meal-plans/skip-date', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								date: dateStr,
							}),
						});
					}
				}

				if (!response.ok) {
					let errorData;
					try {
						errorData = await response.json();
					} catch (e) {
						console.error('[Skip/Unskip] Failed to parse error response:', e);
						errorData = { error: 'Unknown error occurred' };
					}

					console.error(
						'[Skip/Unskip] Error response status:',
						response.status
					);
					console.error(
						'[Skip/Unskip] Error response statusText:',
						response.statusText
					);
					console.error('[Skip/Unskip] Error response data:', errorData);

					const action = isCurrentlySkipped ? 'unskip' : 'skip';
					const errorMessage =
						errorData.error ||
						errorData.message ||
						`Failed to ${action} day. Please try again.`;

					throw new Error(errorMessage);
				}

				const data = await response.json();

				// Validate that the response doesn't contain an error
				if (data.error) {
					throw new Error(data.error);
				}

				// Close the menu immediately for better UX
				setTimeout(() => handleMenuClose(), 100);

				// Apply optimistic update based on server response or current state
				const newStatus: 'planned' | 'skipped' = isCurrentlySkipped
					? 'planned'
					: 'skipped';

				// Update skipped days array
				setSkippedDays((prevSkippedDays) => {
					const updatedSkippedDays = [...prevSkippedDays];
					if (isCurrentlySkipped) {
						const index = updatedSkippedDays.indexOf(dateStr);
						if (index > -1) {
							updatedSkippedDays.splice(index, 1);
						}
					} else {
						if (!updatedSkippedDays.includes(dateStr)) {
							updatedSkippedDays.push(dateStr);
						}
					}
					return updatedSkippedDays;
				});

				// Update meal plans by date
				setMealPlansByDate((prevMealPlansByDate) => {
					const updatedMealPlansByDate = { ...prevMealPlansByDate };
					if (updatedMealPlansByDate[dateStr]) {
						updatedMealPlansByDate[dateStr] = updatedMealPlansByDate[
							dateStr
						].map(
							(plan): MealPlanItem => ({
								...plan,
								status: newStatus,
								...(newStatus === 'skipped' && {
									recipeId: null,
									recipe: null,
								}),
							})
						);
					}
					return updatedMealPlansByDate;
				});

				// Update the plans array as well
				setPlans((prevPlans) =>
					prevPlans.map((plan) => ({
						...plan,
						days: plan.days.map((day): Day => {
							const dayDateStr = format(new Date(day.date), 'yyyy-MM-dd');
							if (dayDateStr === dateStr) {
								return {
									...day,
									status: newStatus,
									...(newStatus === 'skipped' && {
										recipeId: null,
										recipe: null,
									}),
								};
							}
							return day;
						}),
					}))
				);

				// Show success message
				const successAction = isCurrentlySkipped
					? 'unskipped'
					: 'marked as skipped';

				setSnackbar({
					open: true,
					message: `Day ${successAction} successfully.`,
					severity: 'success',
				});
			} catch (error) {
				console.error('[MealPlanner] Error updating day status:', error);

				// Revert to original state
				setSkippedDays(originalSkippedDays);
				setMealPlansByDate(originalMealPlansByDate);
				setPlans(originalPlans);

				setSnackbar({
					open: true,
					message:
						error instanceof Error
							? error.message
							: 'Failed to update day status',
					severity: 'error',
				});
			} finally {
				setSkipUnskipInProgress(false);
			}
		},
		[
			plans,
			skippedDays,
			currentDate,
			getToken,
			userId,
			mealPlansByDate,
			handleMenuClose,
		]
	);

	// Get the current plan ID
	const currentPlanId = useMemo(() => {
		const currentPlan = plans.find((plan) => {
			const planStart = parseDate(plan.startDate);
			const planEnd = parseDate(plan.endDate);
			return planStart <= currentDate && currentDate <= planEnd;
		});
		return currentPlan?._id || '';
	}, [plans, currentDate]);

	// Calculate the number of days to display based on subscription
	const displayDays = useMemo(() => {
		const durationLimit = getMealPlanDurationLimit();
		if (durationLimit === -1) {
			// Unlimited - show 4 weeks by default
			return 28;
		} else if (durationLimit > 0) {
			// Limited - show based on plan limit
			return Math.min(durationLimit, 28); // Cap at 4 weeks for display
		} else {
			// No access - still show 1 week
			return 7;
		}
	}, [getMealPlanDurationLimit]);

	// Memoize calendar calculations for performance
	const { calendarDays, weeks, calendarStartDate } = useMemo(() => {
		// For 4-week planner, anchor to the first week's Sunday of the active plan's month
		const monthAlignedStart = getMonthAnchorStart(currentDate);
		const weekAlignedStart = getWeekStartDate(currentDate);
		const calendarStartDate =
			displayDays >= 28 ? monthAlignedStart : weekAlignedStart;
		const calendarEndDate = addDays(calendarStartDate, displayDays - 1);
		const days = eachDayOfInterval({
			start: calendarStartDate,
			end: calendarEndDate,
		});

		// Split days into weeks dynamically
		const weekArrays: Date[][] = [];
		for (let i = 0; i < days.length; i += 7) {
			weekArrays.push(days.slice(i, i + 7));
		}

		return { calendarDays: days, weeks: weekArrays, calendarStartDate };
	}, [currentDate, displayDays]);

	// Memoize user preferences to prevent unnecessary re-fetching
	const memoizedUserPreferences = useMemo(
		() => userPreferences,
		[userPreferences]
	);

	// Memoize plan duration calculation
	const planDurationInfo = useMemo(() => {
		const durationLimit = getMealPlanDurationLimit();
		if (durationLimit === -1) {
			return 'Your plan includes unlimited meal planning';
		} else if (durationLimit > 0) {
			const weeks = Math.ceil(durationLimit / 7);
			return `Your ${currentPlan} plan includes ${weeks}-week meal plans`;
		} else {
			return 'Upgrade your plan to access meal planning';
		}
	}, [getMealPlanDurationLimit, currentPlan]);

	const handleRecipeClick = useCallback(
		(recipeId: string) => {
			router.push(`/recipe/${recipeId}`);
		},
		[router]
	);

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
				{skipUnskipInProgress && (
					<Typography
						variant='body2'
						sx={{ ml: 2, alignSelf: 'center' }}
					>
						Updating meal plan...
					</Typography>
				)}
			</Box>
		);
	}

	// Show WeekFlex with Skip Date menu when recipes are loading
	if (recipesLoading) {
		return (
			<>
				<style>{styles}</style>
				<Box
					sx={{
						p: { xs: 0, sm: 0 },
						width: '100%',
						maxWidth: 1400,
						mx: 'auto',
						my: 0,
						minHeight: { xs: '100vh', sm: 'auto' },
						display: 'flex',
						flexDirection: 'column',
						gap: { xs: 2, sm: 3 },
					}}
				>
					<Box sx={{ display: 'flex', justifyContent: 'center', mb: 0, mt: 3 }}>
						<Button
							variant='contained'
							disabled
							startIcon={<CalendarMonth />}
							sx={{
								fontWeight: 600,
								fontSize: { xs: 14, sm: 16 },
								px: { xs: 2, sm: 3 },
								py: { xs: 1, sm: 1.5 },
								borderRadius: 2,
								textTransform: 'none',
								letterSpacing: '0.5px',
								position: 'relative',
								minWidth: 200,
								bgcolor: 'primary.main',
								opacity: 0.7,
							}}
						>
							Generate Meal Plan
						</Button>
					</Box>
					<CalendarNavigation
						currentDate={currentDate}
						onPreviousWeek={handlePreviousWeek}
						onNextWeek={handleNextWeek}
						isGenerating={false}
						onGeneratePlan={handleGeneratePlan}
						calendarStartDate={calendarStartDate}
						displayDays={displayDays}
					/>
					{weeks.map((weekDays, weekIndex) => (
						<WeekFlex
							key={`week-${weekIndex}-${refreshKey}`}
							weekDays={weekDays}
							focusedIdx={focusedIdx - weekIndex * 7}
							scrollRef={scrollRef}
							onMenuOpen={handleMenuOpen}
							onStatusMenuOpen={handleStatusMenuOpen}
							mealPlansByDate={mealPlansByDate}
							skippedDays={skippedDays}
							onRecipeClick={handleRecipeClick}
							statusUpdateInProgress={statusUpdateInProgress}
							updatingPlanId={updatingPlanKey}
							recipesLoading={recipesLoading}
						/>
					))}
					<StatusMenu
						anchorEl={menuAnchorEl}
						open={Boolean(menuAnchorEl)}
						onClose={handleMenuClose}
						selectedDate={selectedDate}
						onSkipDate={handleSkipDate}
						skippedDays={skippedDays}
						mealPlansByDate={mealPlansByDate}
					/>
					<StatusChangeMenu
						anchorEl={statusMenuAnchorEl}
						open={Boolean(statusMenuAnchorEl)}
						onClose={handleStatusMenuClose}
						selectedPlan={statusSelectedPlan}
						onStatusUpdate={handleStatusUpdate}
						onDelete={handleDeleteClick}
						statusUpdateInProgress={statusUpdateInProgress}
						updatingPlanId={updatingPlanKey}
						currentPlan={currentPlan}
					/>
				</Box>
			</>
		);
	}

	return (
		<>
			<style>{styles}</style>
			{(isGenerating || skipUnskipInProgress) && (
				<Box
					sx={{
						position: 'fixed',
						top: '20%',
						left: '50%',
						transform: 'translateX(-50%)',
						width: '100%',
						maxWidth: '500px',
						zIndex: 1100,
					}}
				>
					<LoadingOverlay />
				</Box>
			)}
			<Box
				sx={{
					position: 'relative',
					width: '100%',
					minHeight: '400px',
					p: 0,
					filter: isGenerating || skipUnskipInProgress ? 'blur(2px)' : 'none',
					transition: 'filter 0.3s ease',
				}}
			>
				<Box
					sx={{
						p: { xs: 0, sm: 0 },
						width: '100%',
						maxWidth: 1400,
						mx: 'auto',
						my: 0,
						minHeight: { xs: '100vh', sm: 'auto' },
						display: 'flex',
						flexDirection: 'column',
						gap: { xs: 2, sm: 3 },
					}}
				>
					<Box sx={{ display: 'flex', justifyContent: 'center', mb: 0, mt: 3 }}>
						<Button
							variant='contained'
							onClick={handleGeneratePlan}
							disabled={isGenerating}
							startIcon={
								isGenerating ? (
									<CircularProgress
										size={20}
										color='inherit'
									/>
								) : (
									<CalendarMonth />
								)
							}
							sx={{
								fontWeight: 600,
								fontSize: { xs: 14, sm: 16 },
								px: { xs: 2, sm: 3 },
								py: { xs: 1, sm: 1.5 },
								borderRadius: 2,
								textTransform: 'none',
								letterSpacing: '0.5px',
								position: 'relative',
								minWidth: 200,
								bgcolor: 'primary.main',
								'&:hover': {
									bgcolor: 'primary.dark',
								},
								'&.Mui-disabled': {
									bgcolor: 'primary.main',
									opacity: 0.7,
									color: 'white',
								},
							}}
						>
							{isGenerating ? 'Generating...' : 'Generate Meal Plan'}
						</Button>
					</Box>
					{/* Show plan limit info */}
					<Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
						<Typography
							variant='body2'
							color='text.secondary'
							sx={{
								fontSize: { xs: 12, sm: 14 },
								textAlign: 'center',
								fontStyle: 'italic',
							}}
						>
							{planDurationInfo}
						</Typography>
					</Box>
					<CalendarNavigation
						currentDate={currentDate}
						onPreviousWeek={handlePreviousWeek}
						onNextWeek={handleNextWeek}
						isGenerating={isGenerating}
						onGeneratePlan={handleGeneratePlan}
						calendarStartDate={calendarStartDate}
						displayDays={displayDays}
					/>
					{weeks.map((weekDays, weekIndex) => (
						<WeekFlex
							key={`${weekIndex}-${refreshKey}`}
							weekDays={weekDays}
							focusedIdx={focusedIdx - weekIndex * 7}
							scrollRef={scrollRef}
							onMenuOpen={handleMenuOpen}
							onStatusMenuOpen={handleStatusMenuOpen}
							mealPlansByDate={mealPlansByDate}
							skippedDays={skippedDays}
							onRecipeClick={handleRecipeClick}
							statusUpdateInProgress={statusUpdateInProgress}
							updatingPlanId={updatingPlanKey}
							recipesLoading={recipesLoading}
						/>
					))}
					<StatusMenu
						anchorEl={menuAnchorEl}
						open={Boolean(menuAnchorEl)}
						onClose={handleMenuClose}
						selectedDate={selectedDate}
						onSkipDate={handleSkipDate}
						skippedDays={skippedDays}
						mealPlansByDate={mealPlansByDate}
					/>
					<StatusChangeMenu
						anchorEl={statusMenuAnchorEl}
						open={Boolean(statusMenuAnchorEl)}
						onClose={handleStatusMenuClose}
						selectedPlan={statusSelectedPlan}
						onStatusUpdate={handleStatusUpdate}
						onDelete={handleDeleteClick}
						statusUpdateInProgress={statusUpdateInProgress}
						updatingPlanId={updatingPlanKey}
						currentPlan={currentPlan}
					/>
					<DeleteConfirmDialog
						open={deleteConfirmOpen}
						onClose={() => setDeleteConfirmOpen(false)}
						onConfirm={handleDeleteConfirm}
					/>
					<NoRecipesDialog
						open={noRecipesModalOpen}
						onClose={() => setNoRecipesModalOpen(false)}
						onBrowseRecipes={() => {
							setNoRecipesModalOpen(false);
							router.push('/dashboard/recommended-recipes');
						}}
					/>
					<ErrorDialog
						open={errorModalOpen}
						onClose={() => setErrorModalOpen(false)}
						message={errorMessage}
					/>
					<OverwriteConfirmationDialog
						open={overwriteModalOpen}
						onClose={() => setOverwriteModalOpen(false)}
						onConfirm={handleOverwriteConfirm}
					/>
					<Snackbar
						open={snackbar.open}
						autoHideDuration={6000}
						onClose={() => setSnackbar({ ...snackbar, open: false })}
						anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
					>
						<Alert
							onClose={() => setSnackbar({ ...snackbar, open: false })}
							severity={snackbar.severity}
							sx={{ width: '100%' }}
						>
							{snackbar.message}
						</Alert>
					</Snackbar>
				</Box>
			</Box>
		</>
	);
};

export default MealPlanner;
