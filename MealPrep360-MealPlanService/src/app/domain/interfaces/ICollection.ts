import { Document, OptionalUnlessRequiredId } from 'mongodb';

export interface ICollection<T extends Document> {
	findOne(
		query: Record<string, any>,
		options?: Record<string, any>
	): Promise<T | null>;
	find(query: Record<string, any>, options?: Record<string, any>): Promise<T[]>;
	insertOne(document: OptionalUnlessRequiredId<T>): Promise<string>;
	updateOne(
		query: Record<string, any>,
		update: Record<string, any>,
		options?: Record<string, any>
	): Promise<void>;
	deleteOne(query: Record<string, any>): Promise<void>;
	updateMany(
		query: Record<string, any>,
		update: Record<string, any>,
		options?: Record<string, any>
	): Promise<void>;
	countDocuments(query?: Record<string, any>): Promise<number>;
}
