import { Collection, Document, OptionalUnlessRequiredId } from 'mongodb';
import { ICollection } from '../../domain/interfaces/ICollection';

export class MongoCollection<T extends Document> implements ICollection<T> {
	constructor(private collection: Collection<T>) {}

	async findOne(
		query: Record<string, any>,
		options?: Record<string, any>
	): Promise<T | null> {
		return this.collection.findOne<T>(this.transformQuery(query), options);
	}

	async find(
		query: Record<string, any>,
		options?: Record<string, any>
	): Promise<T[]> {
		return this.collection
			.find<T>(this.transformQuery(query), options)
			.toArray();
	}

	async insertOne(document: OptionalUnlessRequiredId<T>): Promise<string> {
		const result = await this.collection.insertOne(document);
		return result.insertedId.toString();
	}

	async updateOne(
		query: Record<string, any>,
		update: Record<string, any>,
		options?: Record<string, any>
	): Promise<void> {
		await this.collection.updateOne(
			this.transformQuery(query),
			update,
			options
		);
	}

	async deleteOne(query: Record<string, any>): Promise<void> {
		await this.collection.deleteOne(this.transformQuery(query));
	}

	async updateMany(
		query: Record<string, any>,
		update: Record<string, any>,
		options?: Record<string, any>
	): Promise<void> {
		await this.collection.updateMany(
			this.transformQuery(query),
			update,
			options
		);
	}

	async countDocuments(query?: Record<string, any>): Promise<number> {
		return this.collection.countDocuments(
			query ? this.transformQuery(query) : {}
		);
	}

	private transformQuery(query: any): any {
		// Preserve primitives as-is
		if (query === null || typeof query !== 'object') {
			return query;
		}

		// Preserve arrays and transform their elements (but do not convert to objects)
		if (Array.isArray(query)) {
			return query.map((item) => this.transformQuery(item));
		}

		// IMPORTANT: Preserve non-plain objects (e.g., MongoDB BSON types like ObjectId, Date, RegExp)
		// Only transform plain objects. This avoids turning ObjectId values into empty objects.
		const objectTag = Object.prototype.toString.call(query);
		if (objectTag !== '[object Object]') {
			return query;
		}

		// Handle plain objects, preserving Mongo operators like $in, $and, etc.
		const transformedQuery: Record<string, any> = {};
		for (const [key, value] of Object.entries(query)) {
			if (key === 'id') {
				transformedQuery['_id'] = this.transformQuery(value);
			} else if (key.startsWith('$')) {
				// Mongo operator – keep the key intact and transform nested values
				transformedQuery[key] = this.transformQuery(value);
			} else {
				transformedQuery[key] = this.transformQuery(value);
			}
		}
		return transformedQuery;
	}
}
