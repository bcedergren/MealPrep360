import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: '#4B7F47',
				tabBarInactiveTintColor: '#666',
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						position: 'absolute',
					},
					default: {},
				}),
			}}
		>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					tabBarIcon: ({ color }) => (
						<Ionicons
							name='home'
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='recipes'
				options={{
					title: 'Recipes',
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name='book-open-variant'
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='collections'
				options={{
					title: 'Collections',
					tabBarIcon: ({ color }) => (
						<Ionicons
							name='folder'
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='meal-plan'
				options={{
					title: 'Meal Plan',
					tabBarIcon: ({ color }) => (
						<Ionicons
							name='calendar'
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='social'
				options={{
					title: 'Social',
					tabBarIcon: ({ color }) => (
						<Ionicons
							name='people'
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='shopping'
				options={{
					title: 'Shopping',
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name='cart'
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='profile'
				options={{
					title: 'Profile',
					tabBarIcon: ({ color }) => (
						<Ionicons
							name='person'
							size={24}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
