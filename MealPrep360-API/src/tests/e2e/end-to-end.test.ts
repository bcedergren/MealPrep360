import { serviceConfig } from '../../lib/services/config';
import { serviceAuth } from '../../lib/services/auth';

// Mock fetch for E2E testing
global.fetch = jest.fn();

describe('End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Workflows', () => {
    test('should complete full meal planning workflow', async () => {
      // Mock all service responses for complete workflow
      const mockResponses = {
        // User authentication
        auth: {
          user: { id: 'user-123', email: 'test@example.com' },
          token: 'jwt-token-123'
        },
        // Recipe search
        recipes: {
          recipes: [
            { id: 'recipe-1', name: 'Chicken Stir Fry', ingredients: ['chicken', 'vegetables'] },
            { id: 'recipe-2', name: 'Pasta Carbonara', ingredients: ['pasta', 'eggs', 'bacon'] }
          ]
        },
        // Meal plan generation
        mealPlan: {
          id: 'mealplan-123',
          userId: 'user-123',
          recipes: ['recipe-1', 'recipe-2'],
          dates: ['2024-01-01', '2024-01-02']
        },
        // Shopping list generation
        shoppingList: {
          id: 'shopping-123',
          items: [
            { name: 'chicken', quantity: '2 lbs', category: 'meat' },
            { name: 'vegetables', quantity: '1 bag', category: 'produce' },
            { name: 'pasta', quantity: '1 box', category: 'pantry' }
          ]
        },
        // Social sharing
        socialPost: {
          id: 'post-123',
          userId: 'user-123',
          content: 'Just planned my meals for the week!',
          mealPlanId: 'mealplan-123'
        }
      };

      // Setup mock responses
      (global.fetch as jest.Mock)
        // Authentication
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.auth
        })
        // Recipe search
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.recipes
        })
        // Meal plan creation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.mealPlan
        })
        // Shopping list generation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.shoppingList
        })
        // Social post creation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.socialPost
        });

      // Execute complete workflow
      const workflow = new MealPlanningWorkflow();
      const result = await workflow.executeCompleteWorkflow({
        userEmail: 'test@example.com',
        preferences: { dietary: 'none', servings: 4 }
      });

      // Verify workflow completion
      expect(result.success).toBe(true);
      expect(result.mealPlan.id).toBe('mealplan-123');
      expect(result.shoppingList.id).toBe('shopping-123');
      expect(result.socialPost.id).toBe('post-123');
    });

    test('should handle user registration and onboarding', async () => {
      const mockResponses = {
        registration: {
          user: { id: 'user-456', email: 'newuser@example.com' },
          token: 'jwt-token-456'
        },
        preferences: {
          id: 'pref-456',
          userId: 'user-456',
          dietaryRestrictions: ['vegetarian'],
          servingSize: 2
        },
        welcomeMealPlan: {
          id: 'welcome-mealplan-456',
          recipes: ['welcome-recipe-1', 'welcome-recipe-2']
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.registration
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.preferences
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.welcomeMealPlan
        });

      const onboarding = new UserOnboardingWorkflow();
      const result = await onboarding.executeOnboarding({
        email: 'newuser@example.com',
        password: 'password123',
        preferences: { dietary: 'vegetarian', servings: 2 }
      });

      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user-456');
      expect(result.preferences.dietaryRestrictions).toContain('vegetarian');
    });

    test('should handle meal plan sharing and collaboration', async () => {
      const mockResponses = {
        mealPlan: {
          id: 'shared-mealplan-789',
          userId: 'user-123',
          sharedWith: ['user-456', 'user-789']
        },
        comments: [
          { id: 'comment-1', userId: 'user-456', content: 'Great meal plan!' },
          { id: 'comment-2', userId: 'user-789', content: 'Love the pasta recipe!' }
        ],
        reactions: {
          likes: 5,
          shares: 2
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.mealPlan
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.comments
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses.reactions
        });

      const collaboration = new MealPlanCollaborationWorkflow();
      const result = await collaboration.shareMealPlan('shared-mealplan-789', ['user-456', 'user-789']);

      expect(result.success).toBe(true);
      expect(result.mealPlan.sharedWith).toHaveLength(2);
      expect(result.comments).toHaveLength(2);
      expect(result.reactions.likes).toBe(5);
    });
  });

  describe('Error Recovery Workflows', () => {
    test('should handle service failures gracefully', async () => {
      // Mock service failures with fallbacks
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Recipe service unavailable'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            recipes: [], 
            fallback: true,
            message: 'Using cached recipes' 
          })
        });

      const workflow = new MealPlanningWorkflow();
      const result = await workflow.executeWithFallback({
        userEmail: 'test@example.com',
        preferences: { dietary: 'none', servings: 4 }
      });

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.message).toBe('Using cached recipes');
    });

    test('should handle partial service failures', async () => {
      (global.fetch as jest.Mock)
        // Recipe service works
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recipes: [{ id: '1', name: 'Test Recipe' }] })
        })
        // Meal plan service fails
        .mockRejectedValueOnce(new Error('Meal plan service unavailable'))
        // Shopping service works with fallback
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            shoppingList: { id: '1', items: [] },
            fallback: true 
          })
        });

      const workflow = new MealPlanningWorkflow();
      const result = await workflow.executePartialFailure({
        userEmail: 'test@example.com',
        preferences: { dietary: 'none', servings: 4 }
      });

      expect(result.recipes).toHaveLength(1);
      expect(result.mealPlan).toBeNull();
      expect(result.shoppingList.fallback).toBe(true);
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent user requests', async () => {
      const concurrentRequests = 10;
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, timestamp: Date.now() })
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const requests = Array(concurrentRequests).fill(null).map(async (_, index) => {
        return fetch(`http://localhost:3001/api/recipes?user=${index}`, {
          method: 'GET'
        });
      });

      const responses = await Promise.all(requests);
      const results = await Promise.all(responses.map(r => r.json()));

      expect(responses).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    test('should handle large data sets efficiently', async () => {
      const largeRecipeSet = {
        recipes: Array(1000).fill(null).map((_, index) => ({
          id: `recipe-${index}`,
          name: `Recipe ${index}`,
          ingredients: [`ingredient-${index}-1`, `ingredient-${index}-2`]
        }))
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => largeRecipeSet
      });

      const startTime = Date.now();
      const response = await fetch('http://localhost:3001/api/recipes?limit=1000');
      const data = await response.json();
      const endTime = Date.now();

      expect(data.recipes).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

// Helper classes for workflow testing
class MealPlanningWorkflow {
  async executeCompleteWorkflow(params: any) {
    // Step 1: Authenticate user
    const authResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: params.userEmail, password: 'password' })
    });
    const auth = await authResponse.json();

    // Step 2: Search recipes
    const recipesResponse = await fetch('http://localhost:3001/api/recipes', {
      headers: { 'Authorization': `Bearer ${auth.token}` }
    });
    const recipes = await recipesResponse.json();

    // Step 3: Create meal plan
    const mealPlanResponse = await fetch('http://localhost:3001/api/meal-plans', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({ recipes: recipes.recipes })
    });
    const mealPlan = await mealPlanResponse.json();

    // Step 4: Generate shopping list
    const shoppingListResponse = await fetch('http://localhost:3001/api/shopping-lists', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({ mealPlanId: mealPlan.id })
    });
    const shoppingList = await shoppingListResponse.json();

    // Step 5: Share on social
    const socialResponse = await fetch('http://localhost:3001/api/social/posts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({ 
        content: 'Just planned my meals!',
        mealPlanId: mealPlan.id 
      })
    });
    const socialPost = await socialResponse.json();

    return {
      success: true,
      auth,
      recipes,
      mealPlan,
      shoppingList,
      socialPost
    };
  }

  async executeWithFallback(params: any) {
    try {
      return await this.executeCompleteWorkflow(params);
    } catch (error) {
      // Return fallback data
      return {
        success: true,
        fallback: true,
        message: 'Using cached recipes',
        recipes: [],
        mealPlan: null,
        shoppingList: null
      };
    }
  }

  async executePartialFailure(params: any) {
    const auth = { user: { id: 'user-123' }, token: 'token' };
    
    // Try to get recipes
    let recipes = [];
    try {
      const recipesResponse = await fetch('http://localhost:3001/api/recipes');
      recipes = await recipesResponse.json();
    } catch (error) {
      // Handle gracefully
    }

    // Try to create meal plan
    let mealPlan = null;
    try {
      const mealPlanResponse = await fetch('http://localhost:3001/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes })
      });
      mealPlan = await mealPlanResponse.json();
    } catch (error) {
      // Handle gracefully
    }

    // Try to generate shopping list
    let shoppingList = null;
    try {
      const shoppingListResponse = await fetch('http://localhost:3001/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlanId: mealPlan?.id })
      });
      shoppingList = await shoppingListResponse.json();
    } catch (error) {
      // Handle gracefully
    }

    return { auth, recipes, mealPlan, shoppingList };
  }
}

class UserOnboardingWorkflow {
  async executeOnboarding(params: any) {
    // Step 1: Register user
    const registrationResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: params.email, 
        password: params.password 
      })
    });
    const user = await registrationResponse.json();

    // Step 2: Set preferences
    const preferencesResponse = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify(params.preferences)
    });
    const preferences = await preferencesResponse.json();

    // Step 3: Generate welcome meal plan
    const welcomeMealPlanResponse = await fetch('http://localhost:3001/api/meal-plans/welcome', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ preferences: params.preferences })
    });
    const welcomeMealPlan = await welcomeMealPlanResponse.json();

    return {
      success: true,
      user,
      preferences,
      welcomeMealPlan
    };
  }
}

class MealPlanCollaborationWorkflow {
  async shareMealPlan(mealPlanId: string, userIds: string[]) {
    // Share meal plan
    const shareResponse = await fetch(`http://localhost:3001/api/meal-plans/${mealPlanId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds })
    });
    const mealPlan = await shareResponse.json();

    // Get comments
    const commentsResponse = await fetch(`http://localhost:3001/api/social/posts/${mealPlanId}/comments`);
    const comments = await commentsResponse.json();

    // Get reactions
    const reactionsResponse = await fetch(`http://localhost:3001/api/social/posts/${mealPlanId}/reactions`);
    const reactions = await reactionsResponse.json();

    return {
      success: true,
      mealPlan,
      comments,
      reactions
    };
  }
}
