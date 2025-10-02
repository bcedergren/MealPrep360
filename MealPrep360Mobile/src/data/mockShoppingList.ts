import { DEFAULT_SHOPPING_CATEGORIES, ShoppingCategory, ShoppingItem, ShoppingList } from '../types/shoppingList';

export const mockShoppingItems: ShoppingItem[] = [
  // Produce items
  {
    id: 'item-1',
    name: 'Chicken Breast',
    quantity: 2,
    unit: 'lbs',
    category: 'Meat & Seafood',
    isCompleted: false,
    isPriority: true,
    estimatedPrice: 12.99,
    recipeSource: [
      {
        recipeId: 'recipe-1',
        recipeName: 'Grilled Chicken Salad',
        mealType: 'lunch',
        date: '2024-01-15',
        servings: 4,
        originalAmount: 1,
        originalUnit: 'lb',
      }
    ],
    addedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'item-2',
    name: 'Mixed Greens',
    quantity: 1,
    unit: 'bag',
    category: 'Produce',
    isCompleted: true,
    isPriority: false,
    estimatedPrice: 3.49,
    completedAt: '2024-01-14T15:30:00Z',
    recipeSource: [
      {
        recipeId: 'recipe-1',
        recipeName: 'Grilled Chicken Salad',
        mealType: 'lunch',
        date: '2024-01-15',
        servings: 4,
        originalAmount: 1,
        originalUnit: 'bag',
      }
    ],
    addedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'item-3',
    name: 'Cherry Tomatoes',
    quantity: 1,
    unit: 'container',
    category: 'Produce',
    isCompleted: false,
    isPriority: false,
    estimatedPrice: 2.99,
    recipeSource: [
      {
        recipeId: 'recipe-1',
        recipeName: 'Grilled Chicken Salad',
        mealType: 'lunch',
        date: '2024-01-15',
        servings: 4,
        originalAmount: 1,
        originalUnit: 'container',
      }
    ],
    addedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'item-4',
    name: 'Avocado',
    quantity: 3,
    unit: 'pieces',
    category: 'Produce',
    isCompleted: true,
    isPriority: false,
    estimatedPrice: 4.50,
    completedAt: '2024-01-14T15:30:00Z',
    addedAt: '2024-01-14T10:00:00Z',
  },
  
  // Dairy & Eggs
  {
    id: 'item-5',
    name: 'Greek Yogurt',
    quantity: 32,
    unit: 'oz',
    category: 'Dairy & Eggs',
    isCompleted: false,
    isPriority: false,
    estimatedPrice: 5.99,
    recipeSource: [
      {
        recipeId: 'recipe-2',
        recipeName: 'Protein Smoothie Bowl',
        mealType: 'breakfast',
        date: '2024-01-16',
        servings: 2,
        originalAmount: 1,
        originalUnit: 'cup',
      }
    ],
    addedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'item-6',
    name: 'Eggs',
    quantity: 12,
    unit: 'pieces',
    category: 'Dairy & Eggs',
    isCompleted: false,
    isPriority: false,
    estimatedPrice: 3.99,
    addedAt: '2024-01-14T10:00:00Z',
  },
  
  // Pantry
  {
    id: 'item-7',
    name: 'Olive Oil',
    quantity: 1,
    unit: 'bottle',
    category: 'Pantry',
    isCompleted: false,
    isPriority: false,
    estimatedPrice: 8.99,
    addedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'item-8',
    name: 'Quinoa',
    quantity: 1,
    unit: 'bag',
    category: 'Pantry',
    isCompleted: true,
    isPriority: false,
    estimatedPrice: 6.49,
    completedAt: '2024-01-14T15:30:00Z',
    recipeSource: [
      {
        recipeId: 'recipe-3',
        recipeName: 'Mediterranean Quinoa Bowl',
        mealType: 'dinner',
        date: '2024-01-17',
        servings: 4,
        originalAmount: 1,
        originalUnit: 'cup',
      }
    ],
    addedAt: '2024-01-14T10:00:00Z',
  },
  
  // Frozen
  {
    id: 'item-9',
    name: 'Frozen Berries',
    quantity: 1,
    unit: 'bag',
    category: 'Frozen',
    isCompleted: false,
    isPriority: false,
    estimatedPrice: 4.99,
    recipeSource: [
      {
        recipeId: 'recipe-2',
        recipeName: 'Protein Smoothie Bowl',
        mealType: 'breakfast',
        date: '2024-01-16',
        servings: 2,
        originalAmount: 0.5,
        originalUnit: 'cup',
      }
    ],
    addedAt: '2024-01-14T10:00:00Z',
  },
  
  // Other custom items
  {
    id: 'item-10',
    name: 'Whole Grain Bread',
    quantity: 1,
    unit: 'loaf',
    category: 'Bakery',
    isCompleted: false,
    isPriority: false,
    estimatedPrice: 3.99,
    addedAt: '2024-01-14T10:00:00Z',
  },
];

export const createShoppingCategories = (items: ShoppingItem[]): ShoppingCategory[] => {
  const categoryMap = new Map<string, ShoppingItem[]>();
  
  // Group items by category
  items.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, []);
    }
    categoryMap.get(item.category)!.push(item);
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
  
  return categories.sort((a, b) => a.order - b.order);
};

export const mockShoppingList: ShoppingList = {
  id: 'shopping-list-1',
  userId: 'user-1',
  title: 'Weekly Groceries',
  description: 'Full week meal plan • 3 meals • Budget: $80',
  status: 'active',
  categories: createShoppingCategories(mockShoppingItems),
  totalItems: mockShoppingItems.length,
  completedItems: mockShoppingItems.filter(item => item.isCompleted).length,
  estimatedTotal: mockShoppingItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0),
  mealPlanId: 'meal-plan-1',
  storeName: 'Whole Foods Market',
  createdAt: '2024-01-14T10:00:00Z',
  updatedAt: '2024-01-14T16:00:00Z',
  isArchived: false,
};

export const mockShoppingListDraft: ShoppingList = {
  id: 'shopping-list-2',
  userId: 'user-1',
  title: 'Quick Shopping List',
  description: 'Selected 3 days • lunch, dinner meals',
  status: 'draft',
  categories: createShoppingCategories(mockShoppingItems.slice(0, 5)),
  totalItems: 5,
  completedItems: 0,
  estimatedTotal: 25.96,
  mealPlanId: 'meal-plan-1',
  createdAt: '2024-01-13T14:00:00Z',
  updatedAt: '2024-01-13T14:00:00Z',
  isArchived: false,
};

export const mockShoppingListCompleted: ShoppingList = {
  id: 'shopping-list-3',
  userId: 'user-1',
  title: 'Last Week\'s Groceries',
  description: 'Full week meal plan • Budget: $75',
  status: 'completed',
  categories: createShoppingCategories(
    mockShoppingItems.slice(0, 8).map(item => ({ ...item, isCompleted: true, completedAt: '2024-01-07T18:00:00Z' }))
  ),
  totalItems: 8,
  completedItems: 8,
  estimatedTotal: 50.43,
  actualTotal: 52.18,
  mealPlanId: 'meal-plan-old',
  storeName: 'Safeway',
  completedDate: '2024-01-07T18:00:00Z',
  createdAt: '2024-01-07T10:00:00Z',
  updatedAt: '2024-01-07T18:00:00Z',
  isArchived: false,
};

export const mockShoppingLists: ShoppingList[] = [
  mockShoppingList,
  mockShoppingListDraft,
  mockShoppingListCompleted,
];

// Helper function to create a custom shopping list
export const createMockShoppingList = (
  title: string,
  itemCount: number = 5,
  completionPercentage: number = 0
): ShoppingList => {
  const items = mockShoppingItems.slice(0, itemCount).map((item, index) => ({
    ...item,
    id: `item-${Date.now()}-${index}`,
    isCompleted: index < Math.floor(itemCount * (completionPercentage / 100)),
    completedAt: index < Math.floor(itemCount * (completionPercentage / 100)) 
      ? new Date().toISOString() 
      : undefined,
  }));
  
  const categories = createShoppingCategories(items);
  const completedItems = items.filter(item => item.isCompleted).length;
  
  return {
    id: `shopping-list-${Date.now()}`,
    userId: 'user-1',
    title,
    description: `${itemCount} items • ${Math.round(completionPercentage)}% complete`,
    status: completionPercentage === 100 ? 'completed' : 
            completionPercentage > 0 ? 'shopping' : 'draft',
    categories,
    totalItems: itemCount,
    completedItems,
    estimatedTotal: items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isArchived: false,
  };
};