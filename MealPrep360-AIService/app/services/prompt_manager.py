"""Centralized prompt management with versioning"""
from pathlib import Path
from typing import List, Dict
from app.models.schemas import RecipeRequest, BlogContentRequest, SuggestionRequest

class PromptManager:
    """Manage prompts with versioning and templates"""
    
    def __init__(self):
        self.prompts_dir = Path(__file__).parent.parent.parent / "prompts"
        self._load_prompts()
    
    def _load_prompts(self):
        """Load prompts from files"""
        # System prompts
        self.chef_system = """You are a professional chef specializing in freezer-prep meals, 
particularly crock pot, slow cooker, and casserole recipes. Focus on batch cooking recipes 
that are perfect for making large quantities.

IMPORTANT RULES:
- Never include season names in recipe titles
- Never use terms like "batch-prep" or "freezer-friendly" in titles
- Focus on the dish itself, not the preparation method
- Return only valid JSON matching the exact schema provided
- Ensure all required fields are present and correctly typed"""

        self.blog_system = """You are a professional food blogger and content creator.
Write engaging, informative content about meal preparation, cooking tips, and family dining.
Use a warm, friendly tone while maintaining professionalism."""

        self.suggestion_system = """You are a helpful cooking assistant.
Provide practical recipe suggestions based on user queries.
Consider dietary restrictions, time constraints, and ingredient availability."""
    
    def build_recipe_messages(self, request: RecipeRequest) -> List[Dict]:
        """Build messages for recipe generation"""
        user_prompt = f"""Generate a detailed freezer-friendly recipe for {request.season} season.

Requirements:
- Servings: {request.servings}"""
        
        if request.recipe_name:
            user_prompt += f"\n- Recipe name: {request.recipe_name}"
        
        if request.ingredients:
            user_prompt += f"\n- Must use: {', '.join(request.ingredients)}"
        
        if request.dietary_restrictions:
            restrictions = [r.value.replace('_', ' ') for r in request.dietary_restrictions]
            user_prompt += f"\n- Dietary restrictions: {', '.join(restrictions)}"
        
        if request.cuisine:
            user_prompt += f"\n- Cuisine style: {request.cuisine}"
        
        user_prompt += """

The recipe MUST include ALL of the following:

**Required Fields:**
1. Title (no season names!)
2. Description (2-3 sentences about the dish)
3. Summary (one sentence for preview cards)
4. At least 6 ingredients with amounts and units
5. Prep instructions (detailed steps for preparation)
6. Main cooking instructions (step-by-step)
7. Serving instructions (how to plate and serve)

**Freezer-Specific:**
8. Freezer prep instructions (how to prepare for freezing)
9. Container suggestions (what containers to use)
10. Defrost instructions (how to thaw safely)
11. Storage time (how long it keeps frozen, in days)

**Classification:**
12. Category (e.g., "soup", "casserole", "pasta dish")
13. Cuisine (e.g., "Italian", "Mexican", "American")
14. Difficulty (easy, medium, or hard)
15. Meal type (breakfast, lunch, dinner, or snacks)

**Time & Servings:**
16. Prep time (minutes)
17. Cook time (minutes)
18. Servings (number of people it serves)

**Dietary & Allergen Info:**
19. Dietary information (vegetarian, vegan, gluten-free, dairy-free, etc.)
20. Allergen information (contains dairy, nuts, eggs, etc.)
21. Tags (descriptive tags like "comfort food", "kid-friendly", etc.)

**Nutrition (per serving):**
22. Calories
23. Protein (grams)
24. Carbs (grams)
25. Fat (grams)
26. Fiber (grams)
27. Sugar (grams)
28. Sodium (milligrams)

**Important Rules:**
- All instruction arrays must have at least 3 detailed steps
- Be specific with ingredient amounts
- Include practical tips and notes
- Make it family-friendly and approachable
- Perfect for batch cooking and freezing

Return a complete recipe matching the exact schema with ALL required fields."""
        
        return [
            {"role": "system", "content": self.chef_system},
            {"role": "user", "content": user_prompt}
        ]
    
    def build_blog_messages(self, request: BlogContentRequest) -> List[Dict]:
        """Build messages for blog content generation"""
        keywords_str = ', '.join(request.keywords) if request.keywords else "none specified"
        
        user_prompt = f"""Write a {request.length}-word blog post about: {request.topic}

Requirements:
- Target length: {request.length} words
- Tone: {request.tone}
- Keywords to include: {keywords_str}
- Format: Markdown with headers, lists, and emphasis
- Include a compelling title and brief excerpt
- Make it engaging and actionable

Return the content as structured JSON."""
        
        return [
            {"role": "system", "content": self.blog_system},
            {"role": "user", "content": user_prompt}
        ]
    
    def build_suggestion_messages(self, request: SuggestionRequest) -> List[Dict]:
        """Build messages for recipe suggestions"""
        user_prompt = f"""Provide {request.max_results} recipe suggestions for: {request.query}"""
        
        if request.dietary_restrictions:
            restrictions = [r.value.replace('_', ' ') for r in request.dietary_restrictions]
            user_prompt += f"\n\nDietary restrictions: {', '.join(restrictions)}"
        
        user_prompt += """

For each suggestion, provide:
- Title
- Brief description
- Estimated total time
- Difficulty level (easy/medium/hard)

Return as structured JSON."""
        
        return [
            {"role": "system", "content": self.suggestion_system},
            {"role": "user", "content": user_prompt}
        ]

# Singleton
prompt_manager = PromptManager()

