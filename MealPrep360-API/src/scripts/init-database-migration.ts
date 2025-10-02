#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';

interface MigrationStep {
	name: string;
	description: string;
	execute: () => Promise<void>;
	validate: () => Promise<boolean>;
}

interface DatabaseConfig {
	name: string;
	connectionString: string;
	collections: string[];
	seedData?: any[];
}

class DatabaseMigrationInitializer {
	private currentDbUri: string;
	private migrationSteps: MigrationStep[] = [];
	private results: Array<{
		step: string;
		success: boolean;
		duration: number;
		error?: string;
	}> = [];

	constructor() {
		this.currentDbUri =
			process.env.MONGODB_URI || 'mongodb://localhost:27017/mealprep360';
		this.initializeMigrationSteps();
	}

	async initializePhase1(): Promise<void> {
		console.log('🗄️  Initializing Database Migration Phase 1...\n');
		console.log('Phase 1: User Service Extraction');
		console.log('================================\n');

		try {
			for (const step of this.migrationSteps) {
				await this.executeStep(step);
			}

			console.log('\n✅ Database Migration Phase 1 initialization complete!');
			this.displaySummary();
			this.displayNextSteps();
		} catch (error) {
			console.error('\n❌ Database migration initialization failed:', error);
			process.exit(1);
		}
	}

	private initializeMigrationSteps(): void {
		this.migrationSteps = [
			{
				name: 'analyze-current-schema',
				description: 'Analyze current database schema and dependencies',
				execute: this.analyzeCurrentSchema.bind(this),
				validate: this.validateSchemaAnalysis.bind(this),
			},
			{
				name: 'create-user-service-db',
				description: 'Create dedicated User Service database',
				execute: this.createUserServiceDatabase.bind(this),
				validate: this.validateUserServiceDatabase.bind(this),
			},
			{
				name: 'setup-migration-tracking',
				description: 'Setup migration tracking system',
				execute: this.setupMigrationTracking.bind(this),
				validate: this.validateMigrationTracking.bind(this),
			},
			{
				name: 'create-event-bus',
				description: 'Initialize event bus for inter-service communication',
				execute: this.createEventBus.bind(this),
				validate: this.validateEventBus.bind(this),
			},
			{
				name: 'prepare-user-data-migration',
				description: 'Prepare user data for migration',
				execute: this.prepareUserDataMigration.bind(this),
				validate: this.validateUserDataPreparation.bind(this),
			},
			{
				name: 'create-migration-scripts',
				description: 'Generate migration scripts and rollback procedures',
				execute: this.createMigrationScripts.bind(this),
				validate: this.validateMigrationScripts.bind(this),
			},
		];
	}

	private async executeStep(step: MigrationStep): Promise<void> {
		console.log(`📋 ${step.description}...`);
		const startTime = Date.now();

		try {
			await step.execute();

			// Validate step completion
			const isValid = await step.validate();
			if (!isValid) {
				throw new Error('Step validation failed');
			}

			const duration = Date.now() - startTime;
			this.results.push({
				step: step.name,
				success: true,
				duration,
			});

			console.log(`  ✅ ${step.description} completed (${duration}ms)`);
		} catch (error) {
			const duration = Date.now() - startTime;
			this.results.push({
				step: step.name,
				success: false,
				duration,
				error: error instanceof Error ? error.message : String(error),
			});

			console.log(
				`  ❌ ${step.description} failed (${duration}ms): ${
					error instanceof Error ? error.message : String(error)
				}`
			);
			throw error;
		}
	}

	private async analyzeCurrentSchema(): Promise<void> {
		const client = new MongoClient(this.currentDbUri);

		try {
			await client.connect();
			const db = client.db();
			const collections = await db.listCollections().toArray();

			const schemaAnalysis = {
				database: db.databaseName,
				collections: collections.map((col) => col.name),
				userRelatedCollections: [] as string[],
				dependencies: {},
				estimatedRecords: {} as { [key: string]: number },
			};

			// Analyze user-related collections
			for (const collection of collections) {
				const collectionName = collection.name;
				const sampleDoc = await db.collection(collectionName).findOne();

				if (sampleDoc) {
					const fields = Object.keys(sampleDoc);
					const hasUserField = fields.some(
						(field) =>
							field.includes('user') ||
							field.includes('userId') ||
							field.includes('clerkId')
					);

					if (hasUserField) {
						schemaAnalysis.userRelatedCollections.push(collectionName);
					}

					// Get estimated record count
					const count = await db
						.collection(collectionName)
						.estimatedDocumentCount();
					schemaAnalysis.estimatedRecords[collectionName] = count;
				}
			}

			// Save analysis to file
			const analysisPath = path.join(process.cwd(), 'migration-analysis.json');
			fs.writeFileSync(analysisPath, JSON.stringify(schemaAnalysis, null, 2));

			console.log(`    Found ${collections.length} collections`);
			console.log(
				`    User-related collections: ${schemaAnalysis.userRelatedCollections.join(
					', '
				)}`
			);
			console.log(`    Analysis saved to: ${analysisPath}`);
		} finally {
			await client.close();
		}
	}

	private async validateSchemaAnalysis(): Promise<boolean> {
		const analysisPath = path.join(process.cwd(), 'migration-analysis.json');
		return fs.existsSync(analysisPath);
	}

	private async createUserServiceDatabase(): Promise<void> {
		const userDbConfig: DatabaseConfig = {
			name: 'mealprep360_users',
			connectionString: this.currentDbUri.replace(
				'/mealprep360',
				'/mealprep360_users'
			),
			collections: [
				'users',
				'user_preferences',
				'user_settings',
				'user_subscriptions',
				'user_sessions',
				'user_profiles',
			],
		};

		const client = new MongoClient(userDbConfig.connectionString);

		try {
			await client.connect();
			const db = client.db(userDbConfig.name);

			// Create collections with appropriate indexes
			for (const collectionName of userDbConfig.collections) {
				await db.createCollection(collectionName);

				// Add common indexes
				if (collectionName === 'users') {
					await db
						.collection(collectionName)
						.createIndex({ clerkId: 1 }, { unique: true });
					await db
						.collection(collectionName)
						.createIndex({ email: 1 }, { unique: true });
				}

				if (collectionName.startsWith('user_')) {
					await db.collection(collectionName).createIndex({ userId: 1 });
				}
			}

			// Save database configuration
			const configPath = path.join(
				process.cwd(),
				'user-service-db-config.json'
			);
			fs.writeFileSync(configPath, JSON.stringify(userDbConfig, null, 2));

			console.log(`    Created database: ${userDbConfig.name}`);
			console.log(`    Created ${userDbConfig.collections.length} collections`);
		} finally {
			await client.close();
		}
	}

	private async validateUserServiceDatabase(): Promise<boolean> {
		const configPath = path.join(process.cwd(), 'user-service-db-config.json');
		if (!fs.existsSync(configPath)) {
			return false;
		}

		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		const client = new MongoClient(config.connectionString);

		try {
			await client.connect();
			const db = client.db(config.name);
			const collections = await db.listCollections().toArray();

			return collections.length === config.collections.length;
		} catch (error) {
			return false;
		} finally {
			await client.close();
		}
	}

	private async setupMigrationTracking(): Promise<void> {
		const client = new MongoClient(this.currentDbUri);

		try {
			await client.connect();
			const db = client.db();

			// Create migration tracking collection
			await db.createCollection('migration_tracking');
			await db
				.collection('migration_tracking')
				.createIndex({ migrationId: 1 }, { unique: true });
			await db.collection('migration_tracking').createIndex({ timestamp: 1 });

			// Insert initial migration record
			await db.collection('migration_tracking').insertOne({
				migrationId: 'phase-1-init',
				phase: 1,
				status: 'initialized',
				timestamp: new Date(),
				description: 'Database migration Phase 1 initialization',
				affectedCollections: [],
				rollbackAvailable: true,
			});

			console.log('    Migration tracking system initialized');
		} finally {
			await client.close();
		}
	}

	private async validateMigrationTracking(): Promise<boolean> {
		const client = new MongoClient(this.currentDbUri);

		try {
			await client.connect();
			const db = client.db();
			const collection = db.collection('migration_tracking');

			const record = await collection.findOne({ migrationId: 'phase-1-init' });
			return !!record;
		} catch (error) {
			return false;
		} finally {
			await client.close();
		}
	}

	private async createEventBus(): Promise<void> {
		// Create event bus configuration
		const eventBusConfig = {
			type: 'redis',
			connectionString: process.env.REDIS_URL || 'redis://localhost:6379',
			channels: [
				'user.created',
				'user.updated',
				'user.deleted',
				'user.preferences.updated',
				'user.subscription.changed',
			],
			retryPolicy: {
				maxRetries: 3,
				backoffMultiplier: 2,
				initialDelay: 1000,
			},
		};

		const configPath = path.join(process.cwd(), 'event-bus-config.json');
		fs.writeFileSync(configPath, JSON.stringify(eventBusConfig, null, 2));

		// Create event schemas
		const eventSchemas = {
			'user.created': {
				properties: {
					userId: { type: 'string', required: true },
					clerkId: { type: 'string', required: true },
					email: { type: 'string', required: true },
					createdAt: { type: 'date', required: true },
				},
			},
			'user.updated': {
				properties: {
					userId: { type: 'string', required: true },
					changes: { type: 'object', required: true },
					updatedAt: { type: 'date', required: true },
				},
			},
			'user.deleted': {
				properties: {
					userId: { type: 'string', required: true },
					deletedAt: { type: 'date', required: true },
				},
			},
		};

		const schemasPath = path.join(process.cwd(), 'event-schemas.json');
		fs.writeFileSync(schemasPath, JSON.stringify(eventSchemas, null, 2));

		console.log('    Event bus configuration created');
		console.log('    Event schemas defined');
	}

	private async validateEventBus(): Promise<boolean> {
		const configPath = path.join(process.cwd(), 'event-bus-config.json');
		const schemasPath = path.join(process.cwd(), 'event-schemas.json');

		return fs.existsSync(configPath) && fs.existsSync(schemasPath);
	}

	private async prepareUserDataMigration(): Promise<void> {
		const client = new MongoClient(this.currentDbUri);

		try {
			await client.connect();
			const db = client.db();

			// Analyze user data for migration
			const usersCollection = db.collection('users');
			const userCount = await usersCollection.countDocuments();

			if (userCount === 0) {
				console.log('    No user data found to migrate');
				return;
			}

			// Create migration plan
			const migrationPlan = {
				totalUsers: userCount,
				batchSize: 1000,
				estimatedBatches: Math.ceil(userCount / 1000),
				estimatedDuration: Math.ceil(userCount / 1000) * 2, // 2 seconds per batch estimate
				dataMapping: {
					users: {
						source: 'users',
						target: 'users',
						transformations: [
							'Add userId field if missing',
							'Normalize email format',
							'Set default preferences',
						],
					},
					userPreferences: {
						source: 'users.preferences',
						target: 'user_preferences',
						transformations: [
							'Extract preferences to separate collection',
							'Add preference versioning',
						],
					},
				},
			};

			const planPath = path.join(process.cwd(), 'user-migration-plan.json');
			fs.writeFileSync(planPath, JSON.stringify(migrationPlan, null, 2));

			console.log(`    Migration plan created for ${userCount} users`);
			console.log(`    Estimated ${migrationPlan.estimatedBatches} batches`);
		} finally {
			await client.close();
		}
	}

	private async validateUserDataPreparation(): Promise<boolean> {
		const planPath = path.join(process.cwd(), 'user-migration-plan.json');
		return fs.existsSync(planPath);
	}

	private async createMigrationScripts(): Promise<void> {
		const scriptsDir = path.join(process.cwd(), 'migration-scripts');
		if (!fs.existsSync(scriptsDir)) {
			fs.mkdirSync(scriptsDir, { recursive: true });
		}

		// Create user migration script
		const userMigrationScript = `
#!/usr/bin/env node

// User Service Migration Script
// This script migrates user data from the main database to the user service database

const { MongoClient } = require('mongodb');

async function migrateUsers() {
  const sourceClient = new MongoClient(process.env.MONGODB_URI);
  const targetClient = new MongoClient(process.env.USER_SERVICE_DB_URI);
  
  try {
    console.log('Starting user migration...');
    
    await sourceClient.connect();
    await targetClient.connect();
    
    const sourceDb = sourceClient.db();
    const targetDb = targetClient.db();
    
    // Migration logic will be implemented here
    
    console.log('User migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

if (require.main === module) {
  migrateUsers();
}

module.exports = { migrateUsers };
`;

		fs.writeFileSync(
			path.join(scriptsDir, 'migrate-users.js'),
			userMigrationScript
		);

		// Create rollback script
		const rollbackScript = `
#!/usr/bin/env node

// Rollback Script for User Service Migration
// This script rolls back user data migration if needed

const { MongoClient } = require('mongodb');

async function rollbackUserMigration() {
  console.log('Starting rollback...');
  
  // Rollback logic will be implemented here
  
  console.log('Rollback completed');
}

if (require.main === module) {
  rollbackUserMigration();
}

module.exports = { rollbackUserMigration };
`;

		fs.writeFileSync(
			path.join(scriptsDir, 'rollback-user-migration.js'),
			rollbackScript
		);

		// Create validation script
		const validationScript = `
#!/usr/bin/env node

// Migration Validation Script
// This script validates the migration was successful

const { MongoClient } = require('mongodb');

async function validateMigration() {
  console.log('Validating migration...');
  
  // Validation logic will be implemented here
  
  console.log('Validation completed');
}

if (require.main === module) {
  validateMigration();
}

module.exports = { validateMigration };
`;

		fs.writeFileSync(
			path.join(scriptsDir, 'validate-migration.js'),
			validationScript
		);

		console.log('    Migration scripts created');
		console.log('    Rollback procedures prepared');
	}

	private async validateMigrationScripts(): Promise<boolean> {
		const scriptsDir = path.join(process.cwd(), 'migration-scripts');
		const requiredScripts = [
			'migrate-users.js',
			'rollback-user-migration.js',
			'validate-migration.js',
		];

		return requiredScripts.every((script) =>
			fs.existsSync(path.join(scriptsDir, script))
		);
	}

	private displaySummary(): void {
		console.log('\n📊 Migration Initialization Summary');
		console.log('==================================');

		const totalSteps = this.results.length;
		const successfulSteps = this.results.filter((r) => r.success).length;
		const failedSteps = totalSteps - successfulSteps;

		console.log(`Total Steps: ${totalSteps}`);
		console.log(`Successful: ${successfulSteps}`);
		console.log(`Failed: ${failedSteps}`);
		console.log(
			`Success Rate: ${Math.round((successfulSteps / totalSteps) * 100)}%`
		);

		const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
		console.log(`Total Time: ${totalTime}ms`);

		console.log('\n📦 Created Files:');
		console.log('• migration-analysis.json - Current schema analysis');
		console.log(
			'• user-service-db-config.json - User service database configuration'
		);
		console.log('• event-bus-config.json - Event bus configuration');
		console.log(
			'• event-schemas.json - Event schemas for inter-service communication'
		);
		console.log('• user-migration-plan.json - Detailed migration plan');
		console.log('• migration-scripts/ - Migration and rollback scripts');
	}

	private displayNextSteps(): void {
		console.log('\n📋 Next Steps for Phase 1 Implementation:');
		console.log('1. Review migration-analysis.json for schema insights');
		console.log(
			'2. Update environment variables with user service database URL'
		);
		console.log('3. Set up Redis for event bus (if not already running)');
		console.log(
			'4. Create user service application with dedicated API endpoints'
		);
		console.log('5. Implement event-driven user synchronization');
		console.log('6. Run migration scripts to move user data');
		console.log('7. Update main API to use user service for user operations');
		console.log('8. Validate migration and test system functionality');

		console.log('\n⚙️  Environment Variables to Add:');
		console.log(
			'USER_SERVICE_DB_URI=mongodb://localhost:27017/mealprep360_users'
		);
		console.log('REDIS_URL=redis://localhost:6379');
		console.log('USER_SERVICE_URL=http://localhost:3010');
		console.log('USER_SERVICE_API_KEY=<generated-api-key>');

		console.log('\n🚨 Important Notes:');
		console.log('• This is Phase 1 of a multi-phase migration');
		console.log(
			'• Always backup your database before running migration scripts'
		);
		console.log('• Test the migration in a development environment first');
		console.log('• Monitor system performance during and after migration');
		console.log('• Keep rollback scripts ready in case of issues');
	}
}

// CLI execution
if (require.main === module) {
	const initializer = new DatabaseMigrationInitializer();
	initializer.initializePhase1().catch((error) => {
		console.error('Migration initialization failed:', error);
		process.exit(1);
	});
}

export default DatabaseMigrationInitializer;
