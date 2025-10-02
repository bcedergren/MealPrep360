import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { WeeklyCalendar } from '../../src/components/mealPlan/WeeklyCalendar';
import { RecipeCard } from '../../src/components/recipe';
import {
  Button,
  Card,
  Colors,
  Loading,
  Screen,
  Spacing,
  Text,
} from '../../src/components/ui';
import { useMealPlanning } from '../../src/hooks/useMealPlanning';
import { useRecipeSearch } from '../../src/hooks/useRecipeSearch';
import { MealPlanDay, MealSlot, MealType } from '../../src/types/mealPlan';
import { Recipe } from '../../src/types/recipe';

export default function MealPlanScreen() {
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<{
    day: MealPlanDay;
    mealSlot: MealSlot;
  } | null>(null);

  // Meal planning hook
  const {
    currentMealPlan,
    selectedDate,
    currentWeekStart,
    isLoading,
    error,
    createMealPlan,
    setSelectedDate,
    navigateWeek,
    goToToday,
    addRecipeToMeal,
    removeRecipeFromMeal,
    markMealCompleted,
    calculateDayNutrition,
    calculateWeekNutrition,
    hasPendingChanges,
    syncPendingChanges,
  } = useMealPlanning();

  // Recipe search for selecting recipes
  const {
    recipes,
    loading: recipesLoading,
    search,
    updateSearchQuery,
    filters,
  } = useRecipeSearch({
    pageSize: 20,
    enableCache: true,
  });

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  const handleMealSlotPress = useCallback((day: MealPlanDay, mealSlot: MealSlot) => {
    setSelectedMealSlot({ day, mealSlot });
    setShowRecipeSelector(true);
  }, []);

  const handleAddRecipeToMeal = useCallback(async (
    day: MealPlanDay, 
    mealType: MealType, 
    recipe: Recipe
  ) => {
    try {
      const date = new Date(day.date);
      await addRecipeToMeal(date, mealType, recipe);
      setShowRecipeSelector(false);
      setSelectedMealSlot(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add recipe to meal plan');
    }
  }, [addRecipeToMeal]);

  const handleRemoveRecipeFromMeal = useCallback(async (
    day: MealPlanDay,
    mealSlotId: string,
    recipeId: string
  ) => {
    try {
      const date = new Date(day.date);
      await removeRecipeFromMeal(date, mealSlotId, recipeId);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove recipe from meal plan');
    }
  }, [removeRecipeFromMeal]);

  const handleWeekChange = useCallback((direction: 'prev' | 'next') => {
    navigateWeek(direction);
  }, [navigateWeek]);

  const handleCreateMealPlan = useCallback(async () => {
    try {
      const title = `Meal Plan - Week of ${currentWeekStart.toLocaleDateString()}`;
      await createMealPlan(title, currentWeekStart);
    } catch (error) {
      Alert.alert('Error', 'Failed to create meal plan');
    }
  }, [createMealPlan, currentWeekStart]);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'generate':
        Alert.alert('AI Generation', 'AI meal plan generation coming soon!');
        break;
      case 'shopping':
        Alert.alert('Shopping List', 'Shopping list generation coming soon!');
        break;
      case 'prep':
        Alert.alert('Prep Schedule', 'Meal prep scheduling coming soon!');
        break;
      case 'sync':
        syncPendingChanges();
        break;
      default:
        break;
    }
  }, [syncPendingChanges]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text variant="h4" weight="bold">Meal Plan</Text>
        {hasPendingChanges && (
          <View style={styles.syncIndicator}>
            <Ionicons name="cloud-upload-outline" size={16} color={Colors.warning} />
            <Text variant="caption" color={Colors.warning}>Syncing...</Text>
          </View>
        )}
      </View>
      
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={goToToday}
        >
          <Ionicons name="today-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => handleQuickAction('generate')}
        >
          <Ionicons name="sparkles-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <Card padding="medium" margin="small">
      <Text variant="body1" weight="semibold" customStyle={styles.quickActionsTitle}>
        Quick Actions
      </Text>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => handleQuickAction('generate')}
        >
          <Ionicons name="sparkles" size={24} color={Colors.primary} />
          <Text variant="caption" weight="medium">Generate Plan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => handleQuickAction('shopping')}
        >
          <Ionicons name="list-outline" size={24} color={Colors.primary} />
          <Text variant="caption" weight="medium">Shopping List</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => handleQuickAction('prep')}
        >
          <Ionicons name="time-outline" size={24} color={Colors.primary} />
          <Text variant="caption" weight="medium">Prep Schedule</Text>
        </TouchableOpacity>
        
        {hasPendingChanges && (
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => handleQuickAction('sync')}
          >
            <Ionicons name="sync-outline" size={24} color={Colors.warning} />
            <Text variant="caption" weight="medium">Sync Changes</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderNutritionSummary = () => {
    const todayNutrition = calculateDayNutrition(selectedDate);
    if (!todayNutrition) return null;

    return (
      <Card padding="medium" margin="small">
        <Text variant="body1" weight="semibold" customStyle={styles.nutritionTitle}>
          Today's Nutrition
        </Text>
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text variant="h6" weight="bold" color={Colors.primary}>
              {Math.round(todayNutrition.totalCalories)}
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>Calories</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text variant="h6" weight="bold">
              {Math.round(todayNutrition.totalProtein)}g
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>Protein</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text variant="h6" weight="bold">
              {Math.round(todayNutrition.totalCarbs)}g
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>Carbs</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text variant="h6" weight="bold">
              {Math.round(todayNutrition.totalFat)}g
            </Text>
            <Text variant="caption" color={Colors.textSecondary}>Fat</Text>
          </View>
        </View>
        
        {todayNutrition.targetCalories && (
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(100, (todayNutrition.totalCalories / todayNutrition.targetCalories) * 100)}%` 
                }
              ]} 
            />
          </View>
        )}
      </Card>
    );
  };

  const renderRecipeSelector = () => (
    <Modal
      visible={showRecipeSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <Screen safeArea padding="none">
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <TouchableOpacity
              onPress={() => {
                setShowRecipeSelector(false);
                setSelectedMealSlot(null);
              }}
            >
              <Text variant="body1" color={Colors.primary}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <Text variant="h6" weight="semibold">
            Add Recipe
          </Text>
          
          <View style={styles.modalHeaderRight} />
        </View>
        
        {selectedMealSlot && (
          <View style={styles.modalSubheader}>
            <Text variant="body2" color={Colors.textSecondary}>
              Adding to {selectedMealSlot.mealSlot.mealType} on{' '}
              {new Date(selectedMealSlot.day.date).toLocaleDateString()}
            </Text>
          </View>
        )}
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <Text variant="body1" color={Colors.textMuted}>
              Search recipes...
            </Text>
          </View>
        </View>
        
        {recipesLoading ? (
          <Loading variant="spinner" size="large" text="Loading recipes..." />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.recipesList}
            renderItem={({ item }) => (
              <View style={styles.recipeCardContainer}>
                <RecipeCard
                  recipe={item}
                  variant="grid"
                  onPress={() => {
                    if (selectedMealSlot) {
                      handleAddRecipeToMeal(
                        selectedMealSlot.day,
                        selectedMealSlot.mealSlot.mealType,
                        item
                      );
                    }
                  }}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyRecipes}>
                <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
                <Text variant="body1" color={Colors.textMuted}>
                  No recipes found
                </Text>
                <Text variant="body2" color={Colors.textSecondary} align="center">
                  Try searching for specific recipes or ingredients
                </Text>
              </View>
            }
          />
        )}
      </Screen>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
      <Text variant="h5" weight="semibold" color={Colors.textMuted} customStyle={styles.emptyTitle}>
        No Meal Plan Yet
      </Text>
      <Text variant="body1" color={Colors.textSecondary} align="center" customStyle={styles.emptyDescription}>
        Create your first meal plan to start organizing your weekly meals and nutrition goals.
      </Text>
      <Button
        title="Create Meal Plan"
        variant="primary"
        onPress={handleCreateMealPlan}
        customStyle={styles.createButton}
      />
    </View>
  );

  return (
    <Screen safeArea padding="none">
      {renderHeader()}
      
      {isLoading ? (
        <Loading variant="spinner" size="large" text="Loading meal plan..." fullScreen />
      ) : error ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text variant="h6" color={Colors.error}>Error loading meal plan</Text>
          <Text variant="body2" color={Colors.textSecondary} align="center">
            {error}
          </Text>
                     <Button
             title="Try Again"
             variant="outline"
             onPress={() => {
               // Retry loading the meal plan
               setSelectedDate(new Date());
             }}
             customStyle={styles.retryButton}
           />
        </View>
      ) : !currentMealPlan ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <WeeklyCalendar
            mealPlan={currentMealPlan}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMealSlotPress={handleMealSlotPress}
            onAddRecipeToMeal={handleAddRecipeToMeal}
            onRemoveRecipeFromMeal={handleRemoveRecipeFromMeal}
            onWeekChange={handleWeekChange}
            currentWeekStart={currentWeekStart}
            isLoading={isLoading}
          />
          
          {renderNutritionSummary()}
          {renderQuickActions()}
        </ScrollView>
      )}
      
      {renderRecipeSelector()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  quickActionsTitle: {
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionItem: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    minWidth: 80,
    gap: Spacing.xs,
  },
  nutritionTitle: {
    marginBottom: Spacing.md,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  emptyDescription: {
    marginBottom: Spacing.lg,
  },
  createButton: {
    minWidth: 200,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  retryButton: {
    minWidth: 120,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalHeaderRight: {
    flex: 1,
  },
  modalSubheader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  recipesList: {
    padding: Spacing.lg,
  },
  recipeCardContainer: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  emptyRecipes: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
});