import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // User is signed in, redirect to onboarding first
        // The onboarding flow will handle checking completion status
        router.replace('/onboarding');
      }
    }
  }, [isLoaded, isSignedIn]);

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  const navigateToSignUp = () => {
    router.push('/(auth)/signup');
  };

  if (!isLoaded) {
    // Show loading state while Clerk loads
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant" size={48} color="#4B7F47" />
          </View>
          <Text style={styles.logoText}>MealPrep360</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="restaurant" size={48} color="#4B7F47" />
            </View>
            <Text style={styles.logoText}>MealPrep360</Text>
            <Text style={styles.tagline}>Plan • Prep • Prosper</Text>
          </View>
          
          <Text style={styles.heroTitle}>
            Transform Your{'\n'}Meal Planning
          </Text>
          <Text style={styles.heroSubtitle}>
            Streamline your weekly meal prep with smart planning, recipe management, and automated shopping lists.
          </Text>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="calendar-check" size={32} color="#4B7F47" />
              <Text style={styles.featureText}>Plan Meals</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="book-open-variant" size={32} color="#E8A053" />
              <Text style={styles.featureText}>Save Recipes</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="cart-check" size={32} color="#6366F1" />
              <Text style={styles.featureText}>Auto Shopping</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="clock-fast" size={32} color="#EF4444" />
              <Text style={styles.featureText}>Save Time</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToSignUp}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToLogin}>
            <Text style={styles.secondaryButtonText}>I Have an Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join thousands who've simplified their meal prep
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4B7F47',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2F2F2F',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2F2F2F',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    paddingVertical: 40,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F2F2F',
    marginTop: 8,
    textAlign: 'center',
  },
  actionContainer: {
    paddingVertical: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#4B7F47',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4B7F47',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  secondaryButton: {
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#4B7F47',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});