import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Loading } from '../../src/components/ui';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { useUserProfile } from '../../src/hooks/useUserProfile';

export default function OnboardingIndex() {
  const router = useRouter();
  const { currentStep, isLoading, state } = useOnboarding();
  const { profile } = useUserProfile();

  useEffect(() => {
    if (isLoading) return;

    // If user already has a complete profile, skip onboarding
    if (profile?.isOnboardingComplete) {
      router.replace('/(tabs)');
      return;
    }

    // If onboarding is complete, go to app
    if (state?.isComplete) {
      router.replace('/(tabs)');
      return;
    }

    // Navigate to current step
    if (currentStep) {
      navigateToStep(currentStep.id);
    }
  }, [currentStep, isLoading, state, profile, router]);

  const navigateToStep = (stepId: string) => {
    switch (stepId) {
      case 'welcome':
        router.replace('/onboarding/welcome');
        break;
      case 'personal-info':
        router.replace('/onboarding/personal-info');
        break;
      case 'health-goals':
        router.replace('/onboarding/health-goals');
        break;
      case 'dietary-preferences':
        router.replace('/onboarding/dietary-preferences');
        break;
      case 'cooking-preferences':
        router.replace('/onboarding/cooking-preferences');
        break;
      case 'kitchen-equipment':
        router.replace('/onboarding/kitchen-equipment');
        break;
      case 'notifications':
        router.replace('/onboarding/notifications');
        break;
      case 'complete':
        router.replace('/onboarding/complete');
        break;
      default:
        router.replace('/onboarding/welcome');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Loading />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});