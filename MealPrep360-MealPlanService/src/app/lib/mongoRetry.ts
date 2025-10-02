import { MongoTopologyClosedError } from 'mongodb';
import { resetMongo } from './mongo';

export async function withMongoRetry<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (e: any) {
		if (e instanceof MongoTopologyClosedError) {
			console.warn(
				'[Mongo] topology closed, resetting client and retrying once…'
			);
			await resetMongo();
			return await fn();
		}
		throw e;
	}
}
