import redis from "../utils/redis.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { Job } from "../common/job.type.js";

export const ackJob = async (job: Job): Promise<void> => {
  const queue = getQueueKeys(job.queueName);


  await redis.multi()
    .lRem(queue.processing, 1, job.jobId)   // remove from LIST
    .zRem(queue.processingZset, job.jobId) // remove from ZSET
    .exec();

};
 