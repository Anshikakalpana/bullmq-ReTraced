import redis from "./utils/redis.js";
import { getQueueKeys } from "./common/queue.constants.js";
import { Job } from "./common/job.type.js";
import processJob from "./worker.main.js";
import { ackJob } from "./queue/ack.js";
import { recoverStuckJobs } from "./queue/visibilityTimeout.js";

const queueName = "email";

let startTime: number | null = null;
let completed = 0;

/**
 * Promote delayed jobs whose time has arrived
 * delayed (ZSET) -> ready (LIST)
 */
const promoteDelayedJobs = async (queueName: string): Promise<void> => {
  const queue = getQueueKeys(queueName);
  const now = Date.now();

  // 🔑 delayed contains jobIds
  const jobIds = await redis.zRangeByScore(queue.delayed, 0, now);
  if (jobIds.length === 0) return;

  const pipeline = redis.multi();
  for (const jobId of jobIds) {
    pipeline.lPush(queue.ready, jobId);
    pipeline.zRem(queue.delayed, jobId);
  }
  await pipeline.exec();
};

/**
 * Fetch next ready job and move to processing
 */
export const fetchNextJob = async (
  queueName: string
): Promise<Job | null> => {
  const queue = getQueueKeys(queueName);

  // 🔑 Atomic move: READY -> PROCESSING (jobId only)
  const jobId = await redis.brPopLPush(
    queue.ready,
    queue.processing,
    0
  );

  if (!jobId) return null;

  // 🔑 Track visibility timeout
  await redis.zAdd(queue.processingZset, {
    score: Date.now(),
    value: jobId,
  });

  // 🔑 Load full job JSON
  const jobStr = await redis.get(`job:${jobId}`);
  if (!jobStr) {
    // defensive: clean up corrupted job
    await redis.lRem(queue.processing, 1, jobId);
    await redis.zRem(queue.processingZset, jobId);
    return null;
  }

  return JSON.parse(jobStr) as Job;
};

/**
 * Worker loop
 */
const startWorker = async () => {
  console.log("Worker started. Waiting for jobs...");

  // Recover stuck jobs
  setInterval(async () => {
    try {
      await recoverStuckJobs(queueName);
    } catch (err) {
      console.error("Visibility recovery error:", err);
    }
  }, 10_000);

  while (true) {
    try {
      // 1️⃣ Promote delayed jobs
      await promoteDelayedJobs(queueName);

      // 2️⃣ Fetch job
      const job = await fetchNextJob(queueName);
      if (!job) continue;

      if (startTime === null) {
        startTime = Date.now();
      }

      // 3️⃣ Process
      await processJob(job);

      // 4️⃣ Ack if completed
      if (job.status === "completed") {
        await ackJob(job);
        completed++;
      }
    } catch (err) {
      console.error("Worker error:", err);
    }
  }
};

/**
 * Graceful shutdown
 */
process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await redis.quit();
  process.exit(0);
});

startWorker();
