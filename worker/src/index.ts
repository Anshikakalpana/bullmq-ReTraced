// import redis from './src/utils/redis';
// import { getQueueKeys } from '../api/src/common/queue.constants';
// import { job } from '../api/src/common/job.type';
// import processJob  from './src/worker';

// const fetchNextJob = async (queueName: string): Promise<job | null> => {
//   const queue = getQueueKeys(queueName);

//   const result = await redis.brPopLPush(
//     queue.ready,
//     queue.processing,
//     0
//   );

//   if (!result) return null;
//   return JSON.parse(result) as job;
// };

// const startWorker = async () => {
//   console.log('Worker started. Waiting for jobs...');

//   while (true) {
//     try {
//       const queueName = 'email';
//       const job = await fetchNextJob(queueName);

//       if (!job) continue;

//       await processJob(job);
//     } catch (err) {
//       console.error('Error processing job:', err);
//     }
//   }
// };

// process.on('SIGINT', async () => {
//   console.log('Shutting down worker...');
//   await redis.quit();
//   process.exit(0);
// });

// startWorker();


import redis from './utils/redis.js';
import { getQueueKeys } from './common/queue.constants.js';
import { job } from './common/job.type.js';
import processJob from './worker.js';
import { ackJob } from './queue/ack.js';
import { recoverStuckJobs } from './queue/visibilityTimeout.js';


const fetchNextJob = async (queueName: string): Promise<job | null> => {
  const queue = getQueueKeys(queueName);
  const result = await redis.brPopLPush(queue.ready, queue.processing, 0);
  console.log("Fetched job from queue:", result);
  if (!result) return null;
  return JSON.parse(result) as job;
};

const startWorker = async () => {
  console.log('Worker started. Waiting for jobs...');

  const queueName = 'email';

  // 🔁 Visibility timeout watchdog
  setInterval(async () => {
    try {
      await recoverStuckJobs(queueName);
    } catch (err) {
      console.error('Visibility recovery error:', err);
    }
  }, 10_000); // every 10 seconds

  while (true) {
    try {
      const job = await fetchNextJob(queueName);
      if (!job) continue;

      await processJob(job);

      
      if (job.status === 'completed') {
        await ackJob(job);
      }

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