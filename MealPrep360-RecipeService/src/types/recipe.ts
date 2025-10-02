export type Recipe = {
	title: string;
	description: string;
	ingredients: string[];
	prepInstructions: string[];
	storageInstructions: string[];
	defrostInstructions: string[];
	cookingInstructions: string[];
	containerRecommendations: string[];
	storageDuration: number;
	servings: number;
	prepTime: number;
	cookTime: number;
	difficulty: string;
	tags: string[];
	imageUrl: string;
	nutritionalInfo: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
	};
	// Regional and cuisine classification for frontend filtering
	regions: string[]; // ["North America", "Europe", "Asia", "Global"]
	cuisineTypes: string[]; // ["Mediterranean", "Asian", "American", "Mexican"]
	climateZones: string[]; // ["temperate", "tropical", "continental", "universal"]
	culturalTags: string[]; // ["western", "eastern", "latin", "universal"]
};
