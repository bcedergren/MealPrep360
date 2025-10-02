import { ServiceContainer } from './ServiceContainer'
import { LoggerService } from '../services/LoggerService'
import { JobService } from '../services/jobService'
import { QueueService } from '../services/queueService'
import { AIService } from '../services/AIService'
import { ImageService } from '../services/ImageService'
import { RecipeService } from '../services/RecipeService'
import { HealthService } from '../services/health'
import { HealthServiceAdapter } from '../services/HealthServiceAdapter'
import { ILogger } from '../services/interfaces/ILogger'
import { IJobService } from '../services/interfaces/IJobService'
import { IQueueService } from '../services/interfaces/IQueueService'
import { IAIService } from '../services/interfaces/IAIService'
import { IImageService } from '../services/interfaces/IImageService'
import { IRecipeService } from '../services/interfaces/IRecipeService'
import { IHealthService } from '../services/interfaces/IHealthService'

export function registerServices(): void {
  const container = ServiceContainer.getInstance()

  // Register core services
  const logger = LoggerService.getInstance()
  container.register<ILogger>('ILogger', logger)

  // Register services with dependencies
  const jobService = new JobService(logger)
  container.register<IJobService>('IJobService', jobService)

  const queueService = new QueueService(logger)
  container.register<IQueueService>('IQueueService', queueService)

  const aiService = new AIService(logger)
  container.register<IAIService>('IAIService', aiService)

  const imageService = new ImageService(logger)
  container.register<IImageService>('IImageService', imageService)

  const recipeService = new RecipeService(logger, aiService, imageService)
  container.register<IRecipeService>('IRecipeService', recipeService)

  // Register health service adapter for the IHealthService contract
  const healthImpl = HealthService.getInstance()
  const health = new HealthServiceAdapter(healthImpl)
  container.register<IHealthService>('IHealthService', health)
}

export function getService<T>(token: string): T {
  return ServiceContainer.getInstance().get<T>(token)
}
