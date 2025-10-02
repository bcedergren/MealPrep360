// Mock JobService and Job model **before** their imports
jest.mock('../../services/jobService.js', () => ({
        JobService: {
                getInstance: jest.fn(),
        },
}));

// Mock uuid to return a predictable job ID
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-job-id') }));

jest.mock('../../models/job.js', () => ({
        Job: {
                findOne: jest.fn(),
                create: jest.fn(),
        },
}));

import { QueueService } from '../../services/queueService.js';
import { JobService } from '../../services/jobService.js';
import { Job } from '../../models/job.js';

describe('QueueService', () => {
	let queueService: QueueService;
	let mockJobService: jest.Mocked<JobService>;

        const mockJob = {
                id: 'test-job-id',
                status: 'pending',
                type: 'recipe',
                progress: 0,
                total: 1,
                data: {},
                createdAt: new Date(),
                updatedAt: new Date(),
                // Added so QueueService.enqueueJob can call job.save()
                save: jest.fn(),
        };

        beforeEach(() => {
                jest.clearAllMocks();
                mockJobService = {
                        updateJobProgress: jest.fn(),
                } as any;
                (JobService.getInstance as jest.Mock).mockReturnValue(mockJobService);
                queueService = QueueService.getInstance();
        });

        afterAll(async () => {
                await queueService.disconnect();
        });

	describe('getInstance', () => {
		it('should return the same instance on multiple calls', () => {
			const instance1 = QueueService.getInstance();
			const instance2 = QueueService.getInstance();
			expect(instance1).toBe(instance2);
		});
	});

	describe('enqueueJob', () => {
		it('should enqueue a job successfully', async () => {
			(Job.findOne as jest.Mock).mockResolvedValueOnce(null);
                        (Job.create as jest.Mock).mockImplementationOnce(async (data) => {
                                mockJob.id = data.id;
                                return { ...mockJob };
                        });

			// Mock the Redis client
                        const mockRedis = {
                                lPush: jest.fn().mockResolvedValue(1),
                                quit: jest.fn().mockResolvedValue(undefined),
                        };
			(queueService as any).redis = mockRedis;

			const result = await queueService.enqueueJob({
				type: 'recipe',
				total: 1,
				season: 'summer',
				data: {},
			});

                        expect(result).toBeDefined();
                        expect(result).toBe('test-job-id');
			expect(Job.create).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'recipe',
					status: 'pending',
					total: 1,
				})
			);
		});

		it('should return existing job if one exists', async () => {
			const existingJob = { ...mockJob, id: 'existing-job-id' };
			(Job.findOne as jest.Mock).mockResolvedValueOnce(existingJob);

			const result = await queueService.enqueueJob({
				type: 'recipe',
				total: 1,
				season: 'summer',
				data: {},
			});

			expect(result).toBe('existing-job-id');
			expect(Job.create).not.toHaveBeenCalled();
		});

		it('should handle errors during job enqueuing', async () => {
			(Job.findOne as jest.Mock).mockRejectedValueOnce(
				new Error('Database error')
			);

			await expect(
				queueService.enqueueJob({
					type: 'recipe',
					total: 1,
					season: 'summer',
					data: {},
				})
			).rejects.toThrow('Database error');
		});
	});
});
