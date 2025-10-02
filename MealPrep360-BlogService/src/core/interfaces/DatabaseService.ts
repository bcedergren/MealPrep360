import { Document } from 'mongoose';
import { BlogPost } from '../models/BlogPost';

export interface QueryParams {
	status?: 'draft' | 'published';
	page?: number;
	limit?: number;
	id?: string;
}

export interface DatabaseService {
	connect(): Promise<void>;
	createPost(data: Partial<BlogPost>): Promise<BlogPost & Document>;
	findPosts(query: QueryParams): Promise<(BlogPost & Document)[]>;
	findPostById(id: string): Promise<(BlogPost & Document) | null>;
	updatePost(
		id: string,
		data: Partial<BlogPost>
	): Promise<(BlogPost & Document) | null>;
	deletePost(id: string): Promise<boolean>;
	countPosts(query: QueryParams): Promise<number>;
}
