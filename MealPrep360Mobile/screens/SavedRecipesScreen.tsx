import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	RefreshControl,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import RecipeCard from '../components/RecipeCard';
import { API_BASE_URL } from '../src/constants/api';
import { testSavedRecipesAPI } from '../src/utils/debugAuth';

type RootStackParamList = {
	Home: undefined;
	SignUp: undefined;
	Login: undefined;
	Dashboard: undefined;
	SavedRecipes: undefined;
	RecipeDetails: {
		recipe: {
			id: string;
			title: string;
			description: string;
			imageUrl: string;
			prepTime: number;
			cookTime: number;
			servings: number;
		};
	};
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

export default function SavedRecipesScreen() {
	const { getToken } = useAuth();
	const navigation = useNavigation<NavigationProp>();
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		fetchSavedRecipes();
	}, []);

	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredRecipes(recipes);
		} else {
			const query = searchQuery.toLowerCase();
			const filtered = recipes.filter(
				(recipe) =>
					recipe.title.toLowerCase().includes(query) ||
					recipe.description.toLowerCase().includes(query)
			);
			setFilteredRecipes(filtered);
		}
	}, [searchQuery, recipes]);

	const onRefresh = React.useCallback(() => {
		setRefreshing(true);
		fetchSavedRecipes().finally(() => setRefreshing(false));
	}, []);

	const fetchSavedRecipes = async () => {
		try {
			setLoading(true);
			setError(null);
			const token = await getToken();

			console.log('Saved Recipes Debug Info:', {
				hasToken: !!token,
				tokenLength: token?.length,
				apiBaseUrl: API_BASE_URL,
				fullUrl: `${API_BASE_URL}/api/user/recipes/saved`,
			});

			// First get the saved recipe IDs
			const savedResponse = await fetch(
				`${API_BASE_URL}/api/user/recipes/saved`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
				}
			);

			console.log('Saved Recipes API Response:', {
				status: savedResponse.status,
				statusText: savedResponse.statusText,
				url: savedResponse.url,
				headers: Object.fromEntries(savedResponse.headers.entries()),
			});

			if (!savedResponse.ok) {
				const errorText = await savedResponse.text();
				console.error('Saved Recipes API Error Details:', {
					status: savedResponse.status,
					statusText: savedResponse.statusText,
					errorText,
					url: savedResponse.url,
				});
				throw new Error(
					`Failed to fetch saved recipes: ${savedResponse.status} - ${
						errorText || savedResponse.statusText
					}`
				);
			}

			const savedData = await savedResponse.json();
			console.log('Saved Recipes Data:', savedData);

			const savedRecipeIds = Array.isArray(savedData)
				? savedData
				: savedData?.recipeIds || [];
			console.log('Processed Recipe IDs:', savedRecipeIds);

			if (savedRecipeIds.length === 0) {
				console.log('No saved recipes found');
				setRecipes([]);
				setFilteredRecipes([]);
				return;
			}

			// Then fetch the full recipe details for each saved recipe
			const recipesPromises = savedRecipeIds.map(async (recipeId: string) => {
				try {
					console.log(`Fetching recipe details for: ${recipeId}`);
					const recipeResponse = await fetch(
						`${API_BASE_URL}/api/recipes/${recipeId}`,
						{
							headers: {
								Authorization: `Bearer ${token}`,
								'Content-Type': 'application/json',
								Accept: 'application/json',
							},
						}
					);

					if (!recipeResponse.ok) {
						console.warn(
							`Failed to fetch recipe ${recipeId}: ${recipeResponse.status} - ${recipeResponse.statusText}`
						);
						return null;
					}

					const recipeData = await recipeResponse.json();
					console.log(`Recipe data for ${recipeId}:`, recipeData);
					return recipeData;
				} catch (error) {
					console.warn(`Error fetching recipe ${recipeId}:`, error);
					return null;
				}
			});

			const recipesData = (await Promise.all(recipesPromises)).filter(Boolean);
			console.log('Final recipes data:', recipesData);
			setRecipes(recipesData);
			setFilteredRecipes(recipesData);
		} catch (error) {
			console.error('Error fetching saved recipes:', error);
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load saved recipes. Please try again.';
			setError(errorMessage);
			setRecipes([]);
			setFilteredRecipes([]);
		} finally {
			setLoading(false);
		}
	};

	const testAPI = async () => {
		console.log('🧪 Manual API Test triggered');
		const result = await testSavedRecipesAPI(getToken);
		console.log('🧪 Test Result:', result);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Image
					source={require('../assets/images/logo_dark.png')}
					style={styles.logo}
					resizeMode='contain'
				/>
				<View style={styles.headerButtons}>
					{__DEV__ && (
						<TouchableOpacity
							style={styles.testButton}
							onPress={testAPI}
						>
							<Text style={styles.testButtonText}>Test API</Text>
						</TouchableOpacity>
					)}
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Ionicons
							name='arrow-back'
							size={24}
							color='#4B7F47'
						/>
					</TouchableOpacity>
				</View>
			</View>

			<ScrollView
				style={styles.content}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={['#4B7F47']}
						tintColor='#4B7F47'
					/>
				}
			>
				<Text style={styles.sectionTitle}>My Saved Recipes</Text>

				<View style={styles.searchContainer}>
					<Ionicons
						name='search'
						size={20}
						color='#666'
						style={styles.searchIcon}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder='Search recipes...'
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholderTextColor='#666'
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity
							onPress={() => setSearchQuery('')}
							style={styles.clearButton}
						>
							<Ionicons
								name='close-circle'
								size={20}
								color='#666'
							/>
						</TouchableOpacity>
					)}
				</View>

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
							onPress={fetchSavedRecipes}
						>
							<Text style={styles.retryButtonText}>Retry</Text>
						</TouchableOpacity>
					</View>
				) : filteredRecipes.length === 0 ? (
					<View style={styles.emptyState}>
						<MaterialCommunityIcons
							name={searchQuery ? 'magnify' : 'bookmark-outline'}
							size={48}
							color='#4B7F47'
						/>
						<Text style={styles.emptyStateText}>
							{searchQuery ? 'No recipes found' : 'No saved recipes yet'}
						</Text>
						<Text style={styles.emptyStateSubtext}>
							{searchQuery
								? 'Try adjusting your search'
								: 'Save recipes from the dashboard to see them here'}
						</Text>
					</View>
				) : (
					<View style={styles.recipeGrid}>
						{filteredRecipes.map((recipe) => (
							<RecipeCard
								key={recipe.id}
								id={recipe.id}
								title={recipe.title}
								description={recipe.description}
								imageUrl={recipe.imageUrl}
								prepTime={recipe.prepTime}
								cookTime={recipe.cookTime}
								servings={recipe.servings}
								onSave={fetchSavedRecipes}
							/>
						))}
					</View>
				)}
			</ScrollView>
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
	},
	logo: {
		width: 150,
		height: 40,
	},
	backButton: {
		padding: 8,
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
	recipeGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	loader: {
		marginTop: 20,
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 40,
	},
	emptyStateText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2F2F2F',
		marginTop: 16,
	},
	emptyStateSubtext: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		marginTop: 8,
	},
	errorState: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 40,
	},
	errorText: {
		fontSize: 16,
		color: '#EF4444',
		textAlign: 'center',
		marginTop: 16,
	},
	retryButton: {
		marginTop: 16,
		paddingHorizontal: 24,
		paddingVertical: 12,
		backgroundColor: '#4B7F47',
		borderRadius: 8,
	},
	retryButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F3F4F6',
		borderRadius: 8,
		paddingHorizontal: 12,
		marginBottom: 20,
		height: 44,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		flex: 1,
		height: '100%',
		fontSize: 16,
		color: '#2F2F2F',
	},
	clearButton: {
		padding: 4,
	},
	testButton: {
		backgroundColor: '#F59E0B',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	testButtonText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	headerButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
});
