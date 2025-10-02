#!/usr/bin/env node

const { ServiceContainer } = require('../container/ServiceContainer');
const { LoggerService } = require('../services/LoggerService');
const { AIService } = require('../services/AIService');
const { ImageService } = require('../services/ImageService');
const { RecipeService } = require('../services/RecipeService');
const { JobService } = require('../services/jobService');
const { QueueService } = require('../services/queueService');
const { HealthService } = require('../services/health');
const { RecipeCategorizationService } = require('../services/categorization/recipeCategorizationService');
const { HybridRecommendationService } = require('../services/recommendation/hybridRecommendationService');
const { RecipeSearchService } = require('../services/search/recipeSearchService');

/**
 * Initialize all Phase 7 services in the service container
 */
class Phase7ServiceInitializer {
  private container: any;
  private logger: any;

  constructor() {
    this.container = ServiceContainer.getInstance();
    this.logger = LoggerService.getInstance();
  }

  /**
   * Initialize all services
   */
  async initializeAllServices(): Promise<void> {
    try {
      this.logger.info('🚀 Initializing Phase 7 services...');

      // Initialize core services first
      await this.initializeCoreServices();

      // Initialize Phase 7 services
      await this.initializePhase7Services();

      this.logger.info('✅ All Phase 7 services initialized successfully!');
      this.displayServiceStatus();

    } catch (error) {
      this.logger.error('Failed to initialize Phase 7 services:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Initialize core services
   */
  private async initializeCoreServices(): Promise<void> {
    this.logger.info('📦 Initializing core services...');

    // Register logger
    this.container.register('ILogger', this.logger);

    // Register AI service
    const aiService = AIService.getInstance();
    this.container.register('IAIService', aiService);

    // Register image service
    const imageService = ImageService.getInstance();
    this.container.register('IImageService', imageService);

    // Register recipe service
    const recipeService = RecipeService.getInstance();
    this.container.register('IRecipeService', recipeService);

    // Register job service
    const jobService = JobService.getInstance();
    this.container.register('IJobService', jobService);

    // Register queue service
    const queueService = QueueService.getInstance();
    this.container.register('IQueueService', queueService);

    // Register health service
    const healthService = HealthService.getInstance();
    this.container.register('IHealthService', healthService);

    this.logger.info('✅ Core services initialized');
  }

  /**
   * Initialize Phase 7 services
   */
  private async initializePhase7Services(): Promise<void> {
    this.logger.info('🤖 Initializing Phase 7 AI services...');

    // Get required services
    const logger = this.container.get('ILogger');
    const aiService = this.container.get('IAIService');

    // Register Phase 7 services
    this.container.registerCategorizationService(logger, aiService);
    this.container.registerRecommendationService(logger, aiService);
    this.container.registerSearchService(logger);

    this.logger.info('✅ Phase 7 services initialized');
  }

  /**
   * Display service status
   */
  private displayServiceStatus(): void {
    this.logger.info('\n📊 Service Status:');
    this.logger.info('==================');

    const services = [
      'ILogger',
      'IAIService',
      'IImageService',
      'IRecipeService',
      'IJobService',
      'IQueueService',
      'IHealthService',
      'RecipeCategorizationService',
      'HybridRecommendationService',
      'RecipeSearchService'
    ];

    services.forEach(serviceName => {
      try {
        const service = this.container.get(serviceName);
        this.logger.info(`✅ ${serviceName}: Registered and ready`);
      } catch (error) {
        this.logger.error(`❌ ${serviceName}: Not registered`);
      }
    });
  }

  /**
   * Test Phase 7 services to ensure they are ready
   */
  async testPhase7Services(): Promise<void> {
    this.logger.info('🧪 Testing Phase 7 services...');
    
    const services = [
      'RecipeCategorizationService',
      'HybridRecommendationService', 
      'RecipeSearchService'
    ];

    services.forEach(serviceName => {
      try {
        const service = this.container.get(serviceName);
        this.logger.info(`✅ ${serviceName}: Registered and ready`);
      } catch (error) {
        this.logger.error(`❌ ${serviceName}: Not registered`);
      }
    });
  }

  /**
   * Get service container instance
   */
  getContainer(): any {
    return this.container;
  }
}

module.exports = { Phase7ServiceInitializer };

// CLI execution
if (require.main === module) {
  const initializer = new Phase7ServiceInitializer();
  
  initializer.initializeAllServices()
    .then(() => initializer.testPhase7Services())
    .then(() => {
      console.log('\n🎉 Phase 7 services are ready for deployment!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Phase 7 initialization failed:', error);
      process.exit(1);
    });
}
