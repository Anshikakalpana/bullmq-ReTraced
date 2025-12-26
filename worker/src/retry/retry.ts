import redis from "../utils/redis.js";
import { job, JobResult } from "../common/job.type.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { moveJobToDLQ } from "../dlq/dlq.producer.js";
import { delayJob } from "../delay-jobs/delay-job.js";

const retryJob = async (jobData: job, result: JobResult): Promise<void> => {
  try {
    // 1️⃣ Increment tries FIRST
    jobData.tries += 1;
    jobData.updatedAt = Date.now();

    // 2️⃣ Max tries exceeded → DLQ
    if (jobData.tries > jobData.maxTries) {
      await moveJobToDLQ(jobData, result);
      console.log("job added to dead letter queue");
      return;
    }

    // 3️⃣ Delay retry window
    if (
      jobData.tries >= jobData.delay?.limitOfTries &&
      jobData.tries <= jobData.maxTries
    ) {
      await delayJob(jobData, jobData.delay.retryAfterSeconds);
      console.log("job retry after some seconds");
      return;
    }

    // 4️⃣ Immediate retry
    jobData.status = "pending";
    const queue = getQueueKeys(jobData.queueName);
    await redis.rPush(queue.ready, JSON.stringify(jobData));

  } catch (err) {
    console.error("Error retrying job:", err);
    throw err;
  }
};

export default retryJob;
