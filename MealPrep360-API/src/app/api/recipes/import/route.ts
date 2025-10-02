import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { User, Recipe } from '@/lib/mongodb/schemas'
import OpenAI from 'openai'

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipe } = body

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe data is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await User.findOne({ clerkId: userId })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate image using DALL-E
    let imageUrl = null
    try {
      const imagePrompt = `A professional food photography style image of ${recipe.title}, ${recipe.description}. The image should be appetizing, well-lit, and showcase the dish in an appealing way. Do not include any text, labels, or words in the image. The image should be clean and focused solely on the food presentation.`

      const imageResponse = await getOpenAI().images.generate({
        model: 'openai/dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      })

      if (imageResponse.data && imageResponse.data[0]?.url) {
        imageUrl = imageResponse.data[0].url
      }
    } catch (error: unknown) {
      console.error('Error generating recipe image')
    }

    // Create recipe in database
    const newRecipe = await Recipe.create({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime || 0,
      cookTime: recipe.cookTime || 0,
      servings: recipe.servings || 4,
      tags: recipe.tags || [],
      imageUrl: imageUrl || '/images/recipe-placeholder.png',
      hasImage: !!imageUrl,
      userId: user._id,
    })

    return NextResponse.json(newRecipe)
  } catch (error) {
    console.error('Error importing recipe:', error)
    return NextResponse.json(
      { error: 'Failed to import recipe' },
      { status: 500 }
    )
  }
}
