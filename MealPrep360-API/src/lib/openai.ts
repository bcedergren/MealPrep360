import OpenAI from 'openai'
import { User } from '@/lib/mongodb/schemas'

// Ensure this code only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server side')
}

let _openai: OpenAI | null = null
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }
  if (!_openai) {
    _openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  }
  return _openai
}

interface UserSettingsData {
  defaultServings: number
  dietaryRestrictions: string[]
  allergies: string[]
  preferredCuisines: string[]
  mealPreferences: string[]
}

// Get user settings by userId
async function getUserSettings(
  userId?: string
): Promise<UserSettingsData | null> {
  if (!userId) return null

  const user = await User.findOne({ clerkId: userId })
  if (!user?.userSettings) return null

  return user.userSettings as unknown as UserSettingsData
}

export async function getRecipeSuggestions(query: string, userId?: string) {
  const userSettings = await getUserSettings(userId)
  const defaultServings = userSettings?.defaultServings || 4
  const dietaryRestrictions = userSettings?.dietaryRestrictions || []
  const allergies = userSettings?.allergies || []
  const preferredCuisines = userSettings?.preferredCuisines || []
  const mealPreferences = userSettings?.mealPreferences || []

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful cooking assistant. Generate recipe suggestions based on the user's query.\nConsider their preferences and dietary restrictions.\nDefault servings: ${defaultServings}\nDietary restrictions: ${
            dietaryRestrictions.join(', ') || 'None'
          }\nAllergies: ${
            allergies.join(', ') || 'None'
          }\nPreferred cuisines: ${
            preferredCuisines.join(', ') || 'Any'
          }\nMeal preferences: ${mealPreferences.join(', ') || 'Any'}`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content returned from OpenAI')

    // Try to parse the response as JSON
    const parsed = JSON.parse(content)

    // Validate the response format
    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      throw new Error('Invalid response format: missing recipes array')
    }

    // Validate each recipe has required fields
    parsed.recipes.forEach((recipe: any) => {
      if (
        !recipe.title ||
        !recipe.image ||
        !recipe.readyInMinutes ||
        !recipe.servings ||
        !recipe.summary
      ) {
        throw new Error('Invalid recipe format: missing required fields')
      }
    })

    return parsed
  } catch (error) {
    console.error('Error parsing OpenAI response:', error)
    // If parsing fails, return a formatted response with the raw content
    const rawContent = error instanceof Error ? error.message : 'Unknown error'
    return {
      aiSuggestions: rawContent || 'No suggestions available',
      recipes: [],
    }
  }
}

export async function generateMealPlan(prompt: string, userId?: string) {
  const userSettings = await getUserSettings(userId)
  const defaultServings = userSettings?.defaultServings || 4
  const dietaryRestrictions = userSettings?.dietaryRestrictions || []
  const allergies = userSettings?.allergies || []
  const preferredCuisines = userSettings?.preferredCuisines || []
  const mealPreferences = userSettings?.mealPreferences || []

  const systemPrompt = `You are a meal planning assistant. Generate a meal plan based on the following criteria:
- Default servings: ${defaultServings}
- Dietary restrictions: ${dietaryRestrictions.join(', ') || 'None'}
- Allergies: ${allergies.join(', ') || 'None'}
- Preferred cuisines: ${preferredCuisines.join(', ') || 'Any'}
- Meal preferences: ${mealPreferences.join(', ') || 'Any'}

Please provide a detailed meal plan that takes into account these preferences and restrictions.`

  const response = await getOpenAI().chat.completions.create({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })

  return response.choices[0].message.content
}

export async function generateRecipe(prompt: string) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            "You are a helpful cooking assistant. Generate a recipe based on the user's prompt.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    const parsed = JSON.parse(content)
    const recipes = parsed.recipes || []

    if (!Array.isArray(recipes) || recipes.length === 0) {
      throw new Error('No valid recipes found in OpenAI response')
    }

    return recipes
  } catch (error) {
    console.error('Error in generateRecipe:', error)
    throw error
  }
}

export async function analyzeRecipe(recipe: any) {
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful cooking assistant. Analyze the recipe and provide insights.',
      },
      {
        role: 'user',
        content: JSON.stringify(recipe),
      },
    ],
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}
