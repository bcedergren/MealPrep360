import { Db, Document, Collection } from 'mongodb';
import { IDatabase } from '../../domain/interfaces/IDatabase';
import { ICollection } from '../../domain/interfaces/ICollection';
import { MongoCollection } from './MongoCollection';
import { getDb } from '../../lib/mongo';

export class MongoDatabase implements IDatabase {
	private _db: Db | null = null;

	async connect(): Promise<void> {
		if (!this._db) {
			this._db = await getDb();
		}
	}

	async disconnect(): Promise<void> {
		// Shared client managed in lib/mongo; intentionally a no-op
	}

	private async db(): Promise<Db> {
		if (this._db) return this._db;
		this._db = await getDb();
		return this._db;
	}

	async getCollection<T extends Document>(
		name: string
	): Promise<ICollection<T>> {
		const db = await this.db();
		const coll: Collection<T> = db.collection<T>(name);
		return new MongoCollection<T>(coll);
	}

	// Expose underlying Db for diagnostics
	async getDb(): Promise<Db> {
		return this.db();
	}
}
