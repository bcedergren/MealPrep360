import { ImageGenerationWorker } from './imageGenerationWorker.js';
import { logger } from '../services/logger.js';

// Start image generation worker
async function startImageWorker() {
  try {
    const worker = new ImageGenerationWorker();
    await worker.start();
  } catch (error) {
    logger.error('Failed to start image generation worker:', error);
    process.exit(1);
  }
}

// Start recipe generation worker
async function startRecipeWorker() {
  try {
    const worker = new ImageGenerationWorker();
    await worker.start();
  } catch (error) {
    logger.error('Failed to start recipe generation worker:', error);
    process.exit(1);
  }
}

// Start all workers
async function startAllWorkers() {
  try {
    const worker = new ImageGenerationWorker();
    await worker.start();
  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Start based on command line argument
const workerType = process.argv[2];
switch (workerType) {
  case 'image':
    startImageWorker();
    break;
  case 'recipe':
    startRecipeWorker();
    break;
  case 'all':
    startAllWorkers();
    break;
  default:
    console.error('Invalid worker type. Use: image, recipe, or all');
    process.exit(1);
}