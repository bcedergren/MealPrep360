export interface IQueueService {
  enqueue(queueName: string, data: any): Promise<string>;
  dequeue(queueName: string): Promise<any>;
  peek(queueName: string): Promise<any>;
  getQueueLength(queueName: string): Promise<number>;
  clearQueue(queueName: string): Promise<void>;
  isQueueEmpty(queueName: string): Promise<boolean>;
  removeFromQueue(queueName: string, jobId: string): Promise<boolean>;
}