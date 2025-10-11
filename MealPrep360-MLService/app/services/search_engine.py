"""ML-powered search engine"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from loguru import logger

class SearchEngine:
    """Semantic recipe search using TF-IDF"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.recipe_vectors = None
        self.recipes = []
    
    async def index_recipes(self, recipes: list):
        """Build search index from recipes"""
        logger.info(f"Indexing {len(recipes)} recipes")
        
        self.recipes = recipes
        
        # Create text corpus
        texts = []
        for recipe in recipes:
            text = f"{recipe.get('title', '')} {recipe.get('description', '')} {' '.join(recipe.get('tags', []))}"
            texts.append(text)
        
        # Vectorize
        self.recipe_vectors = self.vectorizer.fit_transform(texts)
        
        logger.info("Indexing complete")
    
    async def search(self, query: str, k: int = 10) -> list:
        """
        Semantic search for recipes
        Returns top k results with relevance scores
        """
        if self.recipe_vectors is None:
            raise ValueError("Search index not built. Call index_recipes() first")
        
        # Vectorize query
        query_vector = self.vectorizer.transform([query])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(query_vector, self.recipe_vectors)[0]
        
        # Get top k indices
        top_indices = similarities.argsort()[-k:][::-1]
        
        # Return results with scores
        results = []
        for idx in top_indices:
            if similarities[idx] > 0:  # Only include relevant results
                results.append({
                    **self.recipes[idx],
                    "relevance_score": float(similarities[idx]),
                    "rank": len(results) + 1
                })
        
        return results
    
    async def find_similar(self, recipe_id: str, k: int = 5) -> list:
        """Find similar recipes to a given recipe"""
        # Find recipe index
        recipe_idx = next(
            (i for i, r in enumerate(self.recipes) if str(r.get('_id')) == recipe_id),
            None
        )
        
        if recipe_idx is None:
            return []
        
        # Get recipe vector
        recipe_vector = self.recipe_vectors[recipe_idx]
        
        # Calculate similarities
        similarities = cosine_similarity(recipe_vector, self.recipe_vectors)[0]
        
        # Get top k (excluding the recipe itself)
        top_indices = similarities.argsort()[-(k+1):-1][::-1]
        
        results = []
        for idx in top_indices:
            results.append({
                **self.recipes[idx],
                "similarity_score": float(similarities[idx])
            })
        
        return results

# Singleton
search_engine = SearchEngine()

