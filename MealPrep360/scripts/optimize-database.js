import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function createIndexSafely(collection, indexSpec, indexName) {
	try {
		await collection.createIndex(indexSpec.key, {
			name: indexName,
			...indexSpec.options,
		});
		console.log(`  ✅ Created index: ${indexName}`);
	} catch (error) {
		if (error.code === 85 || error.code === 86) {
			// Index already exists (85) or duplicate index (86)
			console.log(`  ℹ️  Index already exists: ${indexName}`);
		} else {
			console.error(`  ❌ Failed to create index ${indexName}:`, error.message);
		}
	}
}

async function optimizeDatabase() {
	try {
		console.log('🚀 Starting database optimization...');

		// Get MongoDB URI from environment
		const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
		if (!mongoUri) {
			console.error(
				'Available environment variables:',
				Object.keys(process.env).filter(
					(key) => key.includes('MONGO') || key.includes('DATABASE')
				)
			);
			throw new Error(
				'MONGODB_URI or DATABASE_URL environment variable is not set'
			);
		}

		// Connect to database
		await mongoose.connect(mongoUri);
		console.log('✅ Connected to database');

		const db = mongoose.connection.db;

		// Create indexes for MealPlan collection
		console.log('\n📊 Creating MealPlan indexes...');
		const mealPlanCollection = db.collection('mealplans');
		await createIndexSafely(
			mealPlanCollection,
			{ key: { userId: 1, startDate: -1, endDate: -1 } },
			'userId_startDate_endDate'
		);
		await createIndexSafely(
			mealPlanCollection,
			{ key: { userId: 1, startDate: 1 } },
			'userId_startDate_asc'
		);
		await createIndexSafely(
			mealPlanCollection,
			{ key: { userId: 1, endDate: 1 } },
			'userId_endDate_asc'
		);
		await createIndexSafely(
			mealPlanCollection,
			{ key: { id: 1 }, options: { unique: true } },
			'id_unique'
		);
		await createIndexSafely(
			mealPlanCollection,
			{ key: { userId: 1, 'recipeItems.status': 1 } },
			'userId_recipeItems_status'
		);
		await createIndexSafely(
			mealPlanCollection,
			{ key: { 'recipeItems.status': 1, 'recipeItems.date': 1 } },
			'recipeItems_status_date'
		);

		// Create indexes for Recipe collection
		console.log('\n📊 Creating Recipe indexes...');
		const recipeCollection = db.collection('recipes');
		await createIndexSafely(
			recipeCollection,
			{ key: { clerkId: 1, isPublic: 1, createdAt: -1 } },
			'clerkId_isPublic_createdAt'
		);
		await createIndexSafely(
			recipeCollection,
			{ key: { isPublic: 1, createdAt: -1 } },
			'isPublic_createdAt'
		);
		await createIndexSafely(
			recipeCollection,
			{ key: { _id: 1, title: 1, 'images.main': 1, imageUrl: 1, prepTime: 1 } },
			'_id_title_images_prepTime'
		);

		// Create indexes for SkippedDay collection
		console.log('\n📊 Creating SkippedDay indexes...');
		const skippedDayCollection = db.collection('skippeddays');
		await createIndexSafely(
			skippedDayCollection,
			{ key: { userId: 1, date: 1 } },
			'userId_date_asc'
		);
		await createIndexSafely(
			skippedDayCollection,
			{ key: { userId: 1, date: -1 } },
			'userId_date_desc'
		);

		// Create indexes for UserRecipe collection
		console.log('\n📊 Creating UserRecipe indexes...');
		const userRecipeCollection = db.collection('userrecipes');
		await createIndexSafely(
			userRecipeCollection,
			{ key: { userId: 1 } },
			'userId'
		);
		await createIndexSafely(
			userRecipeCollection,
			{ key: { 'savedRecipes.recipeId': 1 } },
			'savedRecipes_recipeId'
		);
		await createIndexSafely(
			userRecipeCollection,
			{ key: { 'user.email': 1 } },
			'user_email'
		);

		// Create indexes for User collection
		console.log('\n📊 Creating User indexes...');
		const userCollection = db.collection('users');
		await createIndexSafely(
			userCollection,
			{ key: { clerkId: 1 }, options: { unique: true } },
			'clerkId_unique'
		);
		await createIndexSafely(
			userCollection,
			{ key: { email: 1 }, options: { unique: true } },
			'email_unique'
		);

		// Create indexes for ShoppingList collection
		console.log('\n📊 Creating ShoppingList indexes...');
		const shoppingListCollection = db.collection('shoppinglists');
		await createIndexSafely(
			shoppingListCollection,
			{ key: { userId: 1, createdAt: -1 } },
			'userId_createdAt'
		);
		await createIndexSafely(
			shoppingListCollection,
			{ key: { userId: 1, status: 1 } },
			'userId_status'
		);
		await createIndexSafely(
			shoppingListCollection,
			{ key: { 'items.category': 1 } },
			'items_category'
		);

		// Get index statistics
		console.log('\n📈 Index Statistics:');
		const collections = [
			{ name: 'mealplans', displayName: 'MealPlans' },
			{ name: 'recipes', displayName: 'Recipes' },
			{ name: 'skippeddays', displayName: 'SkippedDays' },
			{ name: 'userrecipes', displayName: 'UserRecipes' },
			{ name: 'users', displayName: 'Users' },
			{ name: 'shoppinglists', displayName: 'ShoppingLists' },
		];

		for (const { name, displayName } of collections) {
			try {
				const collection = db.collection(name);
				const indexes = await collection.indexes();
				console.log(`\n${displayName}: ${indexes.length} indexes`);
				indexes.forEach((index) => {
					const keys = Object.entries(index.key)
						.map(([k, v]) => `${k}:${v}`)
						.join(', ');
					console.log(`  - ${index.name}: {${keys}}`);
				});
			} catch (error) {
				console.log(
					`\n${displayName}: Collection not found or error getting indexes`
				);
			}
		}

		console.log('\n✅ Database optimization complete!');
		await mongoose.connection.close();
		process.exit(0);
	} catch (error) {
		console.error('❌ Error optimizing database:', error);
		await mongoose.connection.close();
		process.exit(1);
	}
}

// Run the optimization
optimizeDatabase();
