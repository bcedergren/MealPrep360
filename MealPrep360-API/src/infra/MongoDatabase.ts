import type { Collection, Document, Db } from 'mongodb';
import { getDb } from '@/lib/mongo';

// Lightweight IDatabase shape for local usage
export interface IDatabase {
	getCollection<T extends Document>(name: string): Promise<Collection<T>>;
}

export class MongoDatabase implements IDatabase {
	private _db: Db | null = null;

	private async db(): Promise<Db> {
		if (this._db) return this._db;
		this._db = await getDb();
		return this._db;
	}

	async getCollection<T extends Document>(
		name: string
	): Promise<Collection<T>> {
		const db = await this.db();
		return db.collection<T>(name);
	}

	// Optional: expose for your debug helper
	async getDb() {
		return this.db();
	}
}
