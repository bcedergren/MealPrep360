import { spawn } from 'child_process';
import { logger } from '../services/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runValidation() {
	try {
		logger.info('Starting recipe validation process...');

		const validationScript = path.join(
			__dirname,
			'validateAndUpdateRecipes.ts'
		);

		const child = spawn('ts-node', [validationScript], {
			stdio: 'inherit',
			shell: true,
		});

		child.on('error', (error) => {
			logger.error(`Failed to start validation script: ${error.message}`);
			process.exit(1);
		});

		child.on('exit', (code) => {
			if (code === 0) {
				logger.info('Validation process completed successfully');
			} else {
				logger.error(`Validation process exited with code ${code}`);
				process.exit(code || 1);
			}
		});
	} catch (error) {
		logger.error(
			`Error running validation: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
		process.exit(1);
	}
}

runValidation();
