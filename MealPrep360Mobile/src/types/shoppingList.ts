
export interface ShoppingList {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: ShoppingListStatus;
  categories: ShoppingCategory[];
  totalItems: number;
  completedItems: number;
  estimatedTotal?: number;
  actualTotal?: number;
  storeId?: string;
  storeName?: string;
  shoppingDate?: string;
  completedDate?: string;
  notes?: string;
  mealPlanId?: string; // Reference to source meal plan
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export interface ShoppingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  items: ShoppingItem[];
  isCollapsed?: boolean;
  estimatedTime?: number; // minutes to shop this category
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  isCompleted: boolean;
  isPriority: boolean;
  estimatedPrice?: number;
  actualPrice?: number;
  notes?: string;
  alternatives?: string[];
  recipeSource?: RecipeSource[];
  nutritionInfo?: ItemNutritionInfo;
  addedAt: string;
  completedAt?: string;
}

export interface RecipeSource {
  recipeId: string;
  recipeName: string;
  mealType: string;
  date: string;
  servings: number;
  originalAmount: number;
  originalUnit: string;
}

export interface ItemNutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

// Shopping list generation and management
export interface ShoppingListGenerationRequest {
  mealPlanId: string;
  selectedDays?: string[]; // ISO date strings, all days if not specified
  selectedMeals?: string[]; // meal types to include
  includeExistingIngredients?: boolean;
  pantryItems?: PantryItem[];
  preferences: ShoppingPreferences;
}

export interface PantryItem {
  ingredientName: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
  location?: string; // fridge, pantry, freezer
}

export interface ShoppingPreferences {
  preferredStore?: string;
  budgetLimit?: number;
  dietaryRestrictions: string[];
  preferredBrands: string[];
  avoidIngredients: string[];
  organicPreference: 'always' | 'when_possible' | 'never';
  groupSimilarItems: boolean;
  sortByStoreLayout: boolean;
  includeNutritionInfo: boolean;
}

// Store and location data
export interface Store {
  id: string;
  name: string;
  address: string;
  distance?: number;
  layout?: StoreLayout;
  averagePrices?: { [ingredient: string]: number };
  isPreferred: boolean;
}

export interface StoreLayout {
  sections: StoreSection[];
  totalAisles: number;
  estimatedShoppingTime: number;
}

export interface StoreSection {
  id: string;
  name: string;
  aisleNumber?: number;
  categories: string[];
  order: number;
}

// Shopping workflow and analytics
export interface ShoppingSession {
  id: string;
  shoppingListId: string;
  startTime: string;
  endTime?: string;
  totalTime?: number;
  itemsCompleted: number;
  totalSpent: number;
  efficiency: number; // 0-100 score
  notes?: string;
}

export interface ShoppingAnalytics {
  averageShoppingTime: number;
  averageItemsPerTrip: number;
  mostFrequentCategories: string[];
  budgetCompliance: number;
  favoriteStores: string[];
  spendingTrends: SpendingTrend[];
}

export interface SpendingTrend {
  category: string;
  amount: number;
  change: number; // percentage change from previous period
  period: string;
}

// Enums and constants
export type ShoppingListStatus = 
  | 'draft'
  | 'active'
  | 'shopping'
  | 'completed'
  | 'archived';

export const DEFAULT_SHOPPING_CATEGORIES: Omit<ShoppingCategory, 'id' | 'items'>[] = [
  {
    name: 'Produce',
    icon: 'leaf',
    color: '#16A34A',
    order: 1,
    estimatedTime: 8,
  },
  {
    name: 'Meat & Seafood',
    icon: 'fish',
    color: '#DC2626',
    order: 2,
    estimatedTime: 5,
  },
  {
    name: 'Dairy & Eggs',
    icon: 'egg',
    color: '#2563EB',
    order: 3,
    estimatedTime: 4,
  },
  {
    name: 'Pantry',
    icon: 'archive',
    color: '#D97706',
    order: 4,
    estimatedTime: 10,
  },
  {
    name: 'Frozen',
    icon: 'snow',
    color: '#0891B2',
    order: 5,
    estimatedTime: 3,
  },
  {
    name: 'Bakery',
    icon: 'bread',
    color: '#C2410C',
    order: 6,
    estimatedTime: 3,
  },
  {
    name: 'Beverages',
    icon: 'wine',
    color: '#7C3AED',
    order: 7,
    estimatedTime: 3,
  },
  {
    name: 'Snacks',
    icon: 'candy',
    color: '#BE185D',
    order: 8,
    estimatedTime: 2,
  },
  {
    name: 'Health & Beauty',
    icon: 'heart',
    color: '#059669',
    order: 9,
    estimatedTime: 4,
  },
  {
    name: 'Household',
    icon: 'home',
    color: '#4B5563',
    order: 10,
    estimatedTime: 5,
  },
  {
    name: 'Other',
    icon: 'shopping-bag',
    color: '#6B7280',
    order: 99,
    estimatedTime: 2,
  },
];

// Ingredient to category mapping
export const INGREDIENT_CATEGORY_MAP: { [key: string]: string } = {
  // Produce
  'onion': 'Produce',
  'garlic': 'Produce',
  'tomato': 'Produce',
  'bell pepper': 'Produce',
  'cucumber': 'Produce',
  'lettuce': 'Produce',
  'spinach': 'Produce',
  'broccoli': 'Produce',
  'carrot': 'Produce',
  'potato': 'Produce',
  'avocado': 'Produce',
  'lemon': 'Produce',
  'lime': 'Produce',
  'apple': 'Produce',
  'banana': 'Produce',
  'berries': 'Produce',
  'parsley': 'Produce',
  'cilantro': 'Produce',
  'basil': 'Produce',
  'ginger': 'Produce',
  
  // Meat & Seafood
  'chicken': 'Meat & Seafood',
  'beef': 'Meat & Seafood',
  'pork': 'Meat & Seafood',
  'turkey': 'Meat & Seafood',
  'salmon': 'Meat & Seafood',
  'shrimp': 'Meat & Seafood',
  'fish': 'Meat & Seafood',
  'ground beef': 'Meat & Seafood',
  'chicken thighs': 'Meat & Seafood',
  'bacon': 'Meat & Seafood',
  'sausage': 'Meat & Seafood',
  
  // Dairy & Eggs
  'milk': 'Dairy & Eggs',
  'eggs': 'Dairy & Eggs',
  'cheese': 'Dairy & Eggs',
  'yogurt': 'Dairy & Eggs',
  'butter': 'Dairy & Eggs',
  'cream': 'Dairy & Eggs',
  'sour cream': 'Dairy & Eggs',
  'cottage cheese': 'Dairy & Eggs',
  
  // Pantry
  'rice': 'Pantry',
  'pasta': 'Pantry',
  'quinoa': 'Pantry',
  'oats': 'Pantry',
  'flour': 'Pantry',
  'sugar': 'Pantry',
  'salt': 'Pantry',
  'pepper': 'Pantry',
  'olive oil': 'Pantry',
  'vegetable oil': 'Pantry',
  'vinegar': 'Pantry',
  'soy sauce': 'Pantry',
  'honey': 'Pantry',
  'canned tomatoes': 'Pantry',
  'beans': 'Pantry',
  'chickpeas': 'Pantry',
  'lentils': 'Pantry',
  'nuts': 'Pantry',
  'tahini': 'Pantry',
  'maple syrup': 'Pantry',
  'vanilla extract': 'Pantry',
  'baking powder': 'Pantry',
  'spices': 'Pantry',
  
  // Frozen
  'frozen vegetables': 'Frozen',
  'frozen fruit': 'Frozen',
  'ice cream': 'Frozen',
  'frozen chicken': 'Frozen',
  'frozen fish': 'Frozen',
  
  // Bakery
  'bread': 'Bakery',
  'tortillas': 'Bakery',
  'bagels': 'Bakery',
  'rolls': 'Bakery',
  
  // Beverages
  'water': 'Beverages',
  'juice': 'Beverages',
  'coffee': 'Beverages',
  'tea': 'Beverages',
  'soda': 'Beverages',
  'wine': 'Beverages',
  'beer': 'Beverages',
};

// Utility functions
export const getCategoryForIngredient = (ingredientName: string): string => {
  const lowerName = ingredientName.toLowerCase();
  
  // Check for exact matches first
  if (INGREDIENT_CATEGORY_MAP[lowerName]) {
    return INGREDIENT_CATEGORY_MAP[lowerName];
  }
  
  // Check for partial matches
  for (const [key, category] of Object.entries(INGREDIENT_CATEGORY_MAP)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return category;
    }
  }
  
  return 'Other';
};

export const consolidateIngredients = (items: ShoppingItem[]): ShoppingItem[] => {
  const consolidated: { [key: string]: ShoppingItem } = {};
  
  items.forEach(item => {
    const key = `${item.name.toLowerCase()}-${item.unit.toLowerCase()}`;
    
    if (consolidated[key]) {
      // Combine quantities
      consolidated[key].quantity += item.quantity;
      
      // Merge recipe sources
      if (item.recipeSource) {
        consolidated[key].recipeSource = [
          ...(consolidated[key].recipeSource || []),
          ...item.recipeSource
        ];
      }
      
      // Update prices if available
      if (item.estimatedPrice) {
        consolidated[key].estimatedPrice = 
          (consolidated[key].estimatedPrice || 0) + item.estimatedPrice;
      }
    } else {
      consolidated[key] = { ...item };
    }
  });
  
  return Object.values(consolidated);
};

export const calculateShoppingListStats = (shoppingList: ShoppingList) => {
  const totalItems = shoppingList.categories.reduce(
    (sum, category) => sum + category.items.length, 
    0
  );
  
  const completedItems = shoppingList.categories.reduce(
    (sum, category) => sum + category.items.filter(item => item.isCompleted).length,
    0
  );
  
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  
  const estimatedTotal = shoppingList.categories.reduce(
    (sum, category) => sum + category.items.reduce(
      (itemSum, item) => itemSum + (item.estimatedPrice || 0),
      0
    ),
    0
  );
  
  const estimatedTime = shoppingList.categories.reduce(
    (sum, category) => sum + (category.estimatedTime || 0),
    0
  );
  
  return {
    totalItems,
    completedItems,
    completionPercentage,
    estimatedTotal,
    estimatedTime,
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const formatQuantity = (quantity: number, unit: string): string => {
  // Handle fractional quantities
  if (quantity < 1) {
    const fraction = quantity;
    if (fraction === 0.25) return `1/4 ${unit}`;
    if (fraction === 0.33) return `1/3 ${unit}`;
    if (fraction === 0.5) return `1/2 ${unit}`;
    if (fraction === 0.67) return `2/3 ${unit}`;
    if (fraction === 0.75) return `3/4 ${unit}`;
  }
  
  // Handle whole numbers
  if (quantity === Math.floor(quantity)) {
    return `${quantity} ${unit}${quantity !== 1 ? 's' : ''}`;
  }
  
  // Handle decimals
  return `${quantity.toFixed(1)} ${unit}${quantity !== 1 ? 's' : ''}`;
};