import OpenAI from 'openai';
import {
	ContentGenerator,
	BlogContent,
} from '../core/interfaces/ContentGenerator';

export class OpenAIService implements ContentGenerator {
	private readonly openai: OpenAI;

	constructor(apiKey: string) {
		if (!apiKey) {
			throw new Error('OpenAI API key is required');
		}
		this.openai = new OpenAI({ apiKey });
	}

	async generateContent(
		topic: string,
		keywords: string[]
	): Promise<BlogContent> {
		const prompt = `Write a comprehensive blog post about ${topic}. 
    Include these keywords: ${keywords.join(', ')}. 
    The blog post should be well-structured with an introduction, main points, and conclusion.
    Format the response as JSON with the following structure:
    {
      "title": "engaging title",
      "content": "full blog content in markdown format",
      "excerpt": "brief summary (max 200 characters)"
    }`;

		const completion = await this.openai.chat.completions.create({
			messages: [{ role: 'user', content: prompt }],
			model: 'gpt-4-turbo-preview',
			response_format: { type: 'json_object' },
		});

		const response = JSON.parse(completion.choices[0].message.content || '{}');
		return response;
	}

	async generateImage(prompt: string): Promise<string> {
		const response = await this.openai.images.generate({
			model: 'dall-e-3',
			prompt,
			n: 1,
			size: '1024x1024',
			quality: 'standard',
		});

		if (!response.data?.[0]?.url) {
			throw new Error('Failed to generate image: No URL returned from OpenAI');
		}

		return response.data[0].url;
	}
}
