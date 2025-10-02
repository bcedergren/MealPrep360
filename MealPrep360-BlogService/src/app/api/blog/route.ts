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

    return NextResponse.json(blogPost)
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Error creating blog post' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'published'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const posts = await BlogPost.find({ status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await BlogPost.countDocuments({ status })

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Error fetching blog posts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB()
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Blog post ID and status are required' },
        { status: 400 }
      )
    }

    const post = await BlogPost.findByIdAndUpdate(id, { status }, { new: true })

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: post,
    })
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Error updating blog post' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Blog post ID is required' },
        { status: 400 }
      )
    }

    const post = await BlogPost.findByIdAndDelete(id)

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Error deleting blog post' },
      { status: 500 }
    )
  }
}
