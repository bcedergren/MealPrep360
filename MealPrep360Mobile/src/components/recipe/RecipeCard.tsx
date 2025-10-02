import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Recipe } from '../../types/recipe';
import { BorderRadius, Card, Colors, Spacing, Text } from '../ui';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  variant?: 'grid' | 'list';
}

export function RecipeCard({
  recipe,
  onPress,
  onSave,
  isSaved = false,
  variant = 'grid'
}: RecipeCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/recipe-details',
        params: { id: recipe.id, recipe: JSON.stringify(recipe) }
      });
    }
  };

  const handleSave = (e: any) => {
    e.stopPropagation();
    onSave?.();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return Colors.success;
      case 'medium':
        return Colors.warning;
      case 'hard':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (variant === 'list') {
    return (
      <Card
        variant="elevated"
        padding="none"
        margin="small"
        pressable
        onPress={handlePress}
        customStyle={styles.listCard}
      >
        <View style={styles.listContent}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.listImage} />
          
          <View style={styles.listDetails}>
            <View style={styles.listHeader}>
              <Text variant="body1" weight="semibold" numberOfLines={2} customStyle={styles.listTitle}>
                {recipe.title}
              </Text>
              {onSave && (
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isSaved ? Colors.primary : Colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text variant="caption" color={Colors.textSecondary} numberOfLines={2}>
              {recipe.description}
            </Text>

            <View style={styles.metaRow}>
              {recipe.rating && (
                <View style={styles.rating}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text variant="caption" weight="semibold">
                    {recipe.rating.toFixed(1)}
                  </Text>
                </View>
              )}
              
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text variant="caption" color={Colors.textSecondary}>
                  {formatTime(recipe.prepTime + recipe.cookTime)}
                </Text>
              </View>

              {recipe.difficulty && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons 
                    name="chef-hat" 
                    size={14} 
                    color={getDifficultyColor(recipe.difficulty)} 
                  />
                  <Text variant="caption" color={getDifficultyColor(recipe.difficulty)}>
                    {recipe.difficulty}
                  </Text>
                </View>
              )}

              {recipe.calories && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="fire" size={14} color={Colors.secondary} />
                  <Text variant="caption" color={Colors.textSecondary}>
                    {recipe.calories} cal
                  </Text>
                </View>
              )}
            </View>

            {recipe.tags && recipe.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {recipe.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text variant="caption" color={Colors.primary}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  }

  // Grid variant (default)
  return (
    <Card
      variant="elevated"
      padding="none"
      margin="small"
      pressable
      onPress={handlePress}
      customStyle={styles.gridCard}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: recipe.imageUrl }} style={styles.gridImage} />
        
        {onSave && (
          <TouchableOpacity onPress={handleSave} style={styles.gridSaveButton}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={Colors.white}
            />
          </TouchableOpacity>
        )}

        {recipe.prepTime + recipe.cookTime <= 30 && (
          <View style={styles.quickBadge}>
            <MaterialCommunityIcons name="lightning-bolt" size={12} color={Colors.white} />
            <Text variant="caption" color={Colors.white} weight="semibold">
              Quick
            </Text>
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <Text variant="body2" weight="semibold" numberOfLines={2} customStyle={styles.gridTitle}>
          {recipe.title}
        </Text>

        <View style={styles.gridMeta}>
          {recipe.rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text variant="caption" weight="semibold">
                {recipe.rating.toFixed(1)}
              </Text>
            </View>
          )}
          
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text variant="caption" color={Colors.textSecondary}>
              {formatTime(recipe.prepTime + recipe.cookTime)}
            </Text>
          </View>

          {recipe.difficulty && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons 
                name="chef-hat" 
                size={12} 
                color={getDifficultyColor(recipe.difficulty)} 
              />
              <Text variant="caption" color={getDifficultyColor(recipe.difficulty)}>
                {recipe.difficulty}
              </Text>
            </View>
          )}
        </View>

        {recipe.calories && (
          <View style={styles.calorieRow}>
            <MaterialCommunityIcons name="fire" size={14} color={Colors.secondary} />
            <Text variant="caption" color={Colors.textSecondary}>
              {recipe.calories} calories
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Grid styles
  gridCard: {
    width: CARD_WIDTH,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: Colors.gray200,
  },
  gridSaveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.sm,
  },
  gridContent: {
    padding: Spacing.sm,
  },
  gridTitle: {
    marginBottom: Spacing.xs,
    minHeight: 40,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  
  // List styles
  listCard: {
    overflow: 'hidden',
  },
  listContent: {
    flexDirection: 'row',
  },
  listImage: {
    width: 100,
    height: 100,
    backgroundColor: Colors.gray200,
  },
  listDetails: {
    flex: 1,
    padding: Spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  listTitle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  saveButton: {
    padding: Spacing.xs,
  },
  
  // Shared styles
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
  },
});