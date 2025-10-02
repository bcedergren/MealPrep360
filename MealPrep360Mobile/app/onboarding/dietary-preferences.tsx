import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, Input, Text } from '../../src/components/ui';
import { Theme } from '../../src/constants/theme';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { DietaryPreferencesStepData } from '../../src/types/onboarding';

interface DietaryRestriction {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface CuisineOption {
  id: string;
  title: string;
  flag: string;
}

const DIETARY_RESTRICTIONS: DietaryRestriction[] = [
  {
    id: 'vegetarian',
    title: 'Vegetarian',
    description: 'No meat, poultry, or fish',
    icon: 'leaf',
  },
  {
    id: 'vegan',
    title: 'Vegan',
    description: 'No animal products',
    icon: 'leaf-outline',
  },
  {
    id: 'gluten-free',
    title: 'Gluten-Free',
    description: 'No wheat, barley, or rye',
    icon: 'ban',
  },
  {
    id: 'dairy-free',
    title: 'Dairy-Free',
    description: 'No milk or dairy products',
    icon: 'close-circle',
  },
  {
    id: 'nut-free',
    title: 'Nut-Free',
    description: 'No nuts or tree nuts',
    icon: 'warning',
  },
  {
    id: 'low-carb',
    title: 'Low Carb',
    description: 'Minimal carbohydrates',
    icon: 'fitness',
  },
  {
    id: 'keto',
    title: 'Ketogenic',
    description: 'Very low carb, high fat',
    icon: 'flame',
  },
  {
    id: 'paleo',
    title: 'Paleo',
    description: 'Whole foods, no processed foods',
    icon: 'earth',
  },
  {
    id: 'mediterranean',
    title: 'Mediterranean',
    description: 'Fish, olive oil, whole grains',
    icon: 'restaurant',
  },
  {
    id: 'halal',
    title: 'Halal',
    description: 'Islamic dietary guidelines',
    icon: 'moon',
  },
  {
    id: 'kosher',
    title: 'Kosher',
    description: 'Jewish dietary guidelines',
    icon: 'star',
  },
];

const CUISINE_OPTIONS: CuisineOption[] = [
  { id: 'american', title: 'American', flag: '🇺🇸' },
  { id: 'italian', title: 'Italian', flag: '🇮🇹' },
  { id: 'mexican', title: 'Mexican', flag: '🇲🇽' },
  { id: 'chinese', title: 'Chinese', flag: '🇨🇳' },
  { id: 'japanese', title: 'Japanese', flag: '🇯🇵' },
  { id: 'indian', title: 'Indian', flag: '🇮🇳' },
  { id: 'thai', title: 'Thai', flag: '🇹🇭' },
  { id: 'french', title: 'French', flag: '🇫🇷' },
  { id: 'greek', title: 'Greek', flag: '🇬🇷' },
  { id: 'korean', title: 'Korean', flag: '🇰🇷' },
  { id: 'mediterranean', title: 'Mediterranean', flag: '🌊' },
  { id: 'middle-eastern', title: 'Middle Eastern', flag: '🏛️' },
];

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree nuts (almonds, walnuts, etc.)',
  'Milk/Dairy',
  'Eggs',
  'Soy',
  'Wheat/Gluten',
  'Fish',
  'Shellfish',
  'Sesame',
];

const MEAL_TYPES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

export default function DietaryPreferencesScreen() {
  const { updateStepData, completeStep, stepData, getValidationErrors } = useOnboarding();
  
  // Dietary restrictions
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    stepData.dietaryPreferences?.restrictions || []
  );
  
  // Allergies
  const [allergies, setAllergies] = useState<DietaryPreferencesStepData['allergies']>(
    stepData.dietaryPreferences?.allergies || []
  );
  const [newAllergyName, setNewAllergyName] = useState('');
  const [newAllergySeverity, setNewAllergySeverity] = useState<'mild' | 'moderate' | 'severe' | 'life-threatening'>('moderate');
  
  // Cuisine preferences
  const [cuisinePreferences, setCuisinePreferences] = useState<DietaryPreferencesStepData['cuisinePreferences']>(
    stepData.dietaryPreferences?.cuisinePreferences || []
  );
  
  // Avoided and preferred ingredients
  const [avoidedIngredients, setAvoidedIngredients] = useState<string[]>(
    stepData.dietaryPreferences?.avoidedIngredients || []
  );
  const [preferredIngredients, setPreferredIngredients] = useState<string[]>(
    stepData.dietaryPreferences?.preferredIngredients || []
  );
  const [newAvoidedIngredient, setNewAvoidedIngredient] = useState('');
  const [newPreferredIngredient, setNewPreferredIngredient] = useState('');
  
  // Macro targets
  const [hasCustomMacros, setHasCustomMacros] = useState(
    stepData.dietaryPreferences?.macroTargets !== undefined
  );
  const [proteinPercentage, setProteinPercentage] = useState(
    stepData.dietaryPreferences?.macroTargets?.percentages?.protein?.toString() || '30'
  );
  const [carbsPercentage, setCarbsPercentage] = useState(
    stepData.dietaryPreferences?.macroTargets?.percentages?.carbs?.toString() || '40'
  );
  const [fatPercentage, setFatPercentage] = useState(
    stepData.dietaryPreferences?.macroTargets?.percentages?.fat?.toString() || '30'
  );
  
  // Calorie target
  const [hasCalorieTarget, setHasCalorieTarget] = useState(
    stepData.dietaryPreferences?.calorieTarget !== undefined
  );
  const [calorieTarget, setCalorieTarget] = useState(
    stepData.dietaryPreferences?.calorieTarget?.toString() || '2000'
  );
  
  // Meal preferences
  const [mealPreferences, setMealPreferences] = useState<DietaryPreferencesStepData['mealPreferences']>(
    stepData.dietaryPreferences?.mealPreferences || []
  );

  // Auto-save on field changes
  useEffect(() => {
    const dietaryPreferencesData: DietaryPreferencesStepData = {
      restrictions: selectedRestrictions,
      allergies,
      cuisinePreferences,
      avoidedIngredients,
      preferredIngredients,
      macroTargets: hasCustomMacros ? {
        protein: 0, // Will be calculated
        carbs: 0,   // Will be calculated
        fat: 0,     // Will be calculated
        percentages: {
          protein: parseFloat(proteinPercentage) || 30,
          carbs: parseFloat(carbsPercentage) || 40,
          fat: parseFloat(fatPercentage) || 30,
        },
      } : undefined,
      calorieTarget: hasCalorieTarget ? parseFloat(calorieTarget) || undefined : undefined,
      mealPreferences,
    };

    updateStepData('dietary-preferences', dietaryPreferencesData);
  }, [
    selectedRestrictions, allergies, cuisinePreferences,
    avoidedIngredients, preferredIngredients,
    hasCustomMacros, proteinPercentage, carbsPercentage, fatPercentage,
    hasCalorieTarget, calorieTarget, mealPreferences,
    updateStepData
  ]);

  const handleContinue = async () => {
    const dietaryPreferencesData: DietaryPreferencesStepData = {
      restrictions: selectedRestrictions,
      allergies,
      cuisinePreferences,
      avoidedIngredients,
      preferredIngredients,
      macroTargets: hasCustomMacros ? {
        protein: 0, // Will be calculated based on calorie target
        carbs: 0,   // Will be calculated based on calorie target
        fat: 0,     // Will be calculated based on calorie target
        percentages: {
          protein: parseFloat(proteinPercentage) || 30,
          carbs: parseFloat(carbsPercentage) || 40,
          fat: parseFloat(fatPercentage) || 30,
        },
      } : undefined,
      calorieTarget: hasCalorieTarget ? parseFloat(calorieTarget) || undefined : undefined,
      mealPreferences,
    };

    await completeStep('dietary-preferences', dietaryPreferencesData);
  };

  const toggleRestriction = (restrictionId: string) => {
    setSelectedRestrictions(prev => 
      prev.includes(restrictionId)
        ? prev.filter(id => id !== restrictionId)
        : [...prev, restrictionId]
    );
  };

  const addAllergy = () => {
    if (newAllergyName.trim()) {
      setAllergies(prev => [
        ...prev,
        {
          name: newAllergyName.trim(),
          severity: newAllergySeverity,
          description: undefined,
        }
      ]);
      setNewAllergyName('');
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(prev => prev.filter((_, i) => i !== index));
  };

  const updateCuisinePreference = (cuisineId: string, preference: 'love' | 'like' | 'neutral' | 'dislike' | 'hate') => {
    setCuisinePreferences(prev => {
      const existing = prev.findIndex(cp => cp.cuisine === cuisineId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { cuisine: cuisineId, preference };
        return updated;
      } else {
        return [...prev, { cuisine: cuisineId, preference }];
      }
    });
  };

  const addAvoidedIngredient = () => {
    if (newAvoidedIngredient.trim() && !avoidedIngredients.includes(newAvoidedIngredient.trim())) {
      setAvoidedIngredients(prev => [...prev, newAvoidedIngredient.trim()]);
      setNewAvoidedIngredient('');
    }
  };

  const removeAvoidedIngredient = (ingredient: string) => {
    setAvoidedIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const addPreferredIngredient = () => {
    if (newPreferredIngredient.trim() && !preferredIngredients.includes(newPreferredIngredient.trim())) {
      setPreferredIngredients(prev => [...prev, newPreferredIngredient.trim()]);
      setNewPreferredIngredient('');
    }
  };

  const removePreferredIngredient = (ingredient: string) => {
    setPreferredIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const getMacroTotal = () => {
    return parseFloat(proteinPercentage || '0') + parseFloat(carbsPercentage || '0') + parseFloat(fatPercentage || '0');
  };

  const macroTotal = getMacroTotal();
  const isMacroValid = Math.abs(macroTotal - 100) < 0.1;

  const validationErrors = getValidationErrors('dietary-preferences');
  const canContinue = !hasCustomMacros || isMacroValid;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" style={styles.title}>
            Dietary Preferences
          </Text>
          <Text variant="body1" style={styles.subtitle}>
            Tell us about your dietary needs and food preferences so we can create personalized meal plans.
          </Text>
        </View>

        {/* Dietary Restrictions */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Dietary Restrictions (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Select any dietary restrictions that apply to you.
          </Text>
          
          <View style={styles.restrictionGrid}>
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <TouchableOpacity
                key={restriction.id}
                onPress={() => toggleRestriction(restriction.id)}
                style={[
                  styles.restrictionOption,
                  selectedRestrictions.includes(restriction.id) && styles.selectedRestrictionOption,
                ]}
              >
                <Ionicons 
                  name={restriction.icon as any} 
                  size={20} 
                  color={selectedRestrictions.includes(restriction.id) ? Theme.colors.primary : Theme.colors.gray600} 
                />
                <View style={styles.restrictionContent}>
                  <Text variant="body2" style={[
                    styles.restrictionTitle,
                    selectedRestrictions.includes(restriction.id) && styles.selectedRestrictionText,
                  ]}>
                    {restriction.title}
                  </Text>
                  <Text variant="caption" style={[
                    styles.restrictionDescription,
                    selectedRestrictions.includes(restriction.id) && styles.selectedRestrictionText,
                  ]}>
                    {restriction.description}
                  </Text>
                </View>
                {selectedRestrictions.includes(restriction.id) && (
                  <Ionicons name="checkmark" size={16} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Food Allergies */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Food Allergies (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Add any food allergies to ensure we avoid these ingredients in your meal plans.
          </Text>
          
          {/* Quick add common allergies */}
          <View style={styles.commonAllergies}>
            {COMMON_ALLERGIES.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                onPress={() => {
                  if (!allergies.some(a => a.name.toLowerCase() === allergy.toLowerCase())) {
                    setAllergies(prev => [...prev, {
                      name: allergy,
                      severity: 'moderate',
                      description: undefined,
                    }]);
                  }
                }}
                style={[
                  styles.commonAllergyOption,
                  allergies.some(a => a.name.toLowerCase() === allergy.toLowerCase()) && styles.selectedCommonAllergy,
                ]}
              >
                <Text style={[
                  styles.commonAllergyText,
                  allergies.some(a => a.name.toLowerCase() === allergy.toLowerCase()) && styles.selectedCommonAllergyText,
                ]}>
                  {allergy}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom allergy input */}
          <View style={styles.addAllergyContainer}>
            <Input
              label="Add Custom Allergy"
              value={newAllergyName}
              onChangeText={setNewAllergyName}
              placeholder="e.g., Coconut"
              style={styles.allergyInput}
            />
            <View style={styles.severityToggle}>
              {(['mild', 'moderate', 'severe', 'life-threatening'] as const).map((severity) => (
                <TouchableOpacity
                  key={severity}
                  onPress={() => setNewAllergySeverity(severity)}
                  style={[
                    styles.severityButton,
                    newAllergySeverity === severity && styles.selectedSeverityButton,
                  ]}
                >
                  <Text style={[
                    styles.severityButtonText,
                    newAllergySeverity === severity && styles.selectedSeverityText,
                  ]}>
                    {severity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="Add Allergy"
              onPress={addAllergy}
              disabled={!newAllergyName.trim()}
              variant="outline"
              size="medium"
            />
          </View>

          {/* Current allergies list */}
          {allergies.length > 0 && (
            <View style={styles.allergiesList}>
              <Text variant="h5" style={styles.allergiesListTitle}>
                Your Allergies:
              </Text>
              {allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyItem}>
                  <View style={styles.allergyInfo}>
                    <Text variant="body2" style={styles.allergyName}>
                      {allergy.name}
                    </Text>
                    <Text variant="caption" style={[
                      styles.allergySeverity,
                      { color: allergy.severity === 'life-threatening' ? Theme.colors.error : Theme.colors.gray600 }
                    ]}>
                      {allergy.severity}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeAllergy(index)}>
                    <Ionicons name="close-circle" size={20} color={Theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Cuisine Preferences */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Cuisine Preferences (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Rate your favorite cuisines to get more personalized recipe suggestions.
          </Text>
          
          <View style={styles.cuisineGrid}>
            {CUISINE_OPTIONS.map((cuisine) => {
              const preference = cuisinePreferences.find(cp => cp.cuisine === cuisine.id)?.preference || 'neutral';
              return (
                <View key={cuisine.id} style={styles.cuisineItem}>
                  <View style={styles.cuisineHeader}>
                    <Text style={styles.cuisineFlag}>{cuisine.flag}</Text>
                    <Text variant="body2" style={styles.cuisineTitle}>
                      {cuisine.title}
                    </Text>
                  </View>
                  <View style={styles.preferenceButtons}>
                    {(['love', 'like', 'neutral', 'dislike'] as const).map((pref) => (
                      <TouchableOpacity
                        key={pref}
                        onPress={() => updateCuisinePreference(cuisine.id, pref)}
                        style={[
                          styles.preferenceButton,
                          preference === pref && styles.selectedPreferenceButton,
                        ]}
                      >
                        <Ionicons 
                          name={
                            pref === 'love' ? 'heart' :
                            pref === 'like' ? 'thumbs-up' :
                            pref === 'neutral' ? 'remove' :
                            'thumbs-down'
                          } 
                          size={16} 
                          color={preference === pref ? Theme.colors.white : Theme.colors.gray600} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Ingredients to Avoid */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Ingredients to Avoid (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            List specific ingredients you prefer to avoid in recipes.
          </Text>
          
          <View style={styles.addIngredientContainer}>
            <Input
              value={newAvoidedIngredient}
              onChangeText={setNewAvoidedIngredient}
              placeholder="e.g., Cilantro, Mushrooms"
              style={styles.ingredientInput}
            />
            <Button
              title="Add"
              onPress={addAvoidedIngredient}
              disabled={!newAvoidedIngredient.trim()}
              variant="outline"
              size="medium"
            />
          </View>

          {avoidedIngredients.length > 0 && (
            <View style={styles.ingredientsList}>
              {avoidedIngredients.map((ingredient) => (
                <View key={ingredient} style={styles.ingredientTag}>
                  <Text style={styles.ingredientTagText}>{ingredient}</Text>
                  <TouchableOpacity onPress={() => removeAvoidedIngredient(ingredient)}>
                    <Ionicons name="close" size={16} color={Theme.colors.gray600} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Preferred Ingredients */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Preferred Ingredients (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            List ingredients you love and want to see more often in recipes.
          </Text>
          
          <View style={styles.addIngredientContainer}>
            <Input
              value={newPreferredIngredient}
              onChangeText={setNewPreferredIngredient}
              placeholder="e.g., Avocado, Salmon"
              style={styles.ingredientInput}
            />
            <Button
              title="Add"
              onPress={addPreferredIngredient}
              disabled={!newPreferredIngredient.trim()}
              variant="outline"
              size="medium"
            />
          </View>

          {preferredIngredients.length > 0 && (
            <View style={styles.ingredientsList}>
              {preferredIngredients.map((ingredient) => (
                <View key={ingredient} style={styles.ingredientTag}>
                  <Text style={styles.ingredientTagText}>{ingredient}</Text>
                  <TouchableOpacity onPress={() => removePreferredIngredient(ingredient)}>
                    <Ionicons name="close" size={16} color={Theme.colors.gray600} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Calorie Target */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Daily Calorie Target (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Set a daily calorie goal for your meal plans.
          </Text>
          
          <View style={styles.calorieToggle}>
            <TouchableOpacity
              onPress={() => setHasCalorieTarget(false)}
              style={[
                styles.toggleButton,
                !hasCalorieTarget && styles.selectedToggleButton,
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                !hasCalorieTarget && styles.selectedToggleText,
              ]}>
                Auto-calculate
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setHasCalorieTarget(true)}
              style={[
                styles.toggleButton,
                hasCalorieTarget && styles.selectedToggleButton,
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                hasCalorieTarget && styles.selectedToggleText,
              ]}>
                Custom target
              </Text>
            </TouchableOpacity>
          </View>

          {hasCalorieTarget && (
            <Input
              label="Daily Calories"
              value={calorieTarget}
              onChangeText={setCalorieTarget}
              placeholder="2000"
              keyboardType="numeric"
            />
          )}
        </Card>

        {/* Macro Targets */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Macronutrient Targets (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Customize your protein, carbs, and fat targets as percentages.
          </Text>
          
          <View style={styles.macroToggle}>
            <TouchableOpacity
              onPress={() => setHasCustomMacros(false)}
              style={[
                styles.toggleButton,
                !hasCustomMacros && styles.selectedToggleButton,
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                !hasCustomMacros && styles.selectedToggleText,
              ]}>
                Recommended
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setHasCustomMacros(true)}
              style={[
                styles.toggleButton,
                hasCustomMacros && styles.selectedToggleButton,
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                hasCustomMacros && styles.selectedToggleText,
              ]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {hasCustomMacros && (
            <View style={styles.macroInputs}>
              <View style={styles.macroRow}>
                <Input
                  label="Protein %"
                  value={proteinPercentage}
                  onChangeText={setProteinPercentage}
                  placeholder="30"
                  keyboardType="numeric"
                  style={styles.macroInput}
                />
                <Input
                  label="Carbs %"
                  value={carbsPercentage}
                  onChangeText={setCarbsPercentage}
                  placeholder="40"
                  keyboardType="numeric"
                  style={styles.macroInput}
                />
                <Input
                  label="Fat %"
                  value={fatPercentage}
                  onChangeText={setFatPercentage}
                  placeholder="30"
                  keyboardType="numeric"
                  style={styles.macroInput}
                />
              </View>
              
              <View style={[
                styles.macroTotal,
                !isMacroValid && styles.macroTotalError,
              ]}>
                <Text variant="body2" style={[
                  styles.macroTotalText,
                  !isMacroValid && styles.macroTotalErrorText,
                ]}>
                  Total: {macroTotal.toFixed(1)}% {isMacroValid ? '✓' : '(Must equal 100%)'}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Card style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={20} color={Theme.colors.error} />
              <Text variant="h5" style={styles.errorTitle}>
                Please fix the following:
              </Text>
            </View>
            {validationErrors.map((error, index) => (
              <Text key={index} variant="body2" style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </Card>
        )}

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!canContinue}
            size="large"
            style={styles.continueButton}
          />
          
          {!canContinue && (
            <Text variant="caption" style={styles.helpText}>
              Please ensure macro percentages add up to 100%
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.white,
  },
  content: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  header: {
    paddingVertical: Theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    color: Theme.colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    color: Theme.colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.sm,
  },
  sectionDescription: {
    color: Theme.colors.gray600,
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
  },
  restrictionGrid: {
    gap: Theme.spacing.sm,
  },
  restrictionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedRestrictionOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  restrictionContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  restrictionTitle: {
    color: Theme.colors.text,
    fontWeight: '500',
  },
  restrictionDescription: {
    color: Theme.colors.gray500,
    marginTop: 2,
  },
  selectedRestrictionText: {
    color: Theme.colors.primary,
  },
  commonAllergies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  commonAllergyOption: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.white,
  },
  selectedCommonAllergy: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '10',
  },
  commonAllergyText: {
    color: Theme.colors.text,
    fontSize: 14,
  },
  selectedCommonAllergyText: {
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  addAllergyContainer: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  allergyInput: {
    flex: 1,
  },
  severityToggle: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.md,
    padding: 2,
  },
  severityButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  selectedSeverityButton: {
    backgroundColor: Theme.colors.primary,
  },
  severityButtonText: {
    color: Theme.colors.gray600,
    fontSize: 12,
    fontWeight: '500',
  },
  selectedSeverityText: {
    color: Theme.colors.white,
  },
  allergiesList: {
    marginTop: Theme.spacing.md,
  },
  allergiesListTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.sm,
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
  },
  allergyInfo: {
    flex: 1,
  },
  allergyName: {
    color: Theme.colors.text,
    fontWeight: '500',
  },
  allergySeverity: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  cuisineGrid: {
    gap: Theme.spacing.md,
  },
  cuisineItem: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  cuisineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  cuisineFlag: {
    fontSize: 20,
    marginRight: Theme.spacing.sm,
  },
  cuisineTitle: {
    color: Theme.colors.text,
    fontWeight: '500',
  },
  preferenceButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  preferenceButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  selectedPreferenceButton: {
    backgroundColor: Theme.colors.primary,
  },
  addIngredientContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    alignItems: 'flex-end',
    marginBottom: Theme.spacing.md,
  },
  ingredientInput: {
    flex: 1,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Theme.colors.primary + '15',
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.xs,
  },
  ingredientTagText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  calorieToggle: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.md,
    padding: 2,
  },
  macroToggle: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.md,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  selectedToggleButton: {
    backgroundColor: Theme.colors.primary,
  },
  toggleButtonText: {
    color: Theme.colors.gray600,
    fontWeight: '500',
  },
  selectedToggleText: {
    color: Theme.colors.white,
  },
  macroInputs: {
    gap: Theme.spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  macroInput: {
    flex: 1,
  },
  macroTotal: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.success + '15',
    borderRadius: Theme.borderRadius.md,
  },
  macroTotalError: {
    backgroundColor: Theme.colors.error + '15',
  },
  macroTotalText: {
    color: Theme.colors.success,
    fontWeight: '500',
  },
  macroTotalErrorText: {
    color: Theme.colors.error,
  },
  errorCard: {
    backgroundColor: Theme.colors.error + '10',
    borderWidth: 1,
    borderColor: Theme.colors.error + '30',
    marginBottom: Theme.spacing.lg,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  errorTitle: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.error,
    fontWeight: '600',
  },
  errorText: {
    color: Theme.colors.error,
    marginLeft: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  continueButton: {
    width: '100%',
    marginBottom: Theme.spacing.md,
  },
  helpText: {
    color: Theme.colors.gray500,
    textAlign: 'center',
  },
});