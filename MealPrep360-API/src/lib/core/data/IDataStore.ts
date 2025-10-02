export interface QueryOptions {
	sort?: Record<string, 1 | -1>;
	limit?: number;
	skip?: number;
	select?: string[];
}

export interface IDataStore<T, CreateDTO = any, UpdateDTO = any> {
	find(query: Partial<T>, options?: QueryOptions): Promise<T[]>;
	findOne(query: Partial<T>): Promise<T | null>;
	findById(id: string): Promise<T | null>;
	create(data: CreateDTO): Promise<T>;
	update(id: string, data: UpdateDTO): Promise<T | null>;
	updateMany(query: Partial<T>, data: UpdateDTO): Promise<number>;
	delete(id: string): Promise<boolean>;
	deleteMany(query: Partial<T>): Promise<number>;
	count(query: Partial<T>): Promise<number>;
}
