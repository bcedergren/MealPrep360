import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    MealPlan,
    MealPlanDay,
    MealSlot,
    MealType,
    getDayOfWeekName,
    getMealTypeColor,
    getMealTypeIcon,
    getWeekDates
} from '../../types/mealPlan';
import { Recipe } from '../../types/recipe';
import {
    BorderRadius,
    Card,
    Colors,
    Shadows,
    Spacing,
    Text
} from '../ui';

const { width } = Dimensions.get('window');
const DAY_CARD_WIDTH = (width - Spacing.xl * 2) / 7 - Spacing.xs;

interface WeeklyCalendarProps {
  mealPlan: MealPlan | null;
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  onMealSlotPress: (day: MealPlanDay, mealSlot: MealSlot) => void;
  onAddRecipeToMeal: (day: MealPlanDay, mealType: MealType, recipe: Recipe) => void;
  onRemoveRecipeFromMeal: (day: MealPlanDay, mealSlotId: string, recipeId: string) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
  currentWeekStart: Date;
  isLoading?: boolean;
}

export function WeeklyCalendar({
  mealPlan,
  selectedDate,
  onDateSelect,
  onMealSlotPress,
  onAddRecipeToMeal,
  onRemoveRecipeFromMeal,
  onWeekChange,
  currentWeekStart,
  isLoading = false,
}: WeeklyCalendarProps) {
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  
  const weekDays = useMemo(() => {
    if (!mealPlan) return [];
    
    return weekDates.map(date => {
      const dateString = date.toISOString().split('T')[0];
      const existingDay = mealPlan.days.find(day => day.date === dateString);
      
      if (existingDay) {
        return existingDay;
      }
      
      // Create default day structure if not exists
      const defaultMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
      return {
        date: dateString,
        dayOfWeek: date.getDay(),
        meals: defaultMealTypes.map((mealType, index) => ({
          id: `${dateString}-${mealType}`,
          mealType,
          order: index,
          recipes: [],
        })),
      } as MealPlanDay;
    });
  }, [mealPlan, weekDates]);

  const renderWeekHeader = () => (
    <View style={styles.weekHeader}>
      <TouchableOpacity
        style={styles.weekNavButton}
        onPress={() => onWeekChange('prev')}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.weekTitle}>
        <Text variant="h5" weight="bold">
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
          {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Text variant="caption" color={Colors.textSecondary}>
          {weekDates[0].getFullYear()}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.weekNavButton}
        onPress={() => onWeekChange('next')}
      >
        <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderDayHeader = (day: MealPlanDay, index: number) => {
    const date = weekDates[index];
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    
    return (
      <TouchableOpacity
        key={day.date}
        style={[
          styles.dayHeader,
          isToday && styles.todayHeader,
          isSelected && styles.selectedDayHeader,
        ]}
        onPress={() => onDateSelect(date)}
      >
        <Text 
          variant="caption" 
          weight="semibold"
          color={isToday || isSelected ? Colors.white : Colors.textSecondary}
        >
          {getDayOfWeekName(date.getDay()).substring(0, 3).toUpperCase()}
        </Text>
        <Text 
          variant="h6" 
          weight="bold"
          color={isToday || isSelected ? Colors.white : Colors.text}
        >
          {date.getDate()}
        </Text>
        
        {day.nutritionSummary && (
          <View style={styles.nutritionIndicator}>
            <Text variant="caption" color={isToday || isSelected ? Colors.white : Colors.textSecondary}>
              {Math.round(day.nutritionSummary.totalCalories)} cal
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMealSlot = (day: MealPlanDay, mealSlot: MealSlot) => {
    const mealColor = getMealTypeColor(mealSlot.mealType);
    const mealIcon = getMealTypeIcon(mealSlot.mealType);
    const hasRecipes = mealSlot.recipes.length > 0;
    
    return (
      <TouchableOpacity
        key={mealSlot.id}
        style={[
          styles.mealSlot,
          hasRecipes && styles.mealSlotWithRecipes,
          selectedMealType === mealSlot.mealType && styles.selectedMealSlot,
        ]}
        onPress={() => {
          setSelectedMealType(mealSlot.mealType);
          onMealSlotPress(day, mealSlot);
        }}
      >
        <View style={styles.mealSlotHeader}>
          <View style={[styles.mealTypeIndicator, { backgroundColor: mealColor }]}>
            <Ionicons name={mealIcon as any} size={12} color={Colors.white} />
          </View>
          
          <Text variant="caption" weight="semibold" customStyle={styles.mealTypeText}>
            {mealSlot.mealType.charAt(0).toUpperCase() + mealSlot.mealType.slice(1)}
          </Text>
          
          {mealSlot.plannedTime && (
            <Text variant="caption" color={Colors.textSecondary}>
              {mealSlot.plannedTime}
            </Text>
          )}
        </View>

        <View style={styles.mealSlotContent}>
          {hasRecipes ? (
            <View style={styles.recipesContainer}>
              {mealSlot.recipes.slice(0, 2).map((mealRecipe, index) => (
                <View key={mealRecipe.id} style={styles.recipeItem}>
                  <Text variant="caption" numberOfLines={1}>
                    {mealRecipe.recipe.title}
                  </Text>
                  {mealRecipe.servings !== mealRecipe.recipe.servings && (
                    <Text variant="caption" color={Colors.textSecondary}>
                      {mealRecipe.servings} servings
                    </Text>
                  )}
                </View>
              ))}
              
              {mealSlot.recipes.length > 2 && (
                <Text variant="caption" color={Colors.textSecondary}>
                  +{mealSlot.recipes.length - 2} more
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyMealSlot}>
              <Ionicons name="add" size={16} color={Colors.textMuted} />
              <Text variant="caption" color={Colors.textMuted}>
                Add recipe
              </Text>
            </View>
          )}
        </View>

        {mealSlot.isCompleted && (
          <View style={styles.completedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDayColumn = (day: MealPlanDay, index: number) => {
    const date = weekDates[index];
    
    return (
      <View key={day.date} style={styles.dayColumn}>
        {renderDayHeader(day, index)}
        
        <ScrollView 
          style={styles.dayMealsContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {day.meals.map((mealSlot) => renderMealSlot(day, mealSlot))}
          
          {/* Add spacing at bottom for better scrolling */}
          <View style={styles.dayColumnPadding} />
        </ScrollView>
      </View>
    );
  };

  const renderNutritionSummary = () => {
    if (!mealPlan?.nutritionSummary) return null;
    
    const summary = mealPlan.nutritionSummary;
    
    return (
      <Card padding="medium" margin="small" variant="elevated">
        <View style={styles.nutritionSummaryHeader}>
          <Text variant="body1" weight="semibold">Weekly Nutrition Summary</Text>
          <View style={styles.complianceScore}>
            <Text variant="caption" color={Colors.textSecondary}>Compliance</Text>
            <Text variant="body2" weight="bold" color={Colors.primary}>
              {Math.round(summary.complianceScore)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.nutritionStats}>
          <View style={styles.nutritionStat}>
            <Text variant="h6" weight="bold">{Math.round(summary.averageCaloriesPerDay)}</Text>
            <Text variant="caption" color={Colors.textSecondary}>Avg Calories</Text>
          </View>
          <View style={styles.nutritionStat}>
            <Text variant="h6" weight="bold">{Math.round(summary.totalProtein / 7)}g</Text>
            <Text variant="caption" color={Colors.textSecondary}>Avg Protein</Text>
          </View>
          <View style={styles.nutritionStat}>
            <Text variant="h6" weight="bold">{Math.round(summary.totalCarbs / 7)}g</Text>
            <Text variant="caption" color={Colors.textSecondary}>Avg Carbs</Text>
          </View>
          <View style={styles.nutritionStat}>
            <Text variant="h6" weight="bold">{Math.round(summary.totalFat / 7)}g</Text>
            <Text variant="caption" color={Colors.textSecondary}>Avg Fat</Text>
          </View>
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="body1" color={Colors.textSecondary}>Loading meal plan...</Text>
      </View>
    );
  }

  if (!mealPlan) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
        <Text variant="h6" color={Colors.textMuted}>No meal plan found</Text>
        <Text variant="body2" color={Colors.textSecondary} align="center">
          Create a new meal plan to get started with your weekly planning
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderWeekHeader()}
      {renderNutritionSummary()}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.calendarContainer}
        contentContainerStyle={styles.calendarContent}
      >
        {weekDays.map((day, index) => renderDayColumn(day, index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.small,
  },
  weekNavButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
  },
  weekTitle: {
    alignItems: 'center',
  },
  nutritionSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  complianceScore: {
    alignItems: 'flex-end',
  },
  nutritionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionStat: {
    alignItems: 'center',
  },
  calendarContainer: {
    flex: 1,
  },
  calendarContent: {
    paddingHorizontal: Spacing.md,
  },
  dayColumn: {
    width: DAY_CARD_WIDTH,
    marginHorizontal: Spacing.xs / 2,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  todayHeader: {
    backgroundColor: Colors.primary,
  },
  selectedDayHeader: {
    backgroundColor: Colors.secondary,
  },
  nutritionIndicator: {
    marginTop: Spacing.xs,
  },
  dayMealsContainer: {
    flex: 1,
    maxHeight: 500,
  },
  dayColumnPadding: {
    height: Spacing.xl,
  },
  mealSlot: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  mealSlotWithRecipes: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.primary,
  },
  selectedMealSlot: {
    borderColor: Colors.secondary,
    borderWidth: 2,
  },
  mealSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  mealTypeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  mealTypeText: {
    flex: 1,
  },
  mealSlotContent: {
    minHeight: 40,
  },
  recipesContainer: {
    gap: Spacing.xs,
  },
  recipeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyMealSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  completedIndicator: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
  },
});