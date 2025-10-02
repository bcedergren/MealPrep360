import { QueueService } from '../src/services/queueService.js';
import { Job } from '../src/models/job.js';

// Mocks
const lPushMock = jest.fn();
const connectMock = jest.fn().mockResolvedValue(undefined);

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: connectMock,
    lPush: lPushMock,
  })),
}), { virtual: false });

const saveMock = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/models/job.js', () => ({
  Job: {
    findOne: jest.fn().mockResolvedValue(null),
    // Include a save mock so QueueService can call job.save()
    create: jest.fn(async (data: any) => ({ ...data, save: saveMock })),
  },
}));

jest.mock('../src/config.js', () => ({
  config: { queue: { name: 'TestQueue' } },
}));

jest.mock('../src/services/logger.js', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('QueueService.enqueueJob', () => {
  it('enqueues a job and returns its ID', async () => {
    const queueService = QueueService.getInstance();

    const jobId = await queueService.enqueueJob({
      type: 'generate',
      total: 5,
      season: 'winter',
    });

    expect(jobId).toBe('test-uuid');
    expect(saveMock).toHaveBeenCalled();
    expect(lPushMock).toHaveBeenCalledWith(
      'TestQueue:queue',
      JSON.stringify({ jobId: 'test-uuid', season: 'winter' })
    );
  });
});
