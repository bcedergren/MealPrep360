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
import { HealthGoalsStepData } from '../../src/types/onboarding';

interface HealthGoalOption {
  id: HealthGoalsStepData['primaryGoal'];
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface TimelineOption {
  id: string;
  title: string;
  description: string;
}

interface FitnessLevelOption {
  id: HealthGoalsStepData['fitnessLevel'];
  title: string;
  description: string;
}

const HEALTH_GOALS: HealthGoalOption[] = [
  {
    id: 'weight-loss',
    title: 'Lose Weight',
    description: 'Reduce body weight through healthy nutrition',
    icon: 'trending-down',
    color: Theme.colors.success,
  },
  {
    id: 'weight-gain',
    title: 'Gain Weight',
    description: 'Increase body weight in a healthy way',
    icon: 'trending-up',
    color: Theme.colors.primary,
  },
  {
    id: 'muscle-gain',
    title: 'Build Muscle',
    description: 'Increase muscle mass and strength',
    icon: 'barbell',
    color: Theme.colors.primary,
  },
  {
    id: 'maintenance',
    title: 'Maintain Weight',
    description: 'Keep current weight while improving health',
    icon: 'checkmark-circle',
    color: Theme.colors.warning,
  },
  {
    id: 'improved-energy',
    title: 'More Energy',
    description: 'Improve overall energy and well-being',
    icon: 'flash',
    color: Theme.colors.error,
  },
];

const TIMELINE_OPTIONS: TimelineOption[] = [
  {
    id: '1-month',
    title: '1 Month',
    description: 'Quick results, intensive focus',
  },
  {
    id: '3-months',
    title: '3 Months',
    description: 'Balanced approach, sustainable habits',
  },
  {
    id: '6-months',
    title: '6 Months',
    description: 'Gradual transformation, lasting change',
  },
  {
    id: '1-year',
    title: '1 Year',
    description: 'Long-term lifestyle change',
  },
  {
    id: 'ongoing',
    title: 'Ongoing',
    description: 'No specific end date, lifestyle focus',
  },
];

const FITNESS_LEVELS: FitnessLevelOption[] = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
  },
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to exercise or getting back into it',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Regular exercise 3-4 times per week',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Consistent training 5+ times per week',
  },
  {
    id: 'athlete',
    title: 'Athlete',
    description: 'Competitive or professional level',
  },
];

const SECONDARY_GOAL_OPTIONS = [
  'Improve overall health',
  'Build confidence',
  'Increase energy',
  'Better sleep',
  'Reduce stress',
  'Athletic performance',
  'Medical condition management',
];

export default function HealthGoalsScreen() {
  const { updateStepData, completeStep, stepData, getValidationErrors } = useOnboarding();
  
  const [selectedGoal, setSelectedGoal] = useState<HealthGoalsStepData['primaryGoal']>(
    stepData.healthGoals?.primaryGoal || 'maintenance'
  );
  const [selectedTimeline, setSelectedTimeline] = useState<string>(
    stepData.healthGoals?.targetDate || ''
  );
  const [selectedSecondaryGoals, setSelectedSecondaryGoals] = useState<string[]>(
    stepData.healthGoals?.secondaryGoals || []
  );
  const [selectedFitnessLevel, setSelectedFitnessLevel] = useState<HealthGoalsStepData['fitnessLevel']>(
    stepData.healthGoals?.fitnessLevel || 'beginner'
  );
  
  // Weight goal state
  const [targetWeight, setTargetWeight] = useState(
    stepData.healthGoals?.targetWeight?.toString() || ''
  );
  
  // Medical conditions
  const [hasMedicalConditions, setHasMedicalConditions] = useState(
    stepData.healthGoals?.medicalConditions !== undefined && stepData.healthGoals.medicalConditions.length > 0
  );
  const [medicalConditionName, setMedicalConditionName] = useState(
    stepData.healthGoals?.medicalConditions?.[0]?.name || ''
  );
  
  // Tracking preferences
  const [trackWeight, setTrackWeight] = useState(
    stepData.healthGoals?.trackingPreferences?.trackWeight ?? true
  );
  const [trackCalories, setTrackCalories] = useState(
    stepData.healthGoals?.trackingPreferences?.trackCalories ?? true
  );
  const [trackMacros, setTrackMacros] = useState(
    stepData.healthGoals?.trackingPreferences?.trackMacros ?? false
  );
  const [trackWater, setTrackWater] = useState(
    stepData.healthGoals?.trackingPreferences?.trackWater ?? false
  );
  const [trackExercise, setTrackExercise] = useState(
    stepData.healthGoals?.trackingPreferences?.trackExercise ?? false
  );

  // Auto-save on field changes
  useEffect(() => {
    const healthGoalsData: HealthGoalsStepData = {
      primaryGoal: selectedGoal!,
      secondaryGoals: selectedSecondaryGoals,
      targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
      targetDate: selectedTimeline || undefined,
      fitnessLevel: selectedFitnessLevel,
      medicalConditions: hasMedicalConditions && medicalConditionName.trim() 
        ? [{
            name: medicalConditionName.trim(),
            severity: 'mild' as const,
            dietaryImpact: []
          }]
        : [],
      supplements: [],
      trackingPreferences: {
        trackWeight,
        trackCalories,
        trackMacros,
        trackWater,
        trackExercise,
      },
    };

    updateStepData('health-goals', healthGoalsData);
  }, [
    selectedGoal, selectedSecondaryGoals, targetWeight, selectedTimeline,
    selectedFitnessLevel, hasMedicalConditions, medicalConditionName,
    trackWeight, trackCalories, trackMacros, trackWater, trackExercise,
    updateStepData
  ]);

  const handleContinue = async () => {
    const healthGoalsData: HealthGoalsStepData = {
      primaryGoal: selectedGoal!,
      secondaryGoals: selectedSecondaryGoals,
      targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
      targetDate: selectedTimeline || undefined,
      fitnessLevel: selectedFitnessLevel,
      medicalConditions: hasMedicalConditions && medicalConditionName.trim() 
        ? [{
            name: medicalConditionName.trim(),
            severity: 'mild' as const,
            dietaryImpact: []
          }]
        : [],
      supplements: [],
      trackingPreferences: {
        trackWeight,
        trackCalories,
        trackMacros,
        trackWater,
        trackExercise,
      },
    };

    await completeStep('health-goals', healthGoalsData);
  };

  const toggleSecondaryGoal = (goalId: string) => {
    setSelectedSecondaryGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const shouldShowWeightTarget = selectedGoal === 'weight-loss' || selectedGoal === 'weight-gain' || selectedGoal === 'muscle-gain';
  const validationErrors = getValidationErrors('health-goals');
  const canContinue = selectedGoal && selectedFitnessLevel;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" style={styles.title}>
            What's your main goal?
          </Text>
          <Text variant="body1" style={styles.subtitle}>
            Help us understand what you want to achieve so we can create a personalized plan for you.
          </Text>
        </View>

        {/* Primary Goal Selection */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Primary Health Goal
          </Text>
          
          <View style={styles.goalGrid}>
            {HEALTH_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                onPress={() => setSelectedGoal(goal.id)}
                style={[
                  styles.goalOption,
                  selectedGoal === goal.id && styles.selectedGoalOption,
                ]}
              >
                <View style={[styles.goalIcon, { backgroundColor: goal.color + '15' }]}>
                  <Ionicons 
                    name={goal.icon as any} 
                    size={24} 
                    color={goal.color} 
                  />
                </View>
                <View style={styles.goalContent}>
                  <Text variant="h5" style={[
                    styles.goalTitle,
                    selectedGoal === goal.id && styles.selectedGoalText,
                  ]}>
                    {goal.title}
                  </Text>
                  <Text variant="body2" style={[
                    styles.goalDescription,
                    selectedGoal === goal.id && styles.selectedGoalText,
                  ]}>
                    {goal.description}
                  </Text>
                </View>
                {selectedGoal === goal.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Target Weight */}
        {shouldShowWeightTarget && (
          <Card style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>
              Target Weight (Optional)
            </Text>
            <Text variant="body2" style={styles.sectionDescription}>
              What's your target weight in pounds? This helps us calculate your calorie needs.
            </Text>
            
            <Input
              label="Target Weight (lbs)"
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="140"
              keyboardType="decimal-pad"
            />
          </Card>
        )}

        {/* Timeline */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Timeline (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            When would you like to achieve your goal?
          </Text>
          
          <View style={styles.timelineOptions}>
            {TIMELINE_OPTIONS.map((timeline) => (
              <TouchableOpacity
                key={timeline.id}
                onPress={() => setSelectedTimeline(timeline.id)}
                style={[
                  styles.timelineOption,
                  selectedTimeline === timeline.id && styles.selectedTimelineOption,
                ]}
              >
                <View style={styles.timelineContent}>
                  <Text variant="h5" style={[
                    styles.timelineTitle,
                    selectedTimeline === timeline.id && styles.selectedTimelineText,
                  ]}>
                    {timeline.title}
                  </Text>
                  <Text variant="body2" style={[
                    styles.timelineDescription,
                    selectedTimeline === timeline.id && styles.selectedTimelineText,
                  ]}>
                    {timeline.description}
                  </Text>
                </View>
                {selectedTimeline === timeline.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Fitness Level */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Current Fitness Level
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            This helps us provide appropriate recommendations for your fitness level.
          </Text>
          
          <View style={styles.fitnessLevels}>
            {FITNESS_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => setSelectedFitnessLevel(level.id)}
                style={[
                  styles.fitnessLevel,
                  selectedFitnessLevel === level.id && styles.selectedFitnessLevel,
                ]}
              >
                <View style={styles.fitnessLevelContent}>
                  <Text variant="h5" style={[
                    styles.fitnessLevelTitle,
                    selectedFitnessLevel === level.id && styles.selectedFitnessText,
                  ]}>
                    {level.title}
                  </Text>
                  <Text variant="body2" style={[
                    styles.fitnessLevelDescription,
                    selectedFitnessLevel === level.id && styles.selectedFitnessText,
                  ]}>
                    {level.description}
                  </Text>
                </View>
                {selectedFitnessLevel === level.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Secondary Goals */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Secondary Goals (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Select any additional goals that matter to you.
          </Text>
          
          <View style={styles.secondaryGoalGrid}>
            {SECONDARY_GOAL_OPTIONS.map((goal) => (
              <TouchableOpacity
                key={goal}
                onPress={() => toggleSecondaryGoal(goal)}
                style={[
                  styles.secondaryGoalOption,
                  selectedSecondaryGoals.includes(goal) && styles.selectedSecondaryGoalOption,
                ]}
              >
                <Text variant="body2" style={[
                  styles.secondaryGoalText,
                  selectedSecondaryGoals.includes(goal) && styles.selectedSecondaryGoalText,
                ]}>
                  {goal}
                </Text>
                {selectedSecondaryGoals.includes(goal) && (
                  <Ionicons name="checkmark" size={16} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Medical Conditions */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Medical Conditions (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Do you have any medical conditions that affect your diet?
          </Text>
          
          <View style={styles.medicalConditionsToggle}>
            <TouchableOpacity
              onPress={() => setHasMedicalConditions(false)}
              style={[
                styles.toggleButton,
                !hasMedicalConditions && styles.selectedToggleButton,
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                !hasMedicalConditions && styles.selectedToggleText,
              ]}>
                No conditions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setHasMedicalConditions(true)}
              style={[
                styles.toggleButton,
                hasMedicalConditions && styles.selectedToggleButton,
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                hasMedicalConditions && styles.selectedToggleText,
              ]}>
                Have conditions
              </Text>
            </TouchableOpacity>
          </View>

          {hasMedicalConditions && (
            <Input
              label="Primary Medical Condition"
              value={medicalConditionName}
              onChangeText={setMedicalConditionName}
              placeholder="e.g., diabetes, high blood pressure"
            />
          )}
        </Card>

        {/* Tracking Preferences */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            What would you like to track?
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Choose what metrics you want to monitor on your health journey.
          </Text>
          
          <View style={styles.trackingOptions}>
            <TouchableOpacity
              onPress={() => setTrackWeight(!trackWeight)}
              style={styles.trackingOption}
            >
              <Ionicons 
                name={trackWeight ? "checkbox" : "square-outline"} 
                size={24} 
                color={trackWeight ? Theme.colors.primary : Theme.colors.gray400} 
              />
              <Text style={styles.trackingText}>Weight progress</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setTrackCalories(!trackCalories)}
              style={styles.trackingOption}
            >
              <Ionicons 
                name={trackCalories ? "checkbox" : "square-outline"} 
                size={24} 
                color={trackCalories ? Theme.colors.primary : Theme.colors.gray400} 
              />
              <Text style={styles.trackingText}>Daily calories</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setTrackMacros(!trackMacros)}
              style={styles.trackingOption}
            >
              <Ionicons 
                name={trackMacros ? "checkbox" : "square-outline"} 
                size={24} 
                color={trackMacros ? Theme.colors.primary : Theme.colors.gray400} 
              />
              <Text style={styles.trackingText}>Macronutrients (protein, carbs, fat)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setTrackWater(!trackWater)}
              style={styles.trackingOption}
            >
              <Ionicons 
                name={trackWater ? "checkbox" : "square-outline"} 
                size={24} 
                color={trackWater ? Theme.colors.primary : Theme.colors.gray400} 
              />
              <Text style={styles.trackingText}>Water intake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setTrackExercise(!trackExercise)}
              style={styles.trackingOption}
            >
              <Ionicons 
                name={trackExercise ? "checkbox" : "square-outline"} 
                size={24} 
                color={trackExercise ? Theme.colors.primary : Theme.colors.gray400} 
              />
              <Text style={styles.trackingText}>Exercise and activity</Text>
            </TouchableOpacity>
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
              Please select a primary goal and fitness level to continue
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
  goalGrid: {
    gap: Theme.spacing.md,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedGoalOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  goalDescription: {
    color: Theme.colors.gray600,
  },
  selectedGoalText: {
    color: Theme.colors.primary,
  },
  timelineOptions: {
    gap: Theme.spacing.md,
  },
  timelineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedTimelineOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  timelineDescription: {
    color: Theme.colors.gray600,
  },
  selectedTimelineText: {
    color: Theme.colors.primary,
  },
  fitnessLevels: {
    gap: Theme.spacing.md,
  },
  fitnessLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedFitnessLevel: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  fitnessLevelContent: {
    flex: 1,
  },
  fitnessLevelTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  fitnessLevelDescription: {
    color: Theme.colors.gray600,
  },
  selectedFitnessText: {
    color: Theme.colors.primary,
  },
  secondaryGoalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  secondaryGoalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
    minWidth: '45%',
  },
  selectedSecondaryGoalOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  secondaryGoalText: {
    flex: 1,
    color: Theme.colors.text,
  },
  selectedSecondaryGoalText: {
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  medicalConditionsToggle: {
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
  trackingOptions: {
    gap: Theme.spacing.md,
  },
  trackingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  trackingText: {
    color: Theme.colors.text,
    fontSize: 16,
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