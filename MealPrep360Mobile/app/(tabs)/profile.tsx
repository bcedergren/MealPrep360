import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, Card, Container, Text as CustomText, Loading, Screen } from '../../src/components/ui';
import { Theme } from '../../src/constants/theme';
import { useUserProfile } from '../../src/hooks/useUserProfile';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    profile,
    isLoading,
    error,
    calculateUserBMR,
    calculateUserTDEE,
    calculateUserCalorieTarget,
    hasAllergies,
    hasDietaryRestrictions,
    exportProfile,
    validateProfile,
  } = useUserProfile();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, this would sync with the server
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExportData = () => {
    const profileData = exportProfile();
    if (profileData) {
      Alert.alert(
        'Export Data',
        'Profile data has been copied to clipboard',
        [{ text: 'OK' }]
      );
      // In a real app, you would copy to clipboard or share
      console.log('Profile data:', profileData);
    }
  };

  const handleEditProfile = () => {
    // TODO: Navigate to profile editing screens
    Alert.alert('Coming Soon', 'Profile editing will be available soon');
  };

  const handleSettings = () => {
    // TODO: Navigate to settings screen
    Alert.alert('Coming Soon', 'Settings screen will be available soon');
  };

  const renderProfileHeader = () => {
    if (!profile) return null;

    const { personalInfo } = profile;
    const initials = `${personalInfo.firstName.charAt(0)}${personalInfo.lastName.charAt(0)}`.toUpperCase();

    return (
      <Card style={styles.headerCard}>
        <View style={styles.profileHeader}>
          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            {profile.profilePictureUrl ? (
              // TODO: Add Image component when we have profile pictures
              <View style={styles.profilePicturePlaceholder}>
                <CustomText variant="h2" style={styles.profileInitials}>
                  {initials}
                </CustomText>
              </View>
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <CustomText variant="h2" style={styles.profileInitials}>
                  {initials}
                </CustomText>
              </View>
            )}
            <TouchableOpacity style={styles.editPictureButton}>
              <Ionicons name="camera" size={16} color={Theme.colors.white} />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <CustomText variant="h3" style={styles.profileName}>
              {personalInfo.firstName} {personalInfo.lastName}
            </CustomText>
            <CustomText variant="body1" style={styles.profileEmail}>
              {personalInfo.email}
            </CustomText>
            
            {/* Profile Status */}
            <View style={styles.profileStatus}>
              {profile.isOnboardingComplete ? (
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Theme.colors.success} />
                  <CustomText variant="caption" style={styles.statusText}>
                    Profile Complete
                  </CustomText>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.incompleteStatus]}>
                  <Ionicons name="alert-circle" size={16} color={Theme.colors.warning} />
                  <CustomText variant="caption" style={[styles.statusText, styles.incompleteText]}>
                    Profile Incomplete
                  </CustomText>
                </View>
              )}
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={20} color={Theme.colors.gray600} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderHealthStats = () => {
    if (!profile) return null;

    const bmr = calculateUserBMR();
    const tdee = calculateUserTDEE();
    const calorieTarget = calculateUserCalorieTarget();
    const { personalInfo, healthGoals } = profile;

    return (
      <Card style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <CustomText variant="h4" style={styles.sectionTitle}>
            Health Stats
          </CustomText>
          <Ionicons name="fitness" size={20} color={Theme.colors.primary} />
        </View>

        <View style={styles.statsGrid}>
          {/* BMR */}
          {bmr && (
            <View style={styles.statItem}>
              <CustomText variant="h4" style={styles.statValue}>
                {Math.round(bmr)}
              </CustomText>
              <CustomText variant="caption" style={styles.statLabel}>
                BMR (calories)
              </CustomText>
            </View>
          )}

          {/* TDEE */}
          {tdee && (
            <View style={styles.statItem}>
              <CustomText variant="h4" style={styles.statValue}>
                {Math.round(tdee)}
              </CustomText>
              <CustomText variant="caption" style={styles.statLabel}>
                TDEE (calories)
              </CustomText>
            </View>
          )}

          {/* Daily Calorie Target */}
          {calorieTarget && (
            <View style={styles.statItem}>
              <CustomText variant="h4" style={styles.statValue}>
                {Math.round(calorieTarget)}
              </CustomText>
              <CustomText variant="caption" style={styles.statLabel}>
                Daily Target
              </CustomText>
            </View>
          )}

          {/* Current Weight */}
          {personalInfo.weight && (
            <View style={styles.statItem}>
              <CustomText variant="h4" style={styles.statValue}>
                {personalInfo.weight.value} {personalInfo.weight.unit}
              </CustomText>
              <CustomText variant="caption" style={styles.statLabel}>
                Current Weight
              </CustomText>
            </View>
          )}

          {/* Target Weight */}
          {healthGoals.targetWeight && (
            <View style={styles.statItem}>
              <CustomText variant="h4" style={styles.statValue}>
                {healthGoals.targetWeight} {personalInfo.weight?.unit || 'lbs'}
              </CustomText>
              <CustomText variant="caption" style={styles.statLabel}>
                Target Weight
              </CustomText>
            </View>
          )}

          {/* Activity Level */}
          <View style={styles.statItem}>
            <CustomText variant="h4" style={styles.statValue}>
              {personalInfo.activityLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CustomText>
            <CustomText variant="caption" style={styles.statLabel}>
              Activity Level
            </CustomText>
          </View>
        </View>

        {/* Primary Goal */}
        <View style={styles.goalContainer}>
          <CustomText variant="body1" style={styles.goalLabel}>
            Primary Goal:
          </CustomText>
          <View style={styles.goalBadge}>
            <CustomText variant="body1" style={styles.goalText}>
              {healthGoals.primaryGoal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CustomText>
          </View>
        </View>
      </Card>
    );
  };

  const renderPreferencesSummary = () => {
    if (!profile) return null;

    const { dietaryPreferences, cookingPreferences } = profile;

    return (
      <Card style={styles.preferencesCard}>
        <View style={styles.preferencesHeader}>
          <CustomText variant="h4" style={styles.sectionTitle}>
            Preferences
          </CustomText>
          <Ionicons name="settings" size={20} color={Theme.colors.primary} />
        </View>

        <View style={styles.preferencesList}>
          {/* Dietary Restrictions */}
          {hasDietaryRestrictions() && (
            <View style={styles.preferenceItem}>
              <Ionicons name="leaf" size={16} color={Theme.colors.success} />
              <CustomText variant="body1" style={styles.preferenceText}>
                {dietaryPreferences.restrictions.length} dietary restriction(s)
              </CustomText>
            </View>
          )}

          {/* Allergies */}
          {hasAllergies() && (
            <View style={styles.preferenceItem}>
              <Ionicons name="warning" size={16} color={Theme.colors.warning} />
              <CustomText variant="body1" style={styles.preferenceText}>
                {dietaryPreferences.allergies.length} allergy(ies) noted
              </CustomText>
            </View>
          )}

          {/* Cooking Skill */}
          <View style={styles.preferenceItem}>
            <Ionicons name="restaurant" size={16} color={Theme.colors.primary} />
            <CustomText variant="body1" style={styles.preferenceText}>
              {cookingPreferences.skillLevel.charAt(0).toUpperCase() + cookingPreferences.skillLevel.slice(1)} cook
            </CustomText>
          </View>

          {/* Max Cooking Time */}
          <View style={styles.preferenceItem}>
            <Ionicons name="time" size={16} color={Theme.colors.gray600} />
            <CustomText variant="body1" style={styles.preferenceText}>
              Max {cookingPreferences.maxCookingTime} min cooking time
            </CustomText>
          </View>

          {/* Budget Preference */}
          <View style={styles.preferenceItem}>
            <Ionicons name="wallet" size={16} color={Theme.colors.info} />
            <CustomText variant="body1" style={styles.preferenceText}>
              {cookingPreferences.budgetPreference.charAt(0).toUpperCase() + cookingPreferences.budgetPreference.slice(1)} budget
            </CustomText>
          </View>
        </View>
      </Card>
    );
  };

  const renderQuickActions = () => {
    return (
      <Card style={styles.actionsCard}>
        <CustomText variant="h4" style={styles.sectionTitle}>
          Quick Actions
        </CustomText>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Ionicons name="person-circle" size={24} color={Theme.colors.primary} />
            <CustomText variant="body1" style={styles.actionText}>
              Edit Profile
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
            <Ionicons name="settings" size={24} color={Theme.colors.primary} />
            <CustomText variant="body1" style={styles.actionText}>
              Settings
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <Ionicons name="download" size={24} color={Theme.colors.primary} />
            <CustomText variant="body1" style={styles.actionText}>
              Export Data
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            <Ionicons name="log-out" size={24} color={Theme.colors.error} />
            <CustomText variant="body1" style={[styles.actionText, styles.signOutText]}>
              Sign Out
            </CustomText>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderProfileValidation = () => {
    const validation = validateProfile();
    
    if (validation.isValid) return null;

    return (
      <Card style={styles.validationCard}>
        <View style={styles.validationHeader}>
          <Ionicons name="alert-circle" size={20} color={Theme.colors.warning} />
          <CustomText variant="h4" style={styles.validationTitle}>
            Profile Needs Attention
          </CustomText>
        </View>
        
        <View style={styles.validationList}>
          {validation.errors.map((error, index) => (
            <View key={index} style={styles.validationItem}>
              <Ionicons name="ellipse" size={6} color={Theme.colors.warning} />
              <CustomText variant="body1" style={styles.validationText}>
                {error}
              </CustomText>
            </View>
          ))}
        </View>

        <Button
          title="Complete Profile"
          onPress={handleEditProfile}
          variant="outline"
          size="small"
          style={styles.completeButton}
        />
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Container style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Error Display */}
          {error && (
            <Card style={styles.errorCard}>
              <CustomText variant="body1" style={styles.errorText}>
                {error}
              </CustomText>
            </Card>
          )}

          {/* Profile Header */}
          {renderProfileHeader()}

          {/* Profile Validation */}
          {renderProfileValidation()}

          {/* Health Stats */}
          {renderHealthStats()}

          {/* Preferences Summary */}
          {renderPreferencesSummary()}

          {/* Quick Actions */}
          {renderQuickActions()}

          {/* App Info */}
          <View style={styles.appInfo}>
            <CustomText variant="caption" style={styles.appInfoText}>
              MealPrep360 Mobile v1.0.0
            </CustomText>
            <CustomText variant="caption" style={styles.appInfoText}>
              Last updated: {profile ? new Date(profile.updatedAt).toLocaleDateString() : 'Never'}
            </CustomText>
          </View>
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  
  // Error
  errorCard: {
    backgroundColor: Theme.colors.error,
    marginBottom: Theme.spacing.md,
  },
  errorText: {
    color: Theme.colors.white,
  },
  
  // Profile Header
  headerCard: {
    marginBottom: Theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePictureContainer: {
    position: 'relative',
    marginRight: Theme.spacing.md,
  },
  profilePicturePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: Theme.colors.white,
    fontWeight: 'bold',
  },
  editPictureButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.gray600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  profileEmail: {
    color: Theme.colors.gray600,
    marginBottom: Theme.spacing.sm,
  },
  profileStatus: {
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  incompleteStatus: {
    backgroundColor: Theme.colors.warning + '20',
  },
  statusText: {
    marginLeft: Theme.spacing.xs,
    color: Theme.colors.success,
    fontWeight: '500',
  },
  incompleteText: {
    color: Theme.colors.warning,
  },
  editButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  
  // Health Stats
  statsCard: {
    marginBottom: Theme.spacing.md,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  statValue: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    color: Theme.colors.gray600,
    textAlign: 'center',
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  goalLabel: {
    color: Theme.colors.text,
    fontWeight: '500',
  },
  goalBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.primary,
  },
  goalText: {
    color: Theme.colors.white,
    fontWeight: '500',
  },
  
  // Preferences
  preferencesCard: {
    marginBottom: Theme.spacing.md,
  },
  preferencesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  preferencesList: {
    gap: Theme.spacing.sm,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
  },
  preferenceText: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.text,
  },
  
  // Quick Actions
  actionsCard: {
    marginBottom: Theme.spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.md,
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  actionText: {
    marginTop: Theme.spacing.sm,
    color: Theme.colors.text,
    fontWeight: '500',
  },
  signOutText: {
    color: Theme.colors.error,
  },
  
  // Validation
  validationCard: {
    marginBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.warning + '10',
    borderWidth: 1,
    borderColor: Theme.colors.warning + '30',
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  validationTitle: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.warning,
    fontWeight: '600',
  },
  validationList: {
    marginBottom: Theme.spacing.md,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
    paddingLeft: Theme.spacing.md,
  },
  validationText: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.gray700,
  },
  completeButton: {
    alignSelf: 'flex-start',
  },
  
  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    marginTop: Theme.spacing.md,
  },
  appInfoText: {
    color: Theme.colors.gray500,
    marginBottom: Theme.spacing.xs,
  },
});