import { Document } from 'mongoose';
import { IBaseService } from '../interfaces/services';
import { IBaseRepository } from '../interfaces/repositories';

export class BaseService<T extends Document> implements IBaseService<T> {
	constructor(protected readonly repository: IBaseRepository<T>) {}

	async create(data: Partial<T>): Promise<T> {
		return this.repository.create(data);
	}

	async getById(id: string): Promise<T | null> {
		return this.repository.findById(id);
	}

	async update(id: string, data: Partial<T>): Promise<T | null> {
		return this.repository.update(id, data);
	}

	async delete(id: string): Promise<boolean> {
		return this.repository.delete(id);
	}
}
