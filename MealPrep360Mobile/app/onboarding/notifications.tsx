import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Button, Card, Input, Text } from '../../src/components/ui';
import { Theme } from '../../src/constants/theme';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { NotificationsStepData } from '../../src/types/onboarding';

interface NotificationOptionConfig {
  key: keyof NotificationsStepData;
  title: string;
  description: string;
  icon: string;
  defaultValue: boolean;
}

interface MealReminderTime {
  mealType: string;
  time: string;
  enabled: boolean;
}

const NOTIFICATION_OPTIONS: NotificationOptionConfig[] = [
  {
    key: 'mealReminders',
    title: 'Meal Reminders',
    description: 'Reminders for planned meals and cooking times',
    icon: 'alarm',
    defaultValue: true,
  },
  {
    key: 'shoppingReminders',
    title: 'Shopping Reminders',
    description: 'Reminders to buy groceries and ingredients',
    icon: 'bag',
    defaultValue: true,
  },
  {
    key: 'prepReminders',
    title: 'Prep Reminders',
    description: 'Reminders for meal prep sessions',
    icon: 'time',
    defaultValue: true,
  },
  {
    key: 'nutritionReminders',
    title: 'Nutrition Tracking',
    description: 'Reminders to log meals and track nutrition',
    icon: 'fitness',
    defaultValue: false,
  },
  {
    key: 'recipeRecommendations',
    title: 'Recipe Recommendations',
    description: 'Daily personalized recipe suggestions',
    icon: 'restaurant',
    defaultValue: true,
  },
  {
    key: 'weeklyReports',
    title: 'Weekly Reports',
    description: 'Weekly summaries of your meal planning',
    icon: 'stats-chart',
    defaultValue: false,
  },
  {
    key: 'pushNotifications',
    title: 'Push Notifications',
    description: 'Receive notifications on your device',
    icon: 'notifications',
    defaultValue: true,
  },
  {
    key: 'emailNotifications',
    title: 'Email Notifications',
    description: 'Receive updates via email',
    icon: 'mail',
    defaultValue: false,
  },
];

const DEFAULT_MEAL_TIMES: MealReminderTime[] = [
  { mealType: 'Breakfast', time: '07:00', enabled: true },
  { mealType: 'Lunch', time: '12:00', enabled: true },
  { mealType: 'Dinner', time: '18:00', enabled: true },
  { mealType: 'Snack', time: '15:00', enabled: false },
];

const SHOPPING_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function NotificationsScreen() {
  const { updateStepData, completeStep, stepData, getValidationErrors } = useOnboarding();
  
  // Initialize with existing data or defaults
  const [mealReminders, setMealReminders] = useState<boolean>(
    stepData.notifications?.mealReminders ?? true
  );
  const [mealReminderTimes, setMealReminderTimes] = useState<MealReminderTime[]>(
    stepData.notifications?.mealReminderTimes || DEFAULT_MEAL_TIMES
  );
  const [shoppingReminders, setShoppingReminders] = useState<boolean>(
    stepData.notifications?.shoppingReminders ?? true
  );
  const [shoppingReminderDay, setShoppingReminderDay] = useState<string>(
    stepData.notifications?.shoppingReminderDay || 'Sunday'
  );
  const [prepReminders, setPrepReminders] = useState<boolean>(
    stepData.notifications?.prepReminders ?? true
  );
  const [prepReminderTime, setPrepReminderTime] = useState<string>(
    stepData.notifications?.prepReminderTime || '10:00'
  );
  const [nutritionReminders, setNutritionReminders] = useState<boolean>(
    stepData.notifications?.nutritionReminders ?? false
  );
  const [weeklyReports, setWeeklyReports] = useState<boolean>(
    stepData.notifications?.weeklyReports ?? false
  );
  const [recipeRecommendations, setRecipeRecommendations] = useState<boolean>(
    stepData.notifications?.recipeRecommendations ?? true
  );
  const [pushNotifications, setPushNotifications] = useState<boolean>(
    stepData.notifications?.pushNotifications ?? true
  );
  const [emailNotifications, setEmailNotifications] = useState<boolean>(
    stepData.notifications?.emailNotifications ?? false
  );

  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Mock permission check since we removed expo-notifications
  useEffect(() => {
    setPermissionStatus('undetermined');
  }, []);

  // Auto-save on field changes
  useEffect(() => {
    const notificationsData: NotificationsStepData = {
      mealReminders,
      mealReminderTimes,
      shoppingReminders,
      shoppingReminderDay,
      prepReminders,
      prepReminderTime,
      nutritionReminders,
      weeklyReports,
      recipeRecommendations,
      pushNotifications,
      emailNotifications,
    };

    updateStepData('notifications', notificationsData);
  }, [
    mealReminders, mealReminderTimes, shoppingReminders, shoppingReminderDay,
    prepReminders, prepReminderTime, nutritionReminders, weeklyReports,
    recipeRecommendations, pushNotifications, emailNotifications, updateStepData
  ]);

  const requestNotificationPermissions = () => {
    setIsRequestingPermission(true);
    // Mock permission request
    setTimeout(() => {
      setPermissionStatus('granted');
      setIsRequestingPermission(false);
      setPushNotifications(true);
    }, 1000);
  };

  const handleContinue = async () => {
    const notificationsData: NotificationsStepData = {
      mealReminders,
      mealReminderTimes,
      shoppingReminders,
      shoppingReminderDay,
      prepReminders,
      prepReminderTime,
      nutritionReminders,
      weeklyReports,
      recipeRecommendations,
      pushNotifications,
      emailNotifications,
    };

    await completeStep('notifications', notificationsData);
  };

  const toggleNotificationOption = (key: keyof NotificationsStepData, value: boolean) => {
    switch (key) {
      case 'mealReminders':
        setMealReminders(value);
        break;
      case 'shoppingReminders':
        setShoppingReminders(value);
        break;
      case 'prepReminders':
        setPrepReminders(value);
        break;
      case 'nutritionReminders':
        setNutritionReminders(value);
        break;
      case 'weeklyReports':
        setWeeklyReports(value);
        break;
      case 'recipeRecommendations':
        setRecipeRecommendations(value);
        break;
      case 'pushNotifications':
        setPushNotifications(value);
        break;
      case 'emailNotifications':
        setEmailNotifications(value);
        break;
    }
  };

  const getNotificationValue = (key: keyof NotificationsStepData): boolean => {
    switch (key) {
      case 'mealReminders': return mealReminders;
      case 'shoppingReminders': return shoppingReminders;
      case 'prepReminders': return prepReminders;
      case 'nutritionReminders': return nutritionReminders;
      case 'weeklyReports': return weeklyReports;
      case 'recipeRecommendations': return recipeRecommendations;
      case 'pushNotifications': return pushNotifications;
      case 'emailNotifications': return emailNotifications;
      default: return false;
    }
  };

  const updateMealReminderTime = (index: number, field: 'time' | 'enabled', value: string | boolean) => {
    setMealReminderTimes(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const validationErrors = getValidationErrors('notifications');
  const canContinue = true; // No required fields for notifications

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" style={styles.title}>
            Notification Preferences
          </Text>
          <Text variant="body1" style={styles.subtitle}>
            Choose which notifications you'd like to receive to help you stay on track with your meal planning.
          </Text>
        </View>

        {/* Permission Status */}
        {permissionStatus === 'undetermined' && pushNotifications && (
          <Card style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <Ionicons name="notifications-outline" size={24} color={Theme.colors.primary} />
              <Text variant="h4" style={styles.permissionTitle}>
                Enable Push Notifications
              </Text>
            </View>
            <Text variant="body2" style={styles.permissionDescription}>
              To receive helpful reminders and updates, please allow push notifications for MealPrep360.
            </Text>
            <Button
              title={isRequestingPermission ? "Requesting..." : "Allow Notifications"}
              onPress={requestNotificationPermissions}
              disabled={isRequestingPermission}
              style={styles.permissionButton}
            />
          </Card>
        )}

        {permissionStatus === 'granted' && pushNotifications && (
          <Card style={styles.successCard}>
            <View style={styles.permissionHeader}>
              <Ionicons name="checkmark-circle" size={24} color={Theme.colors.success} />
              <Text variant="h4" style={styles.successTitle}>
                Push Notifications Enabled
              </Text>
            </View>
            <Text variant="body2" style={styles.successDescription}>
              Great! You'll receive helpful push notifications based on your preferences below.
            </Text>
          </Card>
        )}

        {/* Notification Types */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Notification Types
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Choose which types of notifications you'd like to receive.
          </Text>
          
          <View style={styles.optionsList}>
            {NOTIFICATION_OPTIONS.map((option) => {
              const isEnabled = getNotificationValue(option.key);
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => toggleNotificationOption(option.key, !isEnabled)}
                  style={[
                    styles.notificationOption,
                    isEnabled && styles.selectedOption,
                  ]}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={isEnabled ? Theme.colors.primary : Theme.colors.gray600} 
                  />
                  <View style={styles.optionContent}>
                    <Text variant="h5" style={[
                      styles.optionTitle,
                      isEnabled && styles.selectedText,
                    ]}>
                      {option.title}
                    </Text>
                    <Text variant="body2" style={[
                      styles.optionDescription,
                      isEnabled && styles.selectedText,
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  <View style={styles.toggle}>
                    <View style={[
                      styles.toggleTrack,
                      isEnabled && styles.toggleTrackActive,
                    ]}>
                      <View style={[
                        styles.toggleThumb,
                        isEnabled && styles.toggleThumbActive,
                      ]} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Meal Reminder Times */}
        {mealReminders && (
          <Card style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>
              Meal Reminder Times
            </Text>
            <Text variant="body2" style={styles.sectionDescription}>
              Set when you'd like to receive reminders for each meal.
            </Text>
            
            <View style={styles.mealTimesList}>
              {mealReminderTimes.map((mealTime, index) => (
                <View key={index} style={styles.mealTimeItem}>
                  <View style={styles.mealTimeHeader}>
                    <TouchableOpacity
                      onPress={() => updateMealReminderTime(index, 'enabled', !mealTime.enabled)}
                      style={styles.mealTimeToggle}
                    >
                      <Ionicons 
                        name={mealTime.enabled ? 'checkmark-circle' : 'ellipse-outline'} 
                        size={20} 
                        color={mealTime.enabled ? Theme.colors.primary : Theme.colors.gray400} 
                      />
                      <Text variant="h5" style={[
                        styles.mealTimeTitle,
                        mealTime.enabled && styles.enabledMealTime,
                      ]}>
                        {mealTime.mealType}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {mealTime.enabled && (
                    <Input
                      value={mealTime.time}
                      onChangeText={(time) => updateMealReminderTime(index, 'time', time)}
                      placeholder="HH:MM"
                      style={styles.timeInput}
                    />
                  )}
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Shopping Reminders */}
        {shoppingReminders && (
          <Card style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>
              Shopping Reminder Day
            </Text>
            <Text variant="body2" style={styles.sectionDescription}>
              Choose which day you'd like to be reminded to go grocery shopping.
            </Text>
            
            <View style={styles.dayOptions}>
              {SHOPPING_DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => setShoppingReminderDay(day)}
                  style={[
                    styles.dayOption,
                    shoppingReminderDay === day && styles.selectedDayOption,
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    shoppingReminderDay === day && styles.selectedDayText,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Prep Reminder Time */}
        {prepReminders && (
          <Card style={styles.section}>
            <Text variant="h4" style={styles.sectionTitle}>
              Prep Reminder Time
            </Text>
            <Text variant="body2" style={styles.sectionDescription}>
              Set when you'd like to be reminded to prep your meals.
            </Text>
            
            <Input
              label="Prep Time"
              value={prepReminderTime}
              onChangeText={setPrepReminderTime}
              placeholder="HH:MM"
              style={styles.prepTimeInput}
              helperText="24-hour format (e.g., 10:00 for 10 AM)"
            />
          </Card>
        )}

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text variant="h4" style={styles.sectionTitle}>
            Notification Summary
          </Text>
          
          <View style={styles.summaryItems}>
            <View style={styles.summaryItem}>
              <Ionicons name="alarm" size={20} color={Theme.colors.primary} />
              <Text variant="body2" style={styles.summaryText}>
                Meal reminders: {mealReminders ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="bag" size={20} color={Theme.colors.success} />
              <Text variant="body2" style={styles.summaryText}>
                Shopping reminders: {shoppingReminders ? `${shoppingReminderDay}s` : 'Disabled'}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="time" size={20} color={Theme.colors.warning} />
              <Text variant="body2" style={styles.summaryText}>
                Prep reminders: {prepReminders ? `${prepReminderTime}` : 'Disabled'}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons 
                name={pushNotifications ? 'notifications' : 'notifications-off'} 
                size={20} 
                color={pushNotifications ? Theme.colors.success : Theme.colors.gray400} 
              />
              <Text variant="body2" style={styles.summaryText}>
                Push notifications: {pushNotifications ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons 
                name={emailNotifications ? 'mail' : 'mail-outline'} 
                size={20} 
                color={emailNotifications ? Theme.colors.info : Theme.colors.gray400} 
              />
              <Text variant="body2" style={styles.summaryText}>
                Email notifications: {emailNotifications ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
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
            title="Complete Setup"
            onPress={handleContinue}
            disabled={!canContinue}
            size="large"
            style={styles.continueButton}
          />
          
          <Text variant="caption" style={styles.noteText}>
            You can change these preferences anytime in Settings
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
  permissionCard: {
    backgroundColor: Theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: Theme.colors.primary + '30',
    marginBottom: Theme.spacing.lg,
  },
  successCard: {
    backgroundColor: Theme.colors.success + '10',
    borderWidth: 1,
    borderColor: Theme.colors.success + '30',
    marginBottom: Theme.spacing.lg,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  permissionTitle: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  successTitle: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.success,
    fontWeight: '600',
  },
  permissionDescription: {
    color: Theme.colors.gray700,
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
  },
  successDescription: {
    color: Theme.colors.gray700,
    lineHeight: 20,
  },
  permissionButton: {
    alignSelf: 'flex-start',
  },
  optionsList: {
    gap: Theme.spacing.md,
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  optionContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  optionTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  optionDescription: {
    color: Theme.colors.gray600,
  },
  selectedText: {
    color: Theme.colors.primary,
  },
  toggle: {
    marginLeft: Theme.spacing.md,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.gray300,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: Theme.colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  mealTimesList: {
    gap: Theme.spacing.lg,
  },
  mealTimeItem: {
    gap: Theme.spacing.md,
  },
  mealTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTimeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  mealTimeTitle: {
    color: Theme.colors.gray600,
    fontWeight: '600',
  },
  enabledMealTime: {
    color: Theme.colors.primary,
  },
  timeInput: {
    maxWidth: 120,
  },
  dayOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  dayOption: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.white,
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedDayOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  dayText: {
    color: Theme.colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  selectedDayText: {
    color: Theme.colors.white,
  },
  prepTimeInput: {
    maxWidth: 150,
  },
  summaryCard: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '20',
    marginBottom: Theme.spacing.lg,
  },
  summaryItems: {
    gap: Theme.spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  summaryText: {
    color: Theme.colors.text,
    flex: 1,
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
  noteText: {
    color: Theme.colors.gray400,
    textAlign: 'center',
    fontSize: 12,
  },
});