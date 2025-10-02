import { Model, Document } from 'mongoose';
import { IRepository } from '../interfaces/IRepository';

export abstract class BaseMongoRepository<
	T extends Document,
	CreateDTO = any,
	FilterDTO = any,
> implements IRepository<T, CreateDTO, FilterDTO>
{
	constructor(protected readonly model: Model<T & Document>) {}

	async create(data: CreateDTO): Promise<T> {
		const entity = new this.model(data);
		return await entity.save();
	}

	async findById(id: string): Promise<T | null> {
		return await this.model.findById(id);
	}

	async findOne(filter: Partial<FilterDTO>): Promise<T | null> {
		return await this.model.findOne(filter as any);
	}

	async find(filter: Partial<FilterDTO>): Promise<T[]> {
		return await this.model.find(filter as any);
	}

	async update(id: string, data: Partial<T>): Promise<T | null> {
		return await this.model.findByIdAndUpdate(id, data, { new: true });
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.model.findByIdAndDelete(id);
		return result !== null;
	}
}
