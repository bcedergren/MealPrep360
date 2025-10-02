export interface MealPlanDay {
	recipeId: string | null;
	status: 'planned' | 'completed' | 'skipped';
}

export interface MealPlanPreferences {
	startDate: string;
	duration: number;
	skippedDays?: boolean[];
}

export interface MealPlan {
	id: string;
	userId: string;
	startDate: string;
	endDate: string;
	days: MealPlanDay[];
	createdAt: string;
	updatedAt: string;
}
