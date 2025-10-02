import { Document } from 'mongoose';
import { IMessage } from '../models/Message';
import { IPost } from '../models/Post';
import { IRecipe } from '../models/Recipe';

export interface IBaseRepository<T extends Document> {
	create(data: Partial<T>): Promise<T>;
	findById(id: string): Promise<T | null>;
	findOne(filter: Partial<T>): Promise<T | null>;
	find(filter: Partial<T>): Promise<T[]>;
	update(id: string, data: Partial<T>): Promise<T | null>;
	delete(id: string): Promise<boolean>;
}

export interface IMessageRepository extends IBaseRepository<IMessage> {
	findConversation(userId1: string, userId2: string): Promise<IMessage[]>;
	markAsRead(messageId: string): Promise<IMessage | null>;
}

export interface IPostRepository extends IBaseRepository<IPost> {
	findByAuthor(authorId: string): Promise<IPost[]>;
	incrementLikes(postId: string): Promise<IPost | null>;
	decrementLikes(postId: string): Promise<IPost | null>;
}

export interface IRecipeRepository extends IBaseRepository<IRecipe> {
	findByTags(tags: string[]): Promise<IRecipe[]>;
	incrementForks(recipeId: string): Promise<IRecipe | null>;
	addCollaborator(
		recipeId: string,
		userId: string,
		role: string
	): Promise<IRecipe | null>;
}
