import { IQueueService } from './interfaces/IQueueService';
import { ILogger } from './interfaces/ILogger';
import { Redis } from 'ioredis';
import { config } from '../config';
import { ServiceContainer } from '../container/ServiceContainer';

export class QueueService implements IQueueService {
  private redis: Redis;
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
    if (!config.redis.url) throw new Error('Redis URL is not configured');
    this.redis = new Redis(config.redis.url);
  }

  public static getInstance(): QueueService {
    const container = ServiceContainer.getInstance();
    const logger = container.get<ILogger>('ILogger');
    return new QueueService(logger);
  }

  public async enqueue(queueName: string, data: any): Promise<string> {
    try {
      const jobId = Math.random().toString(36).substring(7);
      const jobData = JSON.stringify({ id: jobId, data });
      await this.redis.rpush(queueName, jobData);
      this.logger.info(`Enqueued job ${jobId} to queue ${queueName}`);
      return jobId;
    } catch (error) {
      this.logger.error(`Error enqueueing to ${queueName}`, error as Error);
      throw error;
    }
  }

  public async enqueueJob(data: any): Promise<string> {
    return this.enqueue('jobs', data);
  }

  public async dequeue(queueName: string): Promise<any> {
    try {
      const jobData = await this.redis.lpop(queueName);
      if (!jobData) {
        return null;
      }
      const job = JSON.parse(jobData);
      this.logger.info(`Dequeued job ${job.id} from queue ${queueName}`);
      return job;
    } catch (error) {
      this.logger.error(`Error dequeuing from ${queueName}`, error as Error);
      throw error;
    }
  }

  public async peek(queueName: string): Promise<any> {
    try {
      const jobData = await this.redis.lindex(queueName, 0);
      if (!jobData) {
        return null;
      }
      return JSON.parse(jobData);
    } catch (error) {
      this.logger.error(`Error peeking queue ${queueName}`, error as Error);
      throw error;
    }
  }

  public async getQueueLength(queueName: string): Promise<number> {
    try {
      return await this.redis.llen(queueName);
    } catch (error) {
      this.logger.error(`Error getting length of queue ${queueName}`, error as Error);
      throw error;
    }
  }

  public async clearQueue(queueName: string): Promise<void> {
    try {
      await this.redis.del(queueName);
      this.logger.info(`Cleared queue ${queueName}`);
    } catch (error) {
      this.logger.error(`Error clearing queue ${queueName}`, error as Error);
      throw error;
    }
  }

  public async isQueueEmpty(queueName: string): Promise<boolean> {
    const length = await this.getQueueLength(queueName);
    return length === 0;
  }

  public async removeFromQueue(queueName: string, jobId: string): Promise<boolean> {
    try {
      const queueLength = await this.getQueueLength(queueName);
      let removed = false;

      for (let i = 0; i < queueLength; i++) {
        const jobData = await this.redis.lindex(queueName, i);
        if (jobData) {
          const job = JSON.parse(jobData);
          if (job.id === jobId) {
            await this.redis.lrem(queueName, 1, jobData);
            removed = true;
            this.logger.info(`Removed job ${jobId} from queue ${queueName}`);
            break;
          }
        }
      }

      return removed;
    } catch (error) {
      this.logger.error(`Error removing job ${jobId} from queue ${queueName}`, error as Error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}