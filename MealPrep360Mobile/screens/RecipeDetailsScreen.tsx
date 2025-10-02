import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	Modal,
	RefreshControl,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { API_BASE_URL } from '../src/constants/api';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import {
	addToOfflineQueue as addToOfflineQueueService,
	getCacheInfo as getCacheInfoService,
	getFromCache,
	saveToCache,
} from '../src/services/cache';
import {
	CacheInfo,
	OfflineChange,
	Recipe,
	SyncStatus,
} from '../src/types/recipe';

type RootStackParamList = {
	RecipeDetails: {
		recipe: Recipe;
	};
};

type RecipeDetailsRouteProp = RouteProp<RootStackParamList, 'RecipeDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const API_TIMEOUT = 10000; // 10 seconds
const CACHE_KEY_PREFIX = 'recipe_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const OFFLINE_QUEUE_KEY = 'offline_recipe_changes';
const SYNC_INTERVAL = 5000; // 5 seconds

export default function RecipeDetailsScreen() {
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<RecipeDetailsRouteProp>();
	const { getToken } = useAuth();
	const { isConnected, quality: networkQuality } = useNetworkStatus();
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recipeData, setRecipeData] = useState(route.params.recipe);
	const [isOffline, setIsOffline] = useState(!isConnected);
	const [retryCount, setRetryCount] = useState(0);
	const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
	const [showCacheDetails, setShowCacheDetails] = useState(false);
	const [syncStatus, setSyncStatus] = useState<SyncStatus>({
		isSyncing: false,
		progress: 0,
		currentOperation: '',
		totalOperations: 0,
	});

	useEffect(() => {
		setIsOffline(!isConnected);
		if (isConnected && error) {
			fetchRecipeDetails(true);
		}
	}, [isConnected, error]);

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	};

	const formatDate = (timestamp: number): string => {
		return new Date(timestamp).toLocaleString();
	};

	const clearCache = async () => {
		try {
			const keys = await AsyncStorage.getAllKeys();
			const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
			await AsyncStorage.multiRemove(cacheKeys);
			setCacheInfo(null);
			Alert.alert('Success', 'Cache cleared successfully');
		} catch (error) {
			console.error('Error clearing cache:', error);
			Alert.alert('Error', 'Failed to clear cache');
		}
	};

	const getErrorMessage = (error: any): string => {
		if (error.name === 'TimeoutError') {
			return 'The request took too long to complete. Please check your internet connection and try again.';
		}
		if (error.message.includes('Network request failed')) {
			return 'Unable to connect to the server. Please check your internet connection.';
		}
		if (error.message.includes('401')) {
			return 'Your session has expired. Please sign in again.';
		}
		if (error.message.includes('404')) {
			return 'Recipe not found. It may have been removed or is no longer available.';
		}
		if (error.message.includes('500')) {
			return 'Server error. Please try again later.';
		}
		return 'An unexpected error occurred. Please try again.';
	};

	const fetchWithTimeout = async (
		url: string,
		options: any,
		timeout: number
	) => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('TimeoutError');
			}
			throw error;
		}
	};

	const resolveConflict = async (
		localChange: OfflineChange,
		serverVersion: number
	): Promise<OfflineChange> => {
		// If server version is newer, use server's state
		if (serverVersion > (localChange.version || 0)) {
			return {
				...localChange,
				version: serverVersion,
			};
		}
		// If local version is newer or same, keep local change
		return localChange;
	};

	const processOfflineQueue = async () => {
		try {
			const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
			if (!queue) return;

			const changes: OfflineChange[] = JSON.parse(queue);
			const token = await getToken();

			setSyncStatus({
				isSyncing: true,
				progress: 0,
				currentOperation: 'Starting sync...',
				totalOperations: changes.length,
			});

			for (let i = 0; i < changes.length; i++) {
				const change = changes[i];
				try {
					setSyncStatus((prev: SyncStatus) => ({
						...prev,
						progress: i,
						currentOperation: `Syncing ${change.type} for recipe ${change.recipeId}...`,
					}));

					// First, get the current server version
					const versionResponse = await fetch(
						`${API_BASE_URL}/api/recipes/${change.recipeId}/version`,
						{
							headers: {
								Authorization: `Bearer ${token}`,
							},
						}
					);

					if (!versionResponse.ok) {
						throw new Error(
							`Failed to get version for recipe ${change.recipeId}`
						);
					}

					const { version: serverVersion } = await versionResponse.json();

					// Resolve any conflicts
					const resolvedChange = await resolveConflict(change, serverVersion);

					const endpoint =
						resolvedChange.type === 'save'
							? `${API_BASE_URL}/api/user/recipes/save`
							: `${API_BASE_URL}/api/user/recipes/unsave`;

					const response = await fetch(endpoint, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							recipeId: resolvedChange.recipeId,
							version: resolvedChange.version,
						}),
					});

					if (!response.ok) {
						throw new Error(
							`Failed to sync ${resolvedChange.type} for recipe ${resolvedChange.recipeId}`
						);
					}

					// Update progress
					setSyncStatus((prev: SyncStatus) => ({
						...prev,
						progress: i + 1,
					}));
				} catch (error) {
					console.error(`Error processing offline change:`, error);
					// Keep failed changes in queue with updated version
					changes[i] = {
						...change,
						version: (change.version || 0) + 1,
					};
					continue;
				}
			}

			// Clear the queue after successful sync
			await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);

			setSyncStatus({
				isSyncing: false,
				progress: 0,
				currentOperation: '',
				totalOperations: 0,
			});
		} catch (error) {
			console.error('Error processing offline queue:', error);
			setSyncStatus({
				isSyncing: false,
				progress: 0,
				currentOperation: '',
				totalOperations: 0,
			});
		}
	};

	// Add sync interval
	useEffect(() => {
		const syncInterval = setInterval(() => {
			if (!isOffline) {
				processOfflineQueue();
			}
		}, SYNC_INTERVAL);

		return () => clearInterval(syncInterval);
	}, [isOffline]);

	const fetchRecipeDetails = async (forceRefresh = false) => {
		try {
			setLoading(true);
			setError(null);

			// Try to get from cache first if not forcing refresh
			if (!forceRefresh) {
				const cachedData = await getFromCache<Recipe>(recipeData.id);
				if (cachedData) {
					setRecipeData(cachedData);
					setLoading(false);
					return;
				}
			}

			// Fetch from API
			const token = await getToken();
			if (!token) {
				throw new Error('Authentication token not available');
			}

			// Use fetch directly since we need to pass the token
			const response = await fetch(
				`${API_BASE_URL}/api/recipes/${recipeData.id}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch recipe: ${response.status}`);
			}

			const data = await response.json();

			// Map API response to component interface (API uses _id, component expects id)
			const mappedRecipe: Recipe = {
				id: data._id || data.id,
				title: data.title,
				description: data.description,
				imageUrl: data.imageUrl || '',
				prepTime: data.prepTime,
				cookTime: data.cookTime,
				servings: data.servings,
				difficulty: data.difficulty || 'Easy',
				calories: data.calories,
				rating: data.rating,
				reviewCount: data.reviewCount,
				tags: data.tags || [],
				dietaryRestrictions: data.dietaryRestrictions || [],
				cuisineType: data.cuisineType || 'International',
				mealType: data.mealType || ['Dinner'],
				ingredients: data.ingredients || [],
				instructions: data.instructions || [],
				nutritionInfo: data.nutritionInfo,
				createdAt: data.createdAt || new Date().toISOString(),
				updatedAt: data.updatedAt || new Date().toISOString(),
				authorId: data.authorId || 'unknown',
				authorName: data.authorName,
				isPublic: data.isPublic || false,
			};

			setRecipeData(mappedRecipe);

			// Save to cache
			await saveToCache(recipeData.id, mappedRecipe);

			// Update cache info
			const cacheInfoData = await getCacheInfoService(recipeData.id);
			if (cacheInfoData) {
				setCacheInfo(cacheInfoData);
			}
		} catch (error) {
			console.error('Error fetching recipe details:', error);
			const errorMsg =
				error instanceof Error
					? error.message
					: 'Failed to fetch recipe details';
			setError(errorMsg);
			Alert.alert('Error', errorMsg);
			// Add to offline queue if network error
			if (!isConnected) {
				await addToOfflineQueueService({
					type: 'save',
					recipeId: recipeData.id,
					timestamp: Date.now(),
				});
			}
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchRecipeDetails();
	}, []);

	const onRefresh = () => {
		setRefreshing(true);
		fetchRecipeDetails(true); // Force refresh
	};

	const renderCacheDetailsModal = () => (
		<Modal
			visible={showCacheDetails}
			transparent
			animationType='fade'
			onRequestClose={() => setShowCacheDetails(false)}
		>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Cache Details</Text>
						<TouchableOpacity
							onPress={() => setShowCacheDetails(false)}
							style={styles.closeButton}
						>
							<Ionicons
								name='close'
								size={24}
								color='#666'
							/>
						</TouchableOpacity>
					</View>
					{cacheInfo ? (
						<View style={styles.cacheDetails}>
							<View style={styles.cacheDetailItem}>
								<Text style={styles.cacheDetailLabel}>Size:</Text>
								<Text style={styles.cacheDetailValue}>
									{formatBytes(cacheInfo.size)}
								</Text>
							</View>
							<View style={styles.cacheDetailItem}>
								<Text style={styles.cacheDetailLabel}>Last Updated:</Text>
								<Text style={styles.cacheDetailValue}>
									{formatDate(cacheInfo.lastUpdated)}
								</Text>
							</View>
							<View style={styles.cacheDetailItem}>
								<Text style={styles.cacheDetailLabel}>Expires:</Text>
								<Text style={styles.cacheDetailValue}>
									{formatDate(cacheInfo.expiresAt)}
								</Text>
							</View>
						</View>
					) : (
						<Text style={styles.noCacheText}>No cached data available</Text>
					)}
					<TouchableOpacity
						style={styles.clearCacheButton}
						onPress={clearCache}
					>
						<Text style={styles.clearCacheButtonText}>Clear Cache</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	const renderSyncStatus = () => {
		if (isOffline) {
			return (
				<View style={styles.offlineIndicator}>
					<Ionicons
						name='cloud-offline'
						size={20}
						color='#EF4444'
					/>
					<Text style={styles.offlineText}>Offline</Text>
				</View>
			);
		}
		return null;
	};

	const renderSyncProgress = () => {
		if (!syncStatus.isSyncing) return null;

		const progress = (syncStatus.progress / syncStatus.totalOperations) * 100;

		return (
			<View style={styles.syncProgressContainer}>
				<View style={styles.syncProgressBar}>
					<View style={[styles.syncProgressFill, { width: `${progress}%` }]} />
				</View>
				<Text style={styles.syncProgressText}>
					{syncStatus.currentOperation} ({Math.round(progress)}%)
				</Text>
			</View>
		);
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator
						size='large'
						color='#4B7F47'
					/>
					<Text style={styles.loadingText}>Loading recipe details...</Text>
					{retryCount > 0 && (
						<Text style={styles.retryText}>
							Retry attempt {retryCount} of {MAX_RETRIES}
						</Text>
					)}
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.errorContainer}>
					<Ionicons
						name='alert-circle-outline'
						size={48}
						color='#EF4444'
					/>
					<Text style={styles.errorText}>{error}</Text>
					{isOffline && (
						<Text style={styles.offlineText}>
							You are currently offline. Some features may be limited.
						</Text>
					)}
					<View style={styles.errorButtons}>
						<TouchableOpacity
							style={styles.retryButton}
							onPress={() => fetchRecipeDetails(true)}
						>
							<Text style={styles.retryButtonText}>Retry</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.clearCacheButton}
							onPress={clearCache}
						>
							<Text style={styles.clearCacheButtonText}>Clear Cache</Text>
						</TouchableOpacity>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={['#4B7F47']}
						tintColor='#4B7F47'
					/>
				}
			>
				{/* Header with back button and refresh */}
				<View style={styles.header}>
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
					<View style={styles.headerRight}>
						{renderSyncStatus()}
						{renderSyncProgress()}
						{isOffline && (
							<View style={styles.offlineIndicator}>
								<Ionicons
									name='cloud-offline'
									size={20}
									color='#EF4444'
								/>
							</View>
						)}
						<View style={styles.networkQualityIndicator}>
							<Ionicons
								name={
									networkQuality === 'good'
										? 'wifi'
										: networkQuality === 'fair'
											? 'cellular'
											: 'alert-circle'
								}
								size={20}
								color={
									networkQuality === 'good'
										? '#4B7F47'
										: networkQuality === 'fair'
											? '#F59E0B'
											: '#EF4444'
								}
							/>
						</View>
						{cacheInfo && (
							<TouchableOpacity
								style={styles.cacheButton}
								onPress={() => setShowCacheDetails(true)}
							>
								<Ionicons
									name='save'
									size={20}
									color='#4B7F47'
								/>
								<Text style={styles.cacheSizeText}>
									{formatBytes(cacheInfo.size)}
								</Text>
							</TouchableOpacity>
						)}
						<TouchableOpacity
							style={styles.refreshButton}
							onPress={onRefresh}
							disabled={refreshing}
						>
							<Ionicons
								name='refresh'
								size={24}
								color='#4B7F47'
							/>
						</TouchableOpacity>
					</View>
				</View>

				{/* Recipe Image */}
				<Image
					source={{ uri: recipeData.imageUrl }}
					style={styles.image}
					resizeMode='cover'
				/>

				<View style={styles.content}>
					{/* Title */}
					<Text style={styles.title}>{recipeData.title}</Text>

					{/* Quick Info */}
					<View style={styles.quickInfo}>
						<View style={styles.infoItem}>
							<Ionicons
								name='time-outline'
								size={20}
								color='#4B7F47'
							/>
							<Text style={styles.infoText}>
								Prep: {recipeData.prepTime} min
							</Text>
						</View>
						<View style={styles.infoItem}>
							<Ionicons
								name='flame-outline'
								size={20}
								color='#4B7F47'
							/>
							<Text style={styles.infoText}>
								Cook: {recipeData.cookTime} min
							</Text>
						</View>
						<View style={styles.infoItem}>
							<Ionicons
								name='people-outline'
								size={20}
								color='#4B7F47'
							/>
							<Text style={styles.infoText}>
								Servings: {recipeData.servings}
							</Text>
						</View>
					</View>

					{/* Description */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Description</Text>
						<Text style={styles.description}>{recipeData.description}</Text>
					</View>

					{/* Ingredients */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Ingredients</Text>
						{Array.isArray(recipeData.ingredients) &&
						recipeData.ingredients.length > 0 ? (
							recipeData.ingredients.map(
								(ingredient: any, index: number) => (
									<View
										key={index}
										style={styles.ingredientItem}
									>
										<View style={styles.bulletPoint} />
										<Text style={styles.ingredientText}>{ingredient}</Text>
									</View>
								)
							)
						) : (
							<Text style={styles.emptyText}>No ingredients listed</Text>
						)}
					</View>

					{/* Instructions */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Instructions</Text>
						{Array.isArray(recipeData.instructions) &&
						recipeData.instructions.length > 0 ? (
							recipeData.instructions.map(
								(instruction: any, index: number) => (
									<View
										key={index}
										style={styles.instructionItem}
									>
										<View style={styles.stepNumber}>
											<Text style={styles.stepNumberText}>{index + 1}</Text>
										</View>
										<Text style={styles.instructionText}>{instruction}</Text>
									</View>
								)
							)
						) : (
							<Text style={styles.emptyText}>No instructions listed</Text>
						)}
					</View>

					{/* Nutritional Information */}
					{recipeData.nutritionInfo && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Nutritional Information</Text>
							<View style={styles.nutritionGrid}>
								<View style={styles.nutritionItem}>
									<Text style={styles.nutritionValue}>
										{recipeData.nutritionInfo.calories}
									</Text>
									<Text style={styles.nutritionLabel}>Calories</Text>
								</View>
								<View style={styles.nutritionItem}>
									<Text style={styles.nutritionValue}>
										{recipeData.nutritionInfo.protein}g
									</Text>
									<Text style={styles.nutritionLabel}>Protein</Text>
								</View>
								<View style={styles.nutritionItem}>
									<Text style={styles.nutritionValue}>
										{recipeData.nutritionInfo.carbs}g
									</Text>
									<Text style={styles.nutritionLabel}>Carbs</Text>
								</View>
								<View style={styles.nutritionItem}>
									<Text style={styles.nutritionValue}>
										{recipeData.nutritionInfo.fat}g
									</Text>
									<Text style={styles.nutritionLabel}>Fat</Text>
								</View>
							</View>
						</View>
					)}

					{/* Tags */}
					{recipeData.tags && recipeData.tags.length > 0 && (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Tags</Text>
							<View style={styles.tagsContainer}>
								{recipeData.tags.map((tag: string, index: number) => (
									<View
										key={index}
										style={styles.tag}
									>
										<Text style={styles.tagText}>{tag}</Text>
									</View>
								))}
							</View>
						</View>
					)}
				</View>
			</ScrollView>
			{renderCacheDetailsModal()}
		</SafeAreaView>
	);
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	header: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 1,
		padding: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: width,
		height: width * 0.75,
	},
	content: {
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#2F2F2F',
		marginBottom: 16,
	},
	quickInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 24,
	},
	infoItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	infoText: {
		fontSize: 14,
		color: '#4B7F47',
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#2F2F2F',
		marginBottom: 12,
	},
	description: {
		fontSize: 16,
		color: '#666',
		lineHeight: 24,
	},
	ingredientItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	bulletPoint: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#4B7F47',
		marginRight: 8,
	},
	ingredientText: {
		fontSize: 16,
		color: '#2F2F2F',
		flex: 1,
	},
	instructionItem: {
		flexDirection: 'row',
		marginBottom: 16,
	},
	stepNumber: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: '#4B7F47',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	stepNumberText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
	instructionText: {
		flex: 1,
		fontSize: 16,
		color: '#2F2F2F',
		lineHeight: 24,
	},
	nutritionGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
	},
	nutritionItem: {
		flex: 1,
		minWidth: width * 0.4,
		backgroundColor: '#F3F4F6',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	nutritionValue: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#4B7F47',
		marginBottom: 4,
	},
	nutritionLabel: {
		fontSize: 14,
		color: '#666',
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	tag: {
		backgroundColor: '#F3F4F6',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	tagText: {
		fontSize: 14,
		color: '#4B7F47',
	},
	emptyText: {
		fontSize: 16,
		color: '#666',
		fontStyle: 'italic',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#4B7F47',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
		padding: 20,
	},
	errorText: {
		marginTop: 16,
		fontSize: 16,
		color: '#EF4444',
		textAlign: 'center',
	},
	retryButton: {
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
	refreshButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	offlineIndicator: {
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		padding: 8,
		borderRadius: 16,
	},
	offlineText: {
		marginTop: 8,
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
	},
	errorButtons: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 16,
	},
	clearCacheButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		backgroundColor: '#F3F4F6',
		borderRadius: 8,
	},
	clearCacheButtonText: {
		color: '#4B7F47',
		fontSize: 16,
		fontWeight: '600',
	},
	retryText: {
		marginTop: 8,
		fontSize: 14,
		color: '#666',
	},
	networkQualityIndicator: {
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		padding: 8,
		borderRadius: 16,
	},
	cacheButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		padding: 8,
		borderRadius: 16,
		gap: 4,
	},
	cacheSizeText: {
		fontSize: 12,
		color: '#4B7F47',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		width: width * 0.8,
		maxWidth: 400,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#2F2F2F',
	},
	closeButton: {
		padding: 4,
	},
	cacheDetails: {
		gap: 12,
		marginBottom: 20,
	},
	cacheDetailItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cacheDetailLabel: {
		fontSize: 14,
		color: '#666',
	},
	cacheDetailValue: {
		fontSize: 14,
		color: '#2F2F2F',
		fontWeight: '500',
	},
	noCacheText: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		marginBottom: 20,
	},
	syncProgressContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		padding: 8,
		zIndex: 2,
	},
	syncProgressBar: {
		height: 4,
		backgroundColor: '#E5E7EB',
		borderRadius: 2,
		overflow: 'hidden',
	},
	syncProgressFill: {
		height: '100%',
		backgroundColor: '#4B7F47',
		borderRadius: 2,
	},
	syncProgressText: {
		fontSize: 12,
		color: '#4B7F47',
		marginTop: 4,
		textAlign: 'center',
	},
});
