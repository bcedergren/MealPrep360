import { useAuth } from '@clerk/clerk-expo';
import { router, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (isSignedIn && !inTabsGroup) {
      // User is signed in but not in protected area, redirect to tabs
      router.replace('/(tabs)/');
    } else if (!isSignedIn && !inAuthGroup) {
      // User is not signed in but not in auth area, redirect to login
      router.replace('/login');
    }

    setIsNavigationReady(true);
  }, [isLoaded, isSignedIn, segments]);

  // Show loading screen while Clerk loads or while navigating
  if (!isLoaded || !isNavigationReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B7F47" />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});