import redis from './src/utils/redis';
import { getQueueKeys } from '../api/src/common/queue.constants';
import { job } from '../api/src/common/job.type';
import processJob  from './src/worker';

const fetchNextJob = async (queueName: string): Promise<job | null> => {
  const queue = getQueueKeys(queueName);

  const result = await redis.brPopLPush(
    queue.ready,
    queue.processing,
    0
  );

  if (!result) return null;
  return JSON.parse(result) as job;
};

const startWorker = async () => {
  console.log('Worker started. Waiting for jobs...');

  while (true) {
    try {
      const queueName = 'email';
      const job = await fetchNextJob(queueName);

      if (!job) continue;

      await processJob(job);
    } catch (err) {
      console.error('Error processing job:', err);
    }
  }
};

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await redis.quit();
  process.exit(0);
});

startWorker();
