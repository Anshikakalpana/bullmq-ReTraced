import redis from './utils/redis.js';
import { getQueueKeys } from './common/queue.constants.js';
import { Job } from './common/job.type.js';
import processJob from './worker.main.js';
import { ackJob } from './queue/ack.js';
import { recoverStuckJobs } from './queue/visibilityTimeout.js';

const TARGET_JOBS = 1000;

let startTime: number | null = null;
let completed = 0;

/**
 * Fetch next job from Redis
 */
export const fetchNextJob = async (queueName: string): Promise<Job | null> => {
  const queue = getQueueKeys(queueName);

  const result = await redis.brPopLPush(
    queue.ready,
    queue.processing,
    0
  );

  if (!result) return null;
  return JSON.parse(result) as Job;
};

/**
 * Worker loop
 */
const startWorker = async () => {
  console.log('Worker started. Waiting for jobs...');

  const queueName = 'email';

  // Visibility timeout recovery
  setInterval(async () => {
    try {
      await recoverStuckJobs(queueName);
    } catch (err) {
      console.error('Visibility recovery error:', err);
    }
  }, 10_000);

  while (true) {
    try {
      const job = await fetchNextJob(queueName);
      if (!job) continue;

      // Start timing when first job is actually processed
      if (startTime === null) {
        startTime = Date.now();
      }

      await processJob(job);

      if (job.status === 'completed') {
        await ackJob(job);
        completed++;

      //     only for testing throughput
      //    if (completed === TARGET_JOBS) {
      //   const seconds = (Date.now() - startTime) / 1000;
      //   const rate = TARGET_JOBS / seconds;

      //   console.log("================================");
        
      //   console.log(`Time: ${seconds.toFixed(2)}s`);
      //   console.log(`Throughput: ${rate.toFixed(2)} jobs/sec`);
      //   console.log("================================");

      //   process.exit(0);
      // }
       
      }

    } catch (err) {
      console.error('Worker error:', err);
    }
  }
};

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await redis.quit();
  process.exit(0);
});

startWorker();


