import { Model } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { IPostRepository } from '../interfaces/repositories';
import { IPost } from '../models/Post';

export class PostRepository
	extends BaseRepository<IPost>
	implements IPostRepository
{
	constructor(model: Model<IPost>) {
		super(model);
	}

	async findByAuthor(authorId: string): Promise<IPost[]> {
		return this.model.find({ authorId });
	}

	async incrementLikes(postId: string): Promise<IPost | null> {
		return this.model.findByIdAndUpdate(
			postId,
			{ $inc: { likes: 1 } },
			{ new: true }
		);
	}

	async decrementLikes(postId: string): Promise<IPost | null> {
		return this.model.findByIdAndUpdate(
			postId,
			{ $inc: { likes: -1 } },
			{ new: true }
		);
	}
}
