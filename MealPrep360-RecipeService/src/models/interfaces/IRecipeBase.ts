export interface IIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface IRecipeBase {
  title: string;
  description: string;
  ingredients: IIngredient[];
  prepTime: number;
  cookTime: number;
  servings: number;
}