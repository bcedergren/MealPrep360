import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

type RootStackParamList = {
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

interface RecipeCardProps {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	prepTime: number;
	cookTime: number;
	servings: number;
	onSave?: () => void;
	isInitiallySaved?: boolean;
}

const SAVED_RECIPES_KEY = '@MealPrep360:savedRecipes';

export default function RecipeCard({
	id,
	title,
	description,
	imageUrl,
	prepTime,
	cookTime,
	servings,
	onSave,
	isInitiallySaved = false,
}: RecipeCardProps) {
	const navigation = useNavigation<NavigationProp>();
	const [isSaving, setIsSaving] = useState(false);
	const [isSaved, setIsSaved] = useState(isInitiallySaved);

	// Check if recipe is saved on mount
	useEffect(() => {
		checkIfSaved();
	}, [id]);

	const checkIfSaved = async () => {
		try {
			const savedRecipesJson = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
			const savedRecipes = savedRecipesJson ? JSON.parse(savedRecipesJson) : [];
			setIsSaved(savedRecipes.includes(id));
		} catch (error) {
			console.error('Error checking saved status:', error);
		}
	};

	const handleSave = async (e: any) => {
		e.stopPropagation(); // Prevent navigation when clicking save button
		if (isSaving) return;

		try {
			setIsSaving(true);

			// Get current saved recipes
			const savedRecipesJson = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
			const savedRecipes = savedRecipesJson ? JSON.parse(savedRecipesJson) : [];

			// Add this recipe if not already saved
			if (!savedRecipes.includes(id)) {
				savedRecipes.push(id);
				await AsyncStorage.setItem(
					SAVED_RECIPES_KEY,
					JSON.stringify(savedRecipes)
				);
			}

			setIsSaved(true);
			Alert.alert('Success', 'Recipe saved successfully!');
			onSave?.();
		} catch (error) {
			console.error('Error saving recipe:', error);
			Alert.alert('Error', 'Failed to save recipe. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleUnsave = async (e: any) => {
		e.stopPropagation(); // Prevent navigation when clicking unsave button
		if (isSaving) return;

		try {
			setIsSaving(true);

			// Get current saved recipes
			const savedRecipesJson = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
			const savedRecipes = savedRecipesJson ? JSON.parse(savedRecipesJson) : [];

			// Remove this recipe
			const updatedRecipes = savedRecipes.filter(
				(recipeId: string) => recipeId !== id
			);
			await AsyncStorage.setItem(
				SAVED_RECIPES_KEY,
				JSON.stringify(updatedRecipes)
			);

			setIsSaved(false);
			Alert.alert('Success', 'Recipe removed from saved recipes');
			onSave?.();
		} catch (error) {
			console.error('Error unsaving recipe:', error);
			Alert.alert('Error', 'Failed to unsave recipe. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handlePress = () => {
		navigation.navigate('RecipeDetails', {
			recipe: {
				id,
				title,
				description,
				imageUrl,
				prepTime,
				cookTime,
				servings,
			},
		});
	};

	const renderSaveButton = () => {
		if (isSaving) {
			return (
				<View style={styles.saveButton}>
					<ActivityIndicator
						size='small'
						color='#4B7F47'
					/>
				</View>
			);
		}

		return (
			<TouchableOpacity
				style={[styles.saveButton, isSaved && styles.savedButton]}
				onPress={isSaved ? handleUnsave : handleSave}
				disabled={isSaving}
			>
				<Ionicons
					name={isSaved ? 'bookmark' : 'bookmark-outline'}
					size={24}
					color={isSaved ? '#E8A053' : '#4B7F47'}
				/>
			</TouchableOpacity>
		);
	};

	return (
		<TouchableOpacity
			style={styles.card}
			onPress={handlePress}
		>
			<Image
				source={{ uri: imageUrl }}
				style={styles.image}
				resizeMode='cover'
			/>
			<View style={styles.content}>
				<View style={styles.titleRow}>
					<Text
						style={styles.title}
						numberOfLines={2}
					>
						{title}
					</Text>
					{renderSaveButton()}
				</View>
				<Text
					style={styles.description}
					numberOfLines={2}
				>
					{description}
				</Text>
				<View style={styles.details}>
					<Text style={styles.detailText}>Prep: {prepTime} min</Text>
					<Text style={styles.detailText}>Cook: {cookTime} min</Text>
					<Text style={styles.detailText}>Servings: {servings}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#fff',
		borderRadius: 12,
		overflow: 'hidden',
		width: 280,
		marginRight: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	image: {
		width: '100%',
		height: 160,
	},
	content: {
		padding: 12,
	},
	titleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 8,
	},
	title: {
		flex: 1,
		fontSize: 16,
		fontWeight: '600',
		color: '#2F2F2F',
		marginRight: 8,
	},
	saveButton: {
		padding: 4,
		minWidth: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
	},
	description: {
		fontSize: 14,
		color: '#666',
		marginBottom: 12,
	},
	details: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	detailText: {
		fontSize: 12,
		color: '#4B7F47',
	},
	savedButton: {
		opacity: 1,
	},
});
