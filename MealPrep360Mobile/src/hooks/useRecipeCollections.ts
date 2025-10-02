import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
    COLLECTION_COLORS,
    CollectionFilter,
    createDefaultCollections,
    DEFAULT_COLLECTION_TEMPLATES,
    generateShareCode,
    getCollectionStats,
    RecipeBookmark,
    RecipeCollection,
} from '../types/collections';
import { Recipe } from '../types/recipe';
import { useRecommendations } from './useRecommendations';

interface UseRecipeCollectionsProps {
  autoSync?: boolean;
}

interface UseRecipeCollectionsReturn {
  // Collections state
  collections: RecipeCollection[];
  bookmarks: RecipeBookmark[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Collection management
  createCollection: (data: Partial<RecipeCollection>) => Promise<RecipeCollection>;
  updateCollection: (id: string, updates: Partial<RecipeCollection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  duplicateCollection: (id: string, newName?: string) => Promise<RecipeCollection>;
  
  // Recipe management in collections
  addRecipeToCollection: (recipeId: string, collectionId: string) => Promise<void>;
  removeRecipeFromCollection: (recipeId: string, collectionId: string) => Promise<void>;
  moveRecipeBetweenCollections: (recipeId: string, fromId: string, toId: string) => Promise<void>;
  
  // Bookmarks and favorites
  bookmarkRecipe: (recipe: Recipe, collectionIds?: string[], notes?: string) => Promise<void>;
  unbookmarkRecipe: (recipeId: string) => Promise<void>;
  isRecipeBookmarked: (recipeId: string) => boolean;
  getRecipeBookmark: (recipeId: string) => RecipeBookmark | null;
  updateBookmarkNotes: (recipeId: string, notes: string) => Promise<void>;
  markRecipeAsCooked: (recipeId: string, cookingTime?: number) => Promise<void>;
  
  // Quick actions
  addToFavorites: (recipe: Recipe) => Promise<void>;
  removeFromFavorites: (recipeId: string) => Promise<void>;
  addToTryLater: (recipe: Recipe) => Promise<void>;
  removeFromTryLater: (recipeId: string) => Promise<void>;
  
  // Collection utilities
  getCollectionById: (id: string) => RecipeCollection | null;
  getCollectionsByRecipe: (recipeId: string) => RecipeCollection[];
  searchCollections: (query: string) => RecipeCollection[];
  filterCollections: (filter: Partial<CollectionFilter>) => RecipeCollection[];
  
  // Social features
  shareCollection: (id: string, shareType: 'public' | 'friends') => Promise<string>;
  unshareCollection: (id: string) => Promise<void>;
  getSharedCollections: () => RecipeCollection[];
  
  // Statistics
  getCollectionStats: (id: string) => any;
  getTotalRecipeCount: () => number;
  getMostUsedCollections: (limit?: number) => RecipeCollection[];
  getRecentlyAddedRecipes: (limit?: number) => { recipe: Recipe; collection: RecipeCollection; addedAt: string }[];
  
  // Import/Export
  exportCollections: () => string;
  importCollections: (data: string) => Promise<void>;
  
  // Templates and suggestions
  getCollectionTemplates: () => typeof DEFAULT_COLLECTION_TEMPLATES;
  createCollectionFromTemplate: (templateId: string, customName?: string) => Promise<RecipeCollection>;
  suggestCollectionsForRecipe: (recipe: Recipe) => RecipeCollection[];
}

const STORAGE_KEYS = {
  COLLECTIONS: 'recipe_collections',
  BOOKMARKS: 'recipe_bookmarks',
  COLLECTION_ACTIVITY: 'collection_activity',
};

export const useRecipeCollections = ({
  autoSync = true,
}: UseRecipeCollectionsProps = {}): UseRecipeCollectionsReturn => {
  const { user } = useUser();
  const { recordInteraction } = useRecommendations();
  
  // State
  const [collections, setCollections] = useState<RecipeCollection[]>([]);
  const [bookmarks, setBookmarks] = useState<RecipeBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user?.id]);

  // Auto-sync collections with server
  useEffect(() => {
    if (autoSync && user) {
      const syncInterval = setInterval(() => {
        // Sync with API in production
        console.log('Auto-syncing collections...');
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => clearInterval(syncInterval);
    }
  }, [autoSync, user]);

  // Load user collections and bookmarks from storage
  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [collectionsData, bookmarksData] = await Promise.all([
        AsyncStorage.getItem(`${STORAGE_KEYS.COLLECTIONS}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.BOOKMARKS}_${user.id}`),
      ]);

      // Load collections
      if (collectionsData) {
        const parsedCollections: RecipeCollection[] = JSON.parse(collectionsData);
        setCollections(parsedCollections);
      } else {
        // Create default collections for new users
        const defaultCollections = createDefaultCollections(user.id);
        setCollections(defaultCollections);
        await saveCollections(defaultCollections);
      }

      // Load bookmarks
      if (bookmarksData) {
        const parsedBookmarks: RecipeBookmark[] = JSON.parse(bookmarksData);
        setBookmarks(parsedBookmarks);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save collections to storage
  const saveCollections = useCallback(async (collectionsToSave: RecipeCollection[]) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.COLLECTIONS}_${user.id}`,
        JSON.stringify(collectionsToSave)
      );
    } catch (err) {
      console.error('Error saving collections:', err);
      throw new Error('Failed to save collections');
    }
  }, [user]);

  // Save bookmarks to storage
  const saveBookmarks = useCallback(async (bookmarksToSave: RecipeBookmark[]) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.BOOKMARKS}_${user.id}`,
        JSON.stringify(bookmarksToSave)
      );
    } catch (err) {
      console.error('Error saving bookmarks:', err);
      throw new Error('Failed to save bookmarks');
    }
  }, [user]);

  // Create new collection
  const createCollection = useCallback(async (data: Partial<RecipeCollection>): Promise<RecipeCollection> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsSaving(true);
      setError(null);

      const newCollection: RecipeCollection = {
        id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        name: data.name || 'New Collection',
        description: data.description || '',
        emoji: data.emoji || '📂',
        color: data.color || COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)],
        recipeIds: [],
        isPrivate: data.isPrivate ?? true,
        isDefault: false,
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isShared: false,
        collaborators: [],
        recipeCount: 0,
        ...data,
      };

      const updatedCollections = [...collections, newCollection];
      setCollections(updatedCollections);
      await saveCollections(updatedCollections);

      return newCollection;
    } catch (err) {
      console.error('Error creating collection:', err);
      setError('Failed to create collection');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user, collections, saveCollections]);

  // Update existing collection
  const updateCollection = useCallback(async (id: string, updates: Partial<RecipeCollection>) => {
    try {
      setIsSaving(true);
      setError(null);

      const updatedCollections = collections.map(collection =>
        collection.id === id
          ? {
              ...collection,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : collection
      );

      setCollections(updatedCollections);
      await saveCollections(updatedCollections);
    } catch (err) {
      console.error('Error updating collection:', err);
      setError('Failed to update collection');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [collections, saveCollections]);

  // Delete collection
  const deleteCollection = useCallback(async (id: string) => {
    try {
      setIsSaving(true);
      setError(null);

      // Don't allow deleting default collections
      const collection = collections.find(c => c.id === id);
      if (collection?.isDefault) {
        throw new Error('Cannot delete default collections');
      }

      const updatedCollections = collections.filter(c => c.id !== id);
      setCollections(updatedCollections);
      await saveCollections(updatedCollections);

      // Remove collection references from bookmarks
      const updatedBookmarks = bookmarks.map(bookmark => ({
        ...bookmark,
        collectionIds: bookmark.collectionIds.filter(cId => cId !== id),
      }));
      setBookmarks(updatedBookmarks);
      await saveBookmarks(updatedBookmarks);
    } catch (err) {
      console.error('Error deleting collection:', err);
      setError('Failed to delete collection');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [collections, bookmarks, saveCollections, saveBookmarks]);

  // Duplicate collection
  const duplicateCollection = useCallback(async (id: string, newName?: string): Promise<RecipeCollection> => {
    const originalCollection = collections.find(c => c.id === id);
    if (!originalCollection) {
      throw new Error('Collection not found');
    }

    const duplicateData: Partial<RecipeCollection> = {
      name: newName || `${originalCollection.name} (Copy)`,
      description: originalCollection.description,
      emoji: originalCollection.emoji,
      color: originalCollection.color,
      recipeIds: [...originalCollection.recipeIds],
      tags: [...originalCollection.tags],
      isPrivate: true, // Always make copies private
    };

    return await createCollection(duplicateData);
  }, [collections, createCollection]);

  // Add recipe to collection
  const addRecipeToCollection = useCallback(async (recipeId: string, collectionId: string) => {
    try {
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) throw new Error('Collection not found');

      if (collection.recipeIds.includes(recipeId)) {
        return; // Recipe already in collection
      }

      const updatedRecipeIds = [...collection.recipeIds, recipeId];
      await updateCollection(collectionId, {
        recipeIds: updatedRecipeIds,
        recipeCount: updatedRecipeIds.length,
      });

      // Update bookmark if exists
      const bookmark = bookmarks.find(b => b.recipeId === recipeId);
      if (bookmark) {
        const updatedBookmarks = bookmarks.map(b =>
          b.recipeId === recipeId
            ? { ...b, collectionIds: [...new Set([...b.collectionIds, collectionId])] }
            : b
        );
        setBookmarks(updatedBookmarks);
        await saveBookmarks(updatedBookmarks);
      }

      // Record interaction for recommendations
      await recordInteraction({
        recipeId,
        action: 'saved',
      });
    } catch (err) {
      console.error('Error adding recipe to collection:', err);
      setError('Failed to add recipe to collection');
      throw err;
    }
  }, [collections, bookmarks, updateCollection, saveBookmarks, recordInteraction]);

  // Remove recipe from collection
  const removeRecipeFromCollection = useCallback(async (recipeId: string, collectionId: string) => {
    try {
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) throw new Error('Collection not found');

      const updatedRecipeIds = collection.recipeIds.filter(id => id !== recipeId);
      await updateCollection(collectionId, {
        recipeIds: updatedRecipeIds,
        recipeCount: updatedRecipeIds.length,
      });

      // Update bookmark
      const updatedBookmarks = bookmarks.map(b =>
        b.recipeId === recipeId
          ? { ...b, collectionIds: b.collectionIds.filter(id => id !== collectionId) }
          : b
      );
      setBookmarks(updatedBookmarks);
      await saveBookmarks(updatedBookmarks);

      // Record interaction
      await recordInteraction({
        recipeId,
        action: 'viewed',
      });
    } catch (err) {
      console.error('Error removing recipe from collection:', err);
      setError('Failed to remove recipe from collection');
      throw err;
    }
  }, [collections, bookmarks, updateCollection, saveBookmarks, recordInteraction]);

  // Move recipe between collections
  const moveRecipeBetweenCollections = useCallback(async (recipeId: string, fromId: string, toId: string) => {
    try {
      await removeRecipeFromCollection(recipeId, fromId);
      await addRecipeToCollection(recipeId, toId);
    } catch (err) {
      console.error('Error moving recipe between collections:', err);
      throw err;
    }
  }, [addRecipeToCollection, removeRecipeFromCollection]);

  // Bookmark recipe
  const bookmarkRecipe = useCallback(async (recipe: Recipe, collectionIds: string[] = [], notes?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const existingBookmark = bookmarks.find(b => b.recipeId === recipe.id);
      
      if (existingBookmark) {
        // Update existing bookmark
        const updatedBookmarks = bookmarks.map(b =>
          b.recipeId === recipe.id
            ? {
                ...b,
                collectionIds: [...new Set([...b.collectionIds, ...collectionIds])],
                notes: notes || b.notes,
                updatedAt: new Date().toISOString(),
              }
            : b
        );
        setBookmarks(updatedBookmarks);
        await saveBookmarks(updatedBookmarks);
      } else {
        // Create new bookmark
        const newBookmark: RecipeBookmark = {
          id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          recipeId: recipe.id,
          recipe,
          collectionIds,
          notes,
          tags: [],
          isCooked: false,
          cookedDates: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          personalNotes: '',
          customIngredients: [],
        };

        const updatedBookmarks = [...bookmarks, newBookmark];
        setBookmarks(updatedBookmarks);
        await saveBookmarks(updatedBookmarks);
      }

      // Add to collections
      for (const collectionId of collectionIds) {
        await addRecipeToCollection(recipe.id, collectionId);
      }

      // Record interaction
      await recordInteraction({
        recipeId: recipe.id,
        action: 'saved',
      });
    } catch (err) {
      console.error('Error bookmarking recipe:', err);
      setError('Failed to bookmark recipe');
      throw err;
    }
  }, [user, bookmarks, saveBookmarks, addRecipeToCollection, recordInteraction]);

  // Unbookmark recipe
  const unbookmarkRecipe = useCallback(async (recipeId: string) => {
    try {
      const bookmark = bookmarks.find(b => b.recipeId === recipeId);
      if (!bookmark) return;

      // Remove from all collections
      for (const collectionId of bookmark.collectionIds) {
        await removeRecipeFromCollection(recipeId, collectionId);
      }

      // Remove bookmark
      const updatedBookmarks = bookmarks.filter(b => b.recipeId !== recipeId);
      setBookmarks(updatedBookmarks);
      await saveBookmarks(updatedBookmarks);

      // Record interaction
      await recordInteraction({
        recipeId,
        action: 'viewed',
      });
    } catch (err) {
      console.error('Error unbookmarking recipe:', err);
      setError('Failed to unbookmark recipe');
      throw err;
    }
  }, [bookmarks, removeRecipeFromCollection, saveBookmarks, recordInteraction]);

  // Check if recipe is bookmarked
  const isRecipeBookmarked = useCallback((recipeId: string): boolean => {
    return bookmarks.some(b => b.recipeId === recipeId);
  }, [bookmarks]);

  // Get recipe bookmark
  const getRecipeBookmark = useCallback((recipeId: string): RecipeBookmark | null => {
    return bookmarks.find(b => b.recipeId === recipeId) || null;
  }, [bookmarks]);

  // Update bookmark notes
  const updateBookmarkNotes = useCallback(async (recipeId: string, notes: string) => {
    try {
      const updatedBookmarks = bookmarks.map(b =>
        b.recipeId === recipeId
          ? { ...b, notes, updatedAt: new Date().toISOString() }
          : b
      );
      setBookmarks(updatedBookmarks);
      await saveBookmarks(updatedBookmarks);
    } catch (err) {
      console.error('Error updating bookmark notes:', err);
      throw err;
    }
  }, [bookmarks, saveBookmarks]);

  // Mark recipe as cooked
  const markRecipeAsCooked = useCallback(async (recipeId: string, cookingTime?: number) => {
    try {
      const updatedBookmarks = bookmarks.map(b =>
        b.recipeId === recipeId
          ? {
              ...b,
              isCooked: true,
              cookedDates: [...b.cookedDates, new Date().toISOString()],
              cookingTimeActual: cookingTime || b.cookingTimeActual,
              updatedAt: new Date().toISOString(),
            }
          : b
      );
      setBookmarks(updatedBookmarks);
      await saveBookmarks(updatedBookmarks);

      // Record interaction
      await recordInteraction({
        recipeId,
        action: 'cooked',
        cookingTime,
      });
    } catch (err) {
      console.error('Error marking recipe as cooked:', err);
      throw err;
    }
  }, [bookmarks, saveBookmarks, recordInteraction]);

  // Quick action: Add to favorites
  const addToFavorites = useCallback(async (recipe: Recipe) => {
    const favoritesCollection = collections.find(c => c.isDefault && c.name === 'Favorites');
    if (favoritesCollection) {
      await bookmarkRecipe(recipe, [favoritesCollection.id]);
    }
  }, [collections, bookmarkRecipe]);

  // Quick action: Remove from favorites
  const removeFromFavorites = useCallback(async (recipeId: string) => {
    const favoritesCollection = collections.find(c => c.isDefault && c.name === 'Favorites');
    if (favoritesCollection) {
      await removeRecipeFromCollection(recipeId, favoritesCollection.id);
    }
  }, [collections, removeRecipeFromCollection]);

  // Quick action: Add to try later
  const addToTryLater = useCallback(async (recipe: Recipe) => {
    const tryLaterCollection = collections.find(c => c.isDefault && c.name === 'To Try');
    if (tryLaterCollection) {
      await bookmarkRecipe(recipe, [tryLaterCollection.id]);
    }
  }, [collections, bookmarkRecipe]);

  // Quick action: Remove from try later
  const removeFromTryLater = useCallback(async (recipeId: string) => {
    const tryLaterCollection = collections.find(c => c.isDefault && c.name === 'To Try');
    if (tryLaterCollection) {
      await removeRecipeFromCollection(recipeId, tryLaterCollection.id);
    }
  }, [collections, removeRecipeFromCollection]);

  // Get collection by ID
  const getCollectionById = useCallback((id: string): RecipeCollection | null => {
    return collections.find(c => c.id === id) || null;
  }, [collections]);

  // Get collections that contain a recipe
  const getCollectionsByRecipe = useCallback((recipeId: string): RecipeCollection[] => {
    return collections.filter(c => c.recipeIds.includes(recipeId));
  }, [collections]);

  // Search collections
  const searchCollections = useCallback((query: string): RecipeCollection[] => {
    const lowercaseQuery = query.toLowerCase();
    return collections.filter(c =>
      c.name.toLowerCase().includes(lowercaseQuery) ||
      c.description?.toLowerCase().includes(lowercaseQuery) ||
      c.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [collections]);

  // Filter collections
  const filterCollections = useCallback((filter: Partial<CollectionFilter>): RecipeCollection[] => {
    let filtered = collections;

    if (filter.isPrivate !== undefined) {
      filtered = filtered.filter(c => c.isPrivate === filter.isPrivate);
    }

    if (filter.isShared !== undefined) {
      filtered = filtered.filter(c => c.isShared === filter.isShared);
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(c =>
        filter.tags!.some(tag => c.tags.includes(tag))
      );
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }

    // Sort results
    const sortBy = filter.sortBy || 'updatedAt';
    const sortOrder = filter.sortOrder || 'desc';

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [collections]);

  // Share collection
  const shareCollection = useCallback(async (id: string, shareType: 'public' | 'friends'): Promise<string> => {
    const shareCode = generateShareCode();
    
    await updateCollection(id, {
      isShared: true,
      shareCode,
    });

    return shareCode;
  }, [updateCollection]);

  // Unshare collection
  const unshareCollection = useCallback(async (id: string) => {
    await updateCollection(id, {
      isShared: false,
      shareCode: undefined,
    });
  }, [updateCollection]);

  // Get shared collections
  const getSharedCollections = useCallback((): RecipeCollection[] => {
    return collections.filter(c => c.isShared);
  }, [collections]);

  // Get collection statistics
  const getCollectionStatsForId = useCallback((id: string) => {
    const collection = collections.find(c => c.id === id);
    if (!collection) return null;
    return getCollectionStats(collection);
  }, [collections]);

  // Get total recipe count across all collections
  const getTotalRecipeCount = useCallback((): number => {
    return bookmarks.length;
  }, [bookmarks]);

  // Get most used collections
  const getMostUsedCollections = useCallback((limit: number = 5): RecipeCollection[] => {
    return collections
      .filter(c => !c.isDefault)
      .sort((a, b) => b.recipeCount - a.recipeCount)
      .slice(0, limit);
  }, [collections]);

  // Get recently added recipes
  const getRecentlyAddedRecipes = useCallback((limit: number = 10) => {
    return bookmarks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(bookmark => {
        const collection = collections.find(c => bookmark.collectionIds.includes(c.id));
        return {
          recipe: bookmark.recipe!,
          collection: collection!,
          addedAt: bookmark.createdAt,
        };
      })
      .filter(item => item.collection);
  }, [bookmarks, collections]);

  // Export collections
  const exportCollections = useCallback((): string => {
    const exportData = {
      collections,
      bookmarks,
      exportedAt: new Date().toISOString(),
      userId: user?.id,
    };
    return JSON.stringify(exportData, null, 2);
  }, [collections, bookmarks, user]);

  // Import collections
  const importCollections = useCallback(async (data: string) => {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.collections || !Array.isArray(importData.collections)) {
        throw new Error('Invalid import data format');
      }

      // Add imported collections (with new IDs to avoid conflicts)
      const importedCollections = importData.collections.map((collection: RecipeCollection) => ({
        ...collection,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user?.id,
        isShared: false,
        shareCode: undefined,
        collaborators: [],
      }));

      const updatedCollections = [...collections, ...importedCollections];
      setCollections(updatedCollections);
      await saveCollections(updatedCollections);

      // Import bookmarks if available
      if (importData.bookmarks && Array.isArray(importData.bookmarks)) {
        const importedBookmarks = importData.bookmarks.map((bookmark: RecipeBookmark) => ({
          ...bookmark,
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user?.id,
          collectionIds: [], // Will need to map these manually
        }));

        const updatedBookmarks = [...bookmarks, ...importedBookmarks];
        setBookmarks(updatedBookmarks);
        await saveBookmarks(updatedBookmarks);
      }
    } catch (err) {
      console.error('Error importing collections:', err);
      throw new Error('Failed to import collections');
    }
  }, [collections, bookmarks, user, saveCollections, saveBookmarks]);

  // Get collection templates
  const getCollectionTemplates = useCallback(() => {
    return DEFAULT_COLLECTION_TEMPLATES;
  }, []);

  // Create collection from template
  const createCollectionFromTemplate = useCallback(async (templateId: string, customName?: string): Promise<RecipeCollection> => {
    const template = DEFAULT_COLLECTION_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const collectionData: Partial<RecipeCollection> = {
      name: customName || template.name,
      description: template.description,
      emoji: template.emoji,
      color: template.color,
      tags: [...template.suggestedTags],
    };

    return await createCollection(collectionData);
  }, [createCollection]);

  // Suggest collections for recipe
  const suggestCollectionsForRecipe = useCallback((recipe: Recipe): RecipeCollection[] => {
    const suggestions: RecipeCollection[] = [];

    // Suggest based on recipe characteristics
    if (recipe.prepTime + recipe.cookTime <= 30) {
      const quickCollection = collections.find(c => c.tags.includes('quick'));
      if (quickCollection) suggestions.push(quickCollection);
    }

    if (recipe.tags.includes('Healthy') || (recipe.nutritionInfo?.calories && recipe.nutritionInfo.calories < 400)) {
      const healthyCollection = collections.find(c => c.tags.includes('healthy'));
      if (healthyCollection) suggestions.push(healthyCollection);
    }

    if (recipe.tags.includes('Meal Prep')) {
      const mealPrepCollection = collections.find(c => c.tags.includes('meal-prep'));
      if (mealPrepCollection) suggestions.push(mealPrepCollection);
    }

    // Always suggest default collections
    const defaultCollections = collections.filter(c => c.isDefault);
    suggestions.push(...defaultCollections);

    return [...new Set(suggestions)]; // Remove duplicates
  }, [collections]);

  return {
    // Collections state
    collections,
    bookmarks,
    isLoading,
    isSaving,
    error,
    
    // Collection management
    createCollection,
    updateCollection,
    deleteCollection,
    duplicateCollection,
    
    // Recipe management in collections
    addRecipeToCollection,
    removeRecipeFromCollection,
    moveRecipeBetweenCollections,
    
    // Bookmarks and favorites
    bookmarkRecipe,
    unbookmarkRecipe,
    isRecipeBookmarked,
    getRecipeBookmark,
    updateBookmarkNotes,
    markRecipeAsCooked,
    
    // Quick actions
    addToFavorites,
    removeFromFavorites,
    addToTryLater,
    removeFromTryLater,
    
    // Collection utilities
    getCollectionById,
    getCollectionsByRecipe,
    searchCollections,
    filterCollections,
    
    // Social features
    shareCollection,
    unshareCollection,
    getSharedCollections,
    
    // Statistics
    getCollectionStats: getCollectionStatsForId,
    getTotalRecipeCount,
    getMostUsedCollections,
    getRecentlyAddedRecipes,
    
    // Import/Export
    exportCollections,
    importCollections,
    
    // Templates and suggestions
    getCollectionTemplates,
    createCollectionFromTemplate,
    suggestCollectionsForRecipe,
  };
};

export default useRecipeCollections;