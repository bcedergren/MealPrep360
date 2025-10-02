'use client';

import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Paper,
	IconButton,
	Grid,
	CircularProgress,
	Link,
	useMediaQuery,
	Button,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '../ui/snackbar';
import {
	format,
	addMonths,
	subMonths,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isToday,
	startOfWeek,
	endOfWeek,
	addDays,
	isSameMonth,
} from 'date-fns';
import type { MealPlan, RecipeItem } from '@/types/meal-plan';

interface Recipe {
	id: string;
	title: string;
	description?: string;
	mealType?: string;
	imageUrl?: string;
}

interface DisplayMealPlan {
	_id: string;
	id: string;
	startDate: Date;
	endDate: Date;
	date: Date;
	recipe: Recipe;
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
	status: 'planned' | 'completed' | 'skipped';
}

interface MealPlanData {
	_id: string;
	id: string;
	startDate: Date;
	endDate: Date;
	days: Array<{
		date: Date;
		recipeId: string | null;
		recipe: Recipe | null;
		mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
		status: 'planned' | 'completed' | 'skipped';
		dayIndex: number;
	}>;
	userId: string;
	createdAt: string;
	updatedAt: string;
}

export default function MealPlan() {
	const { showSnackbar } = useSnackbar();
	const router = useRouter();
	const [currentDate, setCurrentDate] = useState(new Date());
	const [plans, setPlans] = useState<MealPlanData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const isMobile = useMediaQuery('(max-width:600px)');

	// Calculate the calendar range
	const monthStart = startOfMonth(currentDate);
	const monthEnd = endOfMonth(currentDate);
	const calendarStart = startOfWeek(monthStart);
	const calendarEnd = endOfWeek(monthEnd);

	// Create array of weeks
	const weeks: Date[][] = [];
	let currentWeek: Date[] = [];
	eachDayOfInterval({ start: calendarStart, end: calendarEnd }).forEach(
		(date: Date) => {
			currentWeek.push(date);
			if (currentWeek.length === 7) {
				weeks.push(currentWeek);
				currentWeek = [];
			}
		}
	);

	useEffect(() => {
		fetchMealPlans();
	}, [currentDate]);

	const fetchMealPlans = async () => {
		try {
			setLoading(true);
			// Use the calendar range for the API request
			const url = `/api/meal-plans?startDate=${calendarStart.toISOString()}&endDate=${calendarEnd.toISOString()}`;
			const response = await fetch(url);
			if (!response.ok) {
				const errorData = await response.json();
				console.error('API Error:', errorData);
				throw new Error(errorData.error || 'Failed to fetch meal plans');
			}
			const data = await response.json();

			// Transform the data to match the expected structure
			const transformedData = data.map((plan: any) => {
				// Safely parse dates with validation
				const parseDate = (dateStr: string | Date | undefined): Date => {
					if (!dateStr) return new Date();
					const date = new Date(dateStr);
					if (isNaN(date.getTime())) {
						console.error('Invalid date:', dateStr);
						return new Date();
					}
					return date;
				};

				const startDate = parseDate(plan.startDate);
				const endDate = parseDate(plan.endDate);

				// Handle both days (new format) and recipeItems (current API format)
				const items = plan.days || plan.recipeItems || [];

				// Transform items to days format
				const days = items.map((item: any, index: number) => {
					// Use the item's date if available, otherwise calculate from start date
					let dayDate;
					if (item.date) {
						dayDate = parseDate(item.date);
					} else {
						dayDate = new Date(startDate);
						dayDate.setDate(startDate.getDate() + index);
					}

					return {
						date: dayDate,
						recipeId: item.recipeId || null,
						recipe: item.recipe || null,
						mealType: item.mealType || 'dinner',
						status: item.status || 'planned',
						dayIndex: item.dayIndex ?? index,
					};
				});

				return {
					_id: plan._id,
					id: plan.id || plan._id,
					startDate,
					endDate,
					days,
					userId: plan.userId,
					createdAt: plan.createdAt,
					updatedAt: plan.updatedAt,
				};
			});

			// Fetch recipe details for each meal plan
			for (const plan of transformedData) {
				for (const day of plan.days) {
					if (day.recipeId) {
						const recipe = await fetchRecipeDetails(day.recipeId);
						if (recipe) {
							day.recipe = recipe;
						}
					}
				}
			}

			setPlans(transformedData);
		} catch (err) {
			console.error('Error fetching meal plans:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to load meal plans'
			);
		} finally {
			setLoading(false);
		}
	};

	const fetchRecipeDetails = async (recipeId: string) => {
		try {
			const response = await fetch(`/api/recipes/${recipeId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch recipe details');
			}
			const data = await response.json();
			return {
				id: data._id,
				title: data.title || 'Untitled Recipe',
				description: data.description || '',
				mealType: data.mealType || 'dinner',
				imageUrl: data.imageUrl,
			};
		} catch (error) {
			console.error('Error fetching recipe details:', error);
			return null;
		}
	};

	const handlePreviousMonth = () => {
		setCurrentDate((prev) => subMonths(prev, 1));
	};

	const handleNextMonth = () => {
		setCurrentDate((prev) => addMonths(prev, 1));
	};

	// Group meal plans by date
	const mealPlansByDate = plans.reduce(
		(acc, plan) => {
			plan.days.forEach(
				(day: {
					date: Date;
					recipeId: string | null;
					recipe: Recipe | null;
					mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
					status: 'planned' | 'completed' | 'skipped';
					dayIndex: number;
				}) => {
					try {
						const dateKey = format(day.date, 'yyyy-MM-dd');

						if (!acc[dateKey]) {
							acc[dateKey] = [];
						}

						// Check if we already have a meal for this date
						const existingMeal = acc[dateKey][0];

						if (!existingMeal) {
							// No meal exists for this date, add the current one
							acc[dateKey].push({
								_id: plan._id,
								id: plan.id,
								startDate: plan.startDate,
								endDate: plan.endDate,
								date: day.date,
								recipe: day.recipe || { id: '', title: '' },
								mealType: day.mealType,
								status: day.status,
							});
						} else {
							// A meal already exists for this date
							// Replace it if the current meal is dinner and the existing one isn't
							// or if the current meal has a recipe and the existing one doesn't
							const shouldReplace =
								(day.mealType === 'dinner' &&
									existingMeal.mealType !== 'dinner') ||
								(day.recipeId && !existingMeal.recipe?.id) ||
								(day.recipe && !existingMeal.recipe?.id);

							if (shouldReplace) {
								if (process.env.NODE_ENV === 'development') {
									console.log(
										`🔄 [MealPlan] Consolidating meals for ${dateKey}: replacing ${existingMeal.mealType} with ${day.mealType}`
									);
								}
								acc[dateKey][0] = {
									_id: plan._id,
									id: plan.id,
									startDate: plan.startDate,
									endDate: plan.endDate,
									date: day.date,
									recipe: day.recipe || { id: '', title: '' },
									mealType: day.mealType,
									status: day.status,
								};
							} else if (process.env.NODE_ENV === 'development') {
								console.log(
									`⏭️ [MealPlan] Skipping duplicate meal for ${dateKey}: ${day.mealType} (existing: ${existingMeal.mealType})`
								);
							}
						}
					} catch (error) {
						console.error('Error processing day:', error);
					}
				}
			);
			return acc;
		},
		{} as Record<string, DisplayMealPlan[]>
	);

	// Log summary of consolidation
	if (process.env.NODE_ENV === 'development') {
		const totalDates = Object.keys(mealPlansByDate).length;
		const datesWithMultipleMeals = Object.values(mealPlansByDate).filter(
			(meals) => meals.length > 1
		).length;
		if (datesWithMultipleMeals > 0) {
			console.warn(
				`⚠️ [MealPlan] Found ${datesWithMultipleMeals} dates with multiple meals after consolidation`
			);
		} else {
			console.log(
				`✅ [MealPlan] Successfully consolidated meals: ${totalDates} dates with single meals`
			);
		}
	}

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 3, textAlign: 'center' }}>
				<Typography color='error'>{error}</Typography>
			</Box>
		);
	}

	// Show helpful message when no meal plans exist
	if (plans.length === 0 && !loading) {
		return (
			<Box sx={{ p: 3, textAlign: 'center' }}>
				<Typography
					variant='h6'
					color='text.secondary'
					sx={{ mb: 2 }}
				>
					No meal plans found
				</Typography>
				<Typography
					variant='body1'
					color='text.secondary'
					sx={{ mb: 3 }}
				>
					You haven't generated any meal plans yet. To get started:
				</Typography>
				<Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto', mb: 3 }}>
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{ mb: 1 }}
					>
						1. Save some recipes from the recipes page
					</Typography>
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{ mb: 1 }}
					>
						2. Go to the planner page and click "Generate Meal Plan"
					</Typography>
					<Typography
						variant='body2'
						color='text.secondary'
					>
						3. Your generated meal plans will appear here
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
					<Button
						variant='outlined'
						onClick={() => router.push('/dashboard/recommended-recipes')}
					>
						Browse Recipes
					</Button>
					<Button
						variant='contained'
						onClick={() => router.push('/dashboard')}
					>
						Go to Planner
					</Button>
				</Box>
			</Box>
		);
	}

	if (isMobile) {
		// Mobile: vertical list of day cards
		const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
		return (
			<Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 2,
					}}
				>
					<IconButton onClick={handlePreviousMonth}>
						<ChevronLeft />
					</IconButton>
					<Typography
						variant='h6'
						sx={{ fontWeight: 600 }}
					>
						{format(currentDate, 'MMMM yyyy')}
					</Typography>
					<IconButton onClick={handleNextMonth}>
						<ChevronRight />
					</IconButton>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{daysInMonth.map((date) => {
						const dateKey = format(date, 'yyyy-MM-dd');
						const dayPlans = mealPlansByDate[dateKey] || [];
						const isCurrentDay = isToday(date);
						return (
							<Paper
								key={dateKey}
								elevation={isCurrentDay ? 3 : 1}
								sx={{
									p: 2,
									bgcolor: isCurrentDay
										? 'action.selected'
										: 'background.paper',
									border: isCurrentDay ? 2 : 1,
									borderColor: isCurrentDay ? 'primary.main' : 'divider',
								}}
							>
								<Typography
									variant='subtitle2'
									sx={{
										color: isCurrentDay ? 'primary.main' : 'text.primary',
										fontWeight: isCurrentDay ? 'bold' : 'normal',
										fontSize: '1rem',
										mb: 1,
									}}
								>
									{format(date, 'EEEE, MMM d')}
								</Typography>
								{dayPlans.length === 0 ? (
									<Typography
										variant='body2'
										color='text.secondary'
									>
										No meals planned
									</Typography>
								) : (
									dayPlans.map((plan) => (
										<Box
											key={plan.id + plan.mealType}
											sx={{
												mb: 1,
												p: 1,
												borderRadius: 1,
												bgcolor: 'action.hover',
											}}
										>
											<Typography
												variant='body2'
												sx={{
													fontWeight: 500,
													whiteSpace: 'normal',
													wordBreak: 'break-word',
												}}
											>
												{plan.status === 'skipped' ? (
													<span style={{ color: '#888', fontStyle: 'italic' }}>
														Skipped
													</span>
												) : plan.recipe?.id ? (
													<Link
														href={`/recipe/${plan.recipe.id}`}
														underline='hover'
														color='primary'
													>
														{plan.recipe?.title || 'Untitled'}
													</Link>
												) : (
													<span>{plan.recipe?.title || 'Untitled'}</span>
												)}
											</Typography>
										</Box>
									))
								)}
							</Paper>
						);
					})}
				</Box>
			</Box>
		);
	}

	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: { xs: 2, sm: 3 },
				}}
			>
				<IconButton
					onClick={handlePreviousMonth}
					sx={{ p: { xs: 0.5, sm: 1 } }}
				>
					<ChevronLeft />
				</IconButton>
				<Typography
					variant='h5'
					sx={{
						fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
						fontWeight: 600,
					}}
				>
					{format(currentDate, 'MMMM yyyy')}
				</Typography>
				<IconButton
					onClick={handleNextMonth}
					sx={{ p: { xs: 0.5, sm: 1 } }}
				>
					<ChevronRight />
				</IconButton>
			</Box>

			{/* Calendar Header */}
			<Grid
				container
				sx={{ mb: 1 }}
			>
				{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
					<Grid
						item
						xs
						key={day}
						sx={{ textAlign: 'center', py: { xs: 0.5, sm: 1 } }}
					>
						<Typography
							variant='subtitle2'
							color='text.secondary'
							sx={{
								fontSize: { xs: '0.75rem', sm: '0.875rem' },
								fontWeight: 600,
							}}
						>
							{day}
						</Typography>
					</Grid>
				))}
			</Grid>

			{/* Calendar Grid */}
			{weeks.map((week, weekIndex) => (
				<Grid
					container
					key={weekIndex}
					sx={{
						mb: { xs: 1, sm: 1.5 },
						'& .MuiGrid-item': {
							minHeight: { xs: '100px', sm: '120px', md: '140px' },
							px: { xs: 0.5, sm: 1 },
							py: { xs: 0.5, sm: 1 },
						},
					}}
				>
					{week.map((date) => {
						const dateKey = format(date, 'yyyy-MM-dd');
						const dayPlans = mealPlansByDate[dateKey] || [];
						const isCurrentDay = isToday(date);
						const isCurrentMonth = isSameMonth(date, currentDate);

						return (
							<Grid
								item
								xs={12 / 7}
								key={dateKey}
								sx={{
									opacity: isCurrentMonth ? 1 : 0.5,
									width: '14.28%',
									flexBasis: '14.28%',
									maxWidth: '14.28%',
								}}
							>
								<Paper
									elevation={isCurrentDay ? 3 : 1}
									sx={{
										height: '100%',
										bgcolor: isCurrentDay
											? 'action.selected'
											: 'background.paper',
										border: isCurrentDay ? 2 : 1,
										borderColor: isCurrentDay ? 'primary.main' : 'divider',
										display: 'flex',
										flexDirection: 'column',
										overflow: 'hidden',
									}}
								>
									<Box
										sx={{
											p: { xs: 0.5, sm: 1 },
											borderBottom: '1px solid',
											borderColor: 'divider',
											bgcolor: isCurrentDay ? 'primary.light' : 'transparent',
											color: isCurrentDay ? 'primary.contrastText' : 'inherit',
										}}
									>
										<Typography
											variant='subtitle2'
											sx={{
												textAlign: 'center',
												fontWeight: isCurrentDay ? 'bold' : 'normal',
												fontSize: { xs: '0.875rem', sm: '1rem' },
											}}
										>
											{format(date, 'd')}
										</Typography>
									</Box>

									<Box
										sx={{
											flex: 1,
											p: { xs: 0.5, sm: 1 },
											overflowY: 'auto',
											'&::-webkit-scrollbar': {
												width: '4px',
											},
											'&::-webkit-scrollbar-thumb': {
												backgroundColor: 'rgba(0,0,0,0.2)',
												borderRadius: '2px',
											},
										}}
									>
										{dayPlans.map((plan) => (
											<Box
												key={`${plan.id}-${plan.mealType}`}
												sx={{
													mb: { xs: 0.5, sm: 0.75 },
													p: { xs: 0.5, sm: 0.75 },
													borderRadius: 1,
													bgcolor: 'action.hover',
													'&:last-child': {
														mb: 0,
													},
												}}
											>
												<Typography
													variant='caption'
													sx={{
														display: 'block',
														whiteSpace: 'normal',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														lineHeight: 1.3,
														fontSize: { xs: '0.75rem', sm: '0.875rem' },
														color:
															plan.status === 'skipped'
																? 'text.secondary'
																: 'inherit',
														fontStyle:
															plan.status === 'skipped' ? 'italic' : 'normal',
													}}
												>
													{plan.status === 'skipped' ? (
														'Skipped'
													) : (
														<Link
															href={`/recipe/${plan.recipe.id}`}
															sx={{
																color: 'primary.main',
																textDecoration: 'none',
																'&:hover': {
																	textDecoration: 'underline',
																},
															}}
														>
															{plan.recipe.title}
														</Link>
													)}
												</Typography>
											</Box>
										))}
									</Box>
								</Paper>
							</Grid>
						);
					})}
				</Grid>
			))}
		</Box>
	);
}
