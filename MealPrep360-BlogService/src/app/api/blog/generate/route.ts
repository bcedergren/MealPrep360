import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import { generateBlogContent, generateBlogImage } from '@/lib/openai'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI generation is not configured (missing OPENROUTER_API_KEY)',
        },
        { status: 503 }
      )
    }
    await connectDB()
    const { topic, keywords, generateImage } = await request.json()

    if (!topic || !keywords) {
      return NextResponse.json(
        { error: 'Topic and keywords are required' },
        { status: 400 }
      )
    }

    // Generate blog content using OpenAI
    const { title, content, excerpt } = await generateBlogContent(
      topic,
      keywords
    )

    // Generate image if requested
    let featuredImage = ''
    if (generateImage) {
      featuredImage = await generateBlogImage(
        `Create a professional blog header image for an article about ${topic}`
      )
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create new blog post
    const blogPost = await BlogPost.create({
      title,
      content,
      slug,
      featuredImage,
      excerpt,
      author: 'AI Assistant',
      tags: keywords,
      status: 'draft',
    })

    return NextResponse.json({
      success: true,
      data: blogPost,
    })
  } catch (error) {
    console.error('Error generating blog post:', error)
    return NextResponse.json(
      { error: 'Error generating blog post' },
      { status: 500 }
    )
  }
}
