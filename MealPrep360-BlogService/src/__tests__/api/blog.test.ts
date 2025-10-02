import { NextRequest } from 'next/server';
import { POST as generateBlogPost } from '@/app/api/blog/generate/route';
import { POST as createBlogPost } from '@/app/api/blog/route';
import connectDB from '@/lib/mongodb';
import { generateBlogContent, generateBlogImage } from '@/lib/openai';
import BlogPost from '@/models/BlogPost';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/lib/openai');
jest.mock('@/models/BlogPost');

describe('Blog API Routes', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /api/blog/generate', () => {
		const mockRequest = {
			json: jest.fn().mockResolvedValue({
				topic: 'Test Topic',
				keywords: ['keyword1', 'keyword2'],
				generateImage: true,
			}),
		} as unknown as NextRequest;

		const mockBlogContent = {
			title: 'Test Blog Title',
			content: 'Test content',
			excerpt: 'Test excerpt',
		};

		const mockImageUrl = 'https://example.com/image.jpg';

		it('should generate and create a blog post successfully', async () => {
			(generateBlogContent as jest.Mock).mockResolvedValue(mockBlogContent);
			(generateBlogImage as jest.Mock).mockResolvedValue(mockImageUrl);
			(BlogPost.create as jest.Mock).mockResolvedValue({
				...mockBlogContent,
				slug: 'test-blog-title',
				featuredImage: mockImageUrl,
				author: 'AI Assistant',
				tags: ['keyword1', 'keyword2'],
				status: 'draft',
			});

			const response = await generateBlogPost(mockRequest);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.data).toHaveProperty('title', mockBlogContent.title);
			expect(data.data).toHaveProperty('slug', 'test-blog-title');
			expect(connectDB).toHaveBeenCalled();
			expect(generateBlogContent).toHaveBeenCalledWith('Test Topic', [
				'keyword1',
				'keyword2',
			]);
			expect(generateBlogImage).toHaveBeenCalled();
			expect(BlogPost.create).toHaveBeenCalled();
		});

		it('should handle missing required fields', async () => {
			const invalidRequest = {
				json: jest.fn().mockResolvedValue({
					topic: '',
					keywords: [],
				}),
			} as unknown as NextRequest;

			const response = await generateBlogPost(invalidRequest);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe('Topic and keywords are required');
		});

		it('should handle errors during blog post generation', async () => {
			(generateBlogContent as jest.Mock).mockRejectedValue(
				new Error('Generation failed')
			);

			const response = await generateBlogPost(mockRequest);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Error generating blog post');
		});
	});

	describe('POST /api/blog', () => {
		const mockRequest = {
			json: jest.fn().mockResolvedValue({
				topic: 'Test Topic',
				keywords: ['keyword1', 'keyword2'],
				generateImage: true,
			}),
		} as unknown as NextRequest;

		const mockBlogContent = {
			title: 'Test Blog Title',
			content: 'Test content',
			excerpt: 'Test excerpt',
		};

		const mockImageUrl = 'https://example.com/image.jpg';

		it('should create a blog post successfully', async () => {
			(generateBlogContent as jest.Mock).mockResolvedValue(mockBlogContent);
			(generateBlogImage as jest.Mock).mockResolvedValue(mockImageUrl);
			(BlogPost.create as jest.Mock).mockResolvedValue({
				...mockBlogContent,
				slug: 'test-blog-title',
				featuredImage: mockImageUrl,
				author: 'AI Assistant',
				tags: ['keyword1', 'keyword2'],
				status: 'draft',
			});

			const response = await createBlogPost(mockRequest);
			const data = await response.json();

			expect(data).toHaveProperty('title', mockBlogContent.title);
			expect(data).toHaveProperty('slug', 'test-blog-title');
			expect(connectDB).toHaveBeenCalled();
			expect(generateBlogContent).toHaveBeenCalledWith('Test Topic', [
				'keyword1',
				'keyword2',
			]);
			expect(generateBlogImage).toHaveBeenCalled();
			expect(BlogPost.create).toHaveBeenCalled();
		});

		it('should handle errors during blog post creation', async () => {
			(BlogPost.create as jest.Mock).mockRejectedValue(
				new Error('Creation failed')
			);

			const response = await createBlogPost(mockRequest);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Error creating blog post');
		});
	});
});
