import {
	format,
	startOfDay,
	endOfDay,
	addDays,
	eachDayOfInterval,
	subDays,
} from 'date-fns';
import { DisplayMealPlan, MealPlanItem } from '../types/meal-planner';
import { MealStatus } from '@/types/meal-plan';

// Utility function for parsing dates
export const parseDate = (dateStr: string | Date | undefined): Date => {
	if (!dateStr) return new Date();
	// If already a Date, return as-is (ensure valid)
	if (dateStr instanceof Date) {
		return isNaN(dateStr.getTime()) ? new Date() : dateStr;
	}

	const raw = String(dateStr);

	// Treat date-only strings (YYYY-MM-DD) as local dates to avoid timezone shifts
	const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (dateOnlyMatch) {
		const [, y, m, d] = dateOnlyMatch;
		return new Date(Number(y), Number(m) - 1, Number(d));
	}

	// If ISO datetime, prefer using only the date part for day-based features
	// Example: 2025-08-12T00:00:00.000Z -> use 2025-08-12 as local date
	if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
		const datePart = raw.split('T')[0];
		const isoDateOnly = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (isoDateOnly) {
			const [, y, m, d] = isoDateOnly;
			return new Date(Number(y), Number(m) - 1, Number(d));
		}
	}

	// Fallback: let JS parse. If invalid, return now()
	const parsed = new Date(raw);
	if (isNaN(parsed.getTime())) {
		console.error('Invalid date:', dateStr);
		return new Date();
	}
	return parsed;
};

// Utility function to get the start of the week (Sunday) for a given date
export const getWeekStartDate = (date: Date): Date => {
	const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
	return startOfDay(subDays(date, dayOfWeek));
};

// Transform meal plan data from API response
export const transformMealPlanData = (data: any[]): DisplayMealPlan[] => {
	return data.map((plan) => {
		const startDate = parseDate(plan.startDate);
		const endDate = parseDate(plan.endDate);

		// Use days if present, otherwise fallback to recipeItems or generic items
		const items =
			plan.days && plan.days.length > 0
				? plan.days
				: plan.recipeItems && plan.recipeItems.length > 0
					? plan.recipeItems
					: plan.items || [];

		const days = items.map((item: any, index: number) => {
			// Calculate the date based on start date and index if date is not provided
			let dayDate;
			if (item.date) {
				dayDate = parseDate(item.date);
			} else {
				// Calculate date from start date + index
				dayDate = addDays(startDate, index);
			}

			// Normalize recipe id across multiple possible shapes from API
			let recipeId: string | null = null;
			if (item.recipeId && typeof item.recipeId === 'object') {
				recipeId = item.recipeId._id || item.recipeId.id || null;
			} else if (typeof item.recipeId === 'string') {
				recipeId = item.recipeId;
			} else if (typeof item.recipe === 'string') {
				// Some APIs use `recipe` as an ID string
				recipeId = item.recipe;
			} else if (item.recipe && typeof item.recipe === 'object') {
				recipeId = item.recipe._id || item.recipe.id || null;
			} else if (typeof item.recipe_id === 'string') {
				recipeId = item.recipe_id;
			}

			// Handle recipe object only when embedded and is an object
			let recipe = null as any;
			if (item.recipe && typeof item.recipe === 'object') {
				const r = item.recipe;
				recipe = {
					_id: r._id || r.id || recipeId || null,
					id: r._id || r.id || recipeId || null,
					title: r.title || 'Untitled Recipe',
					description: r.description || '',
					ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
					instructions: Array.isArray(r.instructions) ? r.instructions : [],
					prepTime: r.prepTime || 0,
					cookTime: r.cookTime || 0,
					servings: r.servings || 0,
					mealType: r.mealType || 'dinner',
					imageUrl: r.imageUrl || '',
					tags: r.tags || [],
					clerkId: r.clerkId || '',
					allergenInfo: r.allergenInfo || [],
					dietaryInfo: r.dietaryInfo || [],
					hasImage: r.hasImage || false,
					season: r.season || '',
					isPublic: r.isPublic || false,
					isPlaceholder: r.isPlaceholder || false,
					originalLanguage: r.originalLanguage || 'en',
					createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
					updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
				};
			} else if (item.recipeId && typeof item.recipeId === 'object') {
				const r = item.recipeId;
				recipe = {
					_id: r._id,
					id: r._id,
					title: r.title || 'Untitled Recipe',
					description: r.description || '',
					ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
					instructions: Array.isArray(r.instructions) ? r.instructions : [],
					prepTime: r.prepTime || 0,
					cookTime: r.cookTime || 0,
					servings: r.servings || 0,
					mealType: r.mealType || 'dinner',
					imageUrl: r.imageUrl || '',
					tags: r.tags || [],
					clerkId: r.clerkId || '',
					allergenInfo: r.allergenInfo || [],
					dietaryInfo: r.dietaryInfo || [],
					hasImage: r.hasImage || false,
					season: r.season || '',
					isPublic: r.isPublic || false,
					isPlaceholder: r.isPlaceholder || false,
					originalLanguage: r.originalLanguage || 'en',
					createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
					updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
				};
			}

			const transformedDay = {
				date: dayDate,
				recipeId: recipeId,
				recipe: recipe,
				mealType: item.mealType || 'dinner',
				status: item.status || 'planned',
				dayIndex: item.dayIndex ?? index,
			};

			return transformedDay;
		});

		const result = {
			_id: plan._id,
			id: plan.id || plan._id, // Use plan.id if available, otherwise use _id
			startDate,
			endDate,
			days,
			userId: plan.userId,
			createdAt: plan.createdAt,
			updatedAt: plan.updatedAt,
		};

		return result;
	});
};

// Organize meal plans by date
export const organizeMealPlansByDate = (
	plans: DisplayMealPlan[]
): Record<string, MealPlanItem[]> => {
	const result = plans.reduce(
		(acc, plan) => {
			if (!plan.days || plan.days.length === 0) {
				return acc;
			}

			plan.days.forEach((day) => {
				const dateKey = format(day.date, 'yyyy-MM-dd');

				if (!acc[dateKey]) acc[dateKey] = [];

				// Only add one meal per date, prioritizing dinner meals
				const existingMeal = acc[dateKey][0];

				if (!existingMeal) {
					// No meal exists for this date, add the current one
					acc[dateKey].push({
						_id: `${plan._id}-${dateKey}`,
						id: plan.id || plan._id, // Use plan.id if available, otherwise use _id
						startDate: plan.startDate,
						endDate: plan.endDate,
						date: day.date,
						recipeId: day.recipeId,
						recipe: day.recipe,
						mealType: day.mealType || 'dinner',
						status: day.status || 'planned',
						dayIndex: day.dayIndex,
					} as MealPlanItem);
				} else {
					// A meal already exists for this date
					// Replace it if the current meal is dinner and the existing one isn't
					// or if the current meal has a recipe and the existing one doesn't
					const shouldReplace =
						(day.mealType === 'dinner' && existingMeal.mealType !== 'dinner') ||
						(day.recipeId && !existingMeal.recipeId) ||
						(day.recipe && !existingMeal.recipe);

					if (shouldReplace) {
						if (process.env.NODE_ENV === 'development') {
							console.log(
								`🔄 Consolidating meals for ${dateKey}: replacing ${existingMeal.mealType} with ${day.mealType || 'dinner'}`
							);
						}
						acc[dateKey][0] = {
							_id: `${plan._id}-${dateKey}`,
							id: plan.id || plan._id, // Use plan.id if available, otherwise use _id
							startDate: plan.startDate,
							endDate: plan.endDate,
							date: day.date,
							recipeId: day.recipeId,
							recipe: day.recipe,
							mealType: day.mealType || 'dinner',
							status: day.status || 'planned',
							dayIndex: day.dayIndex,
						} as MealPlanItem;
					} else if (process.env.NODE_ENV === 'development') {
						console.log(
							`⏭️ Skipping duplicate meal for ${dateKey}: ${day.mealType || 'dinner'} (existing: ${existingMeal.mealType})`
						);
					}
				}
			});

			return acc;
		},
		{} as Record<string, MealPlanItem[]>
	);

	// Log summary of consolidation
	if (process.env.NODE_ENV === 'development') {
		const totalDates = Object.keys(result).length;
		const datesWithMultipleMeals = Object.values(result).filter(
			(meals) => meals.length > 1
		).length;
		if (datesWithMultipleMeals > 0) {
			console.warn(
				`⚠️ Found ${datesWithMultipleMeals} dates with multiple meals after consolidation`
			);
		} else {
			console.log(
				`✅ Successfully consolidated meals: ${totalDates} dates with single meals`
			);
		}
	}

	return result;
};

// Get skipped days (placeholder function)
export const getSkippedDays = (
	mealPlansByDate: Record<string, MealPlanItem[]>
): string[] => {
	const skipped: string[] = [];
	Object.entries(mealPlansByDate).forEach(([dateStr, plans]) => {
		if (plans.length > 0 && plans.every((plan) => plan.status === 'skipped')) {
			skipped.push(dateStr);
		}
	});
	return skipped;
};

export const isValidObjectId = (id: string): boolean => {
	return /^[0-9a-fA-F]{24}$/.test(id);
};

export const fetchSkippedDays = async (
	start: Date,
	end: Date,
	getToken?: () => Promise<string | null>
): Promise<string[]> => {
	try {
		const response = await fetch(
			`/api/skipped-days?startDate=${start.toISOString()}&endDate=${end.toISOString()}&_t=${Date.now()}`
		);
		if (!response.ok) throw new Error('Failed to fetch skipped days');
		const data = await response.json();
		return data.map((d: any) => {
			// Handle timezone-safe date conversion
			const dateStr = d.date;
			if (dateStr.includes('T')) {
				// If it's an ISO string, extract just the date part to avoid timezone issues
				return dateStr.split('T')[0];
			} else {
				// Otherwise format normally
				return format(new Date(dateStr), 'yyyy-MM-dd');
			}
		});
	} catch (error) {
		console.error('Error fetching skipped days:', error);
		return [];
	}
};

export const formatDate = (date: Date | string): string => {
	try {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		if (isNaN(dateObj.getTime())) {
			return 'Invalid date';
		}
		return format(dateObj, 'MMM d, yyyy');
	} catch (error) {
		console.error('Error formatting date:', error);
		return 'Invalid date';
	}
};
