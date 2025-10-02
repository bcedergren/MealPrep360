import { ILogger } from '../services/interfaces/ILogger';
import { IJobService } from '../services/interfaces/IJobService';
import { IQueueService } from '../services/interfaces/IQueueService';
import { IRecipeService } from '../services/interfaces/IRecipeService';
import { IAIService } from '../services/interfaces/IAIService';
import { IHealthService } from '../services/interfaces/IHealthService';
import { IImageService } from '../services/interfaces/IImageService';
import { RecipeCategorizationService } from '../services/categorization/recipeCategorizationService';
import { HybridRecommendationService } from '../services/recommendation/hybridRecommendationService';
import { RecipeSearchService } from '../services/search/recipeSearchService';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  public register<T>(token: string, implementation: T): void {
    this.services.set(token, implementation);
  }

  public get<T>(token: string): T {
    const service = this.services.get(token);
    if (!service) {
      throw new Error(`Service ${token} not registered`);
    }
    return service;
  }

  public clear(): void {
    this.services.clear();
  }

  // Phase 7 Service Registration Methods
  public registerCategorizationService(logger: ILogger, aiService: IAIService): void {
    const service = new RecipeCategorizationService(logger, aiService);
    this.register('RecipeCategorizationService', service);
  }

  public registerRecommendationService(logger: ILogger, aiService: IAIService): void {
    const service = new HybridRecommendationService(logger, aiService);
    this.register('HybridRecommendationService', service);
  }

  public registerSearchService(logger: ILogger): void {
    const service = new RecipeSearchService(logger);
    this.register('RecipeSearchService', service);
  }

  // Phase 7 Service Getter Methods
  public getCategorizationService(): RecipeCategorizationService {
    return this.get<RecipeCategorizationService>('RecipeCategorizationService');
  }

  public getRecommendationService(): HybridRecommendationService {
    return this.get<HybridRecommendationService>('HybridRecommendationService');
  }

  public getSearchService(): RecipeSearchService {
    return this.get<RecipeSearchService>('RecipeSearchService');
  }
}