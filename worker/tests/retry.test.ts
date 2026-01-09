import { retryJob } from '../src/retry/retry';
import type { job, JobResult } from '../src/common/job.type';

jest.mock('../src/utils/redis', () => ({
  __esModule: true,
  default: {
    rPush: jest.fn(),
  },
}));

jest.mock('../src/delay-jobs/delay-job', () => ({
  __esModule: true,
  delayJob: jest.fn(),
}));

jest.mock('../src/dlq/dlq.producer', () => ({
  __esModule: true,
  moveJobToDLQ: jest.fn(),
}));

jest.mock('../src/common/queue.constants', () => ({
  __esModule: true,
  getQueueKeys: () => ({
    ready: 'queue:ready',
  }),
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
      jobData: { to: 'test@example.com' } as any,
    };
  });

  it('requeues job immediately when tries < limitOfTries', async () => {
    const result: JobResult = { success: false, finishedAt: Date.now() };

    await retryJob(delayData, baseJob, result);

    expect(baseJob.tries).toBe(1);
    expect(redis.rPush).toHaveBeenCalledTimes(1);
    expect(delayJob).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });

  it('delays job when tries >= limitOfTries', async () => {
    baseJob.tries = 2;

    await retryJob(delayData, baseJob, { success: false, finishedAt: Date.now() });

    expect(delayJob).toHaveBeenCalledTimes(1);
  });

  it('moves job to DLQ when maxTries exceeded', async () => {
    baseJob.tries = 3;

    await retryJob(delayData, baseJob, { success: false, finishedAt: Date.now() });

    expect(moveJobToDLQ).toHaveBeenCalledTimes(1);
  });
});
