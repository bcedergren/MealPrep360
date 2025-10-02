import { ServiceRegistry } from './ServiceRegistry';
import { MongoRecipeRepository } from '../recipes/repositories/MongoRecipeRepository';
import { RecipeService } from '../recipes/services/RecipeService';
import { ExternalMealPlanService } from '../meal-plans/services/ExternalMealPlanService';
import { ExternalAnalyticsService } from '../analytics/services/ExternalAnalyticsService';
import { LocalShoppingListService } from '../shopping/services/LocalShoppingListService';
import { IRecipeDocument } from '../recipes/types/recipe';
import mongoose from 'mongoose';
import { serviceDiscovery } from '../services/discovery';
import { serviceConfig } from '../services/config';
import { database } from '@/infra/database';
import { dbSanity } from '@/lib/dbSanity';
import connectDB from '../mongodb/connection';

export class Container {
	private static instance: Container;
	private registry: ServiceRegistry;

	private constructor() {
		this.registry = ServiceRegistry.getInstance();
	}

	private async initializeServices(): Promise<void> {
		// Initialize service configuration
		await serviceConfig.initializeServices();

		// Register services with service discovery before constructing clients
		const mealplanConfig = serviceConfig.getServiceConfig('mealplan-service');
		if (mealplanConfig) {
			serviceDiscovery.registerService('mealplan-service', {
				name: 'mealplan-service',
				endpoint: {
					url: mealplanConfig.url,
					version: '1.0.0',
					capabilities: mealplanConfig.metadata.capabilities,
				},
			});
		}

		const analyticsConfig = serviceConfig.getServiceConfig('analytics-service');
		if (analyticsConfig) {
			serviceDiscovery.registerService('analytics-service', {
				name: 'analytics-service',
				endpoint: {
					url: analyticsConfig.url,
					version: '1.0.0',
					capabilities: analyticsConfig.metadata.capabilities,
				},
			});
		}

		// Register services in the container
		await this.registerServices();
	}

	static async getInstance(): Promise<Container> {
		if (!Container.instance) {
			Container.instance = new Container();
			await Container.instance.initializeServices();
		}
		return Container.instance;
	}

	private async registerServices(): Promise<void> {
		// Ensure database connection is established before accessing models
		await connectDB();
		// One-time startup sanity check for DB/collections
		try {
			await dbSanity(database);
		} catch (e) {
			console.warn('[CONTAINER] DB sanity check failed:', (e as any)?.message);
		}

		// Register services that don't depend on models first
		const mealPlanService = new ExternalMealPlanService();
		// Register under both keys to support existing route usages
		this.registry.register('mealplan-service', mealPlanService);
		this.registry.register('mealPlanService', mealPlanService);

		// Only initialize analytics service if it is configured
		const analyticsConfig = serviceConfig.getServiceConfig('analytics-service');
		if (analyticsConfig) {
			try {
				const analyticsService = new ExternalAnalyticsService();
				this.registry.register('analyticsService', analyticsService);
			} catch (err) {
				console.warn(
					'[CONTAINER] Skipping analytics service initialization due to error:',
					err
				);
			}
		} else {
			console.warn(
				'[CONTAINER] Skipping analytics service initialization: no analytics-service configuration found'
			);
		}

		const shoppingListService = new LocalShoppingListService();
		this.registry.register('shoppingListService', shoppingListService);

		// Register model-dependent services after database connection
		try {
			// Import Recipe model after database connection is established
			const { Recipe } = await import('../mongodb/schemas');

			// Register repositories - use lazy loading to ensure Recipe model is available
			const recipeRepository = new MongoRecipeRepository(Recipe);
			this.registry.register('recipeRepository', recipeRepository);

			// Register services
			const recipeService = new RecipeService(recipeRepository);
			this.registry.register('recipeService', recipeService);
		} catch (error) {
			console.error('[CONTAINER] Error registering Recipe services:', error);
			// Continue without Recipe services - they can be registered later if needed
		}
	}

	getService<T>(name: string): T {
		return this.registry.get<T>(name);
	}
}
