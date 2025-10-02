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
import { CookingPreferencesStepData } from '../../src/types/onboarding';

interface SkillLevelOption {
  id: CookingPreferencesStepData['skillLevel'];
  title: string;
  description: string;
  icon: string;
}

interface CookingMethodOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface DifficultyOption {
  id: CookingPreferencesStepData['difficultyPreference'];
  title: string;
  description: string;
}

interface BudgetOption {
  id: CookingPreferencesStepData['budgetPreference'];
  title: string;
  description: string;
  icon: string;
}

interface MealPrepFrequencyOption {
  id: CookingPreferencesStepData['mealPrepFrequency'];
  title: string;
  description: string;
}

const SKILL_LEVELS: SkillLevelOption[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to cooking, prefer simple recipes',
    icon: 'leaf',
  },
  {
    id: 'novice',
    title: 'Novice',
    description: 'Can follow basic recipes confidently',
    icon: 'book',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Comfortable with most cooking techniques',
    icon: 'restaurant',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Skilled cook, enjoy complex recipes',
    icon: 'trophy',
  },
  {
    id: 'expert',
    title: 'Expert',
    description: 'Professional level, create own recipes',
    icon: 'star',
  },
];

const COOKING_METHODS: CookingMethodOption[] = [
  {
    id: 'baking',
    title: 'Baking',
    description: 'Oven-based cooking',
    icon: 'home',
  },
  {
    id: 'grilling',
    title: 'Grilling',
    description: 'BBQ and grill cooking',
    icon: 'flame',
  },
  {
    id: 'sautéing',
    title: 'Sautéing',
    description: 'Pan cooking with oil',
    icon: 'restaurant',
  },
  {
    id: 'steaming',
    title: 'Steaming',
    description: 'Healthy steam cooking',
    icon: 'cloud',
  },
  {
    id: 'roasting',
    title: 'Roasting',
    description: 'High-heat oven cooking',
    icon: 'bonfire',
  },
  {
    id: 'slow-cooking',
    title: 'Slow Cooking',
    description: 'Low and slow cooking',
    icon: 'time',
  },
  {
    id: 'stir-frying',
    title: 'Stir Frying',
    description: 'High-heat quick cooking',
    icon: 'flash',
  },
  {
    id: 'braising',
    title: 'Braising',
    description: 'Combination wet/dry heat',
    icon: 'water',
  },
  {
    id: 'air-frying',
    title: 'Air Frying',
    description: 'Convection air cooking',
    icon: 'sunny',
  },
  {
    id: 'pressure-cooking',
    title: 'Pressure Cooking',
    description: 'Fast pressure cooking',
    icon: 'speedometer',
  },
];

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'easy-only',
    title: 'Easy Only',
    description: 'Simple recipes with minimal steps',
  },
  {
    id: 'mostly-easy',
    title: 'Mostly Easy',
    description: 'Prefer simple with occasional challenge',
  },
  {
    id: 'mixed',
    title: 'Mixed',
    description: 'Comfortable with various difficulty levels',
  },
  {
    id: 'challenging',
    title: 'Challenging',
    description: 'Enjoy complex, multi-step recipes',
  },
  {
    id: 'expert-level',
    title: 'Expert Level',
    description: 'Advanced techniques and ingredients',
  },
];

const BUDGET_OPTIONS: BudgetOption[] = [
  {
    id: 'budget',
    title: 'Budget',
    description: 'Cost-effective ingredients and meals',
    icon: 'wallet',
  },
  {
    id: 'moderate',
    title: 'Moderate',
    description: 'Balance of quality and affordability',
    icon: 'card',
  },
  {
    id: 'premium',
    title: 'Premium',
    description: 'High-quality ingredients, specialty items',
    icon: 'diamond',
  },
  {
    id: 'luxury',
    title: 'Luxury',
    description: 'No budget constraints, finest ingredients',
    icon: 'star',
  },
];

const MEAL_PREP_FREQUENCIES: MealPrepFrequencyOption[] = [
  {
    id: 'daily',
    title: 'Daily',
    description: 'Cook fresh meals every day',
  },
  {
    id: 'every-other-day',
    title: 'Every Other Day',
    description: 'Cook every 2 days',
  },
  {
    id: 'twice-weekly',
    title: 'Twice Weekly',
    description: 'Two cooking sessions per week',
  },
  {
    id: 'weekly',
    title: 'Weekly',
    description: 'One big cooking session per week',
  },
  {
    id: 'bi-weekly',
    title: 'Bi-weekly',
    description: 'Cook every two weeks',
  },
  {
    id: 'monthly',
    title: 'Monthly',
    description: 'Monthly meal prep sessions',
  },
];

const COOKING_STYLES = [
  'Quick & Easy',
  'Comfort Food',
  'Healthy & Light',
  'International',
  'Gourmet',
  'One-Pot Meals',
  'Meal Prep Friendly',
  'Family Style',
  'Seasonal Cooking',
  'Fusion',
];

const PORTION_SIZE_OPTIONS = [
  { id: 'small', title: 'Small', description: 'Lighter portions' },
  { id: 'medium', title: 'Medium', description: 'Standard portions' },
  { id: 'large', title: 'Large', description: 'Hearty portions' },
  { id: 'extra-large', title: 'Extra Large', description: 'Very generous portions' },
];

const LEFTOVER_PREFERENCES = [
  { id: 'love', title: 'Love', description: 'Great for meal prep', icon: 'heart' },
  { id: 'tolerate', title: 'Tolerate', description: 'Okay with leftovers', icon: 'thumbs-up' },
  { id: 'avoid', title: 'Avoid', description: 'Prefer fresh meals', icon: 'thumbs-down' },
  { id: 'hate', title: 'Hate', description: 'Never want leftovers', icon: 'close' },
];

export default function CookingPreferencesScreen() {
  const { updateStepData, completeStep, stepData, getValidationErrors } = useOnboarding();
  
  const [skillLevel, setSkillLevel] = useState<CookingPreferencesStepData['skillLevel']>(
    stepData.cookingPreferences?.skillLevel || 'intermediate'
  );
  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    stepData.cookingPreferences?.preferredCookingMethods || []
  );
  const [maxCookingTime, setMaxCookingTime] = useState(
    stepData.cookingPreferences?.maxCookingTime?.toString() || '60'
  );
  const [maxPrepTime, setMaxPrepTime] = useState(
    stepData.cookingPreferences?.maxPrepTime?.toString() || '30'
  );
  const [difficultyPreference, setDifficultyPreference] = useState<CookingPreferencesStepData['difficultyPreference']>(
    stepData.cookingPreferences?.difficultyPreference || 'mixed'
  );
  const [budgetPreference, setBudgetPreference] = useState<CookingPreferencesStepData['budgetPreference']>(
    stepData.cookingPreferences?.budgetPreference || 'moderate'
  );
  const [mealPrepFrequency, setMealPrepFrequency] = useState<CookingPreferencesStepData['mealPrepFrequency']>(
    stepData.cookingPreferences?.mealPrepFrequency || 'weekly'
  );
  
  // Serving preferences
  const [defaultServings, setDefaultServings] = useState(
    stepData.cookingPreferences?.servingPreferences?.defaultServings?.toString() || '4'
  );
  const [householdSize, setHouseholdSize] = useState(
    stepData.cookingPreferences?.servingPreferences?.householdSize?.toString() || '2'
  );
  const [leftoverPreference, setLeftoverPreference] = useState<'love' | 'tolerate' | 'avoid' | 'hate'>(
    stepData.cookingPreferences?.servingPreferences?.leftoverPreference || 'tolerate'
  );
  const [portionSize, setPortionSize] = useState<'small' | 'medium' | 'large' | 'extra-large'>(
    stepData.cookingPreferences?.servingPreferences?.portionSizePreference || 'medium'
  );
  
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    stepData.cookingPreferences?.cookingStyles || []
  );

  // Auto-save on field changes
  useEffect(() => {
    const cookingPreferencesData: CookingPreferencesStepData = {
      skillLevel,
      preferredCookingMethods: selectedMethods,
      maxCookingTime: parseInt(maxCookingTime) || 60,
      maxPrepTime: parseInt(maxPrepTime) || 30,
      difficultyPreference,
      budgetPreference,
      mealPrepFrequency,
      servingPreferences: {
        defaultServings: parseInt(defaultServings) || 4,
        householdSize: parseInt(householdSize) || 2,
        leftoverPreference,
        portionSizePreference: portionSize,
      },
      cookingStyles: selectedStyles,
    };

    updateStepData('cooking-preferences', cookingPreferencesData);
  }, [
    skillLevel, selectedMethods, maxCookingTime, maxPrepTime,
    difficultyPreference, budgetPreference, mealPrepFrequency,
    defaultServings, householdSize, leftoverPreference, portionSize,
    selectedStyles, updateStepData
  ]);

  const handleContinue = async () => {
    const cookingPreferencesData: CookingPreferencesStepData = {
      skillLevel,
      preferredCookingMethods: selectedMethods,
      maxCookingTime: parseInt(maxCookingTime) || 60,
      maxPrepTime: parseInt(maxPrepTime) || 30,
      difficultyPreference,
      budgetPreference,
      mealPrepFrequency,
      servingPreferences: {
        defaultServings: parseInt(defaultServings) || 4,
        householdSize: parseInt(householdSize) || 2,
        leftoverPreference,
        portionSizePreference: portionSize,
      },
      cookingStyles: selectedStyles,
    };

    await completeStep('cooking-preferences', cookingPreferencesData);
  };

  const toggleMethod = (methodId: string) => {
    setSelectedMethods(prev => 
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const validationErrors = getValidationErrors('cooking-preferences');
  const canContinue = skillLevel && parseInt(maxCookingTime) >= 5 && parseInt(maxPrepTime) >= 5;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" style={styles.title}>
            Cooking Preferences
          </Text>
          <Text variant="body1" style={styles.subtitle}>
            Tell us about your cooking style and preferences to get recipes that match your skill level and lifestyle.
          </Text>
        </View>

        {/* Skill Level */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Cooking Skill Level
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            This helps us suggest recipes appropriate for your experience level.
          </Text>
          
          <View style={styles.skillLevels}>
            {SKILL_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => setSkillLevel(level.id)}
                style={[
                  styles.skillLevel,
                  skillLevel === level.id && styles.selectedSkillLevel,
                ]}
              >
                <Ionicons 
                  name={level.icon as any} 
                  size={24} 
                  color={skillLevel === level.id ? Theme.colors.primary : Theme.colors.gray600} 
                />
                <View style={styles.skillLevelContent}>
                  <Text variant="h5" style={[
                    styles.skillLevelTitle,
                    skillLevel === level.id && styles.selectedSkillText,
                  ]}>
                    {level.title}
                  </Text>
                  <Text variant="body2" style={[
                    styles.skillLevelDescription,
                    skillLevel === level.id && styles.selectedSkillText,
                  ]}>
                    {level.description}
                  </Text>
                </View>
                {skillLevel === level.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Cooking Methods */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Preferred Cooking Methods
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Select the cooking methods you enjoy or want to learn. We'll suggest recipes that use these techniques.
          </Text>
          
          <View style={styles.methodGrid}>
            {COOKING_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                onPress={() => toggleMethod(method.id)}
                style={[
                  styles.methodOption,
                  selectedMethods.includes(method.id) && styles.selectedMethodOption,
                ]}
              >
                <Ionicons 
                  name={method.icon as any} 
                  size={20} 
                  color={selectedMethods.includes(method.id) ? Theme.colors.primary : Theme.colors.gray600} 
                />
                <View style={styles.methodContent}>
                  <Text variant="body2" style={[
                    styles.methodTitle,
                    selectedMethods.includes(method.id) && styles.selectedMethodText,
                  ]}>
                    {method.title}
                  </Text>
                  <Text variant="caption" style={[
                    styles.methodDescription,
                    selectedMethods.includes(method.id) && styles.selectedMethodText,
                  ]}>
                    {method.description}
                  </Text>
                </View>
                {selectedMethods.includes(method.id) && (
                  <Ionicons name="checkmark" size={16} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Time Preferences */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Time Preferences
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Set your maximum time limits for cooking and prep work.
          </Text>
          
          <View style={styles.timeInputs}>
            <Input
              label="Max Cooking Time (minutes)"
              value={maxCookingTime}
              onChangeText={setMaxCookingTime}
              placeholder="60"
              keyboardType="numeric"
              style={styles.timeInput}
              helperText="Total active cooking time"
            />
            <Input
              label="Max Prep Time (minutes)"
              value={maxPrepTime}
              onChangeText={setMaxPrepTime}
              placeholder="30"
              keyboardType="numeric"
              style={styles.timeInput}
              helperText="Time for chopping, measuring, etc."
            />
          </View>
        </Card>

        {/* Difficulty Preference */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Recipe Difficulty Preference
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            How challenging do you want your recipes to be?
          </Text>
          
          <View style={styles.difficultyOptions}>
            {DIFFICULTY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setDifficultyPreference(option.id)}
                style={[
                  styles.difficultyOption,
                  difficultyPreference === option.id && styles.selectedDifficultyOption,
                ]}
              >
                <View style={styles.difficultyContent}>
                  <Text variant="h5" style={[
                    styles.difficultyTitle,
                    difficultyPreference === option.id && styles.selectedDifficultyText,
                  ]}>
                    {option.title}
                  </Text>
                  <Text variant="body2" style={[
                    styles.difficultyDescription,
                    difficultyPreference === option.id && styles.selectedDifficultyText,
                  ]}>
                    {option.description}
                  </Text>
                </View>
                {difficultyPreference === option.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Budget Preference */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Budget Preference
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            What's your typical grocery budget range?
          </Text>
          
          <View style={styles.budgetGrid}>
            {BUDGET_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setBudgetPreference(option.id)}
                style={[
                  styles.budgetOption,
                  budgetPreference === option.id && styles.selectedBudgetOption,
                ]}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={budgetPreference === option.id ? Theme.colors.primary : Theme.colors.gray600} 
                />
                <View style={styles.budgetContent}>
                  <Text variant="h5" style={[
                    styles.budgetTitle,
                    budgetPreference === option.id && styles.selectedBudgetText,
                  ]}>
                    {option.title}
                  </Text>
                  <Text variant="body2" style={[
                    styles.budgetDescription,
                    budgetPreference === option.id && styles.selectedBudgetText,
                  ]}>
                    {option.description}
                  </Text>
                </View>
                {budgetPreference === option.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Meal Prep Frequency */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Meal Prep Frequency
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            How often do you prefer to cook?
          </Text>
          
          <View style={styles.frequencyOptions}>
            {MEAL_PREP_FREQUENCIES.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setMealPrepFrequency(option.id)}
                style={[
                  styles.frequencyOption,
                  mealPrepFrequency === option.id && styles.selectedFrequencyOption,
                ]}
              >
                <View style={styles.frequencyContent}>
                  <Text variant="h5" style={[
                    styles.frequencyTitle,
                    mealPrepFrequency === option.id && styles.selectedFrequencyText,
                  ]}>
                    {option.title}
                  </Text>
                  <Text variant="body2" style={[
                    styles.frequencyDescription,
                    mealPrepFrequency === option.id && styles.selectedFrequencyText,
                  ]}>
                    {option.description}
                  </Text>
                </View>
                {mealPrepFrequency === option.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Serving Preferences */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Serving Preferences
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Help us recommend the right portion sizes for your needs.
          </Text>
          
          <View style={styles.servingInputs}>
            <View style={styles.servingRow}>
              <Input
                label="Default Servings"
                value={defaultServings}
                onChangeText={setDefaultServings}
                placeholder="4"
                keyboardType="numeric"
                style={styles.servingInput}
                helperText="Recipes scaled to this size"
              />
              <Input
                label="Household Size"
                value={householdSize}
                onChangeText={setHouseholdSize}
                placeholder="2"
                keyboardType="numeric"
                style={styles.servingInput}
                helperText="People you're cooking for"
              />
            </View>

            <View style={styles.preferenceSection}>
              <Text variant="h5" style={styles.preferenceTitle}>
                Portion Size Preference
              </Text>
              <View style={styles.portionOptions}>
                {PORTION_SIZE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setPortionSize(option.id as any)}
                    style={[
                      styles.portionOption,
                      portionSize === option.id && styles.selectedPortionOption,
                    ]}
                  >
                    <Text style={[
                      styles.portionText,
                      portionSize === option.id && styles.selectedPortionText,
                    ]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.preferenceSection}>
              <Text variant="h5" style={styles.preferenceTitle}>
                Leftover Preference
              </Text>
              <View style={styles.leftoverOptions}>
                {LEFTOVER_PREFERENCES.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setLeftoverPreference(option.id as any)}
                    style={[
                      styles.leftoverOption,
                      leftoverPreference === option.id && styles.selectedLeftoverOption,
                    ]}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={leftoverPreference === option.id ? Theme.colors.white : Theme.colors.gray600} 
                    />
                    <Text style={[
                      styles.leftoverText,
                      leftoverPreference === option.id && styles.selectedLeftoverText,
                    ]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* Cooking Styles */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Cooking Styles (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Select cooking styles that appeal to you.
          </Text>
          
          <View style={styles.styleGrid}>
            {COOKING_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                onPress={() => toggleStyle(style)}
                style={[
                  styles.styleOption,
                  selectedStyles.includes(style) && styles.selectedStyleOption,
                ]}
              >
                <Text style={[
                  styles.styleText,
                  selectedStyles.includes(style) && styles.selectedStyleText,
                ]}>
                  {style}
                </Text>
                {selectedStyles.includes(style) && (
                  <Ionicons name="checkmark" size={16} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
              Please select a skill level and set minimum times of 5 minutes
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
  skillLevels: {
    gap: Theme.spacing.md,
  },
  skillLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedSkillLevel: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  skillLevelContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  skillLevelTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  skillLevelDescription: {
    color: Theme.colors.gray600,
  },
  selectedSkillText: {
    color: Theme.colors.primary,
  },
  methodGrid: {
    gap: Theme.spacing.sm,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedMethodOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  methodContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  methodTitle: {
    color: Theme.colors.text,
    fontWeight: '500',
  },
  methodDescription: {
    color: Theme.colors.gray500,
    marginTop: 2,
  },
  selectedMethodText: {
    color: Theme.colors.primary,
  },
  timeInputs: {
    gap: Theme.spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  difficultyOptions: {
    gap: Theme.spacing.md,
  },
  difficultyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedDifficultyOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  difficultyContent: {
    flex: 1,
  },
  difficultyTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  difficultyDescription: {
    color: Theme.colors.gray600,
  },
  selectedDifficultyText: {
    color: Theme.colors.primary,
  },
  budgetGrid: {
    gap: Theme.spacing.md,
  },
  budgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedBudgetOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  budgetContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  budgetTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  budgetDescription: {
    color: Theme.colors.gray600,
  },
  selectedBudgetText: {
    color: Theme.colors.primary,
  },
  frequencyOptions: {
    gap: Theme.spacing.md,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedFrequencyOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  frequencyContent: {
    flex: 1,
  },
  frequencyTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  frequencyDescription: {
    color: Theme.colors.gray600,
  },
  selectedFrequencyText: {
    color: Theme.colors.primary,
  },
  servingInputs: {
    gap: Theme.spacing.lg,
  },
  servingRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  servingInput: {
    flex: 1,
  },
  preferenceSection: {
    gap: Theme.spacing.md,
  },
  preferenceTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
  },
  portionOptions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  portionOption: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
  },
  selectedPortionOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  portionText: {
    color: Theme.colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  selectedPortionText: {
    color: Theme.colors.white,
  },
  leftoverOptions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  leftoverOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.white,
    gap: Theme.spacing.xs,
  },
  selectedLeftoverOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  leftoverText: {
    color: Theme.colors.text,
    fontWeight: '500',
    fontSize: 12,
  },
  selectedLeftoverText: {
    color: Theme.colors.white,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
    minWidth: '45%',
    gap: Theme.spacing.sm,
  },
  selectedStyleOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  styleText: {
    flex: 1,
    color: Theme.colors.text,
    fontWeight: '500',
  },
  selectedStyleText: {
    color: Theme.colors.primary,
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