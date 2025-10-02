import { Model, Document } from 'mongoose';
import { IDataStore, QueryOptions } from './IDataStore';
import { NotFoundError } from '../errors/ServiceError';

export class MongoDataStore<
	T extends Document,
	CreateDTO = any,
	UpdateDTO = any,
> implements IDataStore<T, CreateDTO, UpdateDTO>
{
	constructor(protected readonly model: Model<T>) {}

	async find(query: Partial<T>, options?: QueryOptions): Promise<T[]> {
		let findQuery = this.model.find(query as any);

		if (options?.sort) {
			findQuery = findQuery.sort(options.sort);
		}
		if (options?.limit) {
			findQuery = findQuery.limit(options.limit);
		}
		if (options?.skip) {
			findQuery = findQuery.skip(options.skip);
		}
		if (options?.select) {
			findQuery = findQuery.select(options.select.join(' ')) as any;
		}

		return await findQuery.exec();
	}

	async findOne(query: Partial<T>): Promise<T | null> {
		return await this.model.findOne(query as any);
	}

	async findById(id: string): Promise<T | null> {
		return await this.model.findById(id);
	}

	async create(data: CreateDTO): Promise<T> {
		const entity = new this.model(data);
		return await entity.save();
	}

	async update(id: string, data: UpdateDTO): Promise<T | null> {
		const updated = await this.model.findByIdAndUpdate(id, data as any, {
			new: true,
		});
		if (!updated) {
			throw new NotFoundError(`Entity with id ${id} not found`);
		}
		return updated;
	}

	async updateMany(query: Partial<T>, data: UpdateDTO): Promise<number> {
		const result = await this.model.updateMany(query as any, data as any);
		return result.modifiedCount;
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.model.findByIdAndDelete(id);
		return result !== null;
	}

	async deleteMany(query: Partial<T>): Promise<number> {
		const result = await this.model.deleteMany(query as any);
		return result.deletedCount;
	}

	async count(query: Partial<T>): Promise<number> {
		return await this.model.countDocuments(query as any);
	}
}
