import { retryJob } from '../src/retry/retry';
import { job, JobResult } from '../src/common/job.type';


jest.mock('../src/utils/redis', () => ({
  __esModule: true,
  default: {
    rPush: jest.fn().mockResolvedValue(1),
  },
}));

// Mock delayJob
jest.mock('../src/delay-jobs/delay-job', () => ({
  __esModule: true,
  delayJob: jest.fn().mockResolvedValue(undefined),
}));

// Mock moveJobToDLQ
jest.mock('../src/dlq/dlq.producer', () => ({
  __esModule: true,
  moveJobToDLQ: jest.fn().mockResolvedValue(undefined),
}));

import redis from '../src/utils/redis';
import { delayJob } from '../src/delay-jobs/delay-job';
import { moveJobToDLQ } from '../src/dlq/dlq.producer';

describe('retryJob()', () => {
  const delayData = {
    retryAfterSeconds: 5,
    limitOfTries: 2,
  };

  let baseJob: job;

  beforeEach(() => {
    jest.clearAllMocks();

    baseJob = {
      jobId: 'job-1',
      queueName: 'email',
      status: 'pending',
      tries: 0,
      maxTries: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      jobData: { to: 'test@example.com' } as any,
    };
  });

 
  it('requeues job immediately when tries < limitOfTries', async () => {
    const result: JobResult = { success: false, finishedAt: Date.now() };

    await retryJob(delayData, baseJob, result);

    expect(baseJob.tries).toBe(1);
    expect(baseJob.status).toBe('pending');

    expect(redis.rPush).toHaveBeenCalledTimes(1);
    expect(delayJob).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });


  it('delays job with exponential backoff when tries >= limitOfTries', async () => {
    baseJob.tries = 2;

    await retryJob(delayData, baseJob, { success: false, finishedAt: Date.now() });

    expect(baseJob.tries).toBe(3);
    expect(baseJob.status).toBe('pending');

    expect(delayJob).toHaveBeenCalledTimes(1);
    expect(delayJob).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-1' }),
      expect.any(Number) // backoff seconds
    );

    expect(redis.rPush).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });

  it('moves job to DLQ when maxTries exceeded', async () => {
    baseJob.tries = 3;

    await retryJob(delayData, baseJob, { success: false, finishedAt: Date.now() });

    expect(baseJob.status).toBe('dead');
    expect(baseJob.tries).toBe(4);

    expect(moveJobToDLQ).toHaveBeenCalledTimes(1);
    expect(moveJobToDLQ).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-1' }),
      expect.any(Object)
    );

    expect(redis.rPush).not.toHaveBeenCalled();
    expect(delayJob).not.toHaveBeenCalled();
  });


  it('does nothing if jobData is invalid', async () => {
    // @ts-ignore – intentionally broken input
    await retryJob(delayData, null, { success: false });

    expect(redis.rPush).not.toHaveBeenCalled();
    expect(delayJob).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });

 
  it('caps backoff time to 1 hour', async () => {
    baseJob.tries = 10;

    await retryJob(delayData, baseJob,{ success: false, finishedAt: Date.now() });

    expect(delayJob).toHaveBeenCalledWith(
      expect.any(Object),
      60 * 60 // 1 hour cap
    );
  });
});
