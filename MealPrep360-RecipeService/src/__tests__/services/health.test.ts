// Mock mongoose **before** importing modules that use it
jest.mock('mongoose', () => ({
        connection: {
                readyState: 1,
                host: 'localhost',
                name: 'test-db',
                db: {
                        serverConfig: {
                                pool: {
                                        totalConnectionCount: 5,
                                },
                        },
                },
        },
}));

import { HealthService } from '../../services/health.js';
import mongoose from 'mongoose';

describe('HealthService', () => {
	let healthService: HealthService;

	beforeEach(() => {
		jest.clearAllMocks();
		healthService = HealthService.getInstance();
	});

	describe('getInstance', () => {
		it('should return the same instance on multiple calls', () => {
			const instance1 = HealthService.getInstance();
			const instance2 = HealthService.getInstance();
			expect(instance1).toBe(instance2);
		});
	});

        describe('startMonitoring', () => {
                let setIntervalSpy: jest.SpyInstance;
                let clearIntervalSpy: jest.SpyInstance;

                beforeEach(() => {
                        jest.useFakeTimers();
                        setIntervalSpy = jest.spyOn(global, 'setInterval');
                        clearIntervalSpy = jest.spyOn(global, 'clearInterval');
                });

                afterEach(() => {
                        jest.useRealTimers();
                        setIntervalSpy.mockRestore();
                        clearIntervalSpy.mockRestore();
                });

                it('should start health monitoring with default interval', () => {
                        healthService.startMonitoring();
                        expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
                });

                it('should start health monitoring with custom interval', () => {
                        healthService.startMonitoring(60000);
                        expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
                });

                it('should clear existing interval before starting new one', () => {
                        healthService.startMonitoring();
                        healthService.startMonitoring();
                        expect(clearIntervalSpy).toHaveBeenCalled();
                });
        });

        describe('stopMonitoring', () => {
                let setIntervalSpy: jest.SpyInstance;
                let clearIntervalSpy: jest.SpyInstance;

                beforeEach(() => {
                        jest.useFakeTimers();
                        setIntervalSpy = jest.spyOn(global, 'setInterval');
                        clearIntervalSpy = jest.spyOn(global, 'clearInterval');
                });

                afterEach(() => {
                        jest.useRealTimers();
                        setIntervalSpy.mockRestore();
                        clearIntervalSpy.mockRestore();
                });

                it('should stop health monitoring', () => {
                        healthService.startMonitoring();
                        healthService.stopMonitoring();
                        expect(clearIntervalSpy).toHaveBeenCalled();
                });

                it('should not throw error when stopping without starting', () => {
                        expect(() => healthService.stopMonitoring()).not.toThrow();
                });
        });

	describe('withRetry', () => {
		it('should execute operation successfully on first try', async () => {
			const operation = jest.fn().mockResolvedValue('success');
			const result = await healthService.withRetry(operation);
			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should retry operation on failure', async () => {
			const operation = jest
				.fn()
				.mockRejectedValueOnce(new Error('Failed'))
				.mockResolvedValueOnce('success');

			const result = await healthService.withRetry(operation);
			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(2);
		});

		it('should throw error after max retries', async () => {
			const operation = jest.fn().mockRejectedValue(new Error('Failed'));
			await expect(healthService.withRetry(operation, 2)).rejects.toThrow(
				'Failed'
			);
			expect(operation).toHaveBeenCalledTimes(2);
		});
	});

        describe('checkDatabaseHealth', () => {
                it('should return healthy status when database is connected', async () => {
                        const poolSpy = jest
                                .spyOn(healthService as any, 'getPoolStats')
                                .mockResolvedValue({
                                        size: 5,
                                        available: 5,
                                        pending: 0,
                                        timestamp: Date.now(),
                                });
                        const health = await healthService.checkDatabaseHealth();
                        expect(health.status).toBe('healthy');
                        expect(health.metrics).toBeDefined();
                        poolSpy.mockRestore();
                });

                it('should return unhealthy status when database is disconnected', async () => {
                        const poolSpy = jest
                                .spyOn(healthService as any, 'getPoolStats')
                                .mockResolvedValue({
                                        size: 5,
                                        available: 5,
                                        pending: 0,
                                        timestamp: Date.now(),
                                });
                        (mongoose.connection.readyState as any) = 0;
                        const health = await healthService.checkDatabaseHealth();
                        expect(health.status).toBe('unhealthy');
                        expect(health.metrics.health.issues).toHaveLength(1);
                        poolSpy.mockRestore();
                });
        });
});
