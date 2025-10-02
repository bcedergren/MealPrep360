import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Button, Text } from '../../src/components/ui';
import { Theme } from '../../src/constants/theme';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { WelcomeStepData } from '../../src/types/onboarding';

interface GoalOption {
  id: WelcomeStepData['primaryGoal'];
  title: string;
  description: string;
  icon: string;
  color: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'weight-loss',
    title: 'Lose Weight',
    description: 'Create healthy meal plans to reach your weight loss goals',
    icon: 'trending-down',
    color: Theme.colors.success,
  },
  {
    id: 'muscle-gain',
    title: 'Build Muscle',
    description: 'High-protein meal plans to support muscle growth',
    icon: 'fitness',
    color: Theme.colors.primary,
  },
  {
    id: 'maintenance',
    title: 'Stay Healthy',
    description: 'Maintain your current weight with balanced nutrition',
    icon: 'heart',
    color: Theme.colors.info,
  },
  {
    id: 'improved-health',
    title: 'Improve Health',
    description: 'Focus on nutrition to boost energy and wellness',
    icon: 'leaf',
    color: Theme.colors.warning,
  },
];

interface ExperienceOption {
  id: WelcomeStepData['experienceLevel'];
  title: string;
  description: string;
}

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to meal planning and cooking',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Some experience with meal prep',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Experienced with cooking and nutrition',
  },
];

interface TimeCommitmentOption {
  id: WelcomeStepData['timeCommitment'];
  title: string;
  description: string;
  weeklyHours: string;
}

const TIME_COMMITMENT_OPTIONS: TimeCommitmentOption[] = [
  {
    id: 'minimal',
    title: 'Minimal Time',
    description: 'Quick and simple meal solutions',
    weeklyHours: '1-2 hours',
  },
  {
    id: 'moderate',
    title: 'Moderate Time',
    description: 'Balanced approach to meal planning',
    weeklyHours: '3-5 hours',
  },
  {
    id: 'high',
    title: 'High Commitment',
    description: 'Comprehensive meal prep sessions',
    weeklyHours: '6+ hours',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { updateStepData, completeStep, stepData, goToNextStep } = useOnboarding();
  
  const [selectedGoal, setSelectedGoal] = useState<WelcomeStepData['primaryGoal']>(
    stepData.welcome?.primaryGoal
  );
  const [selectedExperience, setSelectedExperience] = useState<WelcomeStepData['experienceLevel']>(
    stepData.welcome?.experienceLevel
  );
  const [selectedTimeCommitment, setSelectedTimeCommitment] = useState<WelcomeStepData['timeCommitment']>(
    stepData.welcome?.timeCommitment
  );

  const handleContinue = async () => {
    const welcomeData: WelcomeStepData = {
      primaryGoal: selectedGoal,
      experienceLevel: selectedExperience,
      timeCommitment: selectedTimeCommitment,
    };

    updateStepData('welcome', welcomeData);
    await completeStep('welcome', welcomeData);
  };

  const canContinue = selectedGoal && selectedExperience && selectedTimeCommitment;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="nutrition" size={48} color={Theme.colors.primary} />
            </View>
          </View>
          
          <Text variant="h1" style={styles.welcomeTitle}>
            Welcome to MealPrep360
          </Text>
          
          <Text variant="body1" style={styles.welcomeDescription}>
            Your personal meal planning assistant for healthier eating and better nutrition.
            Let's customize your experience!
          </Text>
        </View>

        {/* Goal Selection */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            What's your main goal?
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            This helps us recommend the right recipes and meal plans for you.
          </Text>
          
          <View style={styles.optionsGrid}>
            {GOAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedGoal(option.id)}
                style={[
                  styles.goalOption,
                  selectedGoal === option.id && styles.selectedOption,
                ]}
              >
                <View style={[styles.goalIcon, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon as any} size={24} color={option.color} />
                </View>
                <Text variant="h5" style={styles.optionTitle}>
                  {option.title}
                </Text>
                <Text variant="caption" style={styles.optionDescription}>
                  {option.description}
                </Text>
                {selectedGoal === option.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            What's your experience level?
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            We'll adjust recipe complexity and guidance accordingly.
          </Text>
          
          <View style={styles.verticalOptions}>
            {EXPERIENCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedExperience(option.id)}
                style={[
                  styles.verticalOption,
                  selectedExperience === option.id && styles.selectedVerticalOption,
                ]}
              >
                <View style={styles.verticalOptionContent}>
                  <Text variant="h5" style={styles.verticalOptionTitle}>
                    {option.title}
                  </Text>
                  <Text variant="body2" style={styles.verticalOptionDescription}>
                    {option.description}
                  </Text>
                </View>
                {selectedExperience === option.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Commitment */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            How much time can you commit?
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            We'll recommend meal prep strategies that fit your schedule.
          </Text>
          
          <View style={styles.verticalOptions}>
            {TIME_COMMITMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedTimeCommitment(option.id)}
                style={[
                  styles.verticalOption,
                  selectedTimeCommitment === option.id && styles.selectedVerticalOption,
                ]}
              >
                <View style={styles.verticalOptionContent}>
                  <View style={styles.timeOptionHeader}>
                    <Text variant="h5" style={styles.verticalOptionTitle}>
                      {option.title}
                    </Text>
                    <Text variant="caption" style={styles.timeCommitmentBadge}>
                      {option.weeklyHours}
                    </Text>
                  </View>
                  <Text variant="body2" style={styles.verticalOptionDescription}>
                    {option.description}
                  </Text>
                </View>
                {selectedTimeCommitment === option.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
              Please make all selections to continue
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  logoContainer: {
    marginBottom: Theme.spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
    fontWeight: 'bold',
  },
  welcomeDescription: {
    color: Theme.colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginHorizontal: Theme.spacing.md,
  },
  section: {
    marginBottom: Theme.spacing.xl,
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Theme.spacing.md,
  },
  goalOption: {
    width: '48%',
    backgroundColor: Theme.colors.white,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
  },
  selectedOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  optionTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  optionDescription: {
    color: Theme.colors.gray600,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  verticalOptions: {
    gap: Theme.spacing.md,
  },
  verticalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
  },
  selectedVerticalOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  verticalOptionContent: {
    flex: 1,
  },
  verticalOptionTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  verticalOptionDescription: {
    color: Theme.colors.gray600,
    lineHeight: 20,
  },
  timeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  timeCommitmentBadge: {
    backgroundColor: Theme.colors.backgroundSecondary,
    color: Theme.colors.gray700,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
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