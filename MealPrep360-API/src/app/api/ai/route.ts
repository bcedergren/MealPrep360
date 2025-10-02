import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb/connection'
import { User } from '@/lib/mongodb/schemas'
import { checkUsageMiddleware, UsageTracker } from '@/lib/usage-tracker'
import { generateRecipe } from '@/lib/openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface AIRequest {
  type: 'recipe' | 'mealPlan'
  query?: string
}

/**
 * @swagger
 * /api/ai:
 *   get:
 *     tags:
 *       - AI
 *     summary: Method not allowed
 *     description: GET method is not supported for this endpoint
 *     responses:
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

/**
 * @swagger
 * /api/ai:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate AI content
 *     description: Generate recipes or meal plans using AI with usage tracking and limits
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [recipe, mealPlan]
 *                 description: Type of AI generation requested
 *                 example: "recipe"
 *               query:
 *                 type: string
 *                 description: Query for recipe generation (required for recipe type)
 *                 example: "healthy chicken dinner with vegetables"
 *     responses:
 *       200:
 *         description: AI content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recipes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *                   description: Generated recipes (for recipe type)
 *                 usage:
 *                   type: object
 *                   properties:
 *                     remaining:
 *                       oneOf:
 *                         - type: string
 *                           enum: [unlimited]
 *                         - type: number
 *                       description: Remaining AI generations
 *                     limit:
 *                       oneOf:
 *                         - type: string
 *                           enum: [unlimited]
 *                         - type: number
 *                       description: Total AI generation limit
 *                     percentage:
 *                       type: number
 *                       description: Usage percentage
 *       400:
 *         description: Bad request - Invalid or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Usage limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [USAGE_LIMIT_EXCEEDED]
 *                 feature:
 *                   type: string
 *                   enum: [aiRecipes]
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       501:
 *         description: Feature not implemented (for mealPlan type)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Meal plan generation coming soon"
 */
export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'AI generation unavailable: missing OPENROUTER_API_KEY' },
        { status: 503 }
      )
    }
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const { type, query } = body as AIRequest

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    // Get user and their settings
    const user = await User.findOne({ clerkId: userId })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (type === 'recipe') {
      if (!query) {
        return NextResponse.json(
          { error: 'Query is required for recipe generation' },
          { status: 400 }
        )
      }

      // Check usage limits for AI recipes
      const usageCheck = await checkUsageMiddleware(userId, 'aiRecipes')
      if (!usageCheck.allowed) {
        return NextResponse.json(
          {
            error: usageCheck.message,
            type: 'USAGE_LIMIT_EXCEEDED',
            feature: 'aiRecipes',
          },
          { status: 403 }
        )
      }

      try {
        // Generate recipe using OpenAI
        const recipes = await generateRecipe(query)

        // Increment usage counter
        const tracker = new UsageTracker(userId)
        await tracker.incrementUsage('aiRecipes', 1)

        // Get updated usage info
        const usageReport = await tracker.getUsageReport()

        return NextResponse.json({
          recipes,
          usage: {
            remaining:
              usageReport.limits.aiRecipesLimit === -1
                ? 'unlimited'
                : usageReport.limits.aiRecipesLimit -
                  usageReport.usage.aiRecipesGenerated,
            limit:
              usageReport.limits.aiRecipesLimit === -1
                ? 'unlimited'
                : usageReport.limits.aiRecipesLimit,
            percentage: usageReport.percentages.aiRecipes,
          },
        })
      } catch (error) {
        console.error('Error generating recipe:', error)
        return NextResponse.json(
          { error: 'Failed to generate recipe' },
          { status: 500 }
        )
      }
    } else if (type === 'mealPlan') {
      // For meal plan generation, we might want to check different limits
      // This could be expanded based on your needs
      return NextResponse.json(
        { message: 'Meal plan generation coming soon' },
        { status: 501 }
      )
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error in AI route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
