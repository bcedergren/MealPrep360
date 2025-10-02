// Mock Job model **before** its import
jest.mock('../../models/job.js', () => ({
  Job: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

import { JobService } from '../../services/jobService.js';
import { Job } from '../../models/job.js';

describe('JobService', () => {
  let jobService: JobService;
  const mockJob = {
    id: 'test-job-id',
    status: 'pending',
    type: 'recipe',
    progress: 0,
    total: 1,
    data: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jobService = JobService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = JobService.getInstance();
      const instance2 = JobService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createJob', () => {
    it('should create a new job successfully', async () => {
      (Job.create as jest.Mock).mockResolvedValueOnce(mockJob);

      const result = await jobService.createJob('recipe', {
        status: 'pending',
        total: 1,
        season: 'summer',
      });

      expect(result).toEqual(mockJob);
      expect(Job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'recipe',
          status: 'pending',
          total: 1,
        })
      );
    });

    it('should handle errors during job creation', async () => {
      (Job.create as jest.Mock).mockRejectedValueOnce(
        new Error('Creation failed')
      );

      await expect(
        jobService.createJob('recipe', {
          status: 'pending',
          total: 1,
          season: 'summer',
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('getJob', () => {
    it('should retrieve a job by ID', async () => {
      (Job.findOne as jest.Mock).mockResolvedValueOnce(mockJob);

      const result = await jobService.getJob('test-job-id');

      expect(result).toEqual(mockJob);
      expect(Job.findOne).toHaveBeenCalledWith({ id: 'test-job-id' });
    });

    it('should return null for non-existent job', async () => {
      (Job.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await jobService.getJob('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateJobProgress', () => {
    it('should update job progress successfully', async () => {
      const updatedJob = { ...mockJob, progress: 50 };
      (Job.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(updatedJob);

      const result = await jobService.updateJobProgress('test-job-id', 50, 100);

      expect(result).toEqual(updatedJob);
      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 'test-job-id' },
        expect.objectContaining({
          progress: 50,
          total: 100,
        }),
        { new: true }
      );
    });

    it('should handle errors during progress update', async () => {
      (Job.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        jobService.updateJobProgress('test-job-id', 50, 100)
      ).rejects.toThrow('Job test-job-id not found');
    });
  });

  describe('completeJob', () => {
    it('should complete a job successfully', async () => {
      const completedJob = { ...mockJob, status: 'completed' };
      (Job.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(completedJob);

      const result = await jobService.completeJob('test-job-id', {
        recipesGenerated: 5,
      });

      expect(result).toEqual(completedJob);
      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 'test-job-id' },
        expect.objectContaining({
          status: 'completed',
          result: { recipesGenerated: 5 },
        }),
        { new: true }
      );
    });
  });

  describe('failJob', () => {
    it('should fail a job successfully', async () => {
      const failedJob = { ...mockJob, status: 'failed' };
      (Job.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(failedJob);

      const result = await jobService.failJob(
        'test-job-id',
        new Error('Test error')
      );

      expect(result).toEqual(failedJob);
      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 'test-job-id' },
        expect.objectContaining({
          status: 'failed',
          error: 'Test error',
        }),
        { new: true }
      );
    });
  });

  describe('retryJob', () => {
    it('should retry a failed job successfully', async () => {
      const failedJob = { ...mockJob, status: 'failed', attempts: 1 };
      const retriedJob = { ...mockJob, status: 'processing', attempts: 2 };

      (Job.findOne as jest.Mock).mockResolvedValueOnce(failedJob);
      (Job.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(retriedJob);

      const result = await jobService.retryJob('test-job-id');

      expect(result).toEqual(retriedJob);
      expect(Job.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 'test-job-id' },
        expect.objectContaining({
          status: 'processing',
          attempts: 2,
        }),
        { new: true }
      );
    });

    it('should throw error for non-failed job', async () => {
      const pendingJob = { ...mockJob, status: 'pending' };
      (Job.findOne as jest.Mock).mockResolvedValueOnce(pendingJob);

      await expect(jobService.retryJob('test-job-id')).rejects.toThrow(
        'Only failed jobs can be retried'
      );
    });
  });
});