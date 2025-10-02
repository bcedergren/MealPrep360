import { ObjectId } from 'mongodb';
import type { IDatabase } from '@/infra/MongoDatabase';

export async function dbSanity(database: IDatabase) {
	const anyDb: any = await (database as any).getDb?.();
	const name = anyDb?.databaseName;
	const colls = await anyDb?.listCollections().toArray();
	const names = (colls || []).map((c: any) => c.name);
	console.log('[DB CHECK]', {
		name,
		hasRecipes: names.includes('recipes'),
		hasUserrecipes: names.includes('userrecipes'),
	});

	const recipes = anyDb.collection('recipes');
	const userrecipes = anyDb.collection('userrecipes');
	const rCount = await recipes.estimatedDocumentCount();
	const urCount = await userrecipes.estimatedDocumentCount();
	console.log('[DB CHECK] counts:', { recipes: rCount, userrecipes: urCount });

	// hard sanity: try one known _id from Compass
	try {
		const testId = new ObjectId('6857805a45d24e326f56e55a');
		const hit = await recipes.findOne({ _id: testId }, {
			projection: { _id: 1, title: 1 },
		} as any);
		console.log('[DB CHECK] known _id present?', !!hit, hit?.title);
	} catch (e) {
		console.warn('[DB CHECK] test id probe failed:', (e as any)?.message);
	}
}
