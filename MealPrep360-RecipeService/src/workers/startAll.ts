import { ImageGenerationWorker } from './imageGenerationWorker.js';
import { logger } from '../services/logger.js';

// Start all workers in parallel
async function startAllWorkers() {
  try {
    // Start image generation worker
    logger.info('Starting image generation worker...');
    const imageWorker = new ImageGenerationWorker();
    await imageWorker.start();

    // Add other workers here as needed

    logger.info('All workers started successfully');
  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Start workers with retry
async function startWithRetry(maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      logger.info(`Starting workers (attempt ${retries + 1}/${maxRetries})...`);
      const imageWorker = new ImageGenerationWorker();
      await imageWorker.start();
      logger.info('Workers started successfully');
      return;
    } catch (error) {
      retries++;
      logger.error(`Failed to start workers (attempt ${retries}/${maxRetries}):`, error);
      if (retries < maxRetries) {
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error(`Failed to start workers after ${maxRetries} attempts`);
  process.exit(1);
}

// Start workers with monitoring
async function startWithMonitoring() {
  try {
    logger.info('Starting workers with monitoring...');
    const imageWorker = new ImageGenerationWorker();
    await imageWorker.start();

    // Monitor worker health
    setInterval(() => {
      // Add health checks here
    }, 60000); // Check every minute

    logger.info('Workers started with monitoring');
  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Start based on command line argument
const startMode = process.argv[2];
switch (startMode) {
  case 'parallel':
    startAllWorkers();
    break;
  case 'retry':
    startWithRetry();
    break;
  case 'monitor':
    startWithMonitoring();
    break;
  default:
    startAllWorkers();
}