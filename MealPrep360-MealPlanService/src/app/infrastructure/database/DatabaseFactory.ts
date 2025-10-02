import { IDatabase } from '../../domain/interfaces/IDatabase';
import { MongoDatabase } from './MongoDatabase';
import { dbSanity } from './dbSanity';

export class DatabaseFactory {
	private static instance: DatabaseFactory;
	private databases: Map<string, IDatabase> = new Map();

	private constructor() {}

	static getInstance(): DatabaseFactory {
		if (!DatabaseFactory.instance) {
			DatabaseFactory.instance = new DatabaseFactory();
		}
		return DatabaseFactory.instance;
	}

	getDatabase(
		type: 'mongodb',
		_config: { uri: string; dbName: string }
	): IDatabase {
		const key = `${type}:shared`;

		if (!this.databases.has(key)) {
			switch (type) {
				case 'mongodb': {
					const db = new MongoDatabase();
					this.databases.set(key, db);
					// One-time sanity check in background
					if (!(globalThis as any).__didRunDbSanity) {
						(globalThis as any).__didRunDbSanity = true;
						// fire-and-forget
						dbSanity(db).catch(() => {});
					}
					break;
				}
				default:
					throw new Error(`Unsupported database type: ${type}`);
			}
		}

		return this.databases.get(key)!;
	}

	async closeAll(): Promise<void> {
		for (const database of this.databases.values()) {
			await database.disconnect();
		}
		this.databases.clear();
	}
}
