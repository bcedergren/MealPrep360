import { RecipeGenerationWorker } from './recipeGenerationWorker.js';
import { logger } from '../services/logger.js';

async function startRecipeWorker() {
	try {
		const worker = RecipeGenerationWorker.getInstance();
		await worker.start();
	} catch (error) {
		logger.error('Error starting recipe generation worker:', error);
		process.exit(1);
	}
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
	logger.info('Received SIGTERM signal');
	const worker = RecipeGenerationWorker.getInstance();
	worker.stop();
	process.exit(0);
});

process.on('SIGINT', async () => {
	logger.info('Received SIGINT signal');
	const worker = RecipeGenerationWorker.getInstance();
	worker.stop();
	process.exit(0);
});

startRecipeWorker();
