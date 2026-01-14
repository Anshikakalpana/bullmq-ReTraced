import { retryJob } from '../src/retry/threeTierRetry';
import redis from '../src/utils/redis';
import { delayJob } from '../src/delay-jobs/delay-job';
import { moveJobToDLQ } from '../src/dlq/dlq.producer';
import type { job, JobResult } from '../src/common/job.type';

// Mock modules
jest.mock('../src/utils/redis', () => ({
  __esModule: true,
  default: { 
    rPush: jest.fn(),
  },
}));

jest.mock('../src/delay-jobs/delay-job', () => ({
  delayJob: jest.fn(),
}));

jest.mock('../src/dlq/dlq.producer', () => ({
  moveJobToDLQ: jest.fn(),
}));

jest.mock('../src/common/queue.constants', () => ({
  getQueueKeys: jest.fn(() => ({ 
    ready: 'queue:ready',
    processing: 'queue:processing',
    processingZset: 'queue:processing:zset'
  })),
}));

describe('retryJob()', () => {
  const delayData = { retryAfterSeconds: 5, limitOfTries: 2 };
  let baseJob: job;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (redis.rPush as jest.Mock).mockResolvedValue(1);
    (delayJob as jest.Mock).mockResolvedValue(undefined);
    (moveJobToDLQ as jest.Mock).mockResolvedValue(undefined);

    baseJob = {
      jobId: 'job-1',
      queueName: 'email',
      status: 'pending',
      tries: 0,
      maxTries: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      jobData: {
        emailFrom: 'no-reply@example.com',
        emailTo: 'test@example.com',
        subject: 'Test subject',
        body: 'Test body',
      },
    } as job;
  });

  it('should requeue job immediately when tries < limitOfTries', async () => {
    const result: JobResult = { success: false, finishedAt: Date.now() };
    
    await retryJob(delayData, baseJob, result);
    
    expect(baseJob.tries).toBe(1);
    expect(baseJob.status).toBe('pending');
    expect(redis.rPush).toHaveBeenCalledTimes(1);
    expect(redis.rPush).toHaveBeenCalledWith(
      'queue:ready',
      expect.stringContaining('job-1')
    );
    expect(delayJob).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });

  it('should delay job when tries >= limitOfTries and <= maxTries', async () => {
    baseJob.tries = 2; // Will become 3 after increment
    const result: JobResult = { success: false, finishedAt: Date.now() };
    
    await retryJob(delayData, baseJob, result);
    
    expect(baseJob.tries).toBe(3);
    expect(delayJob).toHaveBeenCalledTimes(1);
    expect(delayJob).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-1' }),
      10 // 5 * 2^(3-2) = 10 seconds
    );
    expect(redis.rPush).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });

  it('should move job to DLQ when maxTries exceeded', async () => {
    baseJob.tries = 3; // Will become 4, exceeding maxTries of 3
    const result: JobResult = { success: false, finishedAt: Date.now() };
    
    await retryJob(delayData, baseJob, result);
    
    expect(baseJob.tries).toBe(4);
    expect(baseJob.status).toBe('dead');
    expect(moveJobToDLQ).toHaveBeenCalledTimes(1);
    expect(moveJobToDLQ).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-1', status: 'dead' }),
      result
    );
    expect(redis.rPush).not.toHaveBeenCalled();
    expect(delayJob).not.toHaveBeenCalled();
  });

  it('should handle invalid job data gracefully', async () => {
    const invalidJob = null as any;
    const result: JobResult = { success: false, finishedAt: Date.now() };
    
    await retryJob(delayData, invalidJob, result);
    
    // Should exit early without calling anything
    expect(redis.rPush).not.toHaveBeenCalled();
    expect(delayJob).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });
});