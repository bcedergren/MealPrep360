import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createMockMealPlan } from '../data/mockMealPlan';
import {
    calculateMealNutrition,
    DailyNutritionSummary,
    DEFAULT_MEAL_PLAN_SETTINGS,
    getWeekDates,
    MealPlan,
    MealRecipe,
    MealType,
    WeeklyNutritionSummary
} from '../types/mealPlan';
import { Recipe } from '../types/recipe';

interface UseMealPlanningProps {
  initialDate?: Date;
  autoSync?: boolean;
}

interface UseMealPlanningReturn {
  // Current meal plan state
  currentMealPlan: MealPlan | null;
  selectedDate: Date;
  currentWeekStart: Date;
  isLoading: boolean;
  error: string | null;
  
  // Meal plan operations
  createMealPlan: (title: string, startDate: Date) => Promise<MealPlan>;
  loadMealPlan: (planId: string) => Promise<void>;
  saveMealPlan: () => Promise<void>;
  deleteMealPlan: (planId: string) => Promise<void>;
  duplicateMealPlan: (planId: string) => Promise<MealPlan>;
  
  // Date navigation
  setSelectedDate: (date: Date) => void;
  navigateWeek: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  
  // Meal operations
  addRecipeToMeal: (date: Date, mealType: MealType, recipe: Recipe, servings?: number) => Promise<void>;
  removeRecipeFromMeal: (date: Date, mealSlotId: string, recipeId: string) => Promise<void>;
  updateMealRecipe: (date: Date, mealSlotId: string, recipeId: string, updates: Partial<MealRecipe>) => Promise<void>;
  moveRecipe: (fromDate: Date, toDate: Date, fromMealType: MealType, toMealType: MealType, recipeId: string) => Promise<void>;
  markMealCompleted: (date: Date, mealSlotId: string, completed: boolean) => Promise<void>;
  
  // Nutrition calculations
  calculateDayNutrition: (date: Date) => DailyNutritionSummary | null;
  calculateWeekNutrition: () => WeeklyNutritionSummary | null;
  
  // Suggestions and recommendations
  getSuggestedRecipes: (mealType: MealType, date: Date) => Recipe[];
  getLeftoverRecipes: () => Recipe[];
  
  // Offline support
  syncPendingChanges: () => Promise<void>;
  hasPendingChanges: boolean;
}

const CACHE_KEYS = {
  MEAL_PLANS: 'meal_plans_cache',
  CURRENT_PLAN: 'current_meal_plan',
  PENDING_CHANGES: 'meal_plan_pending_changes',
};

export const useMealPlanning = ({
  initialDate = new Date(),
  autoSync = true,
}: UseMealPlanningProps = {}): UseMealPlanningReturn => {
  const { getToken, userId } = useAuth();
  
  // State
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);

  // Computed values
  const currentWeekStart = useMemo(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Start week on Monday
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [selectedDate]);

  const hasPendingChanges = pendingChanges.length > 0;

  // Load initial data
  useEffect(() => {
    loadCurrentMealPlan();
    loadPendingChanges();
  }, []);

  // Auto-sync when online
  useEffect(() => {
    if (autoSync && hasPendingChanges) {
      syncPendingChanges();
    }
  }, [autoSync, hasPendingChanges]);

  const loadCurrentMealPlan = async () => {
    try {
      setIsLoading(true);
      
      // Use mock data for development
      const mockPlan = createMockMealPlan(currentWeekStart);
      setCurrentMealPlan(mockPlan);
      
      // Try to load from cache first
      const cachedPlan = await AsyncStorage.getItem(CACHE_KEYS.CURRENT_PLAN);
      if (cachedPlan) {
        const plan = JSON.parse(cachedPlan);
        // Use cached plan if it exists and is for the current week
        const cachedWeekStart = new Date(plan.startDate);
        if (cachedWeekStart.getTime() === currentWeekStart.getTime()) {
          setCurrentMealPlan(plan);
        }
      }
      
      // Comment out API call for development
      // if (userId) {
      //   await loadMealPlanForWeek(currentWeekStart);
      // }
    } catch (err) {
      console.error('Error loading meal plan:', err);
      setError('Failed to load meal plan');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMealPlanForWeek = async (weekStart: Date) => {
    try {
      const token = await getToken();
      const weekStartIso = weekStart.toISOString().split('T')[0];
      
      const response = await fetch(
        `https://www.mealprep360.com/api/meal-plans/week/${weekStartIso}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const mealPlan = await response.json();
        setCurrentMealPlan(mealPlan);
        
        // Cache the meal plan
        await AsyncStorage.setItem(CACHE_KEYS.CURRENT_PLAN, JSON.stringify(mealPlan));
      } else if (response.status === 404) {
        // No meal plan exists for this week
        setCurrentMealPlan(null);
      }
    } catch (err) {
      console.error('Error loading meal plan for week:', err);
      // Keep cached version if available
    }
  };

  const loadPendingChanges = async () => {
    try {
      const pending = await AsyncStorage.getItem(CACHE_KEYS.PENDING_CHANGES);
      if (pending) {
        setPendingChanges(JSON.parse(pending));
      }
    } catch (error) {
      console.error('Error loading pending changes:', error);
    }
  };

  const savePendingChange = async (change: any) => {
    const newChanges = [...pendingChanges, { ...change, timestamp: Date.now() }];
    setPendingChanges(newChanges);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_CHANGES, JSON.stringify(newChanges));
  };

  const createMealPlan = useCallback(async (title: string, startDate: Date): Promise<MealPlan> => {
    if (!userId) throw new Error('User not authenticated');

    const weekDates = getWeekDates(startDate);
    const endDate = weekDates[weekDates.length - 1];
    
    const newMealPlan: MealPlan = {
      id: `temp_${Date.now()}`,
      userId,
      title,
      description: '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: weekDates.map(date => ({
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.getDay(),
        meals: DEFAULT_MEAL_PLAN_SETTINGS.defaultMealTypes.map((mealType, index) => ({
          id: `${date.toISOString().split('T')[0]}-${mealType}`,
          mealType,
          order: index,
          recipes: [],
        })),
      })),
      settings: DEFAULT_MEAL_PLAN_SETTINGS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    try {
      const token = await getToken();
      const response = await fetch('https://www.mealprep360.com/api/meal-plans', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMealPlan),
      });

      if (response.ok) {
        const createdPlan = await response.json();
        setCurrentMealPlan(createdPlan);
        await AsyncStorage.setItem(CACHE_KEYS.CURRENT_PLAN, JSON.stringify(createdPlan));
        return createdPlan;
      } else {
        throw new Error('Failed to create meal plan');
      }
    } catch (err) {
      // Save for offline sync
      await savePendingChange({
        type: 'create_meal_plan',
        payload: newMealPlan,
      });
      
      setCurrentMealPlan(newMealPlan);
      await AsyncStorage.setItem(CACHE_KEYS.CURRENT_PLAN, JSON.stringify(newMealPlan));
      return newMealPlan;
    }
  }, [userId, getToken]);

  const loadMealPlan = useCallback(async (planId: string) => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      const response = await fetch(
        `https://www.mealprep360.com/api/meal-plans/${planId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const mealPlan = await response.json();
        setCurrentMealPlan(mealPlan);
        await AsyncStorage.setItem(CACHE_KEYS.CURRENT_PLAN, JSON.stringify(mealPlan));
      } else {
        throw new Error('Failed to load meal plan');
      }
    } catch (err) {
      console.error('Error loading meal plan:', err);
      setError('Failed to load meal plan');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const saveMealPlan = useCallback(async () => {
    if (!currentMealPlan) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `https://www.mealprep360.com/api/meal-plans/${currentMealPlan.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...currentMealPlan,
            updatedAt: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        const updatedPlan = await response.json();
        setCurrentMealPlan(updatedPlan);
        await AsyncStorage.setItem(CACHE_KEYS.CURRENT_PLAN, JSON.stringify(updatedPlan));
      } else {
        throw new Error('Failed to save meal plan');
      }
    } catch (err) {
      // Save for offline sync
      await savePendingChange({
        type: 'update_meal_plan',
        payload: currentMealPlan,
      });
    }
  }, [currentMealPlan, getToken]);

  const deleteMealPlan = useCallback(async (planId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `https://www.mealprep360.com/api/meal-plans/${planId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        if (currentMealPlan?.id === planId) {
          setCurrentMealPlan(null);
          await AsyncStorage.removeItem(CACHE_KEYS.CURRENT_PLAN);
        }
      } else {
        throw new Error('Failed to delete meal plan');
      }
    } catch (err) {
      await savePendingChange({
        type: 'delete_meal_plan',
        payload: { planId },
      });
    }
  }, [currentMealPlan, getToken]);

  const duplicateMealPlan = useCallback(async (planId: string): Promise<MealPlan> => {
    // Implementation for duplicating meal plans
    throw new Error('Duplicate meal plan not implemented yet');
  }, []);

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
    
    // Load meal plan for new week
    const newWeekStart = new Date(newDate);
    const day = newWeekStart.getDay();
    const diff = newWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    newWeekStart.setDate(diff);
    
    loadMealPlanForWeek(newWeekStart);
  }, [selectedDate]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const addRecipeToMeal = useCallback(async (
    date: Date,
    mealType: MealType,
    recipe: Recipe,
    servings: number = recipe.servings
  ) => {
    if (!currentMealPlan) return;

    const dateString = date.toISOString().split('T')[0];
    const updatedPlan = { ...currentMealPlan };
    
    // Find the day
    const dayIndex = updatedPlan.days.findIndex(day => day.date === dateString);
    if (dayIndex === -1) return;

    // Find the meal slot
    const mealSlotIndex = updatedPlan.days[dayIndex].meals.findIndex(
      meal => meal.mealType === mealType
    );
    if (mealSlotIndex === -1) return;

    // Add recipe to meal
    const newMealRecipe: MealRecipe = {
      id: `${Date.now()}_${recipe.id}`,
      recipeId: recipe.id,
      recipe,
      servings,
      status: 'planned',
      addedAt: new Date().toISOString(),
    };

    updatedPlan.days[dayIndex].meals[mealSlotIndex].recipes.push(newMealRecipe);
    updatedPlan.updatedAt = new Date().toISOString();

    setCurrentMealPlan(updatedPlan);
    await saveMealPlan();

    // Save pending change for offline sync
    await savePendingChange({
      type: 'add_recipe_to_meal',
      payload: { date: dateString, mealType, recipe, servings },
    });
  }, [currentMealPlan, saveMealPlan]);

  const removeRecipeFromMeal = useCallback(async (
    date: Date,
    mealSlotId: string,
    recipeId: string
  ) => {
    if (!currentMealPlan) return;

    const dateString = date.toISOString().split('T')[0];
    const updatedPlan = { ...currentMealPlan };
    
    // Find the day and meal slot
    const day = updatedPlan.days.find(d => d.date === dateString);
    if (!day) return;

    const mealSlot = day.meals.find(m => m.id === mealSlotId);
    if (!mealSlot) return;

    // Remove recipe
    mealSlot.recipes = mealSlot.recipes.filter(r => r.id !== recipeId);
    updatedPlan.updatedAt = new Date().toISOString();

    setCurrentMealPlan(updatedPlan);
    await saveMealPlan();

    await savePendingChange({
      type: 'remove_recipe_from_meal',
      payload: { date: dateString, mealSlotId, recipeId },
    });
  }, [currentMealPlan, saveMealPlan]);

  const updateMealRecipe = useCallback(async (
    date: Date,
    mealSlotId: string,
    recipeId: string,
    updates: Partial<MealRecipe>
  ) => {
    if (!currentMealPlan) return;

    const dateString = date.toISOString().split('T')[0];
    const updatedPlan = { ...currentMealPlan };
    
    // Find and update the recipe
    const day = updatedPlan.days.find(d => d.date === dateString);
    if (!day) return;

    const mealSlot = day.meals.find(m => m.id === mealSlotId);
    if (!mealSlot) return;

    const recipeIndex = mealSlot.recipes.findIndex(r => r.id === recipeId);
    if (recipeIndex === -1) return;

    mealSlot.recipes[recipeIndex] = { ...mealSlot.recipes[recipeIndex], ...updates };
    updatedPlan.updatedAt = new Date().toISOString();

    setCurrentMealPlan(updatedPlan);
    await saveMealPlan();
  }, [currentMealPlan, saveMealPlan]);

  const moveRecipe = useCallback(async (
    fromDate: Date,
    toDate: Date,
    fromMealType: MealType,
    toMealType: MealType,
    recipeId: string
  ) => {
    // Implementation for moving recipes between meals/days
    // This would involve removing from one slot and adding to another
  }, []);

  const markMealCompleted = useCallback(async (
    date: Date,
    mealSlotId: string,
    completed: boolean
  ) => {
    if (!currentMealPlan) return;

    const dateString = date.toISOString().split('T')[0];
    const updatedPlan = { ...currentMealPlan };
    
    const day = updatedPlan.days.find(d => d.date === dateString);
    if (!day) return;

    const mealSlot = day.meals.find(m => m.id === mealSlotId);
    if (!mealSlot) return;

    mealSlot.isCompleted = completed;
    updatedPlan.updatedAt = new Date().toISOString();

    setCurrentMealPlan(updatedPlan);
    await saveMealPlan();
  }, [currentMealPlan, saveMealPlan]);

  const calculateDayNutrition = useCallback((date: Date): DailyNutritionSummary | null => {
    if (!currentMealPlan) return null;

    const dateString = date.toISOString().split('T')[0];
    const day = currentMealPlan.days.find(d => d.date === dateString);
    if (!day) return null;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;

    const mealBreakdown: any[] = [];

    day.meals.forEach(mealSlot => {
      const mealNutrition = calculateMealNutrition(mealSlot.recipes);
      mealBreakdown.push(mealNutrition);
      
      totalCalories += mealNutrition.calories;
      totalProtein += mealNutrition.protein;
      totalCarbs += mealNutrition.carbs;
      totalFat += mealNutrition.fat;
      totalFiber += mealNutrition.fiber;
      totalSugar += mealNutrition.sugar;
      totalSodium += mealNutrition.sodium;
    });

    return {
      date: dateString,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSugar,
      totalSodium,
      mealBreakdown,
      targetCalories: currentMealPlan.settings.targetCaloriesPerDay,
    };
  }, [currentMealPlan]);

  const calculateWeekNutrition = useCallback((): WeeklyNutritionSummary | null => {
    if (!currentMealPlan) return null;

    const dailySummaries = currentMealPlan.days.map(day => 
      calculateDayNutrition(new Date(day.date))
    ).filter(Boolean) as DailyNutritionSummary[];

    if (dailySummaries.length === 0) return null;

    const totals = dailySummaries.reduce(
      (acc, day) => ({
        totalCalories: acc.totalCalories + day.totalCalories,
        totalProtein: acc.totalProtein + day.totalProtein,
        totalCarbs: acc.totalCarbs + day.totalCarbs,
        totalFat: acc.totalFat + day.totalFat,
        totalFiber: acc.totalFiber + day.totalFiber,
        totalSugar: acc.totalSugar + day.totalSugar,
        totalSodium: acc.totalSodium + day.totalSodium,
      }),
      {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        totalSugar: 0,
        totalSodium: 0,
      }
    );

    const targetCalories = currentMealPlan.settings.targetCaloriesPerDay || 2000;
    const complianceScore = Math.min(100, (totals.totalCalories / (targetCalories * 7)) * 100);

    return {
      weekStart: currentMealPlan.startDate,
      weekEnd: currentMealPlan.endDate,
      ...totals,
      averageCaloriesPerDay: totals.totalCalories / dailySummaries.length,
      dailySummaries,
      complianceScore,
    };
  }, [currentMealPlan, calculateDayNutrition]);

  const getSuggestedRecipes = useCallback((mealType: MealType, date: Date): Recipe[] => {
    // Implementation for recipe suggestions based on preferences, nutrition goals, etc.
    return [];
  }, []);

  const getLeftoverRecipes = useCallback((): Recipe[] => {
    // Implementation for finding recipes that could be used as leftovers
    return [];
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (pendingChanges.length === 0) return;

    try {
      // Process each pending change
      for (const change of pendingChanges) {
        // Sync with API based on change type
        // This would implement the actual sync logic
      }

      // Clear pending changes after successful sync
      setPendingChanges([]);
      await AsyncStorage.removeItem(CACHE_KEYS.PENDING_CHANGES);
    } catch (error) {
      console.error('Error syncing pending changes:', error);
    }
  }, [pendingChanges]);

  return {
    // State
    currentMealPlan,
    selectedDate,
    currentWeekStart,
    isLoading,
    error,
    
    // Meal plan operations
    createMealPlan,
    loadMealPlan,
    saveMealPlan,
    deleteMealPlan,
    duplicateMealPlan,
    
    // Navigation
    setSelectedDate,
    navigateWeek,
    goToToday,
    
    // Meal operations
    addRecipeToMeal,
    removeRecipeFromMeal,
    updateMealRecipe,
    moveRecipe,
    markMealCompleted,
    
    // Nutrition
    calculateDayNutrition,
    calculateWeekNutrition,
    
    // Suggestions
    getSuggestedRecipes,
    getLeftoverRecipes,
    
    // Offline support
    syncPendingChanges,
    hasPendingChanges,
  };
};