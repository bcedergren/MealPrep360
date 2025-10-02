import { Document } from 'mongodb';
import { ICollection } from './ICollection';

export interface IDatabase {
	getCollection<T extends Document>(name: string): Promise<ICollection<T>>;
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	// Optional: for diagnostics
	getDb?: () => Promise<any>;
}
