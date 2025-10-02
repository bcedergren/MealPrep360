import { Logger } from '../core/interfaces/Logger';

export class ConsoleLogger implements Logger {
	info(message: string, ...args: unknown[]): void {
		console.log(message, ...args);
	}

	error(message: string, error?: unknown): void {
		console.error(message, error);
	}

	warn(message: string, ...args: unknown[]): void {
		console.warn(message, ...args);
	}

	debug(message: string, ...args: unknown[]): void {
		console.debug(message, ...args);
	}
}
