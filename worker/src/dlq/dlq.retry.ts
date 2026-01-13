import redis from "../utils/redis.js";
import { getQueueKeys } from "../common/queue.constants.js";
import { job as Job } from "../common/job.type.js";

export const retryDLQJobManually = async (
  dlqJobId: string,
  queueName: string
): Promise<void> => {
  if (!dlqJobId || !queueName) {
    throw new Error("dlqJobId and queueName are required");
  }

  const queue = getQueueKeys(queueName);

  // 1️⃣ Fetch DLQ jobs
  const dlqJobs = await redis.lRange(queue.dlq, 0, -1);

  const rawDLQJob = dlqJobs.find((raw) => {
    try {
      const parsed = JSON.parse(raw) as Job;
      return parsed.jobId === dlqJobId;
    } catch {
      return false;
    }
  });

  if (!rawDLQJob) {
    throw new Error(`DLQ job not found: ${dlqJobId}`);
  }

  const dlqJob = JSON.parse(rawDLQJob) as Job;

  // 2️⃣ Reset job for retry
  const retryJob: Job = {
    ...dlqJob,
    status: "pending",
    tries: 0,
    lastError: undefined,
    updatedAt: Date.now(),
  };

  // 3️⃣ Atomically move job
  await redis
    .multi()
    .lRem(queue.dlq, 0, rawDLQJob)
    .rPush(queue.ready, JSON.stringify(retryJob))
    .exec();

  console.log("DLQ job manually requeued", {
    jobId: retryJob.jobId,
    queue: queueName,
  });
};
