import mongoose, { Document, Model } from 'mongoose';
import {
	DatabaseService,
	QueryParams,
} from '../core/interfaces/DatabaseService';
import { BlogPost } from '../core/models/BlogPost';
import { BlogPostSchema } from '../infrastructure/mongodb/schemas/BlogPostSchema';

export class MongoDBService implements DatabaseService {
	private readonly uri: string;
	private readonly BlogPostModel: Model<BlogPost & Document>;
	private isConnected: boolean = false;

	constructor(uri: string) {
		if (!uri) {
			throw new Error('MongoDB URI is required');
		}
		this.uri = uri;
		this.BlogPostModel =
			mongoose.models.BlogPost ||
			mongoose.model<BlogPost & Document>('BlogPost', BlogPostSchema);
	}

	async connect(): Promise<void> {
		if (this.isConnected) return;

		try {
			await mongoose.connect(this.uri, {
				bufferCommands: false,
			});
			this.isConnected = true;
		} catch (error) {
			this.isConnected = false;
			throw error;
		}
	}

	async createPost(data: Partial<BlogPost>): Promise<BlogPost & Document> {
		await this.ensureConnection();
		return this.BlogPostModel.create(data);
	}

	async findPosts(query: QueryParams): Promise<(BlogPost & Document)[]> {
		await this.ensureConnection();
		const { status = 'published', page = 1, limit = 10 } = query;
		const skip = (page - 1) * limit;

		return this.BlogPostModel.find({ status })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);
	}

	async findPostById(id: string): Promise<(BlogPost & Document) | null> {
		await this.ensureConnection();
		return this.BlogPostModel.findById(id);
	}

	async updatePost(
		id: string,
		data: Partial<BlogPost>
	): Promise<(BlogPost & Document) | null> {
		await this.ensureConnection();
		return this.BlogPostModel.findByIdAndUpdate(id, data, { new: true });
	}

	async deletePost(id: string): Promise<boolean> {
		await this.ensureConnection();
		const result = await this.BlogPostModel.findByIdAndDelete(id);
		return result !== null;
	}

	async countPosts(query: QueryParams): Promise<number> {
		await this.ensureConnection();
		const { status = 'published' } = query;
		return this.BlogPostModel.countDocuments({ status });
	}

	private async ensureConnection(): Promise<void> {
		if (!this.isConnected) {
			await this.connect();
		}
	}
}
