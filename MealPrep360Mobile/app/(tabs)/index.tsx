import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	Image,
	RefreshControl,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useApiClient } from '../../src/services/api';

const { width } = Dimensions.get('window');

interface Recipe {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	prepTime: number;
	cookTime: number;
	servings: number;
}

interface UserStats {
	totalRecipes: number;
	savedRecipes: number;
	mealPlansCreated: number;
	favoriteCuisine: string;
}

interface RecentActivity {
	id: string;
	type: 'recipe_saved' | 'meal_planned' | 'shopping_completed';
	title: string;
	subtitle: string;
	timestamp: string;
}

export default function HomeScreen() {
	const { signOut, getToken, isSignedIn } = useAuth();
	const apiClient = useApiClient();
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [stats, setStats] = useState<UserStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [userName, setUserName] = useState('');
	const [refreshing, setRefreshing] = useState(false);
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
	const [todayStats, setTodayStats] = useState({
		plannedMeals: 3,
		completedMeals: 1,
		shoppingItems: 8,
	});

	useEffect(() => {
		if (!isSignedIn) {
			// Redirect to login if not signed in
			router.replace('/login');
			return;
		}

		fetchDashboardData();
	}, [isSignedIn]);

	const fetchDashboardData = async () => {
		try {
			// Fetch recommended recipes using the authenticated API service
			const recipesData = await apiClient.getRecommendedRecipes();

			// Map API response to match component interface (API uses _id, component expects id)
			const mappedRecipes = Array.isArray(recipesData)
				? recipesData.map((recipe: any) => ({
						id: recipe._id || recipe.id,
						title: recipe.title,
						description: recipe.description,
						imageUrl: recipe.imageUrl || '',
						prepTime: recipe.prepTime,
						cookTime: recipe.cookTime,
						servings: recipe.servings,
					}))
				: [];
			setRecipes(mappedRecipes.slice(0, 5));

			// You can add more API calls here for user stats when available
			setStats({
				totalRecipes: 0,
				savedRecipes: 0,
				mealPlansCreated: 0,
				favoriteCuisine: 'Italian',
			});

			// Use mock data for recent activity
			setRecentActivity([
				{
					id: '1',
					type: 'recipe_saved',
					title: 'Grilled Chicken Salad',
					subtitle: 'Saved to your recipes',
					timestamp: '2 hours ago',
				},
				{
					id: '2',
					type: 'meal_planned',
					title: 'Week of Jan 15-21',
					subtitle: 'Meal plan created',
					timestamp: '1 day ago',
				},
				{
					id: '3',
					type: 'shopping_completed',
					title: 'Weekly Groceries',
					subtitle: '12 items completed',
					timestamp: '2 days ago',
				},
			]);
		} catch (error) {
			console.error('Error fetching dashboard data:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut();
			router.replace('/login');
		} catch (err) {
			console.error('Error signing out:', err);
		}
	};

	const QuickActionButton = ({
		title,
		icon,
		onPress,
		color = '#4B7F47',
	}: {
		title: string;
		icon: string;
		onPress: () => void;
		color?: string;
	}) => (
		<TouchableOpacity
			style={styles.quickActionButton}
			onPress={onPress}
		>
			<View style={[styles.quickActionIcon, { backgroundColor: color }]}>
				<MaterialCommunityIcons
					name={icon as any}
					size={28}
					color='white'
				/>
			</View>
			<Text style={styles.quickActionText}>{title}</Text>
		</TouchableOpacity>
	);

	const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
		<TouchableOpacity
			style={styles.recipeCard}
			onPress={() => router.push(`/recipe/${recipe.id}`)}
		>
			<Image
				source={{ uri: recipe.imageUrl || 'https://via.placeholder.com/150' }}
				style={styles.recipeImage}
			/>
			<View style={styles.recipeInfo}>
				<Text
					style={styles.recipeTitle}
					numberOfLines={2}
				>
					{recipe.title}
				</Text>
				<Text style={styles.recipeTime}>
					{recipe.prepTime + recipe.cookTime} min
				</Text>
			</View>
		</TouchableOpacity>
	);

	const onRefresh = () => {
		setRefreshing(true);
		fetchDashboardData().finally(() => setRefreshing(false));
	};

	const renderGreeting = () => {
		const hour = new Date().getHours();
		let greeting = 'Good morning';
		if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
		else if (hour >= 17) greeting = 'Good evening';

		return (
			<View style={styles.greetingContainer}>
				<Text style={styles.greeting}>{greeting}!</Text>
				<Text style={styles.subGreeting}>
					Ready to prep some delicious meals?
				</Text>
			</View>
		);
	};

	const renderTodayStats = () => (
		<View style={styles.statsContainer}>
			<Text style={styles.sectionTitle}>Today's Progress</Text>
			<View style={styles.statsGrid}>
				<View style={styles.statCard}>
					<View style={styles.statIconContainer}>
						<Ionicons
							name='restaurant'
							size={24}
							color='#4B7F47'
						/>
					</View>
					<Text style={styles.statNumber}>
						{todayStats.completedMeals}/{todayStats.plannedMeals}
					</Text>
					<Text style={styles.statLabel}>Meals</Text>
				</View>

				<View style={styles.statCard}>
					<View style={styles.statIconContainer}>
						<MaterialCommunityIcons
							name='cart-check'
							size={24}
							color='#E8A053'
						/>
					</View>
					<Text style={styles.statNumber}>{todayStats.shoppingItems}</Text>
					<Text style={styles.statLabel}>Shopping Items</Text>
				</View>

				<View style={styles.statCard}>
					<View style={styles.statIconContainer}>
						<MaterialCommunityIcons
							name='fire'
							size={24}
							color='#EF4444'
						/>
					</View>
					<Text style={styles.statNumber}>7</Text>
					<Text style={styles.statLabel}>Day Streak</Text>
				</View>
			</View>
		</View>
	);

	const renderQuickActions = () => (
		<View style={styles.quickActionsContainer}>
			<Text style={styles.sectionTitle}>Quick Actions</Text>
			<View style={styles.quickActionsGrid}>
				<QuickActionButton
					title='Browse Recipes'
					icon='book-open-variant'
					onPress={() => router.push('/recipes')}
				/>
				<QuickActionButton
					title='Meal Plan'
					icon='calendar'
					onPress={() => router.push('/meal-plan')}
					color='#E8A053'
				/>
				<QuickActionButton
					title='Shopping List'
					icon='cart'
					onPress={() => router.push('/shopping')}
					color='#8B5CF6'
				/>
				<QuickActionButton
					title='My Profile'
					icon='account'
					onPress={() => router.push('/profile')}
					color='#EF4444'
				/>
			</View>
		</View>
	);

	const renderRecentActivity = () => (
		<View style={styles.activityContainer}>
			<Text style={styles.sectionTitle}>Recent Activity</Text>
			{recentActivity.map((activity) => (
				<View
					key={activity.id}
					style={styles.activityItem}
				>
					<View style={styles.activityIcon}>
						{activity.type === 'recipe_saved' && (
							<MaterialCommunityIcons
								name='bookmark'
								size={20}
								color='#4B7F47'
							/>
						)}
						{activity.type === 'meal_planned' && (
							<Ionicons
								name='calendar'
								size={20}
								color='#E8A053'
							/>
						)}
						{activity.type === 'shopping_completed' && (
							<MaterialCommunityIcons
								name='check-circle'
								size={20}
								color='#10B981'
							/>
						)}
					</View>
					<View style={styles.activityContent}>
						<Text style={styles.activityTitle}>{activity.title}</Text>
						<Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
					</View>
					<Text style={styles.activityTime}>{activity.timestamp}</Text>
				</View>
			))}
		</View>
	);

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator
						size='large'
						color='#4B7F47'
					/>
					<Text style={styles.loadingText}>Loading your dashboard...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={['#4B7F47']}
						tintColor='#4B7F47'
					/>
				}
			>
				{renderGreeting()}
				{renderTodayStats()}
				{renderQuickActions()}
				{renderRecentActivity()}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8F9FA',
	},
	scrollView: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		color: '#666',
		fontSize: 16,
	},
	greetingContainer: {
		paddingHorizontal: 20,
		paddingVertical: 24,
		backgroundColor: '#F9FAFB',
	},
	greeting: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#2F2F2F',
		marginBottom: 4,
	},
	subGreeting: {
		fontSize: 16,
		color: '#666',
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#2F2F2F',
		marginBottom: 16,
	},
	statsContainer: {
		paddingHorizontal: 20,
		paddingVertical: 24,
	},
	statsGrid: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	statCard: {
		flex: 1,
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#F9FAFB',
		borderRadius: 12,
		marginHorizontal: 4,
	},
	statIconContainer: {
		marginBottom: 8,
	},
	statNumber: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#2F2F2F',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		color: '#666',
		textAlign: 'center',
	},
	quickActionsContainer: {
		paddingHorizontal: 20,
		paddingVertical: 24,
	},
	quickActionsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	quickActionButton: {
		alignItems: 'center',
		flex: 1,
		marginHorizontal: 4,
	},
	quickActionIcon: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
	},
	quickActionText: {
		fontSize: 12,
		color: '#333',
		textAlign: 'center',
		fontWeight: '500',
	},
	activityContainer: {
		paddingHorizontal: 20,
		paddingVertical: 24,
	},
	activityItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6',
	},
	activityIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#F9FAFB',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	activityContent: {
		flex: 1,
	},
	activityTitle: {
		fontSize: 16,
		fontWeight: '500',
		color: '#2F2F2F',
		marginBottom: 2,
	},
	activitySubtitle: {
		fontSize: 14,
		color: '#666',
	},
	activityTime: {
		fontSize: 12,
		color: '#999',
	},
	recipeCard: {
		width: 160,
		marginRight: 16,
		backgroundColor: '#F8F9FA',
		borderRadius: 12,
		overflow: 'hidden',
	},
	recipeImage: {
		width: '100%',
		height: 120,
		backgroundColor: '#E5E5E5',
	},
	recipeInfo: {
		padding: 12,
	},
	recipeTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333',
		lineHeight: 18,
	},
	recipeTime: {
		fontSize: 12,
		color: '#666',
		marginTop: 4,
	},
});
