import { DEFAULT_MEAL_PLAN_SETTINGS, MealPlan, MealPlanDay, MealSlot } from '../types/mealPlan';
import { mockRecipes } from './mockRecipes';

export const createMockMealPlan = (startDate: Date): MealPlan => {
  const weekDates: Date[] = [];
  const start = new Date(startDate);
  
  // Ensure we start on Monday
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    weekDates.push(date);
  }

  const mealPlanDays: MealPlanDay[] = weekDates.map((date, dayIndex) => {
    const dateString = date.toISOString().split('T')[0];
    
    // Create meal slots for each day
    const meals: MealSlot[] = [
      {
        id: `${dateString}-breakfast`,
        mealType: 'breakfast',
        order: 0,
        recipes: dayIndex < 5 ? [
          {
            id: `${dateString}-breakfast-recipe-1`,
            recipeId: mockRecipes[4].id, // Overnight Oats
            recipe: mockRecipes[4],
            servings: 1,
            status: 'planned',
            addedAt: new Date().toISOString(),
          }
        ] : [],
        plannedTime: '07:30',
        isCompleted: dayIndex === 0, // Mark Monday breakfast as completed
      },
      {
        id: `${dateString}-lunch`,
        mealType: 'lunch',
        order: 1,
        recipes: dayIndex % 2 === 0 ? [
          {
            id: `${dateString}-lunch-recipe-1`,
            recipeId: mockRecipes[1].id, // Mediterranean Quinoa Bowl
            recipe: mockRecipes[1],
            servings: 1,
            status: 'planned',
            addedAt: new Date().toISOString(),
          }
        ] : [],
        plannedTime: '12:30',
      },
      {
        id: `${dateString}-dinner`,
        mealType: 'dinner',
        order: 2,
        recipes: dayIndex < 6 ? [
          {
            id: `${dateString}-dinner-recipe-1`,
            recipeId: dayIndex % 2 === 0 ? mockRecipes[0].id : mockRecipes[3].id, // Alternate between Honey Garlic Chicken and Thai Basil Beef
            recipe: dayIndex % 2 === 0 ? mockRecipes[0] : mockRecipes[3],
            servings: dayIndex % 2 === 0 ? 4 : 2, // Meal prep vs regular serving
            status: 'planned',
            addedAt: new Date().toISOString(),
          }
        ] : [],
        plannedTime: '19:00',
      },
      {
        id: `${dateString}-snack`,
        mealType: 'snack',
        order: 3,
        recipes: [],
        plannedTime: '15:30',
      },
    ];

    // Calculate daily nutrition
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;

    meals.forEach(meal => {
      meal.recipes.forEach(mealRecipe => {
        if (mealRecipe.recipe.nutritionInfo) {
          const scale = mealRecipe.servings / mealRecipe.recipe.servings;
          const nutrition = mealRecipe.recipe.nutritionInfo;
          
          totalCalories += nutrition.calories * scale;
          totalProtein += nutrition.protein * scale;
          totalCarbs += nutrition.carbs * scale;
          totalFat += nutrition.fat * scale;
          totalFiber += nutrition.fiber * scale;
          totalSugar += nutrition.sugar * scale;
          totalSodium += nutrition.sodium * scale;
        }
      });
    });

    return {
      date: dateString,
      dayOfWeek: date.getDay(),
      meals,
      nutritionSummary: {
        date: dateString,
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFat: Math.round(totalFat),
        totalFiber: Math.round(totalFiber),
        totalSugar: Math.round(totalSugar),
        totalSodium: Math.round(totalSodium),
        mealBreakdown: meals.map(meal => ({
          mealType: meal.mealType,
          calories: meal.recipes.reduce((sum, recipe) => {
            if (recipe.recipe.nutritionInfo) {
              const scale = recipe.servings / recipe.recipe.servings;
              return sum + (recipe.recipe.nutritionInfo.calories * scale);
            }
            return sum;
          }, 0),
          protein: meal.recipes.reduce((sum, recipe) => {
            if (recipe.recipe.nutritionInfo) {
              const scale = recipe.servings / recipe.recipe.servings;
              return sum + (recipe.recipe.nutritionInfo.protein * scale);
            }
            return sum;
          }, 0),
          carbs: meal.recipes.reduce((sum, recipe) => {
            if (recipe.recipe.nutritionInfo) {
              const scale = recipe.servings / recipe.recipe.servings;
              return sum + (recipe.recipe.nutritionInfo.carbs * scale);
            }
            return sum;
          }, 0),
          fat: meal.recipes.reduce((sum, recipe) => {
            if (recipe.recipe.nutritionInfo) {
              const scale = recipe.servings / recipe.recipe.servings;
              return sum + (recipe.recipe.nutritionInfo.fat * scale);
            }
            return sum;
          }, 0),
          fiber: meal.recipes.reduce((sum, recipe) => {
            if (recipe.recipe.nutritionInfo) {
              const scale = recipe.servings / recipe.recipe.servings;
              return sum + (recipe.recipe.nutritionInfo.fiber * scale);
            }
            return sum;
          }, 0),
          sugar: meal.recipes.reduce((sum, recipe) => {
            if (recipe.recipe.nutritionInfo) {
              const scale = recipe.servings / recipe.recipe.servings;
              return sum + (recipe.recipe.nutritionInfo.sugar * scale);
            }
            return sum;
          }, 0),
          sodium: meal.recipes.reduce((sum, recipe) => {
            if (recipe.recipe.nutritionInfo) {
              const scale = recipe.servings / recipe.recipe.servings;
              return sum + (recipe.recipe.nutritionInfo.sodium * scale);
            }
            return sum;
          }, 0),
        })),
        targetCalories: DEFAULT_MEAL_PLAN_SETTINGS.targetCaloriesPerDay,
      },
      notes: dayIndex === 2 ? 'Meal prep day - prepare chicken for the week' : undefined,
    };
  });

  // Calculate weekly nutrition summary
  const weeklyCalories = mealPlanDays.reduce((sum, day) => sum + (day.nutritionSummary?.totalCalories || 0), 0);
  const weeklyProtein = mealPlanDays.reduce((sum, day) => sum + (day.nutritionSummary?.totalProtein || 0), 0);
  const weeklyCarbs = mealPlanDays.reduce((sum, day) => sum + (day.nutritionSummary?.totalCarbs || 0), 0);
  const weeklyFat = mealPlanDays.reduce((sum, day) => sum + (day.nutritionSummary?.totalFat || 0), 0);
  const weeklyFiber = mealPlanDays.reduce((sum, day) => sum + (day.nutritionSummary?.totalFiber || 0), 0);
  const weeklySugar = mealPlanDays.reduce((sum, day) => sum + (day.nutritionSummary?.totalSugar || 0), 0);
  const weeklySodium = mealPlanDays.reduce((sum, day) => sum + (day.nutritionSummary?.totalSodium || 0), 0);

  const targetCaloriesPerWeek = (DEFAULT_MEAL_PLAN_SETTINGS.targetCaloriesPerDay || 2000) * 7;
  const complianceScore = Math.min(100, Math.round((weeklyCalories / targetCaloriesPerWeek) * 100));

  const mealPlan: MealPlan = {
    id: 'mock-meal-plan-1',
    userId: 'user1',
    title: `Meal Plan - Week of ${weekDates[0].toLocaleDateString()}`,
    description: 'A balanced meal plan focused on healthy proteins, complex carbs, and fresh vegetables.',
    startDate: weekDates[0].toISOString(),
    endDate: weekDates[6].toISOString(),
    days: mealPlanDays,
    settings: {
      ...DEFAULT_MEAL_PLAN_SETTINGS,
      dietaryRestrictions: ['Gluten-Free'],
      cuisinePreferences: ['Mediterranean', 'Asian'],
      cookingTimePreference: 'normal',
      budgetPreference: 'moderate',
    },
    nutritionSummary: {
      weekStart: weekDates[0].toISOString(),
      weekEnd: weekDates[6].toISOString(),
      totalCalories: weeklyCalories,
      averageCaloriesPerDay: Math.round(weeklyCalories / 7),
      totalProtein: weeklyProtein,
      totalCarbs: weeklyCarbs,
      totalFat: weeklyFat,
      totalFiber: weeklyFiber,
      totalSugar: weeklySugar,
      totalSodium: weeklySodium,
      dailySummaries: mealPlanDays.map(day => day.nutritionSummary!),
      complianceScore,
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  return mealPlan;
};

export const mockMealPlan = createMockMealPlan(new Date());