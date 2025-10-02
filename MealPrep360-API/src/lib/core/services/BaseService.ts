import { IService } from '../interfaces/IService';
import { IRepository } from '../interfaces/IRepository';

export abstract class BaseService<T, CreateDTO = any, FilterDTO = any>
	implements IService<T, CreateDTO, FilterDTO>
{
	constructor(
		protected readonly repository: IRepository<T, CreateDTO, FilterDTO>
	) {}

	async create(data: CreateDTO): Promise<T> {
		return await this.repository.create(data);
	}

	async findById(id: string): Promise<T | null> {
		return await this.repository.findById(id);
	}

	async findOne(filter: Partial<FilterDTO>): Promise<T | null> {
		return await this.repository.findOne(filter);
	}

	async find(filter: Partial<FilterDTO>): Promise<T[]> {
		return await this.repository.find(filter);
	}

	async update(id: string, data: Partial<T>): Promise<T | null> {
		return await this.repository.update(id, data);
	}

	async delete(id: string): Promise<boolean> {
		return await this.repository.delete(id);
	}
}
