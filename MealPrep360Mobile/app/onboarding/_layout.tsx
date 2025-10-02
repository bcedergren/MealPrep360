import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    View,
} from 'react-native';
import { Button, Container, Loading, Text } from '../../src/components/ui';
import { Theme } from '../../src/constants/theme';
import { useOnboarding } from '../../src/hooks/useOnboarding';

export default function OnboardingLayout() {
  const router = useRouter();
  const {
    currentStep,
    getProgress,
    canGoPrevious,
    canSkipCurrent,
    goToPreviousStep,
    skipStep,
    error,
    isLoading,
    getRemainingTime,
  } = useOnboarding();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading />
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    if (canGoPrevious()) {
      goToPreviousStep();
    } else {
      Alert.alert(
        'Exit Setup',
        'Are you sure you want to exit the setup process? Your progress will be saved.',
        [
          { text: 'Continue Setup', style: 'default' },
          { 
            text: 'Exit', 
            style: 'destructive',
            onPress: () => router.replace('/(tabs)')
          },
        ]
      );
    }
  };

  const handleSkip = () => {
    if (canSkipCurrent()) {
      Alert.alert(
        'Skip Step',
        'Are you sure you want to skip this step? You can always complete it later in your profile settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Skip', 
            style: 'default',
            onPress: () => skipStep()
          },
        ]
      );
    }
  };

  const progress = getProgress();
  const remainingTime = getRemainingTime();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Button
            variant="ghost"
            size="small"
            onPress={handleBack}
            style={styles.backButton}
            title=""
          >
            <Ionicons 
              name={canGoPrevious() ? "chevron-back" : "close"} 
              size={24} 
              color={Theme.colors.gray600} 
            />
          </Button>

          <View style={styles.stepInfo}>
            <Text variant="h4" style={styles.stepTitle}>
              {currentStep?.title || 'Setup'}
            </Text>
            <Text variant="caption" style={styles.stepDescription}>
              {currentStep?.description || ''}
            </Text>
          </View>

          {canSkipCurrent() && (
            <Button
              variant="ghost"
              size="small"
              onPress={handleSkip}
              style={styles.skipButton}
              title="Skip"
            />
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <View style={styles.progressInfo}>
            <Text variant="caption" style={styles.progressText}>
              {Math.round(progress)}% complete
            </Text>
            {remainingTime > 0 && (
              <Text variant="caption" style={styles.timeText}>
                ~{remainingTime} min remaining
              </Text>
            )}
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={Theme.colors.error} />
            <Text variant="body2" style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Container style={styles.content}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: false,
          }}
        />
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.white,
  },
  header: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  stepInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Theme.spacing.md,
  },
  stepTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  stepDescription: {
    color: Theme.colors.gray600,
    textAlign: 'center',
    lineHeight: 16,
  },
  skipButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  progressContainer: {
    marginBottom: Theme.spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  timeText: {
    color: Theme.colors.gray500,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.error + '10',
    borderWidth: 1,
    borderColor: Theme.colors.error + '30',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  errorText: {
    color: Theme.colors.error,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  content: {
    flex: 1,
  },
});