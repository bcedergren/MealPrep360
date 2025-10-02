import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import RecipeCard from '../components/RecipeCard';
import { API_BASE_URL } from '../src/constants/api';
import { debugClerkAuth } from '../src/utils/debugAuth';

type RootStackParamList = {
	Home: undefined;
	SignUp: undefined;
	Login: undefined;
	Dashboard: undefined;
	SavedRecipes: undefined;
	MealPlan: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Recipe {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	prepTime: number;
	cookTime: number;
	servings: number;
}

export default function DashboardScreen() {
	const { signOut, getToken } = useAuth();
	const navigation = useNavigation<NavigationProp>();
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);

	useEffect(() => {
		fetchRecipes();
		const fetchSavedRecipeIds = async () => {
			try {
				const token = await getToken();
				console.log('Dashboard - Token for saved recipes request:', {
					hasToken: !!token,
					tokenLength: token?.length,
					tokenPreview: token?.substring(0, 20) + '...',
				});

				// Note: The API doesn't have a specific saved recipes endpoint
				// This needs to be implemented on the backend or we need to track saved recipes locally
				// For now, we'll skip this feature
				console.log('Note: Saved recipes endpoint not available in API');
				setSavedRecipeIds([]);
			} catch (error) {
				console.error('Dashboard - Error fetching saved recipe IDs:', error);
			}
		};
		fetchSavedRecipeIds();
	}, [getToken]);

	const fetchRecipes = async () => {
		try {
			setLoading(true);
			setError(null);

			// Debug Clerk authentication
			const token = await debugClerkAuth(getToken);

			if (!token) {
				console.error('❌ No valid token available');
				setError('Authentication failed. Please try signing in again.');
				return;
			}

			// Fetch recommended recipes using the proper recommendations endpoint
			const response = await fetch(`${API_BASE_URL}/api/recipes/recommended`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const recipesData = await response.json();
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
				setRecipes(mappedRecipes);
				setError(null);
			} else {
				const errorText = await response.text();
				console.error('API Error:', {
					status: response.status,
					statusText: response.statusText,
					errorText,
					url: response.url,
				});

				if (response.status === 401) {
					setError(
						'Authentication failed. Please try logging out and back in.'
					);
				} else if (response.status === 404) {
					setError(
						'The recipes API endpoint is not available. Please contact support.'
					);
				} else {
					setError(
						`Failed to load recommendations (${response.status}). Please try again.`
					);
				}
				setRecipes([]);
			}
		} catch (error) {
			console.error('💥 Error in fetchRecipes:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Network error occurred';
			setError(`Failed to load recommendations: ${errorMessage}`);
			setRecipes([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut();
			navigation.navigate('Home');
		} catch (err) {
			console.error('Error signing out:', err);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Image
					source={require('../assets/images/logo_dark.png')}
					style={styles.logo}
					resizeMode='contain'
				/>
				<TouchableOpacity
					style={styles.signOutButton}
					onPress={handleSignOut}
				>
					<Ionicons
						name='log-out'
						size={24}
						color='#4B7F47'
					/>
				</TouchableOpacity>
			</View>

			<View style={styles.quickAccess}>
				<TouchableOpacity
					style={[styles.quickAccessButton, styles.activeQuickAccessButton]}
				>
					<MaterialCommunityIcons
						name='book-open-variant'
						size={32}
						color='#E8A053'
					/>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.quickAccessButton}
					onPress={() => navigation.navigate('MealPlan')}
				>
					<Ionicons
						name='calendar'
						size={32}
						color='#4B7F47'
					/>
				</TouchableOpacity>

				<TouchableOpacity style={styles.quickAccessButton}>
					<MaterialCommunityIcons
						name='cart'
						size={32}
						color='#4B7F47'
					/>
				</TouchableOpacity>

				<TouchableOpacity style={styles.quickAccessButton}>
					<MaterialCommunityIcons
						name='snowflake'
						size={32}
						color='#4B7F47'
					/>
				</TouchableOpacity>
			</View>

			<ScrollView style={styles.content}>
				<Text style={styles.sectionTitle}>Recommended Recipes</Text>
				{loading ? (
					<ActivityIndicator
						size='large'
						color='#4B7F47'
						style={styles.loader}
					/>
				) : error ? (
					<View style={styles.errorState}>
						<MaterialCommunityIcons
							name='alert-circle-outline'
							size={48}
							color='#EF4444'
						/>
						<Text style={styles.errorText}>{error}</Text>
						<TouchableOpacity
							style={styles.retryButton}
							onPress={fetchRecipes}
						>
							<Text style={styles.retryButtonText}>Retry</Text>
						</TouchableOpacity>
					</View>
				) : recipes.length === 0 ? (
					<View style={styles.emptyState}>
						<MaterialCommunityIcons
							name='food-off'
							size={48}
							color='#4B7F47'
						/>
						<Text style={styles.emptyStateText}>No recipes available</Text>
						<Text style={styles.emptyStateSubtext}>
							Check back later for personalized recommendations
						</Text>
					</View>
				) : (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.recipeScroll}
					>
						{recipes.map((recipe) => (
							<RecipeCard
								key={recipe.id}
								id={recipe.id}
								title={recipe.title}
								description={recipe.description}
								imageUrl={recipe.imageUrl}
								prepTime={recipe.prepTime}
								cookTime={recipe.cookTime}
								servings={recipe.servings}
								onSave={() => {
									// No need to refetch recipes when saving
									// The RecipeCard component handles its own state
								}}
								isInitiallySaved={savedRecipeIds.includes(recipe.id)}
							/>
						))}
					</ScrollView>
				)}
			</ScrollView>

			<View style={styles.bottomNav}>
				<TouchableOpacity style={styles.navButton}>
					<Ionicons
						name='home'
						size={24}
						color='#E8A053'
					/>
					<Text style={[styles.navText, { color: '#E8A053' }]}>Home</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.navButton}
					onPress={() => navigation.navigate('SavedRecipes')}
				>
					<MaterialCommunityIcons
						name='book-open-variant'
						size={24}
						color='#4B7F47'
					/>
					<Text style={styles.navText}>Recipes</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.navButton}
					onPress={() => navigation.navigate('MealPlan')}
				>
					<Ionicons
						name='calendar'
						size={24}
						color='#4B7F47'
					/>
					<Text style={styles.navText}>Meal Plan</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.navButton}>
					<MaterialCommunityIcons
						name='tune'
						size={24}
						color='#4B7F47'
					/>
					<Text style={styles.navText}>Preferences</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.navButton}>
					<Ionicons
						name='settings'
						size={24}
						color='#4B7F47'
					/>
					<Text style={styles.navText}>Settings</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
		backgroundColor: '#2F2F2F',
	},
	logo: {
		width: 150,
		height: 40,
	},
	signOutButton: {
		padding: 8,
	},
	quickAccess: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 20,
		paddingHorizontal: 10,
		backgroundColor: '#fff',
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
	},
	quickAccessButton: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
		borderRadius: 8,
		backgroundColor: '#F9FAFB',
		width: '22%',
	},
	activeQuickAccessButton: {
		backgroundColor: '#FFF5EB',
	},
	content: {
		flex: 1,
		padding: 20,
	},
	sectionTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#2F2F2F',
		marginBottom: 16,
	},
	recipeScroll: {
		paddingRight: 20,
	},
	loader: {
		marginTop: 20,
	},
	bottomNav: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 5,
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#E5E7EB',
	},
	navButton: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},
	navText: {
		fontSize: 12,
		color: '#4B7F47',
		marginTop: 4,
	},
	errorState: {
		flexDirection: 'column',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: '#EF4444',
		marginBottom: 20,
	},
	retryButton: {
		padding: 12,
		borderRadius: 8,
		backgroundColor: '#4B7F47',
	},
	retryButtonText: {
		fontSize: 16,
		color: '#fff',
		fontWeight: 'bold',
	},
	emptyState: {
		flexDirection: 'column',
		alignItems: 'center',
		padding: 20,
	},
	emptyStateText: {
		fontSize: 16,
		color: '#4B7F47',
		fontWeight: 'bold',
		marginBottom: 10,
	},
	emptyStateSubtext: {
		fontSize: 12,
		color: '#4B7F47',
	},
});
