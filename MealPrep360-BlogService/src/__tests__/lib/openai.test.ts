import { generateBlogContent, generateBlogImage } from '@/lib/openai';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
	return jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn(),
			},
		},
		images: {
			generate: jest.fn(),
		},
	}));
});

describe('OpenAI Functions', () => {
	let openaiInstance: jest.Mocked<OpenAI>;

	beforeEach(() => {
		jest.clearAllMocks();
		openaiInstance = new OpenAI() as jest.Mocked<OpenAI>;
	});

	describe('generateBlogContent', () => {
		const mockResponse = {
			title: 'Test Blog Title',
			content: 'Test blog content',
			excerpt: 'Test excerpt',
		};

		it('should generate blog content successfully', async () => {
			(openaiInstance.chat.completions.create as jest.Mock).mockResolvedValue({
				choices: [
					{
						message: {
							content: JSON.stringify(mockResponse),
						},
					},
				],
			});

			const result = await generateBlogContent('test topic', [
				'keyword1',
				'keyword2',
			]);

			expect(result).toEqual(mockResponse);
			expect(openaiInstance.chat.completions.create).toHaveBeenCalledWith({
				messages: [
					{
						role: 'user',
						content: expect.stringContaining('test topic'),
					},
				],
				model: 'gpt-4-turbo-preview',
				response_format: { type: 'json_object' },
			});
		});

		it('should handle OpenAI API errors', async () => {
			const error = new Error('API Error');
			(openaiInstance.chat.completions.create as jest.Mock).mockRejectedValue(
				error
			);

			await expect(
				generateBlogContent('test topic', ['keyword1'])
			).rejects.toThrow('API Error');
		});
	});

	describe('generateBlogImage', () => {
		const mockImageUrl = 'https://example.com/image.jpg';

		it('should generate blog image successfully', async () => {
			(openaiInstance.images.generate as jest.Mock).mockResolvedValue({
				data: [{ url: mockImageUrl }],
			});

			const result = await generateBlogImage('test prompt');

			expect(result).toBe(mockImageUrl);
			expect(openaiInstance.images.generate).toHaveBeenCalledWith({
				model: 'dall-e-3',
				prompt: 'test prompt',
				n: 1,
				size: '1024x1024',
				quality: 'standard',
			});
		});

		it('should throw error when no image URL is returned', async () => {
			(openaiInstance.images.generate as jest.Mock).mockResolvedValue({
				data: [],
			});

			await expect(generateBlogImage('test prompt')).rejects.toThrow(
				'Failed to generate image: No URL returned from OpenAI'
			);
		});

		it('should handle OpenAI API errors', async () => {
			const error = new Error('API Error');
			(openaiInstance.images.generate as jest.Mock).mockRejectedValue(error);

			await expect(generateBlogImage('test prompt')).rejects.toThrow(
				'API Error'
			);
		});
	});
});
