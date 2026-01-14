import redis from "../utils/redis.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { Job } from "../common/job.type.js";

export const removeFromProcessing = async (job: Job): Promise<void> => {
  const queue = getQueueKeys(job.queueName);

  await redis.lRem(
    queue.processing,
    1,
    JSON.stringify(job)
  );
};
