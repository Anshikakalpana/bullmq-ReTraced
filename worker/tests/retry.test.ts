// import { retryJob } from '../src/retry/threeTierRetry';
// import redis from '../src/utils/redis';
// import { delayJob } from '../src/delay-jobs/delay-job';
// import { moveJobToDLQ } from '../src/dlq/dlq.producer';
// import type { Job, JobResult } from '../src/common/job.type';

// // Mock modules
// jest.mock('../src/utils/redis', () => ({
//   __esModule: true,
//   default: { 
//     rPush: jest.fn(),
//   },
// }));

// jest.mock('../src/delay-jobs/delay-job', () => ({
//   delayJob: jest.fn(),
// }));

// jest.mock('../src/dlq/dlq.producer', () => ({
//   moveJobToDLQ: jest.fn(),
// }));

// jest.mock('../src/common/queue.constants', () => ({
//   getQueueKeys: jest.fn(() => ({ 
//     ready: 'queue:ready',
//     processing: 'queue:processing',
//     processingZset: 'queue:processing:zset'
//   })),
// }));

// describe('retryJob()', () => {
//   const delayData = { retryAfterSeconds: 5, limitOfTries: 2 };
//   let baseJob: Job;

//   beforeEach(() => {
//     jest.clearAllMocks();

//     // Setup mocks
//     (redis.rPush as jest.Mock).mockResolvedValue(1);
//     (delayJob as jest.Mock).mockResolvedValue(undefined);
//     (moveJobToDLQ as jest.Mock).mockResolvedValue(undefined);

//     baseJob = {
//    jobId: "job-1",

//   createdAt: Date.now(),
//   updatedAt: Date.now(),

//   jobData: {
//     emailFrom: "test@example.com",
//     emailTo: "user@example.com",
//     subject: "Test",
//     body: "Test body",
//   },

//   queueName: "default",

//   status: "failed",

//   tries: 1,
//   maxTries: 5,

//   retryAttempts: [],

//   backoffConfig: {
//     baseDelaySeconds: 1,
//     maxDelaySeconds: 30,
//     factor: 2,
//     limitOfTries: 2,
//     jitterSeconds: 0,
//   },

//   backoffStrategy: "threeTier",

  
//     } as Job;
//   });

//   it('should requeue job immediately when tries < limitOfTries', async () => {
//   const result: JobResult = { success: false, finishedAt: Date.now() };
  
//   await retryJob(baseJob, result);
  
//   expect(baseJob.tries).toBe(2);
//   expect(baseJob.status).toBe('pending');
//   expect(redis.rPush).toHaveBeenCalledTimes(1);
//   expect(delayJob).not.toHaveBeenCalled();
//   expect(moveJobToDLQ).not.toHaveBeenCalled();
// });

// it('should delay job when tries >= limitOfTries and <= maxTries', async () => {
//   baseJob.tries = 0;
//   const result: JobResult = { success: false, finishedAt: Date.now() };
  
//   await retryJob(baseJob, result);
  
//   expect(baseJob.tries).toBe(3);
//   expect(delayJob).toHaveBeenCalledTimes(1);
//   expect(redis.rPush).not.toHaveBeenCalled();
//   expect(moveJobToDLQ).not.toHaveBeenCalled();
// });

// it('should move job to DLQ when maxTries exceeded', async () => {
//   baseJob.maxTries = 3;
//   baseJob.tries = 3;

//   const result: JobResult = { success: false, finishedAt: Date.now() };
  
//   await retryJob(baseJob, result);
  
//   expect(baseJob.tries).toBe(4);
//   expect(baseJob.status).toBe('dead');
//   expect(moveJobToDLQ).toHaveBeenCalledTimes(1);
//   expect(redis.rPush).not.toHaveBeenCalled();
//   expect(delayJob).not.toHaveBeenCalled();
// });

// it('should throw on invalid job data', async () => {
//   const invalidJob = null as any;
//   const result: JobResult = { success: false, finishedAt: Date.now() };
  
//   await expect(
//     retryJob(invalidJob, result)
//   ).rejects.toThrow();
// });
// });


import { retryJob } from '../src/retry/threeTierRetry';
import redis from '../src/utils/redis';
import { delayJob } from '../src/delay-jobs/delay-job';
import { moveJobToDLQ } from '../src/dlq/dlq.producer';
import type { Job, JobResult } from '../src/common/job.type';

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
    processingZset: 'queue:processing:zset',
  })),
}));

describe('retryJob()', () => {
  let baseJob: Job;

  beforeEach(() => {
    jest.clearAllMocks();

    (redis.rPush as jest.Mock).mockResolvedValue(1);
    (delayJob as jest.Mock).mockResolvedValue(undefined);
    (moveJobToDLQ as jest.Mock).mockResolvedValue(undefined);

    baseJob = {
      jobId: 'job-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      queueName: 'default',
      status: 'failed',

      tries: 0,
      maxTries: 5,

      jobData: {
        emailFrom: 'test@example.com',
        emailTo: 'user@example.com',
        subject: 'Test',
        body: 'Test body',
      },

      retryAttempts: [],

      backoffConfig: {
        baseDelaySeconds: 1,
        maxDelaySeconds: 30,
        factor: 2,
        limitOfTries: 2,
        jitterSeconds: 0,
      },

      backoffStrategy: 'threeTier',
    } as Job;
  });

  it('should requeue job immediately when tries < limitOfTries', async () => {
    baseJob.tries = 0; // 0 → 1 < 2

    const result: JobResult = { success: false, finishedAt: Date.now() };

    await retryJob(baseJob, result);

    expect(baseJob.tries).toBe(1);
    expect(baseJob.status).toBe('pending');

    expect(redis.rPush).toHaveBeenCalledTimes(1);
    expect(delayJob).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });

  it('should delay job when tries >= limitOfTries and <= maxTries', async () => {
    baseJob.tries = 1; // 1 → 2 === limitOfTries

    const result: JobResult = { success: false, finishedAt: Date.now() };

    await retryJob(baseJob, result);

    expect(baseJob.tries).toBe(2);

    expect(delayJob).toHaveBeenCalledTimes(1);
    expect(redis.rPush).not.toHaveBeenCalled();
    expect(moveJobToDLQ).not.toHaveBeenCalled();
  });

  it('should move job to DLQ when maxTries exceeded', async () => {
    baseJob.maxTries = 3;
    baseJob.tries = 3; // 3 → 4

    const result: JobResult = { success: false, finishedAt: Date.now() };

    await retryJob(baseJob, result);

    expect(baseJob.tries).toBe(4);
    expect(baseJob.status).toBe('dead');

    expect(moveJobToDLQ).toHaveBeenCalledTimes(1);
    expect(redis.rPush).not.toHaveBeenCalled();
    expect(delayJob).not.toHaveBeenCalled();
  });

  it('should throw on invalid job data', async () => {
    const invalidJob = null as any;
    const result: JobResult = { success: false, finishedAt: Date.now() };

    await expect(retryJob(invalidJob, result)).rejects.toThrow();
  });
});
