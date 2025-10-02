import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, Card, Container, Text as CustomText, Loading, Screen } from '../../src/components/ui';
import { Theme } from '../../src/constants/theme';
import { useMealPlanning } from '../../src/hooks/useMealPlanning';
import { useRecipeSearch } from '../../src/hooks/useRecipeSearch';
import { useShopping } from '../../src/hooks/useShopping';
import {
  ShoppingList,
  ShoppingListGenerationRequest,
  calculateShoppingListStats,
  formatPrice,
} from '../../src/types/shoppingList';

export default function ShoppingScreen() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  const {
    shoppingLists,
    activeList,
    isLoading,
    error,
    createFromMealPlan,
    createEmptyList,
    deleteList,
    setActiveList,
    getCompletionPercentage,
    getTotalEstimatedPrice,
  } = useShopping();
  
  const { currentMealPlan } = useMealPlanning();
  const { recipes } = useRecipeSearch();

  const handleCreateFromMealPlan = async () => {
    if (!currentMealPlan) {
      Alert.alert('No Meal Plan', 'Please create a meal plan first to generate a shopping list.');
      return;
    }

    try {
      const request: ShoppingListGenerationRequest = {
        mealPlanId: currentMealPlan.id,
        preferences: {
          dietaryRestrictions: [],
          preferredBrands: [],
          avoidIngredients: [],
          organicPreference: 'when_possible',
          groupSimilarItems: true,
          sortByStoreLayout: false,
          includeNutritionInfo: false,
        },
      };

      const newList = await createFromMealPlan(currentMealPlan, recipes, request);
      setActiveList(newList.id);
      setSelectedListId(newList.id);
    } catch (err) {
      console.error('Error creating shopping list:', err);
      Alert.alert('Error', 'Failed to create shopping list from meal plan');
    }
  };

  const handleCreateEmptyList = async () => {
    try {
      const newList = await createEmptyList('New Shopping List');
      setSelectedListId(newList.id);
    } catch (err) {
      console.error('Error creating empty list:', err);
      Alert.alert('Error', 'Failed to create shopping list');
    }
  };

  const handleDeleteList = (listId: string, listTitle: string) => {
    Alert.alert(
      'Delete Shopping List',
      `Are you sure you want to delete "${listTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteList(listId);
            if (selectedListId === listId) {
              setSelectedListId(null);
            }
          }
        },
      ]
    );
  };

  const renderShoppingListCard = ({ item }: { item: ShoppingList }) => {
    const stats = calculateShoppingListStats(item);
    const isSelected = selectedListId === item.id;
    const isActive = activeList?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.listCard,
          isSelected && styles.selectedCard,
          isActive && styles.activeCard,
        ]}
        onPress={() => setSelectedListId(item.id)}
        onLongPress={() => handleDeleteList(item.id, item.title)}
      >
        <View style={styles.listHeader}>
          <View style={styles.listTitleContainer}>
            <CustomText variant="h4" style={styles.listTitle}>
              {item.title}
            </CustomText>
            {isActive && (
              <View style={styles.activeBadge}>
                <CustomText variant="caption" style={styles.activeBadgeText}>
                  ACTIVE
                </CustomText>
              </View>
            )}
          </View>
          
          <View style={styles.listStatus}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <CustomText variant="caption" style={styles.statusText}>
              {item.status.toUpperCase()}
            </CustomText>
          </View>
        </View>

        <View style={styles.listStats}>
          <View style={styles.statItem}>
            <CustomText variant="caption" style={styles.statLabel}>
              Items
            </CustomText>
            <CustomText variant="body1" style={styles.statValue}>
              {stats.completedItems}/{stats.totalItems}
            </CustomText>
          </View>
          
          <View style={styles.statItem}>
            <CustomText variant="caption" style={styles.statLabel}>
              Progress
            </CustomText>
            <CustomText variant="body1" style={styles.statValue}>
              {Math.round(stats.completionPercentage)}%
            </CustomText>
          </View>
          
          {stats.estimatedTotal > 0 && (
            <View style={styles.statItem}>
              <CustomText variant="caption" style={styles.statLabel}>
                Est. Total
              </CustomText>
              <CustomText variant="body1" style={styles.statValue}>
                {formatPrice(stats.estimatedTotal)}
              </CustomText>
            </View>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${stats.completionPercentage}%` }
              ]} 
            />
          </View>
        </View>

        {item.description && (
          <CustomText variant="caption" style={styles.listDescription}>
            {item.description}
          </CustomText>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return Theme.colors.gray500;
      case 'active': return Theme.colors.info;
      case 'shopping': return Theme.colors.warning;
      case 'completed': return Theme.colors.success;
      default: return Theme.colors.gray500;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="bag-outline"
        size={80}
        color={Theme.colors.gray400}
      />
      <CustomText variant="h3" style={styles.emptyTitle}>
        No Shopping Lists
      </CustomText>
      <CustomText variant="body1" style={styles.emptySubtitle}>
        Create your first shopping list to get started with organized grocery shopping
      </CustomText>
      
      <View style={styles.emptyActions}>
        {currentMealPlan && (
          <Button
            title="Generate from Meal Plan"
            onPress={handleCreateFromMealPlan}
            variant="primary"
            style={styles.emptyButton}
            icon="restaurant"
          />
        )}
        <Button
          title="Create Empty List"
          onPress={handleCreateEmptyList}
          variant="outline"
          style={styles.emptyButton}
          icon="add"
        />
      </View>
    </View>
  );

  const renderSelectedList = () => {
    const selectedList = shoppingLists.find(list => list.id === selectedListId);
    if (!selectedList) return null;

    return (
      <View style={styles.selectedListContainer}>
        <View style={styles.selectedListHeader}>
          <CustomText variant="h3" style={styles.selectedListTitle}>
            {selectedList.title}
          </CustomText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedListId(null)}
          >
            <Ionicons name="close" size={24} color={Theme.colors.gray600} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Button
            title={activeList?.id === selectedList.id ? "Active List" : "Set Active"}
            onPress={() => setActiveList(selectedList.id)}
            variant={activeList?.id === selectedList.id ? "secondary" : "primary"}
            size="small"
            style={styles.quickAction}
            disabled={activeList?.id === selectedList.id}
          />
          
          <Button
            title="View Details"
            onPress={() => {
              // TODO: Navigate to detailed shopping list view
              Alert.alert('Coming Soon', 'Detailed shopping list view will be available soon');
            }}
            variant="outline"
            size="small"
            style={styles.quickAction}
          />
        </View>

        {/* Simple category summary */}
        <View style={styles.categorySummary}>
          <CustomText variant="h4" style={styles.categorySummaryTitle}>
            Categories ({selectedList.categories.length})
          </CustomText>
          {selectedList.categories.slice(0, 3).map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <Ionicons
                name={category.icon as any}
                size={16}
                color={category.color}
                style={styles.categoryIcon}
              />
                             <CustomText variant="body1" style={styles.categoryName}>
                 {category.name}
               </CustomText>
              <CustomText variant="caption" style={styles.categoryCount}>
                {category.items.length} items
              </CustomText>
            </View>
          ))}
          {selectedList.categories.length > 3 && (
            <CustomText variant="caption" style={styles.moreCategories}>
              +{selectedList.categories.length - 3} more categories
            </CustomText>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Container style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <CustomText variant="h2" style={styles.title}>
            Shopping Lists
          </CustomText>
          
          <View style={styles.headerActions}>
            {currentMealPlan && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCreateFromMealPlan}
              >
                <Ionicons name="restaurant" size={20} color={Theme.colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleCreateEmptyList}
            >
              <Ionicons name="add" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error */}
                 {error && (
           <Card style={styles.errorCard}>
             <CustomText variant="body1" style={styles.errorText}>
               {error}
             </CustomText>
           </Card>
         )}

        {/* Content */}
        <View style={styles.content}>
          {/* Lists or Empty State */}
          {shoppingLists.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.listsContainer}>
              <FlatList
                data={shoppingLists}
                keyExtractor={(item) => item.id}
                renderItem={renderShoppingListCard}
                contentContainerStyle={styles.listsList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Selected List Details */}
          {selectedListId && renderSelectedList()}
        </View>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    color: Theme.colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  headerButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  
  // Error
  errorCard: {
    margin: Theme.spacing.md,
    backgroundColor: Theme.colors.error,
  },
  errorText: {
    color: Theme.colors.white,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyTitle: {
    color: Theme.colors.gray700,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  emptySubtitle: {
    color: Theme.colors.gray500,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  emptyActions: {
    gap: Theme.spacing.md,
    alignItems: 'center',
  },
  emptyButton: {
    minWidth: 200,
  },
  
  // Lists
  listsContainer: {
    flex: 1,
  },
  listsList: {
    padding: Theme.spacing.md,
  },
  
  // List card
  listCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.medium,
  },
  selectedCard: {
    borderColor: Theme.colors.primary,
  },
  activeCard: {
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  
  // List header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  listTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listTitle: {
    color: Theme.colors.text,
    marginRight: Theme.spacing.sm,
  },
  activeBadge: {
    backgroundColor: Theme.colors.success,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
  },
  activeBadgeText: {
    color: Theme.colors.white,
    fontWeight: '600',
  },
  listStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Theme.spacing.xs,
  },
  statusText: {
    color: Theme.colors.gray600,
    fontWeight: '500',
  },
  
  // List stats
  listStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: Theme.colors.gray500,
    marginBottom: Theme.spacing.xs,
  },
  statValue: {
    color: Theme.colors.text,
    fontWeight: '600',
  },
  
  // Progress
  progressContainer: {
    marginBottom: Theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Theme.colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.success,
    borderRadius: 3,
  },
  
  // Description
  listDescription: {
    color: Theme.colors.gray600,
    fontStyle: 'italic',
  },
  
  // Selected list details
  selectedListContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    padding: Theme.spacing.md,
  },
  selectedListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  selectedListTitle: {
    color: Theme.colors.text,
    flex: 1,
  },
  closeButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.white,
  },
  
  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  quickAction: {
    flex: 1,
  },
  
  // Category summary
  categorySummary: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
  },
  categorySummaryTitle: {
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.backgroundSecondary,
  },
  categoryIcon: {
    marginRight: Theme.spacing.sm,
  },
  categoryName: {
    flex: 1,
    color: Theme.colors.text,
  },
  categoryCount: {
    color: Theme.colors.gray500,
  },
  moreCategories: {
    color: Theme.colors.gray500,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
    fontStyle: 'italic',
  },
});