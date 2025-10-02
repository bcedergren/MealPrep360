import { MealPlan, MealPlanDay, MealRecipe, MealSlot } from '../types/mealPlan';
import { Recipe } from '../types/recipe';
import {
    consolidateIngredients,
    DEFAULT_SHOPPING_CATEGORIES,
    getCategoryForIngredient,
    PantryItem,
    RecipeSource,
    ShoppingCategory,
    ShoppingItem,
    ShoppingList,
    ShoppingListGenerationRequest,
} from '../types/shoppingList';

export class ShoppingListGenerator {
  /**
   * Generate a shopping list from a meal plan
   */
  static async generateFromMealPlan(
    mealPlan: MealPlan,
    recipes: Recipe[],
    request: ShoppingListGenerationRequest
  ): Promise<ShoppingList> {
    // Create recipe lookup for efficiency
    const recipeMap = new Map(recipes.map(recipe => [recipe.id, recipe]));
    
    // Generate shopping items from meal plan
    const shoppingItems = this.extractShoppingItems(
      mealPlan,
      recipeMap,
      request
    );
    
    // Consolidate similar ingredients
    const consolidatedItems = consolidateIngredients(shoppingItems);
    
    // Remove pantry items if specified
    const filteredItems = request.includeExistingIngredients 
      ? consolidatedItems 
      : this.removePantryItems(consolidatedItems, request.pantryItems || []);
    
    // Organize items by category
    const categories = this.organizeItemsByCategory(filteredItems);
    
    // Apply user preferences
    const sortedCategories = this.applySortingPreferences(categories, request);
    
    // Calculate totals
    const totalItems = filteredItems.length;
    const estimatedTotal = filteredItems.reduce(
      (sum, item) => sum + (item.estimatedPrice || 0), 
      0
    );
    
    // Create shopping list
    const shoppingList: ShoppingList = {
      id: `shopping-${Date.now()}`,
      userId: 'current-user', // TODO: Get from auth context
      title: this.generateTitle(mealPlan, request),
      description: this.generateDescription(mealPlan, request),
      status: 'draft',
      categories: sortedCategories,
      totalItems,
      completedItems: 0,
      estimatedTotal,
      mealPlanId: mealPlan.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
    };
    
    return shoppingList;
  }
  
  /**
   * Extract shopping items from meal plan
   */
  private static extractShoppingItems(
    mealPlan: MealPlan,
    recipeMap: Map<string, Recipe>,
    request: ShoppingListGenerationRequest
  ): ShoppingItem[] {
    const items: ShoppingItem[] = [];
    
    // Filter days if specified
    const daysToInclude = request.selectedDays || 
      mealPlan.days.map((day: MealPlanDay) => day.date);
    
    // Filter meal types if specified
    const mealTypesToInclude = request.selectedMeals || 
      ['breakfast', 'lunch', 'dinner', 'snack'];
    
    mealPlan.days.forEach((day: MealPlanDay) => {
      if (!daysToInclude.includes(day.date)) return;
      
      // Process meal slots that match the selected meal types
      day.meals.forEach((mealSlot: MealSlot) => {
        if (!mealTypesToInclude.includes(mealSlot.mealType)) return;
        
        // Process each recipe in the meal slot
        mealSlot.recipes.forEach((mealRecipe: MealRecipe) => {
          const recipe = recipeMap.get(mealRecipe.recipeId);
          if (!recipe) return;
          
          // Extract ingredients from recipe
          const recipeItems = this.extractIngredientsFromRecipe(
            recipe,
            mealRecipe.servings,
            {
              recipeId: mealRecipe.recipeId,
              recipeName: recipe.title,
              mealType: mealSlot.mealType,
              date: day.date,
              servings: mealRecipe.servings,
              originalAmount: 1,
              originalUnit: 'serving',
            }
          );
          
          items.push(...recipeItems);
        });
      });
    });
    
    return items;
  }
  
  /**
   * Extract ingredients from a recipe and convert to shopping items
   */
  private static extractIngredientsFromRecipe(
    recipe: Recipe,
    servings: number,
    recipeSource: RecipeSource
  ): ShoppingItem[] {
    return recipe.ingredients.map(ingredient => {
      // Calculate adjusted quantity based on servings
      const adjustedQuantity = (ingredient.amount / recipe.servings) * servings;
      
      // Estimate price based on ingredient type and quantity
      const estimatedPrice = this.estimateIngredientPrice(
        ingredient.name,
        adjustedQuantity,
        ingredient.unit
      );
      
      return {
        id: `item-${Date.now()}-${Math.random()}`,
        name: ingredient.name,
        quantity: adjustedQuantity,
        unit: ingredient.unit,
        category: getCategoryForIngredient(ingredient.name),
        isCompleted: false,
        isPriority: ingredient.category === 'Protein' || ingredient.category === 'Pantry',
        estimatedPrice,
        recipeSource: [recipeSource],
        addedAt: new Date().toISOString(),
      };
    });
  }
  
  /**
   * Remove items that are already in pantry
   */
  private static removePantryItems(
    items: ShoppingItem[],
    pantryItems: PantryItem[]
  ): ShoppingItem[] {
    const pantryMap = new Map(
      pantryItems.map(item => [
        `${item.ingredientName.toLowerCase()}-${item.unit.toLowerCase()}`,
        item
      ])
    );
    
    return items.filter(item => {
      const key = `${item.name.toLowerCase()}-${item.unit.toLowerCase()}`;
      const pantryItem = pantryMap.get(key);
      
      if (!pantryItem) return true;
      
      // Check if we have enough in pantry
      return pantryItem.quantity < item.quantity;
    }).map(item => {
      const key = `${item.name.toLowerCase()}-${item.unit.toLowerCase()}`;
      const pantryItem = pantryMap.get(key);
      
      if (pantryItem && pantryItem.quantity < item.quantity) {
        // Reduce quantity by what we have in pantry
        return {
          ...item,
          quantity: item.quantity - pantryItem.quantity,
        };
      }
      
      return item;
    });
  }
  
  /**
   * Organize items by category
   */
  private static organizeItemsByCategory(items: ShoppingItem[]): ShoppingCategory[] {
    const categoryMap = new Map<string, ShoppingItem[]>();
    
    // Group items by category
    items.forEach(item => {
      const category = item.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(item);
    });
    
    // Create categories based on default categories
    const categories: ShoppingCategory[] = DEFAULT_SHOPPING_CATEGORIES
      .filter(defaultCategory => categoryMap.has(defaultCategory.name))
      .map(defaultCategory => ({
        id: `category-${defaultCategory.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: defaultCategory.name,
        icon: defaultCategory.icon,
        color: defaultCategory.color,
        order: defaultCategory.order,
        items: categoryMap.get(defaultCategory.name) || [],
        estimatedTime: defaultCategory.estimatedTime,
        isCollapsed: false,
      }));
    
    // Add any custom categories that don't match defaults
    categoryMap.forEach((items, categoryName) => {
      if (!DEFAULT_SHOPPING_CATEGORIES.find(cat => cat.name === categoryName)) {
        categories.push({
          id: `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
          name: categoryName,
          icon: 'shopping-bag',
          color: '#6B7280',
          order: 99,
          items,
          estimatedTime: 2,
          isCollapsed: false,
        });
      }
    });
    
    return categories;
  }
  
  /**
   * Apply sorting preferences to categories
   */
  private static applySortingPreferences(
    categories: ShoppingCategory[],
    request: ShoppingListGenerationRequest
  ): ShoppingCategory[] {
    // Sort categories by order
    const sortedCategories = categories.sort((a, b) => a.order - b.order);
    
    // Sort items within each category
    sortedCategories.forEach(category => {
      category.items.sort((a, b) => {
        // Priority items first
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        
        // Then by name
        return a.name.localeCompare(b.name);
      });
    });
    
    return sortedCategories;
  }
  
  /**
   * Generate title for shopping list
   */
  private static generateTitle(
    mealPlan: MealPlan,
    request: ShoppingListGenerationRequest
  ): string {
    const startDate = new Date(mealPlan.startDate);
    const endDate = new Date(mealPlan.endDate);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    if (request.selectedDays && request.selectedDays.length < 7) {
      return `Shopping List (${request.selectedDays.length} days)`;
    }
    
    return `Weekly Shopping List (${formatDate(startDate)} - ${formatDate(endDate)})`;
  }
  
  /**
   * Generate description for shopping list
   */
  private static generateDescription(
    mealPlan: MealPlan,
    request: ShoppingListGenerationRequest
  ): string {
    const parts: string[] = [];
    
    if (request.selectedDays && request.selectedDays.length < 7) {
      parts.push(`Selected ${request.selectedDays.length} days`);
    } else {
      parts.push('Full week meal plan');
    }
    
    if (request.selectedMeals && request.selectedMeals.length < 4) {
      parts.push(`${request.selectedMeals.join(', ')} meals`);
    }
    
    if (request.preferences.budgetLimit) {
      parts.push(`Budget: $${request.preferences.budgetLimit}`);
    }
    
    return parts.join(' • ');
  }
  
  /**
   * Estimate ingredient price based on type and quantity
   */
  private static estimateIngredientPrice(
    name: string,
    quantity: number,
    unit: string
  ): number {
    // Basic price estimation - in a real app, this would use actual pricing data
    const pricePerUnit: { [key: string]: number } = {
      // Produce (per item or lb)
      'onion': 0.5,
      'garlic': 0.25,
      'tomato': 2.0,
      'bell pepper': 1.5,
      'avocado': 2.0,
      'lemon': 0.5,
      'lime': 0.3,
      'apple': 1.5,
      'banana': 0.5,
      'spinach': 3.0,
      'lettuce': 2.0,
      'carrot': 1.0,
      'potato': 1.5,
      'broccoli': 2.5,
      
      // Meat & Seafood (per lb)
      'chicken': 6.0,
      'beef': 8.0,
      'salmon': 12.0,
      'shrimp': 10.0,
      'ground beef': 5.0,
      'chicken thighs': 4.0,
      'bacon': 6.0,
      
      // Dairy & Eggs
      'milk': 3.0,
      'eggs': 3.0,
      'cheese': 4.0,
      'yogurt': 1.0,
      'butter': 4.0,
      
      // Pantry items
      'rice': 2.0,
      'pasta': 1.5,
      'quinoa': 4.0,
      'olive oil': 5.0,
      'flour': 3.0,
      'sugar': 2.0,
      'oats': 3.0,
      'beans': 1.5,
      'nuts': 8.0,
      'honey': 5.0,
      
      // Beverages
      'water': 1.0,
      'juice': 4.0,
      'coffee': 6.0,
      'tea': 3.0,
      
      // Bakery
      'bread': 2.5,
      'tortillas': 3.0,
      'bagels': 4.0,
    };
    
    const lowerName = name.toLowerCase();
    
    // Find matching price
    let basePrice = pricePerUnit[lowerName];
    if (!basePrice) {
      // Try partial matches
      for (const [key, price] of Object.entries(pricePerUnit)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
          basePrice = price;
          break;
        }
      }
    }
    
    // Default price if no match found
    if (!basePrice) {
      basePrice = 3.0;
    }
    
    // Adjust for quantity and unit
    let multiplier = quantity;
    
    // Unit conversions for price calculation
    if (unit.toLowerCase().includes('oz')) {
      multiplier = quantity / 16; // Convert oz to lbs
    } else if (unit.toLowerCase().includes('gram')) {
      multiplier = quantity / 453.592; // Convert grams to lbs
    } else if (unit.toLowerCase().includes('tsp') || unit.toLowerCase().includes('teaspoon')) {
      multiplier = quantity / 48; // Rough conversion for spices
    } else if (unit.toLowerCase().includes('tbsp') || unit.toLowerCase().includes('tablespoon')) {
      multiplier = quantity / 16; // Rough conversion for liquids
    } else if (unit.toLowerCase().includes('cup')) {
      multiplier = quantity / 2; // Rough conversion for dry goods
    }
    
    return Math.round(basePrice * multiplier * 100) / 100;
  }
  
  /**
   * Add custom item to shopping list
   */
  static addCustomItem(
    shoppingList: ShoppingList,
    itemName: string,
    quantity: number,
    unit: string,
    category?: string
  ): ShoppingList {
    const newItem: ShoppingItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      name: itemName,
      quantity,
      unit,
      category: category || getCategoryForIngredient(itemName),
      isCompleted: false,
      isPriority: false,
      estimatedPrice: this.estimateIngredientPrice(itemName, quantity, unit),
      addedAt: new Date().toISOString(),
    };
    
    // Find or create category
    let targetCategory = shoppingList.categories.find(cat => cat.name === newItem.category);
    
    if (!targetCategory) {
      const defaultCategory = DEFAULT_SHOPPING_CATEGORIES.find(cat => cat.name === newItem.category);
      targetCategory = {
        id: `category-${newItem.category.toLowerCase().replace(/\s+/g, '-')}`,
        name: newItem.category,
        icon: defaultCategory?.icon || 'shopping-bag',
        color: defaultCategory?.color || '#6B7280',
        order: defaultCategory?.order || 99,
        items: [],
        estimatedTime: defaultCategory?.estimatedTime || 2,
        isCollapsed: false,
      };
      shoppingList.categories.push(targetCategory);
    }
    
    targetCategory.items.push(newItem);
    
    // Update totals
    shoppingList.totalItems += 1;
    shoppingList.estimatedTotal = (shoppingList.estimatedTotal || 0) + (newItem.estimatedPrice || 0);
    shoppingList.updatedAt = new Date().toISOString();
    
    return shoppingList;
  }
  
  /**
   * Remove item from shopping list
   */
  static removeItem(shoppingList: ShoppingList, itemId: string): ShoppingList {
    let removedItem: ShoppingItem | undefined;
    
    shoppingList.categories.forEach(category => {
      const itemIndex = category.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        removedItem = category.items.splice(itemIndex, 1)[0];
      }
    });
    
    if (removedItem) {
      shoppingList.totalItems -= 1;
      if (removedItem.isCompleted) {
        shoppingList.completedItems -= 1;
      }
      shoppingList.estimatedTotal = (shoppingList.estimatedTotal || 0) - (removedItem.estimatedPrice || 0);
      shoppingList.updatedAt = new Date().toISOString();
    }
    
    // Remove empty categories
    shoppingList.categories = shoppingList.categories.filter(category => category.items.length > 0);
    
    return shoppingList;
  }
  
  /**
   * Toggle item completion
   */
  static toggleItemCompletion(shoppingList: ShoppingList, itemId: string): ShoppingList {
    let targetItem: ShoppingItem | undefined;
    
    shoppingList.categories.forEach(category => {
      const item = category.items.find(item => item.id === itemId);
      if (item) {
        targetItem = item;
      }
    });
    
    if (targetItem) {
      targetItem.isCompleted = !targetItem.isCompleted;
      targetItem.completedAt = targetItem.isCompleted ? new Date().toISOString() : undefined;
      
      // Update completed count
      const completedCount = shoppingList.categories.reduce(
        (sum, category) => sum + category.items.filter(item => item.isCompleted).length,
        0
      );
      shoppingList.completedItems = completedCount;
      shoppingList.updatedAt = new Date().toISOString();
    }
    
    return shoppingList;
  }
}