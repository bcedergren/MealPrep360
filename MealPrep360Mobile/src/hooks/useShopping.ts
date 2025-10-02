import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { MealPlan } from '../types/mealPlan';
import { Recipe } from '../types/recipe';
import {
    ShoppingList,
    ShoppingListGenerationRequest,
    ShoppingListStatus,
    calculateShoppingListStats
} from '../types/shoppingList';
import { ShoppingListGenerator } from '../utils/shoppingListGenerator';

const STORAGE_KEY = 'meal_prep_shopping_lists';
const ACTIVE_LIST_KEY = 'meal_prep_active_shopping_list';

interface UseShoppingReturn {
  // Current state
  shoppingLists: ShoppingList[];
  activeList: ShoppingList | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Shopping list management
  createFromMealPlan: (mealPlan: MealPlan, recipes: Recipe[], request: ShoppingListGenerationRequest) => Promise<ShoppingList>;
  createEmptyList: (title: string, description?: string) => Promise<ShoppingList>;
  deleteList: (listId: string) => Promise<void>;
  setActiveList: (listId: string | null) => Promise<void>;
  updateListStatus: (listId: string, status: ShoppingListStatus) => Promise<void>;
  
  // Item management
  addItem: (listId: string, name: string, quantity: number, unit: string, category?: string) => Promise<void>;
  removeItem: (listId: string, itemId: string) => Promise<void>;
  toggleItemCompletion: (listId: string, itemId: string) => Promise<void>;
  updateItemQuantity: (listId: string, itemId: string, quantity: number) => Promise<void>;
  updateItemPrice: (listId: string, itemId: string, price: number) => Promise<void>;
  
  // Category management
  toggleCategoryCollapse: (listId: string, categoryId: string) => Promise<void>;
  
  // Utility functions
  getListStats: (listId: string) => ReturnType<typeof calculateShoppingListStats> | null;
  getCompletionPercentage: (listId: string) => number;
  getTotalEstimatedPrice: (listId: string) => number;
  
  // Bulk operations
  clearCompletedItems: (listId: string) => Promise<void>;
  markAllCompleted: (listId: string) => Promise<void>;
  duplicateList: (listId: string) => Promise<ShoppingList>;
  
  // Sync and persistence
  syncLists: () => Promise<void>;
  loadLists: () => Promise<void>;
  saveLists: () => Promise<void>;
}

export const useShopping = (): UseShoppingReturn => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveListState] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load shopping lists from storage on mount
  useEffect(() => {
    loadLists();
  }, []);

  // Update active list when shopping lists change
  useEffect(() => {
    if (activeList) {
      const updatedActiveList = shoppingLists.find(list => list.id === activeList.id);
      if (updatedActiveList) {
        setActiveListState(updatedActiveList);
      }
    }
  }, [shoppingLists, activeList]);

  // Load shopping lists from AsyncStorage
  const loadLists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [listsData, activeListId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ACTIVE_LIST_KEY)
      ]);

      if (listsData) {
        const parsedLists: ShoppingList[] = JSON.parse(listsData);
        setShoppingLists(parsedLists);

        if (activeListId) {
          const active = parsedLists.find(list => list.id === activeListId);
          setActiveListState(active || null);
        }
      } else {
        // Initialize with empty data for now
        setShoppingLists([]);
        setActiveListState(null);
      }
    } catch (err) {
      console.error('Error loading shopping lists:', err);
      setError('Failed to load shopping lists');
      // Fallback to empty data
      setShoppingLists([]);
      setActiveListState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save shopping lists to AsyncStorage
  const saveLists = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(shoppingLists));
    } catch (err) {
      console.error('Error saving shopping lists:', err);
      setError('Failed to save shopping lists');
    }
  }, [shoppingLists]);

  // Auto-save when shopping lists change
  useEffect(() => {
    if (shoppingLists.length > 0) {
      saveLists();
    }
  }, [shoppingLists, saveLists]);

  // Create shopping list from meal plan
  const createFromMealPlan = useCallback(async (
    mealPlan: MealPlan, 
    recipes: Recipe[], 
    request: ShoppingListGenerationRequest
  ): Promise<ShoppingList> => {
    try {
      setError(null);
      const newList = await ShoppingListGenerator.generateFromMealPlan(mealPlan, recipes, request);
      
      setShoppingLists(prev => [newList, ...prev]);
      return newList;
    } catch (err) {
      console.error('Error creating shopping list from meal plan:', err);
      setError('Failed to create shopping list');
      throw err;
    }
  }, []);

  // Create empty shopping list
  const createEmptyList = useCallback(async (title: string, description?: string): Promise<ShoppingList> => {
    try {
      setError(null);
      const newList: ShoppingList = {
        id: `shopping-${Date.now()}`,
        userId: 'current-user', // TODO: Get from auth context
        title,
        description,
        status: 'draft',
        categories: [],
        totalItems: 0,
        completedItems: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false,
      };

      setShoppingLists(prev => [newList, ...prev]);
      return newList;
    } catch (err) {
      console.error('Error creating empty shopping list:', err);
      setError('Failed to create shopping list');
      throw err;
    }
  }, []);

  // Delete shopping list
  const deleteList = useCallback(async (listId: string) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.filter(list => list.id !== listId));
      
      if (activeList?.id === listId) {
        setActiveListState(null);
        await AsyncStorage.removeItem(ACTIVE_LIST_KEY);
      }
    } catch (err) {
      console.error('Error deleting shopping list:', err);
      setError('Failed to delete shopping list');
    }
  }, [activeList]);

  // Set active shopping list
  const setActiveList = useCallback(async (listId: string | null) => {
    try {
      setError(null);
      if (listId) {
        const list = shoppingLists.find(l => l.id === listId);
        if (list) {
          setActiveListState(list);
          await AsyncStorage.setItem(ACTIVE_LIST_KEY, listId);
        }
      } else {
        setActiveListState(null);
        await AsyncStorage.removeItem(ACTIVE_LIST_KEY);
      }
    } catch (err) {
      console.error('Error setting active list:', err);
      setError('Failed to set active shopping list');
    }
  }, [shoppingLists]);

  // Update shopping list status
  const updateListStatus = useCallback(async (listId: string, status: ShoppingListStatus) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => 
        list.id === listId 
          ? { 
              ...list, 
              status, 
              updatedAt: new Date().toISOString(),
              completedDate: status === 'completed' ? new Date().toISOString() : undefined 
            }
          : list
      ));
    } catch (err) {
      console.error('Error updating list status:', err);
      setError('Failed to update list status');
    }
  }, []);

  // Add item to shopping list
  const addItem = useCallback(async (
    listId: string, 
    name: string, 
    quantity: number, 
    unit: string, 
    category?: string
  ) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
          const updatedList = ShoppingListGenerator.addCustomItem(list, name, quantity, unit, category);
          return updatedList;
        }
        return list;
      }));
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item');
    }
  }, []);

  // Remove item from shopping list
  const removeItem = useCallback(async (listId: string, itemId: string) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
          const updatedList = ShoppingListGenerator.removeItem(list, itemId);
          return updatedList;
        }
        return list;
      }));
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item');
    }
  }, []);

  // Toggle item completion
  const toggleItemCompletion = useCallback(async (listId: string, itemId: string) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
          const updatedList = ShoppingListGenerator.toggleItemCompletion(list, itemId);
          return updatedList;
        }
        return list;
      }));
    } catch (err) {
      console.error('Error toggling item completion:', err);
      setError('Failed to update item');
    }
  }, []);

  // Update item quantity
  const updateItemQuantity = useCallback(async (listId: string, itemId: string, quantity: number) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            categories: list.categories.map(category => ({
              ...category,
              items: category.items.map(item => 
                item.id === itemId 
                  ? { 
                      ...item, 
                      quantity,
                      estimatedPrice: ShoppingListGenerator['estimateIngredientPrice'](item.name, quantity, item.unit)
                    }
                  : item
              )
            })),
            updatedAt: new Date().toISOString(),
          };
        }
        return list;
      }));
    } catch (err) {
      console.error('Error updating item quantity:', err);
      setError('Failed to update item quantity');
    }
  }, []);

  // Update item price
  const updateItemPrice = useCallback(async (listId: string, itemId: string, price: number) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            categories: list.categories.map(category => ({
              ...category,
              items: category.items.map(item => 
                item.id === itemId 
                  ? { ...item, actualPrice: price }
                  : item
              )
            })),
            updatedAt: new Date().toISOString(),
          };
        }
        return list;
      }));
    } catch (err) {
      console.error('Error updating item price:', err);
      setError('Failed to update item price');
    }
  }, []);

  // Toggle category collapse
  const toggleCategoryCollapse = useCallback(async (listId: string, categoryId: string) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            categories: list.categories.map(category => 
              category.id === categoryId 
                ? { ...category, isCollapsed: !category.isCollapsed }
                : category
            ),
            updatedAt: new Date().toISOString(),
          };
        }
        return list;
      }));
    } catch (err) {
      console.error('Error toggling category:', err);
      setError('Failed to toggle category');
    }
  }, []);

  // Get list statistics
  const getListStats = useCallback((listId: string) => {
    const list = shoppingLists.find(l => l.id === listId);
    return list ? calculateShoppingListStats(list) : null;
  }, [shoppingLists]);

  // Get completion percentage
  const getCompletionPercentage = useCallback((listId: string): number => {
    const stats = getListStats(listId);
    return stats ? stats.completionPercentage : 0;
  }, [getListStats]);

  // Get total estimated price
  const getTotalEstimatedPrice = useCallback((listId: string): number => {
    const stats = getListStats(listId);
    return stats ? stats.estimatedTotal : 0;
  }, [getListStats]);

  // Clear completed items
  const clearCompletedItems = useCallback(async (listId: string) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            categories: list.categories.map(category => ({
              ...category,
              items: category.items.filter(item => !item.isCompleted)
            })).filter(category => category.items.length > 0),
            updatedAt: new Date().toISOString(),
          };
        }
        return list;
      }));
    } catch (err) {
      console.error('Error clearing completed items:', err);
      setError('Failed to clear completed items');
    }
  }, []);

  // Mark all items as completed
  const markAllCompleted = useCallback(async (listId: string) => {
    try {
      setError(null);
      setShoppingLists(prev => prev.map(list => {
        if (list.id === listId) {
          const now = new Date().toISOString();
          return {
            ...list,
            categories: list.categories.map(category => ({
              ...category,
              items: category.items.map(item => ({
                ...item,
                isCompleted: true,
                completedAt: now,
              }))
            })),
            completedItems: list.totalItems,
            updatedAt: now,
          };
        }
        return list;
      }));
    } catch (err) {
      console.error('Error marking all completed:', err);
      setError('Failed to mark all items as completed');
    }
  }, []);

  // Duplicate shopping list
  const duplicateList = useCallback(async (listId: string): Promise<ShoppingList> => {
    try {
      setError(null);
      const originalList = shoppingLists.find(list => list.id === listId);
      if (!originalList) {
        throw new Error('Shopping list not found');
      }

      const now = new Date().toISOString();
      const duplicatedList: ShoppingList = {
        ...originalList,
        id: `shopping-${Date.now()}`,
        title: `${originalList.title} (Copy)`,
        status: 'draft',
        completedItems: 0,
        categories: originalList.categories.map(category => ({
          ...category,
          id: `category-${category.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          items: category.items.map(item => ({
            ...item,
            id: `item-${Date.now()}-${Math.random()}`,
            isCompleted: false,
            completedAt: undefined,
            addedAt: now,
          }))
        })),
        createdAt: now,
        updatedAt: now,
      };

      setShoppingLists(prev => [duplicatedList, ...prev]);
      return duplicatedList;
    } catch (err) {
      console.error('Error duplicating list:', err);
      setError('Failed to duplicate shopping list');
      throw err;
    }
  }, [shoppingLists]);

  // Sync with remote server (placeholder)
  const syncLists = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);
      // TODO: Implement actual sync with backend
      // For now, just simulate sync
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Error syncing lists:', err);
      setError('Failed to sync shopping lists');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    // State
    shoppingLists,
    activeList,
    isLoading,
    isSyncing,
    error,
    
    // Shopping list management
    createFromMealPlan,
    createEmptyList,
    deleteList,
    setActiveList,
    updateListStatus,
    
    // Item management
    addItem,
    removeItem,
    toggleItemCompletion,
    updateItemQuantity,
    updateItemPrice,
    
    // Category management
    toggleCategoryCollapse,
    
    // Utility functions
    getListStats,
    getCompletionPercentage,
    getTotalEstimatedPrice,
    
    // Bulk operations
    clearCompletedItems,
    markAllCompleted,
    duplicateList,
    
    // Sync and persistence
    syncLists,
    loadLists,
    saveLists,
  };
};