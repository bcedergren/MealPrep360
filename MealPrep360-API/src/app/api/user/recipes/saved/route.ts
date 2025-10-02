import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb/connection'
import mongoose from 'mongoose'
import { Document } from 'mongoose'
import { TAG_MAPPINGS } from '@/lib/constants/tags'
import { recipeCache, createCacheKey } from '@/lib/cache'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

// Import schemas to ensure models are registered
import '@/lib/mongodb/schemas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

interface SavedRecipe {
  recipeId: string
}

// Explicitly handle unsupported POST requests
export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

interface RecipeDocument extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  ingredients: string
  instructions: string
  tags: string[]
  prepTime: number
  createdAt: Date
  updatedAt: Date
}

interface CachedSavedRecipesData {
  recipes: any[]
  total: number
}

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      console.log('❌ Saved recipes: No userId from Clerk auth')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Saved recipes request for user:', clerkId)

    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '4')
    const search = searchParams.get('search') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const prepTime = searchParams.get('prepTime') || 'all'

    // Get models after connection is established
    const User = mongoose.model('User')
    const Recipe = mongoose.model('Recipe')
    const UserRecipe = mongoose.model('UserRecipe')

    // Get user
    let user = await User.findOne({ clerkId })

    if (!user) {
      // Try to create user using getOrCreateUser utility
      try {
        user = await getOrCreateUser(clerkId)
        if (!user) {
          return NextResponse.json(
            { error: 'User not found - Please sign in again' },
            { status: 401 }
          )
        }
      } catch (error) {
        console.error('[SAVED_RECIPES] Error creating user:', error)
        return NextResponse.json(
          { error: 'User not found - Please sign in again' },
          { status: 401 }
        )
      }
    }

    // Get user's recipe collection
    let userRecipeCollection = await UserRecipe.findOne({ userId: user._id })

    // If no collection found, check for any collections with this user's email
    if (!userRecipeCollection) {
      try {
        const oldCollection = await UserRecipe.findOne({
          'user.email': user.email,
        })

        if (oldCollection) {
          // Update the collection with the new user ID
          userRecipeCollection = await UserRecipe.findByIdAndUpdate(
            oldCollection._id,
            { userId: user._id },
            { new: true }
          )
        } else {
          return NextResponse.json({
            recipes: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          })
        }
      } catch (error) {
        console.error(
          '[SAVED_RECIPES] Error during collection migration:',
          error
        )
        throw new Error('Failed to migrate user recipe collection')
      }
    }

    try {
      // Get the saved recipe IDs, convert to ObjectId first (tolerant)
      const rawIds = userRecipeCollection.savedRecipes.map(
        (savedRecipe: SavedRecipe) => savedRecipe.recipeId
      )
      const objectIds: mongoose.Types.ObjectId[] = []
      for (const rid of rawIds) {
        if (!rid) continue
        // Already an ObjectId instance
        if ((rid as any)?.constructor?.name === 'ObjectId') {
          objectIds.push(rid as any)
        } else if (typeof rid === 'string' && mongoose.isValidObjectId(rid)) {
          objectIds.push(new mongoose.Types.ObjectId(rid))
        } else {
          try {
            const asString = String(rid)
            if (mongoose.isValidObjectId(asString)) {
              objectIds.push(new mongoose.Types.ObjectId(asString))
            }
          } catch {}
        }
      }
      if (objectIds.length === 0) {
        console.log(
          'No saved recipe references found for user',
          user._id.toString()
        )
        return NextResponse.json({
          recipes: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        })
      }

      // Create cache key for user's saved recipes
      const cacheKey = createCacheKey('saved-recipes', {
        userId: user._id.toString(),
        page,
        limit,
        search,
        tags: tags.join(','),
        sortBy,
        sortOrder,
        prepTime,
      })

      // Try to get cached data
      const cachedData = recipeCache.get<CachedSavedRecipesData>(cacheKey)
      if (cachedData) {
        const totalPages = Math.ceil(cachedData.total / limit)

        const response = NextResponse.json({
          recipes: cachedData.recipes,
          pagination: {
            total: cachedData.total,
            page,
            limit,
            totalPages,
          },
        })

        // Set cache headers
        response.headers.set(
          'Cache-Control',
          'private, s-maxage=120, stale-while-revalidate=300'
        )

        return response
      }

      // Build query
      const query: any = { _id: { $in: objectIds } }

      // Add search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]
      }

      // Add tags filter
      if (tags.length > 0) {
        // Standardize filter tags to lowercase for comparison
        const filterTagsLower = tags.map((tag) => tag.toLowerCase())

        // Use $expr and $setIsIntersection to filter recipes with at least one matching tag (case-insensitive)
        query.$expr = {
          $gt: [
            {
              $size: {
                $setIntersection: [
                  filterTagsLower,
                  {
                    $map: {
                      input: '$tags',
                      as: 'tag',
                      in: { $toLower: '$$tag' },
                    },
                  },
                ],
              },
            },
            0,
          ],
        }
      }

      // Add prep time filter
      if (prepTime !== 'all') {
        const timeRanges: { [key: string]: { $gte: number; $lte: number } } = {
          quick: { $gte: 0, $lte: 30 },
          medium: { $gte: 31, $lte: 60 },
          long: { $gte: 61, $lte: 999 },
        }
        if (timeRanges[prepTime]) {
          // Use $or to check both prepTime and readyInMinutes
          query.$or = [
            { prepTime: timeRanges[prepTime] },
            { readyInMinutes: timeRanges[prepTime] },
          ]
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit

      // Get total count for pagination
      const total = await Recipe.countDocuments(query)

      // Get recipes with pagination and sorting - OPTIMIZED to only fetch necessary fields
      const recipes = await Recipe.find(query, {
        _id: 1,
        title: 1,
        description: 1,
        'images.main': 1,
        imageUrl: 1,
        prepTime: 1,
        readyInMinutes: 1,
        tags: 1,
        servings: 1,
        isPublic: 1,
        createdAt: 1,
        updatedAt: 1,
      })
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for better performance

      // Transform recipes with proper error handling
      const transformedRecipes = recipes
        .map((recipe: any) => {
          try {
            // Calculate total prep time
            const totalPrepTime = recipe.readyInMinutes || recipe.prepTime || 0

            return {
              id: recipe._id.toString(),
              title: recipe.title,
              description: recipe.description || '',
              imageUrl: recipe.imageUrl || recipe.images?.main || '',
              prepTime: totalPrepTime,
              tags: recipe.tags || [],
              servings: recipe.servings || 4,
              isPublic: recipe.isPublic || false,
              createdAt: recipe.createdAt || new Date().toISOString(),
              updatedAt: recipe.updatedAt || new Date().toISOString(),
            }
          } catch (error) {
            console.error('[SAVED_RECIPES] Error transforming recipe:', error)
            return null
          }
        })
        .filter(Boolean)

      const totalPages = Math.ceil(total / limit)

      // Cache the results for 2 minutes
      recipeCache.set(cacheKey, { recipes: transformedRecipes, total }, 120)

      const response = NextResponse.json({
        recipes: transformedRecipes,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      })

      // Set cache headers
      response.headers.set(
        'Cache-Control',
        'private, s-maxage=120, stale-while-revalidate=300'
      )

      return response
    } catch (error) {
      console.error('[SAVED_RECIPES] Error fetching recipes:', error)
      throw new Error('Failed to fetch saved recipes')
    }
  } catch (error) {
    console.error('💥 Saved recipes API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
