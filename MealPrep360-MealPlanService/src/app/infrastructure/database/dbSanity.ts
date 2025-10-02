import { ObjectId } from 'mongodb';
import { IDatabase } from '../../domain/interfaces/IDatabase';

export async function dbSanity(database: IDatabase) {
	try {
		const db: any = await (database as any).getDb?.();
		const name = db?.databaseName;
		const colls = await db?.listCollections().toArray();
		const names = (colls || []).map((c: any) => c.name);
		console.log('[DB CHECK]', {
			name,
			hasRecipes: names.includes('recipes'),
			hasUserrecipes: names.includes('userrecipes'),
		});

		const recipes = db.collection('recipes');
		const userrecipes = db.collection('userrecipes');
		const rCount = await recipes.estimatedDocumentCount();
		const urCount = await userrecipes.estimatedDocumentCount();
		console.log('[DB CHECK] counts:', {
			recipes: rCount,
			userrecipes: urCount,
		});

		// hard sanity: try one known _id from Compass
		try {
			const testId = new ObjectId('6857805a45d24e326f56e55a');
			const hit = await recipes.findOne(
				{ _id: testId },
				{ projection: { _id: 1, title: 1 } }
			);
			console.log('[DB CHECK] known _id present?', !!hit, hit?.title);
		} catch {}
	} catch (e) {
		console.log('[DB CHECK] error:', (e as Error).message);
	}
}
