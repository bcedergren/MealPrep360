"""Pydantic models for type-safe AI operations"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from enum import Enum

class Season(str, Enum):
    """Recipe seasons"""
    SPRING = "spring"
    SUMMER = "summer"
    FALL = "fall"
    WINTER = "winter"

class DietaryRestriction(str, Enum):
    """Dietary restrictions"""
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"
    KETO = "keto"
    PALEO = "paleo"
    LOW_CARB = "low_carb"

class Ingredient(BaseModel):
    """Recipe ingredient"""
    name: str = Field(..., description="Ingredient name")
    amount: str = Field(..., description="Amount (e.g., '2', '1/2')")
    unit: str = Field(..., description="Unit of measurement (e.g., 'cups', 'lbs')")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "chicken breast",
                "amount": "2",
                "unit": "lbs"
            }
        }

class RecipeRequest(BaseModel):
    """Request to generate a recipe"""
    season: Season
    recipe_name: Optional[str] = None
    ingredients: Optional[List[str]] = None
    dietary_restrictions: Optional[List[DietaryRestriction]] = None
    cuisine: Optional[str] = None
    servings: int = Field(default=4, ge=1, le=20)
    user_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "season": "fall",
                "recipe_name": "Butternut Squash Soup",
                "dietary_restrictions": ["vegetarian"],
                "servings": 6
            }
        }

class Nutrition(BaseModel):
    """Nutrition information"""
    calories: Optional[int] = None
    protein: Optional[float] = Field(None, description="Grams of protein")
    carbs: Optional[float] = Field(None, description="Grams of carbohydrates")
    fat: Optional[float] = Field(None, description="Grams of fat")
    fiber: Optional[float] = Field(None, description="Grams of fiber")
    sugar: Optional[float] = Field(None, description="Grams of sugar")
    sodium: Optional[float] = Field(None, description="Milligrams of sodium")

class Recipe(BaseModel):
    """Complete recipe with all details - matches MealPrep360 application schema"""
    # Core fields
    title: str = Field(..., description="Recipe title (no season names)")
    description: str = Field(..., description="Brief description")
    summary: str = Field(..., description="One-sentence summary for cards/previews")
    
    # Ingredients and instructions
    ingredients: List[Ingredient] = Field(..., min_length=3)
    instructions: List[str] = Field(..., min_length=1, description="Main cooking instructions")
    prep_instructions: List[str] = Field(..., alias="prepInstructions", min_length=1, description="Prep steps")
    cooking_instructions: List[str] = Field(..., alias="cookingInstructions", min_length=1)
    serving_instructions: List[str] = Field(..., alias="servingInstructions", min_length=1)
    
    # Freezer-specific instructions
    freezer_prep: List[str] = Field(..., alias="freezerPrep", description="Freezer preparation steps")
    defrost_instructions: List[str] = Field(..., alias="defrostInstructions")
    container_suggestions: List[str] = Field(..., alias="containerSuggestions")
    
    # Time and servings
    prep_time: int = Field(..., alias="prepTime", ge=0, description="Prep time in minutes")
    cook_time: int = Field(..., alias="cookTime", ge=0, description="Cook time in minutes")
    servings: int = Field(..., ge=1, le=20)
    storage_time: int = Field(..., alias="storageTime", ge=0, description="Freezer storage time in days")
    
    # Classification
    category: str = Field(..., description="Recipe category (e.g., soup, casserole, pasta)")
    cuisine: str = Field(..., description="Cuisine type (e.g., Italian, Mexican, American)")
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    meal_type: str = Field(..., alias="mealType", pattern="^(breakfast|lunch|dinner|snacks)$")
    season: Season
    
    # Tags and dietary info
    tags: List[str] = Field(default_factory=list, description="Recipe tags")
    allergen_info: List[str] = Field(default_factory=list, alias="allergenInfo", description="Allergens present")
    dietary_info: List[str] = Field(default_factory=list, alias="dietaryInfo", description="Dietary categories (vegetarian, vegan, etc)")
    
    # Nutrition
    nutrition: Optional[Nutrition] = Field(None, description="Nutritional information per serving")
    
    @validator('title')
    def validate_title(cls, v):
        """Ensure title doesn't contain season names"""
        season_words = ['spring', 'summer', 'fall', 'winter', 'seasonal']
        lower_title = v.lower()
        if any(word in lower_title for word in season_words):
            raise ValueError("Title should not contain season names")
        return v
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Hearty Chicken Noodle Soup",
                "description": "A comforting freezer-friendly soup",
                "prep_time": 20,
                "cook_time": 45,
                "servings": 6,
                "season": "fall"
            }
        }

class RecipeResponse(BaseModel):
    """Response containing generated recipe"""
    recipe: Recipe
    generation_time: float = Field(..., description="Generation time in seconds")
    cost: float = Field(..., description="Generation cost in USD")
    model_used: str

class BlogContentRequest(BaseModel):
    """Request to generate blog content"""
    topic: str = Field(..., min_length=3)
    keywords: List[str] = Field(default_factory=list)
    tone: str = Field(default="professional")
    length: int = Field(default=1000, ge=300, le=5000, description="Target word count")
    
    class Config:
        json_schema_extra = {
            "example": {
                "topic": "Meal Prep Tips for Busy Families",
                "keywords": ["meal prep", "freezer meals", "family dinner"],
                "tone": "friendly",
                "length": 1200
            }
        }

class BlogContent(BaseModel):
    """Generated blog content"""
    title: str
    content: str = Field(..., description="Markdown formatted content")
    excerpt: str = Field(..., max_length=200)
    estimated_reading_time: int = Field(..., description="Minutes to read")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "10 Easy Meal Prep Tips",
                "excerpt": "Save time and money with these simple meal prep strategies...",
                "estimated_reading_time": 5
            }
        }

class SuggestionRequest(BaseModel):
    """Request for recipe suggestions"""
    query: str = Field(..., min_length=3)
    user_id: Optional[str] = None
    dietary_restrictions: Optional[List[DietaryRestriction]] = None
    max_results: int = Field(default=5, ge=1, le=20)
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "quick chicken dinner ideas",
                "dietary_restrictions": ["gluten_free"],
                "max_results": 5
            }
        }

class RecipeSuggestion(BaseModel):
    """Individual recipe suggestion"""
    title: str
    description: str
    estimated_time: int = Field(..., description="Total time in minutes")
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    
class SuggestionResponse(BaseModel):
    """Response with recipe suggestions"""
    suggestions: List[RecipeSuggestion]
    query: str
    
class ImageGenerationRequest(BaseModel):
    """Request to generate recipe image"""
    recipe_title: str = Field(..., min_length=3)
    recipe_description: Optional[str] = None
    style: str = Field(default="food photography")
    size: str = Field(default="1024x1024", pattern="^(1024x1024|1792x1024|1024x1792)$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "recipe_title": "Creamy Butternut Squash Soup",
                "style": "food photography",
                "size": "1024x1024"
            }
        }

class ImageResponse(BaseModel):
    """Response with generated image"""
    url: str
    revised_prompt: str
    cost: float

class CostMetrics(BaseModel):
    """Cost tracking metrics"""
    total_requests: int
    total_cost: float
    total_tokens: int
    average_cost_per_request: float
    breakdown_by_model: dict
    breakdown_by_endpoint: dict

