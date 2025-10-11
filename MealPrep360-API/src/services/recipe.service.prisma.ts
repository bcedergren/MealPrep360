/**
 * Recipe Service - Prisma Implementation
 * 
 * Example of complex queries with relations
 */

import { prisma } from '../lib/prisma'
import { Recipe, RecipeIngredient, RecipeNutrition } from '@prisma/client'

export class RecipeService {
  /**
   * Create a new recipe with ingredients
   */
  async createRecipe(data: {
    userId: string
    title: string
    description?: string
    instructions: string[]
    prepTime?: number
    cookTime?: number
    servings?: number
    difficulty?: string
    imageUrl?: string
    ingredients: Array<{
      ingredientName: string
      amount: number
      unit: string
      notes?: string
    }>
    nutrition?: {
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
      fiber?: number
      sugar?: number
      sodium?: number
    }
    tags?: string[]
  }): Promise<Recipe> {
    // First, ensure all ingredients exist
    const ingredientIds = await Promise.all(
      data.ingredients.map(async (ing) => {
        const ingredient = await prisma.ingredient.upsert({
          where: { name: ing.ingredientName },
          create: { name: ing.ingredientName },
          update: {},
        })
        return {
          ingredientId: ingredient.id,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.notes,
        }
      })
    )

    // Get or create tags
    const tagConnections = data.tags
      ? await Promise.all(
          data.tags.map(async (tagName) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              create: { name: tagName },
              update: {},
            })
            return { tagId: tag.id }
          })
        )
      : []

    // Create recipe with all relations
    return await prisma.recipe.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        difficulty: data.difficulty,
        imageUrl: data.imageUrl,
        ingredients: {
          create: ingredientIds,
        },
        nutrition: data.nutrition
          ? {
              create: data.nutrition,
            }
          : undefined,
        tags: {
          create: tagConnections,
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        nutrition: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
  }

  /**
   * Get recipe by ID with all details
   */
  async getRecipeById(recipeId: string) {
    return await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        nutrition: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
  }

  /**
   * Search recipes
   */
  async searchRecipes(params: {
    query?: string
    tags?: string[]
    difficulty?: string
    maxPrepTime?: number
    userId?: string
    isPublic?: boolean
    limit?: number
    offset?: number
  }) {
    const {
      query,
      tags,
      difficulty,
      maxPrepTime,
      userId,
      isPublic,
      limit = 20,
      offset = 0,
    } = params

    const where: any = {}

    // Text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    // Filters
    if (difficulty) where.difficulty = difficulty
    if (maxPrepTime) where.prepTime = { lte: maxPrepTime }
    if (userId) where.userId = userId
    if (isPublic !== undefined) where.isPublic = isPublic

    // Tag filtering
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: {
              in: tags,
            },
          },
        },
      }
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          ingredients: {
            include: {
              ingredient: true,
            },
          },
          nutrition: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.recipe.count({ where }),
    ])

    return {
      recipes,
      total,
      hasMore: offset + limit < total,
    }
  }

  /**
   * Update recipe
   */
  async updateRecipe(
    recipeId: string,
    userId: string,
    data: Partial<{
      title: string
      description: string
      instructions: string[]
      prepTime: number
      cookTime: number
      servings: number
      difficulty: string
      imageUrl: string
      isPublic: boolean
    }>
  ) {
    // Verify ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { userId: true },
    })

    if (!recipe || recipe.userId !== userId) {
      throw new Error('Recipe not found or unauthorized')
    }

    return await prisma.recipe.update({
      where: { id: recipeId },
      data,
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        nutrition: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
  }

  /**
   * Delete recipe
   */
  async deleteRecipe(recipeId: string, userId: string) {
    // Verify ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { userId: true },
    })

    if (!recipe || recipe.userId !== userId) {
      throw new Error('Recipe not found or unauthorized')
    }

    await prisma.recipe.delete({
      where: { id: recipeId },
    })
  }

  /**
   * Get popular recipes
   */
  async getPopularRecipes(limit: number = 10) {
    return await prisma.recipe.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  }
}

// Export singleton instance
export const recipeService = new RecipeService()

