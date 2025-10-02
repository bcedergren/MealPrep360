import { IJobService } from './interfaces/IJobService';
import { ILogger } from './interfaces/ILogger';
import { IJob, Job } from '../models/job';
import type { FilterQuery } from 'mongoose';
import { ServiceContainer } from '../container/ServiceContainer';

export class JobService implements IJobService {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  public static getInstance(): JobService {
    const container = ServiceContainer.getInstance();
    const logger = container.get<ILogger>('ILogger');
    return new JobService(logger);
  }

  public async createJob(type: string, data: any): Promise<IJob> {
    try {
      const job = await Job.create({
        id: Math.random().toString(36).substring(7),
        type,
        data,
        status: 'pending',
        progress: 0,
        total: 0,
        attempts: 0,
      });
      this.logger.info(`Created job ${job.id} of type ${type}`);
      return job;
    } catch (error) {
      this.logger.error('Error creating job', error as Error);
      throw error;
    }
  }

  public async updateJob(id: string, updates: Partial<IJob>): Promise<IJob> {
    try {
      const job = await Job.findOneAndUpdate(
        { id },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
      if (!job) {
        throw new Error(`Job ${id} not found`);
      }
      this.logger.info(`Updated job ${id}`, { updates });
      return job;
    } catch (error) {
      this.logger.error(`Error updating job ${id}`, error as Error);
      throw error;
    }
  }

  public async getJob(id: string): Promise<IJob | null> {
    try {
      return await Job.findOne({ id });
    } catch (error) {
      this.logger.error(`Error getting job ${id}`, error as Error);
      throw error;
    }
  }

  public async deleteJob(id: string): Promise<boolean> {
    try {
      const result = await Job.deleteOne({ id });
      const success = result.deletedCount === 1;
      if (success) {
        this.logger.info(`Deleted job ${id}`);
      }
      return success;
    } catch (error) {
      this.logger.error(`Error deleting job ${id}`, error as Error);
      throw error;
    }
  }

  public async listJobs(filter: FilterQuery<IJob>): Promise<IJob[]> {
    try {
      return await Job.find(filter).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error('Error listing jobs', error as Error);
      throw error;
    }
  }

  public async updateJobProgress(id: string, progress: number, total?: number): Promise<IJob> {
    try {
      const updates: Partial<IJob> = { progress };
      if (total !== undefined) {
        updates.total = total;
      }
      return await this.updateJob(id, updates);
    } catch (error) {
      this.logger.error(`Error updating job progress ${id}`, error as Error);
      throw error;
    }
  }

  public async completeJob(id: string, result?: any): Promise<IJob> {
    return this.updateJob(id, { status: 'completed', result });
  }

  public async failJob(id: string, error: Error): Promise<IJob> {
    return this.updateJob(id, { status: 'failed', error: error.message });
  }

  public async retryJob(id: string): Promise<IJob> {
    const job = await this.getJob(id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }
    if (job.status !== 'failed') {
      throw new Error('Only failed jobs can be retried');
    }
    return this.updateJob(id, {
      status: 'processing',
      attempts: (job.attempts || 0) + 1,
      error: undefined,
    });
  }
}