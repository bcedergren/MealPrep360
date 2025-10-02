import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { EnhancedSearch, RecipeCard, RecipeFilters } from '../../src/components/recipe';
import {
  Button,
  Colors,
  EmptyState,
  Loading,
  Screen,
  Spacing,
  Text
} from '../../src/components/ui';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useRecipeSearch } from '../../src/hooks/useRecipeSearch';
import { Recipe } from '../../src/types/recipe';

export default function RecipesScreen() {
  const { isConnected } = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<'discover' | 'saved'>('discover');
  
  const {
    recipes,
    filteredRecipes,
    loading,
    refreshing,
    error,
    hasMore,
    filters,
    activeFilterCount,
    suggestions,
    searchHistory,
    suggestionsLoading,
    search,
    applyFilters,
    applyPreset,
    clearFilters,
    loadMore,
    refresh,
    updateSearchQuery,
    selectSuggestion,
    selectSearchHistory,
    clearSearchHistory,
  } = useRecipeSearch({
    pageSize: 20,
    enableCache: true,
  });

  const currentRecipes = activeTab === 'discover' ? filteredRecipes : [];

  const handleTabChange = (tab: 'discover' | 'saved') => {
    setActiveTab(tab);
    // TODO: Implement saved recipes logic
  };

  const handleRecipeUpdate = () => {
    // Refresh when a recipe is saved/unsaved
    refresh();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="h4" weight="bold">Recipes</Text>
      <View style={styles.headerActions}>
        <Button
          title=""
          variant="ghost"
          size="small"
          icon="grid-outline"
          onPress={() => {
            // TODO: Change to grid view
            Alert.alert('View Mode', 'Grid view coming soon!');
          }}
        />
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <Button
        title={`Discover (${recipes.length})`}
        variant={activeTab === 'discover' ? 'primary' : 'ghost'}
        size="small"
        onPress={() => handleTabChange('discover')}
        customStyle={styles.tabButton}
      />
      <Button
        title="Saved (0)"
        variant={activeTab === 'saved' ? 'primary' : 'ghost'}
        size="small"
        onPress={() => handleTabChange('saved')}
        customStyle={styles.tabButton}
      />
    </View>
  );

  const renderOfflineIndicator = () => {
    if (isConnected) return null;
    
    return (
      <View style={styles.offlineIndicator}>
        <Ionicons name="cloud-offline" size={16} color={Colors.error} />
        <Text variant="caption" color={Colors.error} customStyle={styles.offlineText}>
          Offline mode - Showing cached results
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    const hasFilters = activeFilterCount > 0;
    
    return (
      <EmptyState
        icon={hasFilters ? 'search-outline' : 'restaurant-outline'}
        title={hasFilters ? 'No recipes found' : 'Discover amazing recipes'}
        description={
          hasFilters 
            ? 'Try adjusting your filters or search terms'
            : 'Search for recipes by name, ingredient, or cuisine'
        }
        actionText={hasFilters ? 'Clear Filters' : undefined}
        onAction={hasFilters ? clearFilters : undefined}
      />
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text variant="h6" color={Colors.error} align="center">
        {error}
      </Text>
      <Button
        title="Try Again"
        variant="outline"
        onPress={refresh}
        customStyle={styles.retryButton}
      />
    </View>
  );

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeCardContainer}>
      <RecipeCard
        recipe={item}
        onSave={handleRecipeUpdate}
        isSaved={false} // TODO: Check if recipe is saved
        variant="grid"
      />
    </View>
  );

  const renderRecipeList = () => {
    if (error && activeTab === 'discover') {
      return renderErrorState();
    }

    if (currentRecipes.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={currentRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.recipeRow}
        contentContainerStyle={styles.recipeListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && !loading ? (
            <View style={styles.loadMoreContainer}>
              <Button
                title="Load More"
                variant="outline"
                loading={loading}
                onPress={loadMore}
              />
            </View>
          ) : null
        }
      />
    );
  };

  const renderContent = () => {
    if (loading && currentRecipes.length === 0) {
      return (
        <Loading
          variant="spinner"
          size="large"
          text="Discovering delicious recipes..."
          fullScreen
        />
      );
    }

    return renderRecipeList();
  };

  return (
    <Screen
      safeArea={true}
      padding="none"
      backgroundColor={Colors.background}
    >
      {renderHeader()}
      {renderTabs()}
      
      <EnhancedSearch
        value={filters.searchQuery}
        onChangeText={updateSearchQuery}
        onSubmit={search}
        suggestions={suggestions}
        searchHistory={searchHistory}
        loading={suggestionsLoading}
        onSuggestionPress={selectSuggestion}
        onHistoryPress={selectSearchHistory}
        onClearHistory={clearSearchHistory}
      />
      
      <RecipeFilters
        filters={filters}
        onFiltersChange={applyFilters}
        onPresetsApply={applyPreset}
        activeFilterCount={activeFilterCount}
      />
      
      {renderOfflineIndicator()}
      
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    gap: Spacing.xs,
  },
  offlineText: {
    marginLeft: 0,
  },
  contentContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  retryButton: {
    minWidth: 120,
  },
  recipeListContent: {
    padding: Spacing.lg,
  },
  recipeRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  recipeCardContainer: {
    width: '48%',
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});