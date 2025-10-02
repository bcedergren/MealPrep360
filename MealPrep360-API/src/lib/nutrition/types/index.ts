export interface NutritionInfo {
	calories: number;
	protein: number;
	carbohydrates: number;
	fat: number;
	fiber: number;
	sugar: number;
	sodium: number;
	cholesterol: number;
	saturatedFat: number;
	unsaturatedFat: number;
	transFat: number;
	vitamins: {
		a: number;
		c: number;
		d: number;
		e: number;
		k: number;
		b6: number;
		b12: number;
		thiamin: number;
		riboflavin: number;
		niacin: number;
		folate: number;
	};
	minerals: {
		calcium: number;
		iron: number;
		magnesium: number;
		phosphorus: number;
		potassium: number;
		zinc: number;
		selenium: number;
	};
	servingSize: number;
	servingUnit: string;
}

export interface NutritionalGoals {
	dailyCalories: number;
	macroRatio: {
		protein: number; // percentage
		carbohydrates: number;
		fat: number;
	};
	micronutrientGoals: {
		fiber: number;
		sodium: number;
		vitamins?: Partial<NutritionInfo['vitamins']>;
		minerals?: Partial<NutritionInfo['minerals']>;
	};
}

export interface MealNutritionLog {
	userId: string;
	date: Date;
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	recipeId?: string;
	recipeName?: string;
	servingSize: number;
	nutrition: NutritionInfo;
	notes?: string;
}

export interface NutritionAnalysisRequest {
	ingredients: Array<{
		name: string;
		amount: number;
		unit: string;
	}>;
	servingSize: number;
	servingUnit: string;
}

export interface NutritionRecommendation {
	type: 'increase' | 'decrease' | 'maintain';
	nutrient: keyof NutritionInfo | 'calories';
	currentValue: number;
	targetValue: number;
	recommendations: string[];
	foodSuggestions: Array<{
		name: string;
		amount: number;
		unit: string;
		nutritionPer100g: Partial<NutritionInfo>;
	}>;
}

export interface NutritionSummary {
	date: Date;
	totalNutrition: NutritionInfo;
	goalProgress: {
		calories: {
			current: number;
			target: number;
			percentage: number;
		};
		macros: {
			protein: { current: number; target: number; percentage: number };
			carbohydrates: { current: number; target: number; percentage: number };
			fat: { current: number; target: number; percentage: number };
		};
		micronutrients: {
			[key: string]: { current: number; target: number; percentage: number };
		};
	};
	mealBreakdown: {
		[key in MealNutritionLog['mealType']]: {
			calories: number;
			protein: number;
			carbohydrates: number;
			fat: number;
		};
	};
}

export interface NutritionFilterDTO {
	userId: string;
	startDate?: Date;
	endDate?: Date;
	mealType?: MealNutritionLog['mealType'];
	includeRecipes?: boolean;
}
