import redis from "../utils/redis.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { job } from "../common/job.type.js";

export const removeFromProcessing = async (job: job): Promise<void> => {
  const queue = getQueueKeys(job.queueName);

  await redis.lRem(
    queue.processing,
    1,
    JSON.stringify(job)
  );
};
