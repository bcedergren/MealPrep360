import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    BorderRadius,
    Button,
    Card,
    Colors,
    Loading,
    Screen,
    Shadows,
    Spacing,
    Text
} from '../src/components/ui';
import { Ingredient, Recipe } from '../src/types/recipe';

const { width } = Dimensions.get('window');

export default function RecipeDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [servingSize, setServingSize] = useState(4);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'nutrition'>('ingredients');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [activeTimers, setActiveTimers] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchRecipeDetails();
    checkIfSaved();
  }, [params.id]);

  const fetchRecipeDetails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // First try to get from params if passed
      if (params.recipe && typeof params.recipe === 'string') {
        try {
          const parsedRecipe = JSON.parse(params.recipe);
          setRecipe(parsedRecipe);
          setServingSize(parsedRecipe.servings);
          return;
        } catch (e) {
          console.error('Failed to parse recipe from params:', e);
        }
      }
      
      // Otherwise fetch from API
      const response = await fetch(
        `https://www.mealprep360.com/api/recipes/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }

      const data = await response.json();
      setRecipe(data);
      setServingSize(data.servings);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      Alert.alert('Error', 'Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const savedRecipes = await AsyncStorage.getItem('saved_recipes');
      if (savedRecipes) {
        const parsed = JSON.parse(savedRecipes);
        setIsSaved(parsed.includes(params.id));
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveRecipe = async () => {
    try {
      const token = await getToken();
      const endpoint = isSaved 
        ? `https://www.mealprep360.com/api/recipes/unsave/${params.id}`
        : 'https://www.mealprep360.com/api/recipes/save';
      
      const response = await fetch(endpoint, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: isSaved ? undefined : JSON.stringify({ recipeId: params.id }),
      });

      if (response.ok) {
        setIsSaved(!isSaved);
        
        // Update local storage
        const savedRecipes = await AsyncStorage.getItem('saved_recipes') || '[]';
        const parsed = JSON.parse(savedRecipes);
        if (isSaved) {
          const filtered = parsed.filter((id: string) => id !== params.id);
          await AsyncStorage.setItem('saved_recipes', JSON.stringify(filtered));
        } else {
          parsed.push(params.id);
          await AsyncStorage.setItem('saved_recipes', JSON.stringify(parsed));
        }
        
        Alert.alert('Success', isSaved ? 'Recipe removed from favorites' : 'Recipe saved to favorites!');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    
    try {
      await Share.share({
        message: `Check out this recipe: ${recipe.title}\n\nIngredients: ${recipe.ingredients.length}\nPrep Time: ${recipe.prepTime} min\nCook Time: ${recipe.cookTime} min\n\nFind more at MealPrep360!`,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleServingChange = (increment: boolean) => {
    const newSize = increment ? servingSize + 1 : Math.max(1, servingSize - 1);
    setServingSize(newSize);
  };

  const getScaledIngredient = (ingredient: Ingredient): string => {
    if (!recipe) return '';
    const scale = servingSize / recipe.servings;
    const scaledAmount = ingredient.amount * scale;
    
    // Round to reasonable precision
    const rounded = Math.round(scaledAmount * 100) / 100;
    return `${rounded} ${ingredient.unit} ${ingredient.name}${ingredient.isOptional ? ' (optional)' : ''}`;
  };

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const startTimer = (stepId: string, duration: number) => {
    // This would integrate with a timer component/service
    Alert.alert(
      'Timer Started',
      `Timer set for ${duration} minutes`,
      [{ text: 'OK' }]
    );
  };

  const renderHeader = () => {
    if (!recipe) return null;

    return (
      <View>
        <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSaveRecipe}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Text variant="h3" weight="bold" color={Colors.white}>
            {recipe.title}
          </Text>
          <Text variant="body2" color={Colors.white} customStyle={styles.description}>
            {recipe.description}
          </Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={20} color={Colors.white} />
              <Text variant="body2" color={Colors.white}>
                {recipe.prepTime + recipe.cookTime} min
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="restaurant-outline" size={20} color={Colors.white} />
              <Text variant="body2" color={Colors.white}>
                {recipe.difficulty}
              </Text>
            </View>
            {recipe.rating && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text variant="body2" color={Colors.white}>
                  {recipe.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.tagsContainer}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text variant="caption" color={Colors.white}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
        onPress={() => setActiveTab('ingredients')}
      >
        <Text
          variant="body1"
          weight={activeTab === 'ingredients' ? 'semibold' : 'regular'}
          color={activeTab === 'ingredients' ? Colors.primary : Colors.textSecondary}
        >
          Ingredients
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'instructions' && styles.activeTab]}
        onPress={() => setActiveTab('instructions')}
      >
        <Text
          variant="body1"
          weight={activeTab === 'instructions' ? 'semibold' : 'regular'}
          color={activeTab === 'instructions' ? Colors.primary : Colors.textSecondary}
        >
          Instructions
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]}
        onPress={() => setActiveTab('nutrition')}
      >
        <Text
          variant="body1"
          weight={activeTab === 'nutrition' ? 'semibold' : 'regular'}
          color={activeTab === 'nutrition' ? Colors.primary : Colors.textSecondary}
        >
          Nutrition
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderIngredients = () => {
    if (!recipe) return null;

    const groupedIngredients = recipe.ingredients.reduce((acc, ingredient) => {
      if (!acc[ingredient.category]) {
        acc[ingredient.category] = [];
      }
      acc[ingredient.category].push(ingredient);
      return acc;
    }, {} as Record<string, Ingredient[]>);

    return (
      <View style={styles.section}>
        <Card padding="medium" margin="small">
          <View style={styles.servingAdjuster}>
            <Text variant="h6" weight="semibold">
              Servings
            </Text>
            <View style={styles.servingControls}>
              <TouchableOpacity
                style={styles.servingButton}
                onPress={() => handleServingChange(false)}
              >
                <Ionicons name="remove" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Text variant="h6" weight="bold" customStyle={styles.servingText}>
                {servingSize}
              </Text>
              <TouchableOpacity
                style={styles.servingButton}
                onPress={() => handleServingChange(true)}
              >
                <Ionicons name="add" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {Object.entries(groupedIngredients).map(([category, ingredients]) => (
          <Card key={category} padding="medium" margin="small">
            <Text variant="body1" weight="semibold" color={Colors.primary} customStyle={styles.categoryTitle}>
              {category}
            </Text>
            {ingredients.map((ingredient) => (
              <View key={ingredient.id} style={styles.ingredientItem}>
                <View style={styles.ingredientCheckbox}>
                  <MaterialCommunityIcons
                    name="checkbox-blank-outline"
                    size={20}
                    color={Colors.gray400}
                  />
                </View>
                <Text variant="body1">
                  {getScaledIngredient(ingredient)}
                </Text>
              </View>
            ))}
          </Card>
        ))}

        <Button
          title="Add All to Shopping List"
          variant="primary"
          icon="cart-outline"
          fullWidth
          onPress={() => Alert.alert('Shopping List', 'Added all ingredients to shopping list!')}
          customStyle={styles.addToCartButton}
        />
      </View>
    );
  };

  const renderInstructions = () => {
    if (!recipe) return null;

    return (
      <View style={styles.section}>
        {recipe.instructions.map((step, index) => (
          <Card
            key={step.id}
                         padding="medium"
             margin="small"
             pressable
             onPress={() => toggleStepCompletion(step.id)}
             customStyle={completedSteps.has(step.id) ? styles.completedStep : undefined}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text variant="body2" weight="bold" color={Colors.white}>
                  {step.stepNumber}
                </Text>
              </View>
              <View style={styles.stepContent}>
                                 <Text
                   variant="body1"
                   customStyle={completedSteps.has(step.id) ? { ...styles.stepInstruction, ...styles.completedText } : styles.stepInstruction}
                 >
                  {step.instruction}
                </Text>
                
                {(step.duration || step.temperature) && (
                  <View style={styles.stepMeta}>
                    {step.duration && (
                      <TouchableOpacity
                        style={styles.timerButton}
                        onPress={() => startTimer(step.id, step.duration!)}
                      >
                        <Ionicons name="timer-outline" size={16} color={Colors.primary} />
                        <Text variant="caption" color={Colors.primary}>
                          {step.duration} min
                        </Text>
                      </TouchableOpacity>
                    )}
                    {step.temperature && (
                      <View style={styles.tempInfo}>
                        <Ionicons name="thermometer-outline" size={16} color={Colors.secondary} />
                        <Text variant="caption" color={Colors.secondary}>
                          {step.temperature}°F
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              {completedSteps.has(step.id) && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              )}
            </View>
          </Card>
        ))}

        <Card padding="medium" margin="small" variant="elevated">
          <View style={styles.cookingTips}>
            <Ionicons name="bulb-outline" size={24} color={Colors.warning} />
            <View style={styles.tipsContent}>
              <Text variant="body2" weight="semibold">
                Pro Tips
              </Text>
              <Text variant="caption" color={Colors.textSecondary}>
                • Prep all ingredients before starting
                • Read through all steps first
                • Have your tools ready
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const renderNutrition = () => {
    if (!recipe || !recipe.nutritionInfo) return null;

    const nutrition = recipe.nutritionInfo;
    const servingNutrition = {
      calories: Math.round(nutrition.calories * (servingSize / recipe.servings)),
      protein: Math.round(nutrition.protein * (servingSize / recipe.servings)),
      carbs: Math.round(nutrition.carbs * (servingSize / recipe.servings)),
      fat: Math.round(nutrition.fat * (servingSize / recipe.servings)),
      fiber: Math.round(nutrition.fiber * (servingSize / recipe.servings)),
      sugar: Math.round(nutrition.sugar * (servingSize / recipe.servings)),
      sodium: Math.round(nutrition.sodium * (servingSize / recipe.servings)),
    };

    return (
      <View style={styles.section}>
        <Card padding="medium" margin="small" variant="elevated">
          <Text variant="h6" weight="semibold" customStyle={styles.nutritionTitle}>
            Nutrition Facts
          </Text>
          <Text variant="caption" color={Colors.textSecondary}>
            Per serving ({servingSize} servings)
          </Text>
          
          <View style={styles.caloriesRow}>
            <Text variant="h4" weight="bold" color={Colors.primary}>
              {servingNutrition.calories}
            </Text>
            <Text variant="body1" color={Colors.textSecondary}>
              calories
            </Text>
          </View>

          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: Colors.protein }]} />
              <Text variant="h6" weight="bold">{servingNutrition.protein}g</Text>
              <Text variant="caption" color={Colors.textSecondary}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: Colors.carbs }]} />
              <Text variant="h6" weight="bold">{servingNutrition.carbs}g</Text>
              <Text variant="caption" color={Colors.textSecondary}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: Colors.secondary }]} />
              <Text variant="h6" weight="bold">{servingNutrition.fat}g</Text>
              <Text variant="caption" color={Colors.textSecondary}>Fat</Text>
            </View>
          </View>

          <View style={styles.nutritionDetails}>
            <View style={styles.nutritionRow}>
              <Text variant="body2">Fiber</Text>
              <Text variant="body2" weight="semibold">{servingNutrition.fiber}g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text variant="body2">Sugar</Text>
              <Text variant="body2" weight="semibold">{servingNutrition.sugar}g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text variant="body2">Sodium</Text>
              <Text variant="body2" weight="semibold">{servingNutrition.sodium}mg</Text>
            </View>
          </View>
        </Card>

        {recipe.dietaryRestrictions.length > 0 && (
          <Card padding="medium" margin="small">
            <Text variant="body1" weight="semibold" customStyle={styles.dietaryTitle}>
              Dietary Information
            </Text>
            <View style={styles.dietaryTags}>
              {recipe.dietaryRestrictions.map((restriction, index) => (
                <View key={index} style={styles.dietaryTag}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text variant="body2" color={Colors.text}>
                    {restriction}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'ingredients':
        return renderIngredients();
      case 'instructions':
        return renderInstructions();
      case 'nutrition':
        return renderNutrition();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Screen safeArea={false}>
        <Loading variant="spinner" size="large" fullScreen text="Loading recipe..." />
      </Screen>
    );
  }

  if (!recipe) {
    return (
      <Screen safeArea={false}>
        <View style={styles.errorContainer}>
          <Text variant="h6">Recipe not found</Text>
          <Button
            title="Go Back"
            variant="outline"
            onPress={() => router.back()}
            customStyle={styles.errorButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={false} padding="none" scrollable={false}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderTabs()}
        {renderContent()}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroImage: {
    width: width,
    height: 300,
    backgroundColor: Colors.gray200,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    right: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  description: {
    marginTop: Spacing.xs,
    opacity: 0.9,
  },
  metaContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.small,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  section: {
    paddingVertical: Spacing.md,
  },
  servingAdjuster: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  servingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingText: {
    minWidth: 30,
    textAlign: 'center',
  },
  categoryTitle: {
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  ingredientCheckbox: {
    width: 24,
  },
  addToCartButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    lineHeight: 24,
  },
  completedStep: {
    opacity: 0.7,
    backgroundColor: Colors.gray50,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  stepMeta: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
  },
  tempInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cookingTips: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tipsContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  nutritionTitle: {
    marginBottom: Spacing.xs,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  macroItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  macroBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  nutritionDetails: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  dietaryTitle: {
    marginBottom: Spacing.md,
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dietaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  errorButton: {
    minWidth: 120,
  },
  bottomPadding: {
    height: 100,
  },
});