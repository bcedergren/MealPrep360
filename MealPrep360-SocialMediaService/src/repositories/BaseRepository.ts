import { Document, Model } from 'mongoose';
import { IBaseRepository } from '../interfaces/repositories';

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
	constructor(protected readonly model: Model<T>) {}

	async create(data: Partial<T>): Promise<T> {
		return this.model.create(data);
	}

	async findById(id: string): Promise<T | null> {
		return this.model.findById(id);
	}

	async findOne(filter: Partial<T>): Promise<T | null> {
		return this.model.findOne(filter as any);
	}

	async find(filter: Partial<T>): Promise<T[]> {
		return this.model.find(filter as any);
	}

	async update(id: string, data: Partial<T>): Promise<T | null> {
		return this.model.findByIdAndUpdate(id, data as any, { new: true });
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.model.findByIdAndDelete(id);
		return result !== null;
	}
}
