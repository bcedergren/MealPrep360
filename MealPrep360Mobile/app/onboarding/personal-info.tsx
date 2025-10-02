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
import { PersonalInfoStepData } from '../../src/types/onboarding';

interface GenderOption {
  id: PersonalInfoStepData['gender'];
  title: string;
  icon: string;
}

interface ActivityLevelOption {
  id: PersonalInfoStepData['activityLevel'];
  title: string;
  description: string;
  examples: string;
}

const GENDER_OPTIONS: GenderOption[] = [
  { id: 'male', title: 'Male', icon: 'male' },
  { id: 'female', title: 'Female', icon: 'female' },
  { id: 'non-binary', title: 'Non-binary', icon: 'person' },
  { id: 'prefer-not-to-say', title: 'Prefer not to say', icon: 'help-circle' },
];

const ACTIVITY_LEVELS: ActivityLevelOption[] = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
    examples: 'Desk job, minimal physical activity',
  },
  {
    id: 'lightly-active',
    title: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    examples: 'Walking, light yoga, occasional workouts',
  },
  {
    id: 'moderately-active',
    title: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    examples: 'Regular gym, sports, active lifestyle',
  },
  {
    id: 'very-active',
    title: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    examples: 'Daily workouts, competitive sports',
  },
  {
    id: 'extremely-active',
    title: 'Extremely Active',
    description: 'Very hard exercise, physical job',
    examples: 'Professional athlete, manual labor',
  },
];

export default function PersonalInfoScreen() {
  const { updateStepData, completeStep, stepData, getValidationErrors } = useOnboarding();
  
  // Form state
  const [firstName, setFirstName] = useState(stepData.personalInfo?.firstName || '');
  const [lastName, setLastName] = useState(stepData.personalInfo?.lastName || '');
  const [email, setEmail] = useState(stepData.personalInfo?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState(stepData.personalInfo?.dateOfBirth || '');
  const [selectedGender, setSelectedGender] = useState<PersonalInfoStepData['gender']>(
    stepData.personalInfo?.gender
  );
  
  // Height state
  const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>(
    stepData.personalInfo?.height?.unit || 'ft'
  );
  const [heightFeet, setHeightFeet] = useState(
    stepData.personalInfo?.height?.feet?.toString() || ''
  );
  const [heightInches, setHeightInches] = useState(
    stepData.personalInfo?.height?.inches?.toString() || ''
  );
  const [heightCm, setHeightCm] = useState(
    stepData.personalInfo?.height?.cm?.toString() || ''
  );
  
  // Weight state
  const [weightValue, setWeightValue] = useState(
    stepData.personalInfo?.weight?.value?.toString() || ''
  );
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>(
    stepData.personalInfo?.weight?.unit || 'lbs'
  );
  
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<PersonalInfoStepData['activityLevel']>(
    stepData.personalInfo?.activityLevel || 'moderately-active'
  );
  
  // Location state
  const [country, setCountry] = useState(stepData.personalInfo?.location?.country || 'United States');
  const [state, setState] = useState(stepData.personalInfo?.location?.state || '');
  const [city, setCity] = useState(stepData.personalInfo?.location?.city || '');

  // Auto-save on field changes
  useEffect(() => {
    const personalInfoData: PersonalInfoStepData = {
      firstName,
      lastName,
      email,
      dateOfBirth: dateOfBirth || undefined,
      gender: selectedGender,
      height: heightUnit === 'ft' 
        ? {
            unit: 'ft',
            feet: heightFeet ? parseInt(heightFeet) : undefined,
            inches: heightInches ? parseInt(heightInches) : undefined,
          }
        : {
            unit: 'cm',
            cm: heightCm ? parseInt(heightCm) : undefined,
          },
      weight: weightValue ? {
        value: parseFloat(weightValue),
        unit: weightUnit,
      } : undefined,
      activityLevel: selectedActivityLevel,
      location: (country || state || city) ? {
        country,
        state: state || undefined,
        city: city || undefined,
      } : undefined,
    };

    updateStepData('personal-info', personalInfoData);
  }, [
    firstName, lastName, email, dateOfBirth, selectedGender,
    heightUnit, heightFeet, heightInches, heightCm,
    weightValue, weightUnit, selectedActivityLevel,
    country, state, city, updateStepData
  ]);

  const handleContinue = async () => {
    const personalInfoData: PersonalInfoStepData = {
      firstName,
      lastName,
      email,
      dateOfBirth: dateOfBirth || undefined,
      gender: selectedGender,
      height: heightUnit === 'ft' 
        ? {
            unit: 'ft',
            feet: heightFeet ? parseInt(heightFeet) : undefined,
            inches: heightInches ? parseInt(heightInches) : undefined,
          }
        : {
            unit: 'cm',
            cm: heightCm ? parseInt(heightCm) : undefined,
          },
      weight: weightValue ? {
        value: parseFloat(weightValue),
        unit: weightUnit,
      } : undefined,
      activityLevel: selectedActivityLevel,
      location: (country || state || city) ? {
        country,
        state: state || undefined,
        city: city || undefined,
      } : undefined,
    };

    await completeStep('personal-info', personalInfoData);
  };

  const validateAge = (birthDate: string): boolean => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    return age >= 13 && age <= 120; // Reasonable age range
  };

  const handleDateOfBirthChange = (text: string) => {
    // Auto-format as MM/DD/YYYY
    let formatted = text.replace(/\D/g, '');
    if (formatted.length >= 2) {
      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
    }
    if (formatted.length >= 5) {
      formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
    }
    setDateOfBirth(formatted);
  };

  const validationErrors = getValidationErrors('personal-info');
  const canContinue = firstName.trim() && lastName.trim() && email.trim() && selectedActivityLevel;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" style={styles.title}>
            Tell us about yourself
          </Text>
          <Text variant="body1" style={styles.subtitle}>
            This information helps us calculate your nutritional needs and provide personalized recommendations.
          </Text>
        </View>

        {/* Basic Information */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Basic Information
          </Text>
          
          <View style={styles.row}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              style={styles.halfInput}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              style={styles.halfInput}
              required
            />
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Input
            label="Date of Birth (Optional)"
            value={dateOfBirth}
            onChangeText={handleDateOfBirthChange}
            placeholder="MM/DD/YYYY"
            keyboardType="numeric"
            maxLength={10}
            helperText="Used to calculate age-appropriate nutrition recommendations"
          />
        </Card>

        {/* Gender Selection */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Gender (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Helps us provide more accurate calorie and nutrition calculations.
          </Text>
          
          <View style={styles.genderGrid}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedGender(option.id)}
                style={[
                  styles.genderOption,
                  selectedGender === option.id && styles.selectedGenderOption,
                ]}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={selectedGender === option.id ? Theme.colors.primary : Theme.colors.gray600} 
                />
                <Text 
                  variant="body1" 
                  style={[
                    styles.genderOptionText,
                    selectedGender === option.id && styles.selectedGenderText,
                  ]}
                >
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Physical Measurements */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Physical Measurements (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Used to calculate your daily calorie needs and macro targets.
          </Text>

          {/* Height */}
          <View style={styles.measurementGroup}>
            <Text variant="h5" style={styles.measurementTitle}>
              Height
            </Text>
            
            <View style={styles.unitToggle}>
              <TouchableOpacity
                onPress={() => setHeightUnit('ft')}
                style={[
                  styles.unitButton,
                  heightUnit === 'ft' && styles.selectedUnitButton,
                ]}
              >
                <Text style={[
                  styles.unitButtonText,
                  heightUnit === 'ft' && styles.selectedUnitText,
                ]}>
                  ft/in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setHeightUnit('cm')}
                style={[
                  styles.unitButton,
                  heightUnit === 'cm' && styles.selectedUnitButton,
                ]}
              >
                <Text style={[
                  styles.unitButtonText,
                  heightUnit === 'cm' && styles.selectedUnitText,
                ]}>
                  cm
                </Text>
              </TouchableOpacity>
            </View>

            {heightUnit === 'ft' ? (
              <View style={styles.row}>
                <Input
                  label="Feet"
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                  placeholder="5"
                  keyboardType="numeric"
                  style={styles.halfInput}
                  maxLength={1}
                />
                <Input
                  label="Inches"
                  value={heightInches}
                  onChangeText={setHeightInches}
                  placeholder="10"
                  keyboardType="numeric"
                  style={styles.halfInput}
                  maxLength={2}
                />
              </View>
            ) : (
              <Input
                label="Centimeters"
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="175"
                keyboardType="numeric"
                maxLength={3}
              />
            )}
          </View>

          {/* Weight */}
          <View style={styles.measurementGroup}>
            <Text variant="h5" style={styles.measurementTitle}>
              Current Weight
            </Text>
            
            <View style={styles.unitToggle}>
              <TouchableOpacity
                onPress={() => setWeightUnit('lbs')}
                style={[
                  styles.unitButton,
                  weightUnit === 'lbs' && styles.selectedUnitButton,
                ]}
              >
                <Text style={[
                  styles.unitButtonText,
                  weightUnit === 'lbs' && styles.selectedUnitText,
                ]}>
                  lbs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setWeightUnit('kg')}
                style={[
                  styles.unitButton,
                  weightUnit === 'kg' && styles.selectedUnitButton,
                ]}
              >
                <Text style={[
                  styles.unitButtonText,
                  weightUnit === 'kg' && styles.selectedUnitText,
                ]}>
                  kg
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label={`Weight (${weightUnit})`}
              value={weightValue}
              onChangeText={setWeightValue}
              placeholder={weightUnit === 'lbs' ? '150' : '68'}
              keyboardType="decimal-pad"
            />
          </View>
        </Card>

        {/* Activity Level */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Activity Level
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            This affects your daily calorie needs. You can change this later.
          </Text>
          
          <View style={styles.activityLevels}>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => setSelectedActivityLevel(level.id)}
                style={[
                  styles.activityLevel,
                  selectedActivityLevel === level.id && styles.selectedActivityLevel,
                ]}
              >
                <View style={styles.activityLevelContent}>
                  <Text variant="h5" style={[
                    styles.activityLevelTitle,
                    selectedActivityLevel === level.id && styles.selectedActivityText,
                  ]}>
                    {level.title}
                  </Text>
                  <Text variant="body2" style={[
                    styles.activityLevelDescription,
                    selectedActivityLevel === level.id && styles.selectedActivityText,
                  ]}>
                    {level.description}
                  </Text>
                  <Text variant="caption" style={[
                    styles.activityLevelExamples,
                    selectedActivityLevel === level.id && styles.selectedActivityText,
                  ]}>
                    {level.examples}
                  </Text>
                </View>
                {selectedActivityLevel === level.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Location (Optional) */}
        <Card style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Location (Optional)
          </Text>
          <Text variant="body2" style={styles.sectionDescription}>
            Helps us suggest local grocery stores and seasonal recipes.
          </Text>
          
          <Input
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="United States"
          />
          
          <View style={styles.row}>
            <Input
              label="State/Province"
              value={state}
              onChangeText={setState}
              placeholder="California"
              style={styles.halfInput}
            />
            <Input
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="San Francisco"
              style={styles.halfInput}
            />
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
              Please fill in the required fields to continue
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
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  genderOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedGenderOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  genderOptionText: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.text,
  },
  selectedGenderText: {
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  measurementGroup: {
    marginBottom: Theme.spacing.lg,
  },
  measurementTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.md,
  },
  unitToggle: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.md,
    padding: 2,
  },
  unitButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  selectedUnitButton: {
    backgroundColor: Theme.colors.primary,
  },
  unitButtonText: {
    color: Theme.colors.gray600,
    fontWeight: '500',
  },
  selectedUnitText: {
    color: Theme.colors.white,
  },
  activityLevels: {
    gap: Theme.spacing.md,
  },
  activityLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.white,
  },
  selectedActivityLevel: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  activityLevelContent: {
    flex: 1,
  },
  activityLevelTitle: {
    color: Theme.colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  activityLevelDescription: {
    color: Theme.colors.gray600,
    marginBottom: Theme.spacing.xs,
  },
  activityLevelExamples: {
    color: Theme.colors.gray500,
    fontStyle: 'italic',
  },
  selectedActivityText: {
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