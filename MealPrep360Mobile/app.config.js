// Set the app root for expo-router before exporting config
const path = require('path');
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app');

module.exports = {
	expo: {
		name: 'MealPrep360',
		slug: 'mealprepmobile',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/images/icon.png',
		userInterfaceStyle: 'light',
		scheme: 'mealprep360',
		splash: {
			image: './assets/images/splash.png',
			resizeMode: 'contain',
			backgroundColor: '#4B7F47',
		},
		updates: {
			fallbackToCacheTimeout: 0,
		},
		assetBundlePatterns: ['**/*'],
		ios: {
			supportsTablet: true,
			jsEngine: 'hermes',
			bundleIdentifier: 'com.mealprep360.mobile',
			buildNumber: '1',
			infoPlist: {
				NSCameraUsageDescription: 'MealPrep360 needs access to your camera to take photos of your meals and recipes.',
				NSPhotoLibraryUsageDescription: 'MealPrep360 needs access to your photo library to save and share recipe photos.',
				NSUserNotificationsUsageDescription: 'MealPrep360 sends meal reminders and planning notifications to help you stay on track.',
			},
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/images/adaptive-icon.png',
				backgroundColor: '#4B7F47',
			},
			jsEngine: 'hermes',
			package: 'com.mealprep360.mobile',
			versionCode: 1,
			permissions: [
				'CAMERA',
				'READ_EXTERNAL_STORAGE',
				'WRITE_EXTERNAL_STORAGE',
				'RECEIVE_BOOT_COMPLETED',
				'VIBRATE',
				'WAKE_LOCK',
			],
		},
		web: {
			favicon: './assets/images/icon.png',
			bundling: {
				minify: true,
			},
		},
		plugins: [
			'expo-router',
			[
				'expo-notifications',
				{
					icon: './assets/images/notification-icon.png',
					color: '#4B7F47',
					sounds: ['./assets/sounds/notification.wav'],
				},
			],
		],
		extra: {
			apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.mealprep360.com',
			// Get your production key from Clerk Dashboard → Production → API Keys
			clerkPublishableKey:
				process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
				'pk_test_dGVzdGluZy1jb2RlLWxlYXJuaW5nLWFwcC1iYXNlLWFwcC1kZXZlbG9wbWVudC1rZXk',
		},
	},
};
