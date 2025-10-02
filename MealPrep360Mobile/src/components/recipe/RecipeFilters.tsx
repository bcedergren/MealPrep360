import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    CuisineType,
    DEFAULT_FILTERS,
    DietaryRestriction,
    DifficultyLevel,
    FILTER_PRESETS,
    FilterPreset,
    MealType,
    RecipeCategory,
    RecipeFilters
} from '../../types/recipe';
import {
    BorderRadius,
    Card,
    Colors,
    Container,
    Spacing,
    Typography
} from '../ui';

interface RecipeFiltersProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  onPresetsApply?: (preset: FilterPreset) => void;
  activeFilterCount?: number;
}

export const RecipeFiltersComponent: React.FC<RecipeFiltersProps> = ({
  filters,
  onFiltersChange,
  onPresetsApply,
  activeFilterCount = 0,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<RecipeFilters>(filters);

  // Quick Filter Presets
  const renderFilterPresets = () => (
    <View style={styles.presetsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsScrollContent}
      >
        {FILTER_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={styles.presetChip}
            onPress={() => {
              if (onPresetsApply) {
                onPresetsApply(preset);
              }
            }}
          >
            <Ionicons 
              name={preset.icon as keyof typeof Ionicons.glyphMap} 
              size={16} 
              color={Colors.primary} 
              style={styles.presetIcon}
            />
            <Text style={styles.presetText}>{preset.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Active Filters Display
  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <Text style={styles.activeFiltersText}>
          {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
        </Text>
        <TouchableOpacity
          onPress={() => onFiltersChange(DEFAULT_FILTERS)}
          style={styles.clearFiltersButton}
        >
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Sort and Filter Actions
  const renderFilterActions = () => (
    <View style={styles.filterActions}>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowAdvancedFilters(true)}
      >
        <Ionicons name="options-outline" size={20} color={Colors.primary} />
        <Text style={styles.sortButtonText}>Filters</Text>
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => {
          // TODO: Show sort options modal
        }}
      >
        <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
        <Text style={styles.sortButtonText}>Sort</Text>
      </TouchableOpacity>
    </View>
  );

  // Advanced Filters Modal
  const renderAdvancedFiltersModal = () => (
    <Modal
      visible={showAdvancedFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <Container safeArea={true} padding="none">
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowAdvancedFilters(false)}
            style={styles.modalCloseButton}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity
            onPress={() => {
              onFiltersChange(localFilters);
              setShowAdvancedFilters(false);
            }}
            style={styles.modalApplyButton}
          >
            <Text style={styles.modalApplyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {renderCategoryFilters()}
          {renderDietaryFilters()}
          {renderCuisineFilters()}
          {renderMealTypeFilters()}
          {renderDifficultyFilters()}
          {renderTimeFilters()}
          {renderCalorieFilters()}
        </ScrollView>
      </Container>
    </Modal>
  );

  // Category Filters
  const renderCategoryFilters = () => (
    <Card padding="medium" margin="small">
      <Text style={styles.filterSectionTitle}>Categories</Text>
      <View style={styles.filterGrid}>
        {(['Popular', 'Quick & Easy', 'Healthy', 'Meal Prep', 'High Protein', 'Budget Friendly'] as RecipeCategory[]).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterChip,
              localFilters.categories.includes(category) && styles.filterChipActive
            ]}
            onPress={() => {
              const updatedCategories = localFilters.categories.includes(category)
                ? localFilters.categories.filter(c => c !== category)
                : [...localFilters.categories, category];
              setLocalFilters({
                ...localFilters,
                categories: updatedCategories
              });
            }}
          >
            <Text style={[
              styles.filterChipText,
              localFilters.categories.includes(category) && styles.filterChipTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  // Dietary Restriction Filters
  const renderDietaryFilters = () => (
    <Card padding="medium" margin="small">
      <Text style={styles.filterSectionTitle}>Dietary Restrictions</Text>
      <View style={styles.filterGrid}>
        {(['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo'] as DietaryRestriction[]).map((restriction) => (
          <TouchableOpacity
            key={restriction}
            style={[
              styles.filterChip,
              localFilters.dietaryRestrictions.includes(restriction) && styles.filterChipActive
            ]}
            onPress={() => {
              const updatedRestrictions = localFilters.dietaryRestrictions.includes(restriction)
                ? localFilters.dietaryRestrictions.filter(r => r !== restriction)
                : [...localFilters.dietaryRestrictions, restriction];
              setLocalFilters({
                ...localFilters,
                dietaryRestrictions: updatedRestrictions
              });
            }}
          >
            <Text style={[
              styles.filterChipText,
              localFilters.dietaryRestrictions.includes(restriction) && styles.filterChipTextActive
            ]}>
              {restriction}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  // Cuisine Type Filters
  const renderCuisineFilters = () => (
    <Card padding="medium" margin="small">
      <Text style={styles.filterSectionTitle}>Cuisine</Text>
      <View style={styles.filterGrid}>
        {(['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian'] as CuisineType[]).map((cuisine) => (
          <TouchableOpacity
            key={cuisine}
            style={[
              styles.filterChip,
              localFilters.cuisineTypes.includes(cuisine) && styles.filterChipActive
            ]}
            onPress={() => {
              const updatedCuisines = localFilters.cuisineTypes.includes(cuisine)
                ? localFilters.cuisineTypes.filter(c => c !== cuisine)
                : [...localFilters.cuisineTypes, cuisine];
              setLocalFilters({
                ...localFilters,
                cuisineTypes: updatedCuisines
              });
            }}
          >
            <Text style={[
              styles.filterChipText,
              localFilters.cuisineTypes.includes(cuisine) && styles.filterChipTextActive
            ]}>
              {cuisine}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  // Meal Type Filters
  const renderMealTypeFilters = () => (
    <Card padding="medium" margin="small">
      <Text style={styles.filterSectionTitle}>Meal Type</Text>
      <View style={styles.filterGrid}>
        {(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] as MealType[]).map((mealType) => (
          <TouchableOpacity
            key={mealType}
            style={[
              styles.filterChip,
              localFilters.mealTypes.includes(mealType) && styles.filterChipActive
            ]}
            onPress={() => {
              const updatedMealTypes = localFilters.mealTypes.includes(mealType)
                ? localFilters.mealTypes.filter(m => m !== mealType)
                : [...localFilters.mealTypes, mealType];
              setLocalFilters({
                ...localFilters,
                mealTypes: updatedMealTypes
              });
            }}
          >
            <Text style={[
              styles.filterChipText,
              localFilters.mealTypes.includes(mealType) && styles.filterChipTextActive
            ]}>
              {mealType}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  // Difficulty Filters
  const renderDifficultyFilters = () => (
    <Card padding="medium" margin="small">
      <Text style={styles.filterSectionTitle}>Difficulty</Text>
      <View style={styles.filterGrid}>
        {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((difficulty) => (
          <TouchableOpacity
            key={difficulty}
            style={[
              styles.filterChip,
              localFilters.difficulty.includes(difficulty) && styles.filterChipActive
            ]}
            onPress={() => {
              const updatedDifficulty = localFilters.difficulty.includes(difficulty)
                ? localFilters.difficulty.filter(d => d !== difficulty)
                : [...localFilters.difficulty, difficulty];
              setLocalFilters({
                ...localFilters,
                difficulty: updatedDifficulty
              });
            }}
          >
            <Text style={[
              styles.filterChipText,
              localFilters.difficulty.includes(difficulty) && styles.filterChipTextActive
            ]}>
              {difficulty}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  // Time Range Filters
  const renderTimeFilters = () => (
    <Card padding="medium" margin="small">
      <Text style={styles.filterSectionTitle}>Cooking Time</Text>
      <View style={styles.timeFilters}>
        <View style={styles.timeFilterRow}>
          <Text style={styles.timeFilterLabel}>Total Time (max)</Text>
          <View style={styles.timeOptions}>
            {[15, 30, 60, 120].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.timeOption,
                  localFilters.totalTimeRange.max === minutes && styles.timeOptionActive
                ]}
                onPress={() => {
                  setLocalFilters({
                    ...localFilters,
                    totalTimeRange: { ...localFilters.totalTimeRange, max: minutes }
                  });
                }}
              >
                <Text style={[
                  styles.timeOptionText,
                  localFilters.totalTimeRange.max === minutes && styles.timeOptionTextActive
                ]}>
                  {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Card>
  );

  // Calorie Range Filters
  const renderCalorieFilters = () => (
    <Card padding="medium" margin="small">
      <Text style={styles.filterSectionTitle}>Calories per Serving</Text>
      <View style={styles.calorieFilters}>
        {[
          { label: 'Under 300', max: 300 },
          { label: '300-500', max: 500 },
          { label: '500-700', max: 700 },
          { label: 'Over 700', max: 2000 },
        ].map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.calorieOption,
              localFilters.calorieRange.max === option.max && styles.calorieOptionActive
            ]}
            onPress={() => {
              setLocalFilters({
                ...localFilters,
                calorieRange: { min: 0, max: option.max }
              });
            }}
          >
            <Text style={[
              styles.calorieOptionText,
              localFilters.calorieRange.max === option.max && styles.calorieOptionTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {renderFilterPresets()}
      {renderActiveFilters()}
      {renderFilterActions()}
      {renderAdvancedFiltersModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  presetsContainer: {
    paddingVertical: Spacing.sm,
  },
  presetsScrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetIcon: {
    marginRight: Spacing.xs,
  },
  presetText: {
    fontSize: Typography.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundTertiary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activeFiltersText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  clearFiltersButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearFiltersText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    position: 'relative',
  },
  sortButtonText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: Typography.xs,
    color: Colors.white,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    paddingVertical: Spacing.sm,
  },
  modalCloseText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  modalApplyButton: {
    paddingVertical: Spacing.sm,
  },
  modalApplyText: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  filterSectionTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.sm,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  timeFilters: {
    gap: Spacing.md,
  },
  timeFilterRow: {
    gap: Spacing.sm,
  },
  timeFilterLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  timeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeOptionText: {
    fontSize: Typography.sm,
    color: Colors.text,
  },
  timeOptionTextActive: {
    color: Colors.white,
  },
  calorieFilters: {
    gap: Spacing.sm,
  },
  calorieOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  calorieOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  calorieOptionText: {
    fontSize: Typography.sm,
    color: Colors.text,
    textAlign: 'center',
  },
  calorieOptionTextActive: {
    color: Colors.white,
  },
});