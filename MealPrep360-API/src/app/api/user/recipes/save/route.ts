import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { User, Recipe, UserRecipe } from '@/lib/mongodb/schemas'
import connectDB from '@/lib/mongodb/connection'
import { recipeCache } from '@/lib/cache'
import { SubscriptionPlan, PLAN_FEATURES } from '@/types/subscription'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getRecipeSaveLimit(plan: SubscriptionPlan): number {
  const feature = PLAN_FEATURES[plan]['Saved Recipes']
  if (feature === 'Unlimited') return -1 // -1 means unlimited
  if (typeof feature === 'number') return feature
  if (typeof feature === 'string') {
    const num = parseInt(feature)
    return isNaN(num) ? 0 : num
  }
  return 0 // Default to 0 if no access
}

// Explicitly handle unsupported GET requests
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    console.log('[SAVE] Clerk userId:', clerkId)
    if (!clerkId) {
      console.error('[SAVE] Unauthorized: No clerkId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { recipeId } = await request.json()
    console.log('[SAVE] Incoming recipeId:', recipeId)
    if (!recipeId) {
      console.error('[SAVE] No recipeId provided')
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ clerkId })
    console.log('[SAVE] User found:', user ? user._id : null)
    if (!user) {
      console.error('[SAVE] User not found for clerkId:', clerkId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const recipe = await Recipe.findById(recipeId)
    console.log('[SAVE] Recipe found:', recipe ? recipe._id : null)
    if (!recipe) {
      console.error('[SAVE] Recipe not found for recipeId:', recipeId)
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const currentPlan: SubscriptionPlan = user.subscription?.plan || 'FREE'
    const saveLimit = getRecipeSaveLimit(currentPlan)
    console.log('[SAVE] Plan:', currentPlan, 'Save limit:', saveLimit)

    let userRecipeCollection = await UserRecipe.findOne({ userId: user._id })
    console.log(
      '[SAVE] UserRecipeCollection found:',
      userRecipeCollection ? userRecipeCollection._id : null
    )

    if (!userRecipeCollection) {
      console.log(
        '[SAVE] Creating new UserRecipeCollection for user:',
        user._id
      )
      userRecipeCollection = await UserRecipe.create({
        userId: user._id,
        savedRecipes: [],
      })
    }

    const isAlreadySaved = userRecipeCollection.savedRecipes.some(
      (savedRecipe: any) => savedRecipe.recipeId.toString() === recipeId
    )
    console.log('[SAVE] Is already saved:', isAlreadySaved)

    if (isAlreadySaved) {
      console.log('[SAVE] Recipe already saved for user:', user._id)
      return NextResponse.json(
        { message: 'Recipe already saved', saved: true },
        { status: 200 }
      )
    }

    if (saveLimit !== -1) {
      const currentSavedCount = userRecipeCollection.savedRecipes.length
      console.log('[SAVE] Current saved count:', currentSavedCount)

      if (currentSavedCount >= saveLimit) {
        console.error('[SAVE] Save limit exceeded:', saveLimit)
        return NextResponse.json(
          {
            error: `You've reached your recipe limit (${saveLimit} recipes). Upgrade your plan to save more recipes.`,
            type: 'SUBSCRIPTION_LIMIT_EXCEEDED',
            currentCount: currentSavedCount,
            limit: saveLimit,
            plan: currentPlan,
          },
          { status: 403 }
        )
      }
    }

    userRecipeCollection.savedRecipes.push({
      recipeId,
      savedAt: new Date(),
    })
    console.log('[SAVE] Added recipeId to savedRecipes:', recipeId)

    await userRecipeCollection.save()
    console.log(
      '[SAVE] UserRecipeCollection saved. Total recipes:',
      userRecipeCollection.savedRecipes.length
    )

    recipeCache.clear()
    console.log('[SAVE] Cache cleared')

    const newCount = userRecipeCollection.savedRecipes.length
    console.log('[SAVE] Returning success. New count:', newCount)
    return NextResponse.json({
      message: 'Recipe saved successfully',
      saved: true,
      usage: {
        current: newCount,
        limit: saveLimit === -1 ? 'unlimited' : saveLimit,
        remaining:
          saveLimit === -1 ? 'unlimited' : Math.max(0, saveLimit - newCount),
      },
    })
  } catch (error) {
    console.error('Error saving recipe:', error)
    return NextResponse.json(
      { error: 'Failed to save recipe' },
      { status: 500 }
    )
  }
}
