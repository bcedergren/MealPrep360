import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb/connection'
import { Recipe } from '@/lib/mongodb/schemas'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import axios from 'axios'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }
  if (!_openai) {
    _openai = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' })
  }
  return _openai
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * @swagger
 * /api/generate-image:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate recipe image
 *     description: Generate an AI-powered image for a recipe using DALL-E 3
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipeId
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: ID of the recipe to generate an image for
 *                 example: "64a1b2c3d4e5f6789012345"
 *     responses:
 *       200:
 *         description: Image generated and recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Recipe ID is required
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
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to generate image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to generate image"
 *                 details:
 *                   type: string
 *                   description: Error details
 */

async function getImagePrompt(recipe: any) {
  const prompt = `Create a beautiful, appetizing food photography style image of ${recipe.title}. The image should be high quality, well-lit, and showcase the dish in an appealing way.`

  try {
    const response = await getOpenAI().images.generate({
      model: 'openai/dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
    })

    if (!response.data?.[0]?.url) {
      throw new Error('No image URL returned from DALL-E')
    }

    return response.data[0].url
  } catch (error) {
    console.error('Error generating image:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'Image generation unavailable: missing OPENROUTER_API_KEY' },
        { status: 503 }
      )
    }
    const { recipeId } = await req.json()

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Recipe ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get recipe in parallel with auth check
    const [recipe, { userId }] = await Promise.all([
      Recipe.findById(recipeId),
      auth(),
    ])

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Generate image with timeout
    const imageUrl = (await Promise.race([
      getImagePrompt(recipe),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Image generation timed out')), 50000)
      ),
    ])) as string

    if (typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL returned')
    }

    // Update the recipe with the new image URL
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      {
        $set: {
          imageUrl,
          hasImage: true,
          isPlaceholder: false,
        },
      },
      { new: true }
    )

    return NextResponse.json(updatedRecipe)
  } catch (error) {
    console.error('Error generating recipe image:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
