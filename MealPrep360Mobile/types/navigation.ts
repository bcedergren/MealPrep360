export type RootStackParamList = {
	Splash: undefined;
	Debug: undefined;
	Home: undefined;
	SignUp: undefined;
	Login: undefined;
	Verification: undefined;
	Dashboard: undefined;
	SavedRecipes: undefined;
	MealPlan: undefined;
	RecipeDetails: {
		recipe: {
			id: string;
			title: string;
			description: string;
			image: string;
			ingredients: string[];
			instructions: string[];
			prepTime: number;
			cookTime: number;
			servings: number;
		};
	};
};
