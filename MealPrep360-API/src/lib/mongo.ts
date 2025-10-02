import { MongoClient, Db } from 'mongodb';

const URI = process.env.MONGODB_URI!;
const DB_NAME =
	process.env.MONGODB_DB ||
	// if your URI includes the db path ( ...mongodb.net/mealprep360?.... )
	new URL(URI).pathname.replace(/^\//, '') ||
	'mealprep360'; // <- fallback to your real DB name

if (!URI) throw new Error('MONGODB_URI is not set');

let _client: MongoClient | null = null;
let _db: Db | null = null;

export async function getDb(): Promise<Db> {
	if (_db) return _db;
	if (!_client) {
		_client = new MongoClient(URI, { maxPoolSize: 10 });
		await _client.connect();
	}
	_db = _client.db(DB_NAME);
	// one-time sanity log
	console.log('[Mongo] connected db:', _db.databaseName);
	return _db;
}
