import { IJob } from '../../models/job';
import type { FilterQuery } from 'mongoose';

export interface IJobService {
  createJob(type: string, data: any): Promise<IJob>;
  updateJob(id: string, updates: Partial<IJob>): Promise<IJob>;
  getJob(id: string): Promise<IJob | null>;
  deleteJob(id: string): Promise<boolean>;
  listJobs(filter: FilterQuery<IJob>): Promise<IJob[]>;
  updateJobProgress(id: string, progress: number, total?: number): Promise<IJob>;
  completeJob(id: string, result?: any): Promise<IJob>;
  failJob(id: string, error: Error): Promise<IJob>;
  retryJob(id: string): Promise<IJob>;
}