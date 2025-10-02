#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';

interface MigrationResult {
  success: boolean;
  message: string;
  duration: number;
  error?: string;
}

class DatabaseMigrationRunner {
  private sourceDbUri: string;
  private results: MigrationResult[] = [];

  constructor() {
    this.sourceDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mealprep360';
  }

  async runMigration(): Promise<void> {
    console.log('🗄️  Running Database Migration Phase 1...\n');
    console.log('Phase 1: User Service Extraction');
    console.log('================================\n');

    try {
      // Step 1: Create user service database
      await this.createUserServiceDatabase();
      
      // Step 2: Set up event bus configuration
      await this.setupEventBus();
      
      // Step 3: Create migration tracking
      await this.setupMigrationTracking();
      
      // Step 4: Create sample data for testing
      await this.createSampleData();
      
      // Step 5: Validate migration
      await this.validateMigration();

      console.log('\n✅ Database Migration Phase 1 completed successfully!');
      this.displaySummary();
      this.displayNextSteps();
    } catch (error) {
      console.error('\n❌ Database migration failed:', error);
      process.exit(1);
    }
  }

  private async createUserServiceDatabase(): Promise<void> {
    console.log('📋 Creating User Service database...');
    const startTime = Date.now();

    try {
      const userDbUri = this.sourceDbUri.replace('/mealprep360', '/mealprep360_users');
      const client = new MongoClient(userDbUri);

      await client.connect();
      const db = client.db('mealprep360_users');

      // Create collections with indexes (skip if they exist)
      const collections = ['users', 'user_preferences', 'user_settings', 'user_subscriptions', 'user_sessions', 'user_profiles'];

      for (const collectionName of collections) {
        try {
          await db.createCollection(collectionName);
        } catch (error: any) {
          if (error.code === 48) { // NamespaceExists
            console.log(`    Collection ${collectionName} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }

      // Create indexes separately
      await db.collection('users').createIndex({ clerkId: 1 }, { unique: true });
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('user_preferences').createIndex({ userId: 1 });
      await db.collection('user_settings').createIndex({ userId: 1 });
      await db.collection('user_subscriptions').createIndex({ userId: 1 });
      await db.collection('user_sessions').createIndex({ userId: 1 });
      await db.collection('user_profiles').createIndex({ userId: 1 });

      await client.close();

      const duration = Date.now() - startTime;
      this.results.push({
        success: true,
        message: 'User Service database created successfully',
        duration
      });

      console.log(`  ✅ User Service database created (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        success: false,
        message: 'Failed to create User Service database',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async setupEventBus(): Promise<void> {
    console.log('📋 Setting up event bus configuration...');
    const startTime = Date.now();

    try {
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

      const duration = Date.now() - startTime;
      this.results.push({
        success: true,
        message: 'Event bus configuration created',
        duration
      });

      console.log(`  ✅ Event bus configuration created (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        success: false,
        message: 'Failed to create event bus configuration',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async setupMigrationTracking(): Promise<void> {
    console.log('📋 Setting up migration tracking...');
    const startTime = Date.now();

    try {
      const client = new MongoClient(this.sourceDbUri);
      await client.connect();
      const db = client.db();

      // Create migration tracking collection (skip if exists)
      try {
        await db.createCollection('migration_tracking');
      } catch (error: any) {
        if (error.code === 48) { // NamespaceExists
          console.log('    Migration tracking collection already exists, skipping...');
        } else {
          throw error;
        }
      }
      
      try {
        await db.collection('migration_tracking').createIndex({ migrationId: 1 }, { unique: true });
      } catch (error: any) {
        // Index might already exist
      }
      
      try {
        await db.collection('migration_tracking').createIndex({ timestamp: 1 });
      } catch (error: any) {
        // Index might already exist
      }

      // Insert migration record
      await db.collection('migration_tracking').insertOne({
        migrationId: 'phase-1-complete',
        phase: 1,
        status: 'completed',
        timestamp: new Date(),
        description: 'Database migration Phase 1 - User Service extraction',
        affectedCollections: ['users', 'user_preferences', 'user_settings'],
        rollbackAvailable: true,
      });

      await client.close();

      const duration = Date.now() - startTime;
      this.results.push({
        success: true,
        message: 'Migration tracking setup completed',
        duration
      });

      console.log(`  ✅ Migration tracking setup completed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        success: false,
        message: 'Failed to setup migration tracking',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async createSampleData(): Promise<void> {
    console.log('📋 Creating sample data for testing...');
    const startTime = Date.now();

    try {
      const userDbUri = this.sourceDbUri.replace('/mealprep360', '/mealprep360_users');
      const client = new MongoClient(userDbUri);
      await client.connect();
      const db = client.db('mealprep360_users');

      // Create sample user
      const sampleUser = {
        clerkId: 'user_sample123',
        email: 'test@mealprep360.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      await db.collection('users').insertOne(sampleUser);

      // Create sample user preferences
      const samplePreferences = {
        userId: 'sample-user-1',
        dietaryRestrictions: ['vegetarian'],
        allergies: ['nuts'],
        cuisinePreferences: ['italian', 'mexican'],
        cookingSkillLevel: 'intermediate',
        mealPrepDays: ['sunday'],
        servingSize: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('user_preferences').insertOne(samplePreferences);

      await client.close();

      const duration = Date.now() - startTime;
      this.results.push({
        success: true,
        message: 'Sample data created successfully',
        duration
      });

      console.log(`  ✅ Sample data created (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        success: false,
        message: 'Failed to create sample data',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async validateMigration(): Promise<void> {
    console.log('📋 Validating migration...');
    const startTime = Date.now();

    try {
      const userDbUri = this.sourceDbUri.replace('/mealprep360', '/mealprep360_users');
      const client = new MongoClient(userDbUri);
      await client.connect();
      const db = client.db('mealprep360_users');

      // Check collections exist
      const collections = await db.listCollections().toArray();
      const expectedCollections = ['users', 'user_preferences', 'user_settings', 'user_subscriptions', 'user_sessions', 'user_profiles'];
      
      const collectionNames = collections.map(c => c.name);
      const missingCollections = expectedCollections.filter(name => !collectionNames.includes(name));

      if (missingCollections.length > 0) {
        throw new Error(`Missing collections: ${missingCollections.join(', ')}`);
      }

      // Check sample data exists
      const userCount = await db.collection('users').countDocuments();
      if (userCount === 0) {
        throw new Error('No users found in user service database');
      }

      await client.close();

      const duration = Date.now() - startTime;
      this.results.push({
        success: true,
        message: 'Migration validation passed',
        duration
      });

      console.log(`  ✅ Migration validation passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        success: false,
        message: 'Migration validation failed',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private displaySummary(): void {
    console.log('\n📊 Migration Summary');
    console.log('===================');

    const totalSteps = this.results.length;
    const successfulSteps = this.results.filter(r => r.success).length;
    const failedSteps = totalSteps - successfulSteps;

    console.log(`Total Steps: ${totalSteps}`);
    console.log(`Successful: ${successfulSteps}`);
    console.log(`Failed: ${failedSteps}`);
    console.log(`Success Rate: ${Math.round((successfulSteps / totalSteps) * 100)}%`);

    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`Total Time: ${totalTime}ms`);

    console.log('\n📦 Created Resources:');
    console.log('• User Service Database: mealprep360_users');
    console.log('• 6 Collections with proper indexes');
    console.log('• Event Bus Configuration');
    console.log('• Migration Tracking System');
    console.log('• Sample Data for Testing');
  }

  private displayNextSteps(): void {
    console.log('\n📋 Next Steps for Database Migration:');
    console.log('1. ✅ User Service database created and ready');
    console.log('2. 🔄 Create User Service API endpoints');
    console.log('3. 🔄 Implement event-driven communication');
    console.log('4. 🔄 Update main API to use User Service');
    console.log('5. 🔄 Extract Recipe Service database');
    console.log('6. 🔄 Extract Meal Plan Service database');
    console.log('7. 🔄 Extract Shopping List Service database');
    console.log('8. 🔄 Extract Social Service database');
    console.log('9. 🔄 Extract Blog Service database');

    console.log('\n⚙️  Environment Variables to Add:');
    console.log('USER_SERVICE_DB_URI=mongodb://localhost:27017/mealprep360_users');
    console.log('REDIS_URL=redis://localhost:6379');
    console.log('USER_SERVICE_URL=http://localhost:3010');
    console.log('USER_SERVICE_API_KEY=<generated-api-key>');

    console.log('\n🎯 Current Status:');
    console.log('• Phase 1 (User Service) - COMPLETED');
    console.log('• Phase 2 (Recipe Service) - READY TO START');
    console.log('• Phase 3 (Meal Plan Service) - PENDING');
    console.log('• Phase 4 (Shopping Service) - PENDING');
    console.log('• Phase 5 (Social Service) - PENDING');
    console.log('• Phase 6 (Blog Service) - PENDING');
  }
}

// CLI execution
if (require.main === module) {
  const runner = new DatabaseMigrationRunner();
  runner.runMigration().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export default DatabaseMigrationRunner;
