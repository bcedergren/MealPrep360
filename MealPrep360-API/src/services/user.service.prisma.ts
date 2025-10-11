/**
 * User Service - Prisma Implementation
 * 
 * This is an example of how to migrate from Mongoose to Prisma.
 * Use this as a template for migrating other services.
 */

import { prisma } from '../lib/prisma'
import { User, Subscription, UserPreferences } from '@prisma/client'

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: {
    clerkId: string
    email: string
    name?: string
    avatarUrl?: string
  }): Promise<User> {
    return await prisma.user.create({
      data,
    })
  }

  /**
   * Find user by Clerk ID
   */
  async findByClerkId(clerkId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { clerkId },
      include: {
        subscription: true,
        preferences: true,
      },
    })
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    })
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    data: {
      name?: string
      avatarUrl?: string
    }
  ): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data,
    })
  }

  /**
   * Delete user (cascades to all related data)
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    })
  }

  /**
   * Create or update subscription
   */
  async upsertSubscription(
    userId: string,
    data: {
      plan: string
      status: string
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      currentPeriodStart?: Date
      currentPeriodEnd?: Date
    }
  ): Promise<Subscription> {
    return await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    })
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    data: {
      dietaryRestrictions?: string[]
      allergens?: string[]
      cuisinePreferences?: string[]
      skillLevel?: string
    }
  ): Promise<UserPreferences> {
    return await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        dietaryRestrictions: data.dietaryRestrictions || [],
        allergens: data.allergens || [],
        cuisinePreferences: data.cuisinePreferences || [],
        skillLevel: data.skillLevel,
      },
      update: data,
    })
  }

  /**
   * Get user with full details
   */
  async getUserWithDetails(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        preferences: true,
        recipes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        mealPlans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  /**
   * Search users (admin feature)
   */
  async searchUsers(query: string, limit: number = 20) {
    return await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        subscription: true,
      },
    })
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const [recipeCount, mealPlanCount, postCount] = await Promise.all([
      prisma.recipe.count({ where: { userId } }),
      prisma.mealPlan.count({ where: { userId } }),
      prisma.post.count({ where: { userId } }),
    ])

    return {
      recipes: recipeCount,
      mealPlans: mealPlanCount,
      posts: postCount,
    }
  }
}

// Export singleton instance
export const userService = new UserService()

