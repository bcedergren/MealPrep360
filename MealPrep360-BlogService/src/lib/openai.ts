import OpenAI from 'openai'

let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    // Defer error to request time instead of module import/build time
    throw new Error(
      'OPENROUTER_API_KEY is not configured. Set it in the environment to use blog generation features.'
    )
  }
  if (!_openai) {
    _openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  }
  return _openai
}

export async function generateBlogContent(
  topic: string,
  keywords: string[]
): Promise<{
  title: string
  content: string
  excerpt: string
}> {
  const prompt = `Write a comprehensive blog post about ${topic}. 
    Include these keywords: ${keywords.join(', ')}. 
    The blog post should be well-structured with an introduction, main points, and conclusion.
    Format the response as JSON with the following structure:
    {
      "title": "engaging title",
      "content": "full blog content in markdown format",
      "excerpt": "brief summary (max 200 characters)"
    }`

  const completion = await getOpenAI().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-4o',
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0].message.content || '{}')
  return response
}

export async function generateBlogImage(prompt: string): Promise<string> {
  const response = await getOpenAI().images.generate({
    model: 'openai/dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  })

  if (!response.data?.[0]?.url) {
    throw new Error('Failed to generate image: No URL returned from OpenAI')
  }

  return response.data[0].url
}
