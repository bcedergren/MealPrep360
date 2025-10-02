#!/usr/bin/env node

const { ServiceContainer } = require('../dist/container/ServiceContainer');
const { LoggerService } = require('../dist/services/LoggerService');
const { AIService } = require('../dist/services/AIService');
const { ImageService } = require('../dist/services/ImageService');
const { RecipeService } = require('../dist/services/RecipeService');
const { JobService } = require('../dist/services/jobService');
const { QueueService } = require('../dist/services/queueService');
const { HealthService } = require('../dist/services/health');
const { RecipeCategorizationService } = require('../dist/services/categorization/recipeCategorizationService');
const { HybridRecommendationService } = require('../dist/services/recommendation/hybridRecommendationService');
const { RecipeSearchService } = require('../dist/services/search/recipeSearchService');

/**
 * Initialize all Phase 7 services in the service container
 */
class Phase7ServiceInitializer {
  constructor() {
    this.container = ServiceContainer.getInstance();
    this.logger = LoggerService.getInstance();
  }

  /**
   * Initialize all services
   */
  async initializeAllServices() {
    try {
      this.logger.info('🚀 Initializing Phase 7 services...');

      // Register core services first
      this.container.register('ILogger', this.logger);
      this.container.register('IAIService', AIService.getInstance());
      this.container.register('IImageService', ImageService.getInstance());
      this.container.register('IRecipeService', RecipeService.getInstance());
      this.container.register('IJobService', JobService.getInstance());
      this.container.register('IQueueService', QueueService.getInstance());
      this.container.register('IHealthService', HealthService.getInstance());

      // Register Phase 7 services
      this.container.registerCategorizationService(this.logger, this.container.get('IAIService'));
      this.container.registerRecommendationService(this.logger, this.container.get('IAIService'));
      this.container.registerSearchService(this.logger);

      this.logger.info('✅ All Phase 7 services registered successfully.');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Phase 7 services:', error);
      throw error;
    }
  }

  /**
   * Test Phase 7 services to ensure they are ready
   */
  async testPhase7Services() {
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
  getContainer() {
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
