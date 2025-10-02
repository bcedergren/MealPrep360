import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, Text } from '../../src/components/ui';
import { Theme } from '../../src/constants/theme';
import { useOnboarding } from '../../src/hooks/useOnboarding';

interface FeatureHighlight {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    icon: 'restaurant',
    title: 'Personalized Recipes',
    description: 'Get recipe suggestions tailored to your dietary preferences and goals',
    color: Theme.colors.primary,
  },
  {
    icon: 'calendar',
    title: 'Weekly Meal Plans',
    description: 'Automatically generated meal plans that fit your schedule and preferences',
    color: Theme.colors.success,
  },
  {
    icon: 'list',
    title: 'Smart Shopping Lists',
    description: 'Organized grocery lists with exact quantities for your meal plans',
    color: Theme.colors.warning,
  },
  {
    icon: 'bar-chart',
    title: 'Nutrition Tracking',
    description: 'Monitor your daily calories, macros, and nutritional goals',
    color: Theme.colors.info,
  },
  {
    icon: 'timer',
    title: 'Meal Prep Assistant',
    description: 'Step-by-step cooking instructions and prep time optimization',
    color: Theme.colors.secondary,
  },
  {
    icon: 'heart',
    title: 'Health Insights',
    description: 'Track your progress toward your health and fitness goals',
    color: Theme.colors.error,
  },
];

export default function CompleteScreen() {
  const { stepData, completeOnboarding } = useOnboarding();

  useEffect(() => {
    // Mark this step as completed when the component mounts
    completeOnboarding();
  }, [completeOnboarding]);

  const handleStartJourney = async () => {
    // Navigate to the main app
    router.replace('/(tabs)');
  };

  const handleViewProfile = () => {
    router.push('/(tabs)/profile');
  };

  // Generate summary data
  const getSummaryData = () => {
    const summary = {
      name: stepData.personalInfo?.firstName || 'User',
      goal: stepData.healthGoals?.primaryGoal || stepData.welcome?.primaryGoal || 'improve health',
      restrictions: stepData.dietaryPreferences?.restrictions?.length || 0,
      allergies: stepData.dietaryPreferences?.allergies?.length || 0,
      fitnessLevel: stepData.healthGoals?.fitnessLevel || 'beginner',
      trackingPreferences: stepData.healthGoals?.trackingPreferences ? 
        Object.values(stepData.healthGoals.trackingPreferences).filter(Boolean).length : 0,
    };
    return summary;
  };

  const summary = getSummaryData();

  const getGoalEmoji = (goal: string) => {
    switch (goal) {
      case 'weight-loss': return '📉';
      case 'weight-gain': return '📈';
      case 'muscle-gain': return '💪';
      case 'maintenance': return '⚖️';
      case 'improved-energy': return '⚡';
      case 'improved-health': return '❤️';
      default: return '🎯';
    }
  };

  const getFitnessEmoji = (level: string) => {
    switch (level) {
      case 'sedentary': return '🪑';
      case 'beginner': return '🌱';
      case 'intermediate': return '🏃';
      case 'advanced': return '🏋️';
      case 'athlete': return '🏆';
      default: return '🌱';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Theme.colors.success} />
          </View>
          <Text variant="h1" style={styles.successTitle}>
            All Set, {summary.name}! 🎉
          </Text>
          <Text variant="h3" style={styles.successSubtitle}>
            Your personalized meal planning journey starts now
          </Text>
        </View>

        {/* Personal Summary */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Your Profile Summary
          </Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryEmoji}>{getGoalEmoji(summary.goal)}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text variant="body2" style={styles.summaryLabel}>
                  Primary Goal
                </Text>
                <Text variant="h5" style={styles.summaryValue}>
                  {summary.goal.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryEmoji}>{getFitnessEmoji(summary.fitnessLevel)}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text variant="body2" style={styles.summaryLabel}>
                  Fitness Level
                </Text>
                <Text variant="h5" style={styles.summaryValue}>
                  {summary.fitnessLevel.charAt(0).toUpperCase() + summary.fitnessLevel.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryEmoji}>🚫</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text variant="body2" style={styles.summaryLabel}>
                  Dietary Restrictions
                </Text>
                <Text variant="h5" style={styles.summaryValue}>
                  {summary.restrictions} restriction{summary.restrictions !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryEmoji}>⚠️</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text variant="body2" style={styles.summaryLabel}>
                  Food Allergies
                </Text>
                <Text variant="h5" style={styles.summaryValue}>
                  {summary.allergies} allergi{summary.allergies !== 1 ? 'es' : 'y'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryEmoji}>📊</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text variant="body2" style={styles.summaryLabel}>
                  Tracking Goals
                </Text>
                <Text variant="h5" style={styles.summaryValue}>
                  {summary.trackingPreferences} metric{summary.trackingPreferences !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleViewProfile} style={styles.editProfileButton}>
            <Ionicons name="settings-outline" size={16} color={Theme.colors.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        {/* App Features */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            What's Next? Discover MealPrep360
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Here's what you can do with your personalized meal planning assistant:
          </Text>
          
          <View style={styles.featureGrid}>
            {FEATURE_HIGHLIGHTS.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                  <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text variant="h5" style={styles.featureTitle}>
                    {feature.title}
                  </Text>
                  <Text variant="body2" style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Quick Start Tips */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Quick Start Tips
          </Text>
          
          <View style={styles.tipsList}>
            <View style={styles.tip}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>1</Text>
              </View>
              <View style={styles.tipContent}>
                <Text variant="body2" style={styles.tipText}>
                  <Text style={styles.tipBold}>Explore Recipes:</Text> Browse our extensive recipe database filtered to your preferences
                </Text>
              </View>
            </View>

            <View style={styles.tip}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>2</Text>
              </View>
              <View style={styles.tipContent}>
                <Text variant="body2" style={styles.tipText}>
                  <Text style={styles.tipBold}>Generate Meal Plans:</Text> Create your first weekly meal plan with one tap
                </Text>
              </View>
            </View>

            <View style={styles.tip}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>3</Text>
              </View>
              <View style={styles.tipContent}>
                <Text variant="body2" style={styles.tipText}>
                  <Text style={styles.tipBold}>Start Shopping:</Text> Use your auto-generated shopping list for easy grocery trips
                </Text>
              </View>
            </View>

            <View style={styles.tip}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>4</Text>
              </View>
              <View style={styles.tipContent}>
                <Text variant="body2" style={styles.tipText}>
                  <Text style={styles.tipBold}>Track Progress:</Text> Log your meals and monitor your health journey
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Motivational Message */}
        <Card style={[styles.section, styles.motivationCard]}>
          <View style={styles.motivationContent}>
            <Text variant="h4" style={styles.motivationTitle}>
              Your Health Journey Begins Now! 🚀
            </Text>
            <Text variant="body1" style={styles.motivationText}>
              You've taken the first important step toward a healthier lifestyle. 
              Every meal you plan, every nutritious choice you make, brings you closer to your goals.
            </Text>
            <Text variant="body2" style={styles.motivationFooter}>
              Remember: Progress, not perfection. We're here to support you every step of the way!
            </Text>
          </View>
        </Card>

        {/* Start Journey Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Start My Health Journey"
            onPress={handleStartJourney}
            size="large"
            style={styles.startButton}
          />
          
          <Text variant="caption" style={styles.helpText}>
            You can always update your preferences in your profile settings
          </Text>
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
  successHeader: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  successIcon: {
    marginBottom: Theme.spacing.lg,
  },
  successTitle: {
    color: Theme.colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  successSubtitle: {
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
  summaryGrid: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.lg,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  summaryEmoji: {
    fontSize: 24,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    color: Theme.colors.gray600,
    marginBottom: 2,
  },
  summaryValue: {
    color: Theme.colors.text,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.sm,
  },
  editProfileText: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  featureGrid: {
    gap: Theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  featureDescription: {
    color: Theme.colors.gray600,
    lineHeight: 20,
  },
  tipsList: {
    gap: Theme.spacing.lg,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  tipNumberText: {
    color: Theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipText: {
    color: Theme.colors.text,
    lineHeight: 22,
  },
  tipBold: {
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  motivationCard: {
    backgroundColor: Theme.colors.primary + '05',
    borderWidth: 2,
    borderColor: Theme.colors.primary + '20',
  },
  motivationContent: {
    alignItems: 'center',
    textAlign: 'center',
  },
  motivationTitle: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  motivationText: {
    color: Theme.colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Theme.spacing.md,
  },
  motivationFooter: {
    color: Theme.colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  startButton: {
    width: '100%',
    marginBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.success,
  },
  helpText: {
    color: Theme.colors.gray500,
    textAlign: 'center',
  },
});