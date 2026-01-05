import redis from "../utils/redis.js";
import { getQueueKeys } from "../common/queue.constants.js";

const VISIBILITY_TIMEOUT_MS = 30_000; // 30 seconds

export const recoverStuckJobs = async (queueName: string) => {
  const queue = getQueueKeys(queueName);
  const jobs = await redis.lRange(queue.processing, 0, -1);

  const now = Date.now();

  for (const raw of jobs) {
    const job = JSON.parse(raw);

    if (!job.updatedAt) continue;

    if (now - job.updatedAt > VISIBILITY_TIMEOUT_MS) {
      // move back to ready
      await redis.multi()
        .lRem(queue.processing, 1, raw)
        .rPush(queue.ready, raw)
        .exec();

      console.log("Recovered stuck job:", job.jobId);
    }
  }
};
