import { Job } from "../common/job.type.js";
import redis from "../utils/redis.js";
import { getQueueKeys } from "../common/queue.constants.js";

export const delayJob = async (
  jobData: Job,
  runAt: number // UNIX timestamp (ms)
): Promise<void> => {

    

  if (!jobData || !runAt) {
    throw new Error("Incomplete job delay data");
  }
  await redis.set(`job:${jobData.jobId}`, JSON.stringify(jobData));

  const queueKeys = getQueueKeys(jobData.queueName);

  // Store delayed jobs in a sorted set
  await redis.zAdd(queueKeys.delayed, {

    score: runAt,
    value: jobData.jobId,

  });
  
};
