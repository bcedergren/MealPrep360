import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/useColorScheme';

// Get the publishable key from the app config
const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey;

if (!publishableKey) {
	console.warn('Please set your Clerk publishable key in app.config.js');
}

function AuthenticatedLayout() {
	const { isSignedIn, isLoaded } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoaded) return;

		if (isSignedIn) {
			router.replace('/(tabs)');
		} else {
			router.replace('/login');
		}
	}, [isSignedIn, isLoaded]);

	return (
		<Stack>
			<Stack.Screen
				name='(tabs)'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='login'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='signup'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='recipe/[id]'
				options={{ headerShown: false }}
			/>
			<Stack.Screen name='+not-found' />
		</Stack>
	);
}

const CLERK_PUBLISHABLE_KEY = publishableKey;

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
	});

	if (!loaded) {
		// Async font loading only occurs in development.
		return null;
	}

	return (
		<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
			<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
				<AuthenticatedLayout />
				<StatusBar style='auto' />
			</ThemeProvider>
		</ClerkProvider>
	);
}
