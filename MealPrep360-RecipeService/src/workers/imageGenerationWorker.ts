import { config } from '../config';
import { connectToDatabase } from '../utils/db';
import { Recipe } from '../models/recipe';
import { logger } from '../services/logger';
import { JobService } from '../services/jobService';
import { AIService } from '../services/AIService';
import { ImageService } from '../services/ImageService';

export class ImageGenerationWorker {
  private jobService: JobService;
  private imageService: ImageService;

  constructor() {
    this.jobService = JobService.getInstance();
    this.imageService = ImageService.getInstance();
  }

  public async processImageGenerationBatch(jobId: string, batch: any[]) {
    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    for (let i = 0; i < batch.length; i++) {
      const recipe = batch[i];
      try {
        const images = await this.imageService.generateImages({
          prompt: `Professional food photography of ${recipe.title}. ${recipe.description}`,
          n: 2,
        });

        await Recipe.findByIdAndUpdate(recipe._id, {
          images,
          hasImage: true,
          updatedAt: new Date(),
        });

        results.success.push(recipe._id);
        logger.info(`Generated images for recipe ${recipe._id}`);
      } catch (error) {
        results.failed.push(recipe._id);
        logger.error(`Failed to generate images for recipe ${recipe._id}:`, error);
      }

      // Update job progress
      await this.jobService.updateJobProgress(jobId, i + 1, batch.length);
    }

    return results;
  }

  public async start() {
    try {
      await connectToDatabase();
      logger.info('Connected to database');

      // Get recipes without images
      const recipes = await Recipe.find({ hasImage: false }).limit(10);
      if (recipes.length === 0) {
        logger.info('No recipes found that need images');
        return;
      }

      // Create a job to track progress
      const job = await this.jobService.createJob('image-generation', {
        total: recipes.length,
      });

      // Process recipes in batches
      const results = await this.processImageGenerationBatch(job.id, recipes);

      // Update job with results
      await this.jobService.completeJob(job.id, {
        success: results.success.length,
        failed: results.failed.length,
        successIds: results.success,
        failedIds: results.failed,
      });

      logger.info('Image generation completed', {
        success: results.success.length,
        failed: results.failed.length,
      });
    } catch (error) {
      logger.error('Error in image generation worker:', error);
      process.exit(1);
    }
  }
}

// Start the worker if this file is run directly
if (require.main === module) {
  const worker = new ImageGenerationWorker();
  worker.start();
}