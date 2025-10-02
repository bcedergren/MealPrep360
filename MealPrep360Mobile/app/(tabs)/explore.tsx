import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
	Alert,
	Dimensions,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipeCard } from '../../src/components/recipe/RecipeCard';
import { LoadingSpinner } from '../../src/components/ui/Loading';
import { Colors, Spacing, Typography } from '../../src/constants/theme';
import { useRecommendations } from '../../src/hooks/useRecommendations';
import { RecipeRecommendation } from '../../src/services/recommendationEngine';

const { width } = Dimensions.get('window');

interface RecommendationSectionProps {
	title: string;
	subtitle?: string;
	icon: string;
	recipes: RecipeRecommendation[];
	loading?: boolean;
	onRecipePress: (recipeId: string) => void;
	onSeeAll?: () => void;
	showReasons?: boolean;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
	title,
	subtitle,
	icon,
	recipes,
	loading,
	onRecipePress,
	onSeeAll,
	showReasons = false,
}) => {
	if (loading) {
		return (
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<View style={styles.sectionTitle}>
						<Ionicons
							name={icon as any}
							size={24}
							color={Colors.primary}
						/>
						<Text style={styles.sectionTitleText}>{title}</Text>
					</View>
				</View>
				<View style={styles.loadingContainer}>
					<LoadingSpinner size='small' />
					<Text style={styles.loadingText}>
						Finding perfect recipes for you...
					</Text>
				</View>
			</View>
		);
	}

	if (!recipes.length) {
		return null;
	}

	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<View style={styles.sectionTitle}>
					<Ionicons
						name={icon as any}
						size={24}
						color={Colors.primary}
					/>
					<View>
						<Text style={styles.sectionTitleText}>{title}</Text>
						{subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
					</View>
				</View>
				{onSeeAll && (
					<TouchableOpacity
						onPress={onSeeAll}
						style={styles.seeAllButton}
					>
						<Text style={styles.seeAllText}>See All</Text>
						<Ionicons
							name='chevron-forward'
							size={16}
							color={Colors.primary}
						/>
					</TouchableOpacity>
				)}
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.horizontalList}
			>
				{recipes.map((recipe) => (
					<View
						key={recipe.id}
						style={styles.recipeCardContainer}
					>
						<RecipeCard
							recipe={recipe}
							variant='grid'
							onPress={() => onRecipePress(recipe.id)}
						/>
						{showReasons && recipe.reasoning.length > 0 && (
							<View style={styles.reasoningContainer}>
								<Text style={styles.reasoningText}>
									{recipe.reasoning[0].description}
								</Text>
								<View style={styles.scoreContainer}>
									<Text style={styles.scoreText}>
										{Math.round(recipe.score * 100)}% match
									</Text>
								</View>
							</View>
						)}
					</View>
				))}
			</ScrollView>
		</View>
	);
};

interface QuickContextButtonProps {
	title: string;
	icon: string;
	onPress: () => void;
	active?: boolean;
}

const QuickContextButton: React.FC<QuickContextButtonProps> = ({
	title,
	icon,
	onPress,
	active = false,
}) => (
	<TouchableOpacity
		style={[styles.contextButton, active && styles.contextButtonActive]}
		onPress={onPress}
	>
		<Ionicons
			name={icon as any}
			size={20}
			color={active ? Colors.white : Colors.primary}
		/>
		<Text
			style={[
				styles.contextButtonText,
				active && styles.contextButtonTextActive,
			]}
		>
			{title}
		</Text>
	</TouchableOpacity>
);

export default function ExploreScreen() {
	const {
		personalizedRecommendations,
		trendingRecipes,
		quickMeals,
		healthyOptions,
		loading,
		error,
		lastUpdated,
		refreshRecommendations,
		recordInteraction,
		getRecommendationsForContext,
		getRecommendedForMealType,
		getRecommendedForTime,
	} = useRecommendations();

	// Collections functionality can be added later when needed
	// const {
	//   addToFavorites,
	//   removeFromFavorites,
	//   addToTryLater,
	//   isRecipeBookmarked,
	//   collections,
	// } = useRecipeCollections();

	const [refreshing, setRefreshing] = useState(false);
	const [activeContext, setActiveContext] = useState<string | null>(null);
	const [contextualRecipes, setContextualRecipes] = useState<
		RecipeRecommendation[]
	>([]);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await refreshRecommendations();
		} finally {
			setRefreshing(false);
		}
	}, [refreshRecommendations]);

	const handleRecipePress = useCallback(
		(recipeId: string) => {
			recordInteraction({
				recipeId,
				action: 'viewed',
			});
			router.push(`/recipe-details/${recipeId}`);
		},
		[recordInteraction]
	);

	const handleContextualSearch = useCallback(
		async (context: string) => {
			setActiveContext(context);

			let recipes: RecipeRecommendation[] = [];

			switch (context) {
				case 'breakfast':
				case 'lunch':
				case 'dinner':
					recipes = getRecommendedForMealType(context);
					break;
				case 'quick':
					recipes = getRecommendedForTime(30);
					break;
				case 'tonight':
					recipes = await getRecommendationsForContext({
						timeOfDay: 'evening',
						availableTime: 45,
						mealType: 'Dinner',
					});
					break;
				case 'weekend':
					recipes = await getRecommendationsForContext({
						dayOfWeek: 6, // Saturday
						planningAhead: true,
					});
					break;
			}

			setContextualRecipes(recipes);
		},
		[
			getRecommendedForMealType,
			getRecommendedForTime,
			getRecommendationsForContext,
		]
	);

	const clearContextualSearch = useCallback(() => {
		setActiveContext(null);
		setContextualRecipes([]);
	}, []);

	const handleSeeAllPersonalized = useCallback(() => {
		// Navigate to full recommendations screen
		Alert.alert(
			'Coming Soon',
			'Full personalized recommendations view will be available soon!'
		);
	}, []);

	const handleSeeAllTrending = useCallback(() => {
		// Navigate to trending recipes screen
		Alert.alert('Coming Soon', 'Trending recipes view will be available soon!');
	}, []);

	if (error) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.errorContainer}>
					<Ionicons
						name='alert-circle'
						size={48}
						color={Colors.error}
					/>
					<Text style={styles.errorTitle}>Something went wrong</Text>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={handleRefresh}
					>
						<Text style={styles.retryButtonText}>Try Again</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						colors={[Colors.primary]}
						tintColor={Colors.primary}
					/>
				}
			>
				{/* Header */}
				<View style={styles.header}>
					<View>
						<Text style={styles.headerTitle}>For You</Text>
						<Text style={styles.headerSubtitle}>
							Personalized recipe discoveries
						</Text>
					</View>
					{lastUpdated && (
						<Text style={styles.lastUpdated}>
							Updated {lastUpdated.toLocaleTimeString()}
						</Text>
					)}
				</View>

				{/* Quick Context Buttons */}
				<View style={styles.contextSection}>
					<Text style={styles.contextSectionTitle}>
						What are you looking for?
					</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.contextButtons}
					>
						<QuickContextButton
							title='Breakfast'
							icon='sunny'
							onPress={() => handleContextualSearch('breakfast')}
							active={activeContext === 'breakfast'}
						/>
						<QuickContextButton
							title='Lunch'
							icon='restaurant'
							onPress={() => handleContextualSearch('lunch')}
							active={activeContext === 'lunch'}
						/>
						<QuickContextButton
							title='Dinner'
							icon='moon'
							onPress={() => handleContextualSearch('dinner')}
							active={activeContext === 'dinner'}
						/>
						<QuickContextButton
							title='Quick (30min)'
							icon='timer'
							onPress={() => handleContextualSearch('quick')}
							active={activeContext === 'quick'}
						/>
						<QuickContextButton
							title='Tonight'
							icon='time'
							onPress={() => handleContextualSearch('tonight')}
							active={activeContext === 'tonight'}
						/>
						<QuickContextButton
							title='Weekend'
							icon='calendar'
							onPress={() => handleContextualSearch('weekend')}
							active={activeContext === 'weekend'}
						/>
					</ScrollView>
					{activeContext && (
						<TouchableOpacity
							style={styles.clearContextButton}
							onPress={clearContextualSearch}
						>
							<Text style={styles.clearContextText}>Clear filter</Text>
							<Ionicons
								name='close'
								size={16}
								color={Colors.textSecondary}
							/>
						</TouchableOpacity>
					)}
				</View>

				{/* Contextual Results */}
				{contextualRecipes.length > 0 && (
					<RecommendationSection
						title={`Perfect for ${activeContext}`}
						icon='sparkles'
						recipes={contextualRecipes}
						onRecipePress={handleRecipePress}
						showReasons={true}
					/>
				)}

				{/* Personalized Recommendations */}
				<RecommendationSection
					title='Recommended for You'
					subtitle='Based on your preferences and cooking history'
					icon='heart'
					recipes={personalizedRecommendations.slice(0, 8)}
					loading={loading}
					onRecipePress={handleRecipePress}
					onSeeAll={handleSeeAllPersonalized}
					showReasons={true}
				/>

				{/* Quick Meals */}
				<RecommendationSection
					title='Quick & Easy'
					subtitle='Ready in 30 minutes or less'
					icon='flash'
					recipes={quickMeals}
					onRecipePress={handleRecipePress}
					showReasons={false}
				/>

				{/* Healthy Options */}
				<RecommendationSection
					title='Healthy Choices'
					subtitle='Nutritious meals aligned with your goals'
					icon='leaf'
					recipes={healthyOptions}
					onRecipePress={handleRecipePress}
					showReasons={false}
				/>

				{/* Trending */}
				<RecommendationSection
					title='Trending Now'
					subtitle='Popular recipes in the community'
					icon='trending-up'
					recipes={trendingRecipes.map((recipe) => ({
						...recipe,
						score: 0,
						reasoning: [],
					}))}
					onRecipePress={handleRecipePress}
					onSeeAll={handleSeeAllTrending}
					showReasons={false}
				/>

				{/* Bottom Spacing */}
				<View style={styles.bottomSpacing} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	scrollContent: {
		paddingBottom: Spacing.xl,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.md,
		paddingTop: Spacing.lg,
	},
	headerTitle: {
		fontSize: Typography['3xl'],
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: Spacing.xs,
	},
	headerSubtitle: {
		fontSize: Typography.base,
		color: Colors.textSecondary,
	},
	lastUpdated: {
		fontSize: Typography.xs,
		color: Colors.textMuted,
		textAlign: 'right',
	},
	contextSection: {
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.lg,
	},
	contextSectionTitle: {
		fontSize: Typography.lg,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: Spacing.md,
	},
	contextButtons: {
		paddingRight: Spacing.lg,
	},
	contextButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.backgroundSecondary,
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.sm,
		borderRadius: 20,
		marginRight: Spacing.sm,
		borderWidth: 1,
		borderColor: Colors.border,
	},
	contextButtonActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	contextButtonText: {
		fontSize: Typography.sm,
		color: Colors.primary,
		marginLeft: Spacing.xs,
		fontWeight: '600',
	},
	contextButtonTextActive: {
		color: Colors.white,
	},
	clearContextButton: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		marginTop: Spacing.sm,
	},
	clearContextText: {
		fontSize: Typography.sm,
		color: Colors.textSecondary,
		marginRight: Spacing.xs,
	},
	section: {
		marginBottom: Spacing.xl,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: Spacing.lg,
		marginBottom: Spacing.md,
	},
	sectionTitle: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	sectionTitleText: {
		fontSize: Typography.xl,
		fontWeight: 'bold',
		color: Colors.text,
		marginLeft: Spacing.sm,
	},
	sectionSubtitle: {
		fontSize: Typography.sm,
		color: Colors.textSecondary,
	},
	seeAllButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	seeAllText: {
		fontSize: Typography.sm,
		color: Colors.primary,
		fontWeight: '600',
		marginRight: Spacing.xs,
	},
	horizontalList: {
		paddingLeft: Spacing.lg,
	},
	recipeCardContainer: {
		marginRight: Spacing.md,
		width: width * 0.72,
	},
	recipeCard: {
		width: '100%',
	},
	reasoningContainer: {
		backgroundColor: Colors.backgroundSecondary,
		borderRadius: 8,
		padding: Spacing.sm,
		marginTop: Spacing.xs,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	reasoningText: {
		fontSize: Typography.xs,
		color: Colors.textSecondary,
		flex: 1,
		marginRight: Spacing.sm,
	},
	scoreContainer: {
		backgroundColor: Colors.primary,
		borderRadius: 12,
		paddingHorizontal: Spacing.sm,
		paddingVertical: 2,
	},
	scoreText: {
		fontSize: Typography.xs,
		color: Colors.white,
		fontWeight: '600',
	},
	loadingContainer: {
		alignItems: 'center',
		padding: Spacing.xl,
	},
	loadingText: {
		fontSize: Typography.sm,
		color: Colors.textSecondary,
		marginTop: Spacing.sm,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: Spacing.xl,
	},
	errorTitle: {
		fontSize: Typography.xl,
		fontWeight: 'bold',
		color: Colors.text,
		marginTop: Spacing.md,
		marginBottom: Spacing.sm,
	},
	errorText: {
		fontSize: Typography.base,
		color: Colors.textSecondary,
		textAlign: 'center',
		marginBottom: Spacing.lg,
	},
	retryButton: {
		backgroundColor: Colors.primary,
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.md,
		borderRadius: 8,
	},
	retryButtonText: {
		fontSize: Typography.base,
		color: Colors.white,
		fontWeight: '600',
	},
	bottomSpacing: {
		height: Spacing['4xl'],
	},
});
