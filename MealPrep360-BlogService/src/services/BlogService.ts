import { ContentGenerator } from '../core/interfaces/ContentGenerator';
import {
	DatabaseService,
	QueryParams,
} from '../core/interfaces/DatabaseService';
import { Logger } from '../core/interfaces/Logger';
import { BlogPost, BlogPostData } from '../core/models/BlogPost';
import { Document } from 'mongoose';

export class BlogService {
	constructor(
		private readonly db: DatabaseService,
		private readonly contentGenerator: ContentGenerator,
		private readonly logger: Logger
	) {}

	async createPost(
		topic: string,
		keywords: string[],
		generateImage: boolean
	): Promise<BlogPost & Document> {
		try {
			const { title, content, excerpt } =
				await this.contentGenerator.generateContent(topic, keywords);

			let featuredImage = '';
			if (generateImage) {
				featuredImage = await this.contentGenerator.generateImage(
					`Create a professional blog header image for an article about ${topic}`
				);
			}

			const slug = this.generateSlug(title);

			const postData: BlogPostData = {
				title,
				content,
				excerpt,
				featuredImage,
				author: 'AI Assistant',
				tags: keywords,
				status: 'draft',
				slug,
			};

			return await this.db.createPost(postData);
		} catch (error) {
			this.logger.error('Error creating blog post:', error);
			throw error;
		}
	}

	async getPosts(query: QueryParams): Promise<{
		posts: (BlogPost & Document)[];
		pagination: {
			total: number;
			page: number;
			pages: number;
		};
	}> {
		const posts = await this.db.findPosts(query);
		const total = await this.db.countPosts(query);
		const page = query.page || 1;
		const limit = query.limit || 10;

		return {
			posts,
			pagination: {
				total,
				page,
				pages: Math.ceil(total / limit),
			},
		};
	}

	async getPostById(id: string): Promise<BlogPost & Document> {
		const post = await this.db.findPostById(id);
		if (!post) {
			throw new Error('Blog post not found');
		}
		return post;
	}

	async updatePost(
		id: string,
		data: Partial<BlogPost>
	): Promise<BlogPost & Document> {
		const post = await this.db.updatePost(id, data);
		if (!post) {
			throw new Error('Blog post not found');
		}
		return post;
	}

	async deletePost(id: string): Promise<boolean> {
		return this.db.deletePost(id);
	}

	private generateSlug(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}
}
