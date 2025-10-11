# Recipe Schema Mapping - Python AI Service ↔ Application

## 🎯 Complete Field Mapping

This document shows how the Python AI service output maps to your application's recipe schema.

---

## ✅ Python AI Service Output (All Fields)

### Core Fields
```json
{
  "title": "Hearty Chicken and Wild Rice Soup",
  "description": "A comforting, freezer-friendly soup perfect for batch cooking. Rich with vegetables and tender chicken in a creamy broth.",
  "summary": "Comforting chicken soup with wild rice, perfect for freezer meal prep.",
  
  // Ingredients with structured data
  "ingredients": [
    {
      "name": "chicken breast",
      "amount": "2",
      "unit": "lbs"
    },
    {
      "name": "wild rice",
      "amount": "1",
      "unit": "cup"
    }
    // ... more ingredients
  ],
  
  // All instruction types
  "instructions": [
    "Dice chicken into 1-inch cubes",
    "Sauté onions and garlic until fragrant",
    "Add chicken and brown on all sides"
    // Main cooking steps
  ],
  "prepInstructions": [
    "Wash and chop all vegetables",
    "Measure out all ingredients",
    "Prepare containers for freezing"
  ],
  "cookingInstructions": [
    "Bring broth to a boil",
    "Add rice and simmer for 30 minutes",
    "Stir in cream and heat through"
  ],
  "servingInstructions": [
    "Ladle into bowls",
    "Garnish with fresh parsley",
    "Serve with crusty bread"
  ],
  
  // Freezer-specific fields
  "freezerPrep": [
    "Cool completely before freezing",
    "Divide into 2-cup portions",
    "Leave 1 inch headspace in containers"
  ],
  "defrostInstructions": [
    "Thaw overnight in refrigerator",
    "Or use defrost setting on microwave",
    "Do not thaw at room temperature"
  ],
  "containerSuggestions": [
    "Freezer-safe plastic containers with tight lids",
    "Glass containers (leave room for expansion)",
    "Freezer bags (lay flat for space saving)"
  ],
  
  // Time and servings
  "prepTime": 20,
  "cookTime": 45,
  "servings": 6,
  "storageTime": 90,  // days
  
  // Classification
  "category": "soup",
  "cuisine": "American",
  "difficulty": "easy",
  "mealType": "dinner",
  "season": "fall",
  
  // Tags and dietary
  "tags": [
    "comfort food",
    "family-friendly",
    "batch cooking",
    "freezer-friendly"
  ],
  "allergenInfo": [
    "dairy",
    "gluten"
  ],
  "dietaryInfo": [
    "can be made gluten-free",
    "contains dairy"
  ],
  
  // Nutrition per serving
  "nutrition": {
    "calories": 380,
    "protein": 28.0,
    "carbs": 35.0,
    "fat": 12.0,
    "fiber": 4.0,
    "sugar": 5.0,
    "sodium": 680.0
  }
}
```

---

## 🔄 Mapping to MongoDB Schema

### Direct Mapping (No Transformation Needed)
```typescript
// These map 1:1 from Python AI → MongoDB
title → title
description → description
prepTime → prepTime
cookTime → cookTime
servings → servings
season → season
difficulty → difficulty
category → category
cuisine → cuisine
tags → tags
allergenInfo → allergenInfo
dietaryInfo → dietaryInfo
nutrition → nutrition
```

### Array Transformations
```typescript
// Python AI returns arrays, MongoDB expects arrays or strings
ingredients → ingredients (array of objects)
instructions → instructions (keep as array)
prepInstructions → prepInstructions (array → string or array)
cookingInstructions → cookingInstructions (array → string or array)
servingInstructions → servingInstructions (array → string or array)
defrostInstructions → defrostInstructions (array → string or array)
freezerPrep → freezerPrep (array → string)
containerSuggestions → containerSuggestions (array → string or array)
storageTime → storageTime (number → string)
mealType → mealType (string)
```

### Fields Set by Application (Not from AI)
```typescript
// These are added when saving to database:
clerkId: string              // User ID from Clerk auth
_id: ObjectId                // MongoDB auto-generated
isPublic: boolean            // User choice (default false)
isPlaceholder: boolean       // System flag (default false)
hasImage: boolean            // Set after image generation
imageUrl: string            // Generated separately via DALL-E
imageBase64: string         // Optional base64 encoded image
spoonacularId: string       // Only for imported recipes
analysis: object            // Optional AI analysis
originalLanguage: string    // Default 'en'
createdAt: Date             // Auto timestamp
updatedAt: Date             // Auto timestamp
```

---

## 📋 Complete Application Recipe Interface

```typescript
interface ApplicationRecipe {
  // From Python AI Service
  title: string
  description: string
  summary: string
  ingredients: Array<{
    name: string
    amount: string
    unit: string
  }>
  instructions: string[]
  prepInstructions: string[]
  cookingInstructions: string[]
  servingInstructions: string[]
  freezerPrep: string[]
  defrostInstructions: string[]
  containerSuggestions: string[]
  prepTime: number
  cookTime: number
  servings: number
  storageTime: number
  category: string
  cuisine: string
  difficulty: 'easy' | 'medium' | 'hard'
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  season: string
  tags: string[]
  allergenInfo: string[]
  dietaryInfo: string[]
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }
  
  // Set by application when saving
  _id?: string
  clerkId: string           // From auth context
  isPublic: boolean         // User preference
  isPlaceholder: boolean    // false for AI-generated
  hasImage: boolean         // true after image generated
  imageUrl?: string         // From DALL-E endpoint
  imageBase64?: string      // Optional
  spoonacularId?: string    // null for AI recipes
  analysis?: any            // Optional
  originalLanguage: string  // 'en'
  createdAt: Date           // Auto
  updatedAt: Date           // Auto
}
```

---

## 🔌 Integration Example

### When Saving AI-Generated Recipe to Database:

```typescript
// 1. Get recipe from Python AI service
const aiResponse = await fetch('http://ai-service:8000/api/recipes/generate', {
  method: 'POST',
  body: JSON.stringify({ season: 'fall', servings: 6 })
})
const { recipe, cost, generation_time } = await aiResponse.json()

// 2. Optionally generate image
const imageResponse = await fetch('http://ai-service:8000/api/images/generate', {
  method: 'POST',
  body: JSON.stringify({
    recipe_title: recipe.title,
    recipe_description: recipe.description
  })
})
const { url: imageUrl } = await imageResponse.json()

// 3. Combine with application metadata
const recipeToSave = {
  // From AI service (all fields)
  ...recipe,
  
  // Add application-specific fields
  clerkId: user.id,
  isPublic: false,
  isPlaceholder: false,
  hasImage: !!imageUrl,
  imageUrl: imageUrl,
  originalLanguage: 'en',
  
  // Timestamps (auto-generated by MongoDB)
  createdAt: new Date(),
  updatedAt: new Date()
}

// 4. Save to MongoDB
await Recipe.create(recipeToSave)
```

---

## ✅ Validation Checklist

When you receive a recipe from the AI service, it will include:

### Core Information
- [x] Title (validated - no season names)
- [x] Description (2-3 sentences)
- [x] Summary (one sentence)
- [x] Category (soup, casserole, etc.)
- [x] Cuisine (Italian, Mexican, etc.)
- [x] Difficulty (easy/medium/hard)
- [x] Meal type (breakfast/lunch/dinner/snacks)

### Ingredients & Instructions
- [x] Ingredients (min 3, with name/amount/unit)
- [x] Main instructions
- [x] Prep instructions
- [x] Cooking instructions
- [x] Serving instructions

### Freezer-Specific
- [x] Freezer prep steps
- [x] Container suggestions
- [x] Defrost instructions
- [x] Storage time (days)

### Time & Servings
- [x] Prep time (minutes)
- [x] Cook time (minutes)
- [x] Servings (1-20)

### Dietary & Tags
- [x] Tags (descriptive)
- [x] Allergen info
- [x] Dietary info (vegetarian, vegan, etc.)

### Nutrition (per serving)
- [x] Calories
- [x] Protein (g)
- [x] Carbs (g)
- [x] Fat (g)
- [x] Fiber (g)
- [x] Sugar (g)
- [x] Sodium (mg)

---

## 🚀 Testing the Complete Schema

### Test with Interactive Docs

1. Open: http://localhost:8000/docs
2. POST /api/recipes/generate
3. Try it out
4. Execute
5. **Verify all fields are present in response**

### Example Response Structure

```json
{
  "recipe": {
    "title": "...",
    "description": "...",
    "summary": "...",
    "ingredients": [...],
    "instructions": [...],
    "prepInstructions": [...],
    "cookingInstructions": [...],
    "servingInstructions": [...],
    "freezerPrep": [...],
    "defrostInstructions": [...],
    "containerSuggestions": [...],
    "prepTime": 20,
    "cookTime": 45,
    "servings": 6,
    "storageTime": 90,
    "category": "soup",
    "cuisine": "American",
    "difficulty": "easy",
    "mealType": "dinner",
    "season": "fall",
    "tags": ["comfort food", "family-friendly"],
    "allergenInfo": ["dairy"],
    "dietaryInfo": ["gluten-free option"],
    "nutrition": {
      "calories": 380,
      "protein": 28.0,
      "carbs": 35.0,
      "fat": 12.0,
      "fiber": 4.0,
      "sugar": 5.0,
      "sodium": 680.0
    }
  },
  "generation_time": 2.847,
  "cost": 0.0185,
  "model_used": "gpt-4o"
}
```

---

## 🎯 Benefits of This Schema

### For Your Application
- ✅ **All required fields** - No missing data
- ✅ **Type-safe** - Pydantic validates everything
- ✅ **Complete nutrition** - Ready for tracking features
- ✅ **Freezer-optimized** - All freezer-specific data included
- ✅ **Search-ready** - Tags, category, cuisine for filtering
- ✅ **Display-ready** - Summary, difficulty, meal type for UI

### For AI Generation
- ✅ **Structured prompts** - AI knows exactly what to provide
- ✅ **Validated output** - Can't return incomplete recipes
- ✅ **Consistent format** - Every recipe has same structure
- ✅ **No post-processing** - Use directly in app

---

## 🔧 Restart Service to Apply Changes

```powershell
docker restart mealprep360-ai-service
Start-Sleep -Seconds 5
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

Then test with the updated schema at: http://localhost:8000/docs

---

**The Python AI service now returns EVERYTHING your application needs!** ✅

No missing fields, full nutrition data, complete freezer instructions, and ready to save directly to MongoDB or PostgreSQL!

