"""USDA FoodData Central API client"""
import httpx
from loguru import logger
from typing import Optional, Dict

from app.core.config import settings

class USDAClient:
    """Client for USDA FoodData Central API"""
    
    BASE_URL = "https://api.nal.usda.gov/fdc/v1"
    
    def __init__(self):
        self.api_key = settings.USDA_API_KEY
        self.cache = {}
    
    async def search_food(self, query: str) -> Optional[Dict]:
        """Search for food in USDA database"""
        if query in self.cache:
            return self.cache[query]
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/foods/search",
                    params={
                        "query": query,
                        "api_key": self.api_key,
                        "dataType": ["Foundation", "SR Legacy"],
                        "pageSize": 1
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('foods'):
                        food = data['foods'][0]
                        self.cache[query] = food
                        return food
                        
        except Exception as e:
            logger.error(f"USDA API error for {query}: {e}")
        
        return None
    
    async def get_nutrition(self, food_name: str, amount: float, unit: str) -> Dict:
        """
        Get nutrition data for an ingredient
        Returns calories, protein, carbs, fat, etc per serving
        """
        food = await self.search_food(food_name)
        
        if not food:
            # Return estimated values if not found
            return self._estimate_nutrition(food_name, amount, unit)
        
        # Extract nutrients
        nutrients = {}
        for nutrient in food.get('foodNutrients', []):
            name = nutrient.get('nutrientName', '').lower()
            value = nutrient.get('value', 0)
            
            if 'energy' in name or 'calorie' in name:
                nutrients['calories'] = value
            elif 'protein' in name:
                nutrients['protein'] = value
            elif 'carbohydrate' in name:
                nutrients['carbs'] = value
            elif 'total lipid' in name or 'fat' in name:
                nutrients['fat'] = value
            elif 'fiber' in name:
                nutrients['fiber'] = value
            elif 'sugars' in name:
                nutrients['sugar'] = value
            elif 'sodium' in name:
                nutrients['sodium'] = value
        
        # Adjust for amount
        multiplier = self._convert_to_grams(amount, unit) / 100  # USDA uses per 100g
        
        return {
            k: round(v * multiplier, 2)
            for k, v in nutrients.items()
        }
    
    def _convert_to_grams(self, amount: float, unit: str) -> float:
        """Convert various units to grams"""
        conversions = {
            'cup': 240,
            'cups': 240,
            'tbsp': 15,
            'tablespoon': 15,
            'tsp': 5,
            'teaspoon': 5,
            'oz': 28.35,
            'ounce': 28.35,
            'lb': 453.592,
            'pound': 453.592,
            'g': 1,
            'gram': 1,
            'kg': 1000,
            'ml': 1,  # Approximate for liquids
            'l': 1000,
        }
        
        unit_lower = unit.lower().strip()
        return amount * conversions.get(unit_lower, 100)  # Default to 100g
    
    def _estimate_nutrition(self, food_name: str, amount: float, unit: str) -> Dict:
        """Provide rough estimates when USDA data unavailable"""
        # Very basic estimates based on food type
        base_values = {
            'calories': 100,
            'protein': 5.0,
            'carbs': 15.0,
            'fat': 3.0,
            'fiber': 2.0,
            'sugar': 5.0,
            'sodium': 200.0
        }
        
        # Adjust based on food type keywords
        food_lower = food_name.lower()
        
        if any(word in food_lower for word in ['chicken', 'beef', 'pork', 'fish']):
            base_values['protein'] *= 3
            base_values['fat'] *= 2
        elif any(word in food_lower for word in ['vegetable', 'lettuce', 'spinach']):
            base_values['calories'] *= 0.3
            base_values['carbs'] *= 0.5
        elif any(word in food_lower for word in ['rice', 'pasta', 'bread']):
            base_values['carbs'] *= 3
        
        return base_values

# Singleton
usda_client = USDAClient()

