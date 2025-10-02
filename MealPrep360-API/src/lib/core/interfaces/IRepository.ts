export interface IRepository<T, CreateDTO = any, FilterDTO = any> {
	create(data: CreateDTO): Promise<T>;
	findById(id: string): Promise<T | null>;
	findOne(filter: Partial<FilterDTO>): Promise<T | null>;
	find(filter: Partial<FilterDTO>): Promise<T[]>;
	update(id: string, data: Partial<T>): Promise<T | null>;
	delete(id: string): Promise<boolean>;
}
